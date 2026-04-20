import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getPortalClient } from "@/lib/portal-auth";

type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number; // cents
};

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session for a client portal invoice.
 * Authorization: caller must have a portal session (Supabase magic-link auth)
 * whose email matches the invoice's client.
 *
 * Body: { invoiceId: string }
 * Returns: { url: string } — the Stripe-hosted checkout URL
 */
export async function POST(request: NextRequest) {
  const client = await getPortalClient();
  if (!client) {
    return NextResponse.json(
      { error: "Sign in to the portal to pay this invoice" },
      { status: 401 }
    );
  }

  let body: { invoiceId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { invoiceId } = body;

  if (!invoiceId) {
    return NextResponse.json({ error: "invoiceId is required" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, clientId: client.id },
    include: {
      client: { select: { email: true } },
      project: { select: { id: true, name: true } },
      user: { select: { stripeAccountId: true } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (!["SENT", "VIEWED", "OVERDUE"].includes(invoice.status)) {
    return NextResponse.json(
      { error: "Invoice is not available for payment" },
      { status: 400 }
    );
  }

  const stripeAccountId = invoice.user.stripeAccountId;
  if (!stripeAccountId) {
    return NextResponse.json(
      { error: "Freelancer has not connected a payment account" },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://itsfriday.dev";
  const lineItems = invoice.lineItems as LineItem[];

  try {
    const session = await getStripe()!.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: invoice.client.email,
        line_items: lineItems.map((item) => ({
          price_data: {
            currency: "usd",
            product_data: { name: item.description },
            unit_amount: item.unitPrice,
          },
          quantity: item.quantity,
        })),
        metadata: {
          invoiceId: invoice.id,
          clientId: client.id,
        },
        success_url: `${appUrl}/portal?payment=success`,
        cancel_url: `${appUrl}/portal/projects/${invoice.project.id}`,
      },
      { stripeAccount: stripeAccountId }
    );

    if (invoice.status === "SENT") {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "VIEWED" },
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout] failed to create session:", err);
    return NextResponse.json(
      { error: "Failed to create payment session" },
      { status: 500 }
    );
  }
}

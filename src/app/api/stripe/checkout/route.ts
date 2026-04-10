import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number; // cents
};

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session for a client portal invoice.
 * Called from the client portal — no freelancer auth required.
 * Security: invoiceId must belong to the clientId (cuid access token).
 *
 * Body: { invoiceId: string; clientId: string }
 * Returns: { url: string } — the Stripe-hosted checkout URL
 */
export async function POST(request: NextRequest) {
  let body: { invoiceId?: string; clientId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { invoiceId, clientId } = body;

  if (!invoiceId || !clientId) {
    return NextResponse.json(
      { error: "invoiceId and clientId are required" },
      { status: 400 }
    );
  }

  // Load invoice and verify it belongs to this client (portal auth pattern)
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, clientId },
    include: {
      client: { select: { email: true } },
      project: { select: { id: true, name: true } },
      user: { select: { stripeAccountId: true } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Only SENT, VIEWED, or OVERDUE invoices are payable
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
    const session = await stripe.checkout.sessions.create(
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
          clientId,
        },
        success_url: `${appUrl}/portal/${clientId}?payment=success`,
        cancel_url: `${appUrl}/portal/${clientId}/projects/${invoice.project.id}`,
      },
      // Route payment through the connected Stripe account
      { stripeAccount: stripeAccountId }
    );

    // Advance SENT → VIEWED now that the client has engaged with payment flow
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

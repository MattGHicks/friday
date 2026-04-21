import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import {
  InvoiceStatus,
  ActivityType,
  ProjectStatus,
} from "@/generated/prisma/client";
import { logActivity } from "@/app/(dashboard)/projects/[id]/log-activity";

/**
 * POST /api/stripe/webhooks
 *
 * Stripe webhook endpoint. Handles events from:
 * - Direct account webhooks (standard events)
 * - Connect webhooks (events from connected accounts, include `account` field)
 *
 * Register this URL in Stripe Dashboard → Developers → Webhooks.
 * Set STRIPE_WEBHOOK_SECRET to the endpoint's signing secret.
 *
 * Handled events:
 *   checkout.session.completed — marks the linked invoice as PAID
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhooks] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe()!.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhooks] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      await handleCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session
      );
      break;
    }
    default:
      // Unhandled event types — acknowledge receipt without processing
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const invoiceId = session.metadata?.invoiceId;

  if (!invoiceId) {
    console.warn(
      "[stripe/webhooks] checkout.session.completed: missing invoiceId in session metadata",
      { sessionId: session.id }
    );
    return;
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      projectId: true,
      userId: true,
      status: true,
      isDeposit: true,
      quoteId: true,
    },
  });

  if (!invoice) {
    console.warn(
      `[stripe/webhooks] checkout.session.completed: invoice ${invoiceId} not found`
    );
    return;
  }

  // Idempotency guard — don't double-mark
  if (invoice.status === InvoiceStatus.PAID) {
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: InvoiceStatus.PAID,
      paidAt: new Date(),
      stripePaymentIntentId: paymentIntentId,
    },
  });

  await logActivity({
    userId: invoice.userId,
    projectId: invoice.projectId,
    actorId: invoice.userId,
    action: ActivityType.INVOICE_PAID,
    metadata: { invoiceId, stripeSessionId: session.id },
  });

  // Deposit paid → flip the linked project to ACTIVE and mark the quote.
  if (invoice.isDeposit && invoice.quoteId) {
    const now = new Date();
    await prisma.project.update({
      where: { id: invoice.projectId },
      data: { status: ProjectStatus.ACTIVE },
    });
    await prisma.quote.update({
      where: { id: invoice.quoteId },
      data: { depositPaidAt: now },
    });
  }
}

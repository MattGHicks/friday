"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getResend } from "@/lib/resend";
import { buildQuoteSentEmail } from "@/lib/email/quote-sent";
import { logActivity } from "@/app/(dashboard)/projects/[id]/log-activity";
import { ActivityType, DepositType, QuoteStatus } from "@/generated/prisma/client";

type LineItemInput = {
  description: string;
  quantity: number;
  unitPrice: number; // cents
};

type QuoteFormInput = {
  leadId?: string | null;
  clientId?: string | null;
  quoteId?: string;
  subject: string;
  lineItems: LineItemInput[];
  depositType: DepositType;
  depositValue: number; // percent (0-100) or cents (FIXED)
  validUntil?: string | null; // ISO
  notes?: string | null;
};

function computeTotals(
  lineItems: LineItemInput[],
  depositType: DepositType,
  depositValue: number
) {
  const subtotal = lineItems.reduce(
    (sum, li) => sum + li.quantity * li.unitPrice,
    0
  );
  const depositAmount =
    depositType === "PERCENT"
      ? Math.round(subtotal * (Math.max(0, Math.min(depositValue, 100)) / 100))
      : Math.max(0, Math.min(depositValue, subtotal));
  return { subtotal, total: subtotal, depositAmount };
}

function revalidateFor(opts: { leadId?: string | null; clientId?: string | null }) {
  revalidatePath("/quotes");
  if (opts.leadId) revalidatePath(`/leads/${opts.leadId}`);
  if (opts.clientId) revalidatePath(`/clients/${opts.clientId}`);
}

export async function saveQuote(input: QuoteFormInput): Promise<{
  error?: string;
  success?: boolean;
  quoteId?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  if (!input.subject.trim()) return { error: "Subject is required" };
  if (input.lineItems.length === 0)
    return { error: "At least one line item is required" };

  const leadId = input.leadId ?? null;
  const clientId = input.clientId ?? null;
  if (!leadId && !clientId)
    return { error: "Select a lead or client for this quote" };
  if (leadId && clientId)
    return { error: "Quote can target a lead or client, not both" };

  if (leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId: user.id },
    });
    if (!lead) return { error: "Lead not found" };
  }
  if (clientId) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: user.id },
    });
    if (!client) return { error: "Client not found" };
  }

  const { subtotal, total, depositAmount } = computeTotals(
    input.lineItems,
    input.depositType,
    input.depositValue
  );

  const validUntil = input.validUntil ? new Date(input.validUntil) : null;

  if (input.quoteId) {
    const existing = await prisma.quote.findFirst({
      where: { id: input.quoteId, userId: user.id },
    });
    if (!existing) return { error: "Quote not found" };
    if (existing.status !== "DRAFT")
      return { error: "Only draft quotes can be edited" };

    await prisma.$transaction([
      prisma.quoteLineItem.deleteMany({ where: { quoteId: existing.id } }),
      prisma.quote.update({
        where: { id: existing.id },
        data: {
          subject: input.subject.trim(),
          subtotal,
          total,
          depositType: input.depositType,
          depositAmount,
          validUntil,
          notes: input.notes?.trim() || null,
          lineItems: {
            create: input.lineItems.map((li, idx) => ({
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              total: li.quantity * li.unitPrice,
              position: idx,
            })),
          },
        },
      }),
    ]);

    revalidateFor({ leadId: existing.leadId, clientId: existing.clientId });
    return { success: true, quoteId: existing.id };
  }

  const created = await prisma.quote.create({
    data: {
      userId: user.id,
      leadId,
      clientId,
      subject: input.subject.trim(),
      subtotal,
      total,
      depositType: input.depositType,
      depositAmount,
      validUntil,
      notes: input.notes?.trim() || null,
      lineItems: {
        create: input.lineItems.map((li, idx) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          total: li.quantity * li.unitPrice,
          position: idx,
        })),
      },
    },
  });

  revalidateFor({ leadId, clientId });
  return { success: true, quoteId: created.id };
}

export async function sendQuote(quoteId: string): Promise<{
  error?: string;
  success?: boolean;
}> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, userId: user.id },
    include: {
      lead: true,
      client: true,
      lineItems: { orderBy: { position: "asc" } },
    },
  });
  if (!quote) return { error: "Quote not found" };

  const recipientEmail = quote.lead?.email ?? quote.client?.email ?? null;
  const recipientName = quote.lead?.name ?? quote.client?.name ?? "there";
  if (!recipientEmail)
    return { error: "Recipient needs an email address before sending" };

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: QuoteStatus.SENT,
      sentAt: new Date(),
    },
  });

  await logActivity({
    userId: user.id,
    actorId: user.id,
    action: ActivityType.QUOTE_SENT,
    metadata: {
      quoteId: quote.id,
      quoteSubject: quote.subject,
      total: quote.total,
      recipientName,
    },
  });

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://itsfriday.dev";
    const publicUrl = `${appUrl}/portal/quotes/${quote.publicToken}`;

    const { subject, html, text } = buildQuoteSentEmail({
      freelancerName: user.name ?? user.email,
      clientName: recipientName,
      quoteSubject: quote.subject,
      totalCents: quote.total,
      depositCents: quote.depositAmount,
      lineItems: quote.lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
      })),
      publicUrl,
      notes: quote.notes,
    });

    const resend = getResend();
    if (!resend) {
      console.warn("[quote-sent-email] Resend not configured — skipping");
    } else {
      await resend.emails.send({
        from: "Friday <quotes@itsfriday.dev>",
        to: recipientEmail,
        subject,
        html,
        text,
      });
    }
  } catch (err) {
    console.error("[quote-sent-email] failed to send:", err);
  }

  revalidateFor({ leadId: quote.leadId, clientId: quote.clientId });
  return { success: true };
}

export async function deleteQuote(quoteId: string): Promise<{
  error?: string;
  success?: boolean;
}> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, userId: user.id },
  });
  if (!quote) return { error: "Quote not found" };
  if (quote.status !== "DRAFT")
    return { error: "Only draft quotes can be deleted" };

  await prisma.quote.delete({ where: { id: quoteId } });

  revalidateFor({ leadId: quote.leadId, clientId: quote.clientId });
  return { success: true };
}

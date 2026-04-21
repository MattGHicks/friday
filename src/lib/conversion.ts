import { prisma } from "@/lib/prisma";
import {
  ActivityType,
  ActorType,
  InvoiceStatus,
  LeadStatus,
  Prisma,
  ProjectStatus,
  QuoteStatus,
} from "@/generated/prisma/client";

/**
 * Accept a quote:
 *   - If tied to a lead: create/reuse Client + Project(ON_HOLD), set Lead.status = WON.
 *   - If tied to a client: create a Project(ON_HOLD) for the follow-on work.
 *   - Either path: generate a deposit Invoice (isDeposit = true, quoteId = quote.id).
 *
 * The Stripe webhook flips Project.status → ACTIVE when the deposit is paid.
 */
export async function acceptQuoteAndPrepareDeposit(quoteId: string): Promise<{
  error?: string;
  projectId?: string;
  invoiceId?: string;
}> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { lead: true, client: true, lineItems: true },
  });
  if (!quote) return { error: "Quote not found" };
  if (quote.status === QuoteStatus.ACCEPTED)
    return { error: "Quote has already been accepted" };
  if (quote.status === QuoteStatus.DECLINED)
    return { error: "Quote has already been declined" };
  if (quote.status === QuoteStatus.EXPIRED)
    return { error: "This quote has expired" };
  if (quote.lineItems.length === 0)
    return { error: "Quote has no line items" };

  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    let clientId: string;
    let leadId: string | null = null;

    if (quote.client) {
      clientId = quote.client.id;
    } else if (quote.lead) {
      leadId = quote.lead.id;
      const existing = quote.lead.email
        ? await tx.client.findFirst({
            where: { userId: quote.userId, email: quote.lead.email },
          })
        : null;
      if (existing) {
        clientId = existing.id;
      } else {
        const created = await tx.client.create({
          data: {
            userId: quote.userId,
            name: quote.lead.name,
            email: quote.lead.email ?? `${quote.lead.id}@lead.local`,
            company: quote.lead.company,
            phone: quote.lead.phone,
            notes: quote.lead.notes,
          },
        });
        clientId = created.id;
      }
    } else {
      throw new Error("Quote has no lead or client");
    }

    const project = await tx.project.create({
      data: {
        userId: quote.userId,
        clientId,
        name: quote.subject,
        status: ProjectStatus.ON_HOLD,
      },
    });

    const invoice = await tx.invoice.create({
      data: {
        userId: quote.userId,
        clientId,
        projectId: project.id,
        quoteId: quote.id,
        isDeposit: true,
        subtotal: quote.depositAmount,
        total: quote.depositAmount,
        status: InvoiceStatus.SENT,
        lineItems: [
          {
            description: `Deposit — ${quote.subject}`,
            quantity: 1,
            unitPrice: quote.depositAmount,
            total: quote.depositAmount,
          },
        ],
        notes: `Deposit to kick off: ${quote.subject}`,
      },
    });

    await tx.quote.update({
      where: { id: quote.id },
      data: { status: QuoteStatus.ACCEPTED, acceptedAt: now },
    });

    if (leadId) {
      await tx.lead.update({
        where: { id: leadId },
        data: {
          status: LeadStatus.WON,
          convertedClientId: clientId,
          convertedProjectId: project.id,
        },
      });
    }

    // QUOTE_ACCEPTED carries the quote + project context so dashboard and portal
    // feeds can anchor on the moment of acceptance. Plus the deposit INVOICE_SENT.
    await tx.activity.create({
      data: {
        userId: quote.userId,
        projectId: project.id,
        actorId: quote.userId,
        actorType: ActorType.USER,
        action: ActivityType.QUOTE_ACCEPTED,
        metadata: {
          quoteId: quote.id,
          quoteSubject: quote.subject,
          depositAmount: quote.depositAmount,
          fromLead: Boolean(leadId),
        } as Prisma.InputJsonValue,
      },
    });
    await tx.activity.create({
      data: {
        userId: quote.userId,
        projectId: project.id,
        actorId: quote.userId,
        actorType: ActorType.USER,
        action: ActivityType.INVOICE_SENT,
        metadata: {
          invoiceId: invoice.id,
          total: invoice.total,
          isDeposit: true,
        } as Prisma.InputJsonValue,
      },
    });

    return { projectId: project.id, invoiceId: invoice.id };
  });

  return result;
}

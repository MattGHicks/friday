import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ActivityType, ActorType, QuoteStatus } from "@/generated/prisma/client";
import { logActivity } from "@/app/(dashboard)/projects/[id]/log-activity";
import { PortalBrandHeader } from "@/components/portal/brand-header";
import { QuoteViewer } from "./quote-viewer";

export const dynamic = "force-dynamic";

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          brandColor: true,
          logoUrl: true,
        },
      },
      lead: { select: { name: true, company: true } },
      client: { select: { name: true, company: true } },
      lineItems: { orderBy: { position: "asc" } },
    },
  });

  if (!quote) notFound();

  if (quote.status === QuoteStatus.SENT) {
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: QuoteStatus.VIEWED, viewedAt: new Date() },
    });
    quote.status = QuoteStatus.VIEWED;
    quote.viewedAt = new Date();

    await logActivity({
      userId: quote.userId,
      actorId: quote.id,
      actorType: ActorType.CLIENT,
      action: ActivityType.QUOTE_VIEWED,
      metadata: {
        quoteId: quote.id,
        quoteSubject: quote.subject,
      },
    });
  }

  const recipient = quote.lead ?? quote.client;
  const freelancerName = quote.user.name ?? quote.user.email;

  return (
    <>
      <PortalBrandHeader
        freelancer={{
          name: quote.user.name,
          logoUrl: quote.user.logoUrl,
          brandColor: quote.user.brandColor,
        }}
      />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        <QuoteViewer
          quote={{
            id: quote.id,
            subject: quote.subject,
            status: quote.status,
            subtotal: quote.subtotal,
            total: quote.total,
            depositAmount: quote.depositAmount,
            depositType: quote.depositType,
            validUntil: quote.validUntil,
            sentAt: quote.sentAt,
            acceptedAt: quote.acceptedAt,
            declinedAt: quote.declinedAt,
            notes: quote.notes,
            publicToken: quote.publicToken,
            lineItems: quote.lineItems.map((li) => ({
              id: li.id,
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              total: li.total,
            })),
          }}
          freelancerName={freelancerName}
          brandColor={quote.user.brandColor}
          recipientName={recipient?.name ?? "there"}
          recipientCompany={recipient?.company ?? null}
        />
      </main>
    </>
  );
}

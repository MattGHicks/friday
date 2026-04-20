import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, Building2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeadDetailActions } from "./lead-detail-actions";
import { QuotesPanel } from "../../quotes/quotes-panel";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const lead = await prisma.lead.findFirst({
    where: { id, userId: user.id },
    include: {
      pipelineStage: { select: { id: true, name: true, color: true } },
    },
  });
  if (!lead) notFound();

  const [stages, quotes] = await Promise.all([
    prisma.pipelineStage.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
      orderBy: { position: "asc" },
    }),
    prisma.quote.findMany({
      where: { userId: user.id, leadId: lead.id },
      include: {
        lineItems: {
          orderBy: { position: "asc" },
          select: { description: true, quantity: true, unitPrice: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const publicBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://itsfriday.dev";

  return (
    <div className="flex flex-col gap-8 animate-fade-up">
      <div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs text-cream/40 hover:text-cream transition-colors"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
          Back to leads
        </Link>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-cream">
              {lead.name}
            </h1>
            {lead.company && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                {lead.company}
              </p>
            )}
          </div>
          <LeadDetailActions lead={lead} stages={stages} />
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/[0.06] bg-surface-2 p-4">
          <h2 className="mb-3 font-display text-sm font-bold text-cream">
            Contact
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-cream/70">
              <Mail className="h-3.5 w-3.5 text-cream/40" strokeWidth={1.5} />
              {lead.email ? (
                <a
                  href={`mailto:${lead.email}`}
                  className="hover:text-gold transition-colors"
                >
                  {lead.email}
                </a>
              ) : (
                <span className="text-cream/30 italic">No email</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-cream/70">
              <Phone className="h-3.5 w-3.5 text-cream/40" strokeWidth={1.5} />
              {lead.phone ? (
                <a
                  href={`tel:${lead.phone}`}
                  className="hover:text-gold transition-colors"
                >
                  {lead.phone}
                </a>
              ) : (
                <span className="text-cream/30 italic">No phone</span>
              )}
            </div>
            {lead.source && (
              <div className="flex items-center gap-2 text-cream/70">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cream/40">
                  Source
                </span>
                <span>{lead.source}</span>
              </div>
            )}
            {lead.pipelineStage && (
              <div className="flex items-center gap-2 text-cream/70">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: lead.pipelineStage.color }}
                />
                <span>{lead.pipelineStage.name}</span>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-surface-2 p-4">
          <h2 className="mb-3 font-display text-sm font-bold text-cream">
            Notes
          </h2>
          {lead.notes ? (
            <p className="text-sm text-cream/70 whitespace-pre-wrap leading-relaxed">
              {lead.notes}
            </p>
          ) : (
            <p className="text-sm text-cream/30 italic">No notes yet.</p>
          )}
        </div>
      </section>

      <QuotesPanel
        target={{ kind: "lead", leadId: lead.id }}
        recipientHasEmail={Boolean(lead.email)}
        quotes={quotes}
        publicBaseUrl={publicBaseUrl}
      />
    </div>
  );
}

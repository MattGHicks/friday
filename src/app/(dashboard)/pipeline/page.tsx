import Link from "next/link";
import {
  Sparkles,
  FileText,
  CreditCard,
  Play,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";

const UNPAID_STATUSES = new Set(["SENT", "VIEWED", "OVERDUE"]);

/**
 * Pipeline — the project lifecycle view.
 *
 * Shows everything flowing through the business as one pipeline:
 *   Leads → Quoted → Deposit pending → Active → Completed
 *
 * Each column pulls from a different source (leads / quotes / projects).
 * This is intentionally read-only — stage transitions happen through the
 * natural actions (send quote, accept quote, mark invoice paid, etc.).
 * The lead drag-and-drop board is still available at /leads/board.
 */
export default async function PipelinePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [activeLeads, openQuotes, projects] = await Promise.all([
    prisma.lead.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: [{ updatedAt: "desc" }],
      take: 30,
    }),
    prisma.quote.findMany({
      where: {
        userId: user.id,
        status: { in: ["DRAFT", "SENT", "VIEWED"] },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 30,
    }),
    prisma.project.findMany({
      where: {
        userId: user.id,
        status: { in: ["ON_HOLD", "ACTIVE", "COMPLETED"] },
      },
      include: {
        client: { select: { id: true, name: true } },
        invoices: {
          select: { total: true, status: true, isDeposit: true },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 60,
    }),
  ]);

  // Split projects into lifecycle buckets
  const depositPending = projects.filter((p) => {
    if (p.status !== "ON_HOLD") return false;
    const deposit = p.invoices.find((inv) => inv.isDeposit);
    return deposit && deposit.status !== "PAID";
  });

  const activeProjects = projects.filter((p) => p.status === "ACTIVE");
  const completedProjects = projects
    .filter((p) => p.status === "COMPLETED")
    .slice(0, 10);

  function outstandingCents(
    invs: { total: number; status: string }[]
  ): number {
    return invs
      .filter((i) => UNPAID_STATUSES.has(i.status))
      .reduce((sum, i) => sum + i.total, 0);
  }

  return (
    <div className="flex flex-col flex-1 -mx-6 md:-mx-10 -my-8">
      {/* Header */}
      <div className="px-6 md:px-10 pt-8 pb-5 border-b border-white/[0.04]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Pipeline
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything flowing through your business — from first lead to
              paid-and-shipped.
            </p>
          </div>
          <Link href="/leads/board">
            <Button variant="outline" size="sm" className="gap-1.5">
              Leads board
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Button>
          </Link>
        </div>
      </div>

      {/* Lifecycle columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 md:px-10 py-6 min-h-0 snap-x scroll-smooth">
        <div className="flex gap-3 h-full pb-4">
          {/* Leads */}
          <Column
            title="Leads"
            icon={Sparkles}
            tone="gold"
            count={activeLeads.length}
            emptyHref="/leads"
            emptyLabel="No active leads"
          >
            {activeLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                href={`/leads/${lead.id}`}
                name={lead.name}
                subtitle={lead.company ?? lead.email ?? null}
              />
            ))}
          </Column>

          {/* Quoted */}
          <Column
            title="Quoted"
            icon={FileText}
            tone="gold"
            count={openQuotes.length}
            emptyHref="/quotes"
            emptyLabel="No open quotes"
          >
            {openQuotes.map((q) => (
              <QuoteCard
                key={q.id}
                href={`/quotes`}
                subject={q.subject}
                total={q.total}
                status={q.status}
              />
            ))}
          </Column>

          {/* Deposit pending */}
          <Column
            title="Deposit pending"
            icon={CreditCard}
            tone="fire"
            count={depositPending.length}
            emptyLabel="No deposits waiting"
          >
            {depositPending.map((p) => (
              <ProjectCard
                key={p.id}
                href={`/projects/${p.id}`}
                name={p.name}
                clientName={p.client.name}
                outstandingCents={outstandingCents(p.invoices)}
              />
            ))}
          </Column>

          {/* Active */}
          <Column
            title="Active"
            icon={Play}
            tone="sage"
            count={activeProjects.length}
            emptyLabel="No active projects"
          >
            {activeProjects.map((p) => (
              <ProjectCard
                key={p.id}
                href={`/projects/${p.id}`}
                name={p.name}
                clientName={p.client.name}
                outstandingCents={outstandingCents(p.invoices)}
                dueDate={p.dueDate}
              />
            ))}
          </Column>

          {/* Completed */}
          <Column
            title="Completed"
            icon={CheckCircle2}
            tone="sage"
            count={completedProjects.length}
            emptyLabel="Nothing shipped yet"
          >
            {completedProjects.map((p) => (
              <ProjectCard
                key={p.id}
                href={`/projects/${p.id}`}
                name={p.name}
                clientName={p.client.name}
                outstandingCents={outstandingCents(p.invoices)}
                muted
              />
            ))}
          </Column>
        </div>
      </div>
    </div>
  );
}

// ── Components ─────────────────────────────────────────────────────────────

type Tone = "gold" | "fire" | "sage";

const TONE_STYLES: Record<Tone, { dot: string; icon: string }> = {
  gold: { dot: "bg-gold", icon: "text-gold" },
  fire: { dot: "bg-fire", icon: "text-fire" },
  sage: { dot: "bg-sage", icon: "text-sage" },
};

function Column({
  title,
  icon: Icon,
  tone,
  count,
  children,
  emptyLabel,
  emptyHref,
}: {
  title: string;
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
  tone: Tone;
  count: number;
  children?: React.ReactNode;
  emptyLabel: string;
  emptyHref?: string;
}) {
  const toneClass = TONE_STYLES[tone];
  const hasContent = count > 0;

  return (
    <div className="flex flex-col w-[85vw] sm:w-72 shrink-0 h-full snap-start snap-always">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Icon className={`h-3.5 w-3.5 ${toneClass.icon}`} strokeWidth={1.5} />
          <span className="font-display font-semibold text-sm text-cream">
            {title}
          </span>
          <span className="text-xs text-cream/40 font-mono">{count}</span>
        </div>
      </div>

      <div className="flex-1 min-h-[120px] rounded-xl border border-white/[0.04] bg-surface-1/40 p-2 space-y-2 overflow-y-auto">
        {hasContent ? (
          children
        ) : emptyHref ? (
          <Link
            href={emptyHref}
            className="flex items-center justify-center h-24 text-[11px] text-cream/30 italic hover:text-cream/60 transition-colors"
          >
            {emptyLabel}
          </Link>
        ) : (
          <div className="flex items-center justify-center h-24 text-[11px] text-cream/20 italic">
            {emptyLabel}
          </div>
        )}
      </div>
    </div>
  );
}

function LeadCard({
  href,
  name,
  subtitle,
}: {
  href: string;
  name: string;
  subtitle: string | null;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-white/[0.06] bg-surface-2 p-3 transition-colors hover:border-white/[0.12] hover:bg-surface-3"
    >
      {subtitle && (
        <div className="text-[10px] font-mono uppercase tracking-wider text-cream/40 mb-1 truncate">
          {subtitle}
        </div>
      )}
      <div className="font-display font-semibold text-sm text-cream leading-tight line-clamp-2">
        {name}
      </div>
    </Link>
  );
}

function QuoteCard({
  href,
  subject,
  total,
  status,
}: {
  href: string;
  subject: string;
  total: number;
  status: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-white/[0.06] bg-surface-2 p-3 transition-colors hover:border-white/[0.12] hover:bg-surface-3"
    >
      <div className="mb-1 flex items-center gap-1.5">
        <Badge
          variant="outline"
          className="border-gold/30 bg-gold/10 px-1.5 py-0 text-[9px] text-gold"
        >
          {status.toLowerCase()}
        </Badge>
      </div>
      <div className="font-display font-semibold text-sm text-cream leading-tight line-clamp-2 mb-1.5">
        {subject}
      </div>
      <div className="text-xs font-mono tabular-nums text-gold">
        {formatMoney(total)}
      </div>
    </Link>
  );
}

function ProjectCard({
  href,
  name,
  clientName,
  outstandingCents,
  dueDate,
  muted = false,
}: {
  href: string;
  name: string;
  clientName: string;
  outstandingCents: number;
  dueDate?: Date | null;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-lg border p-3 transition-colors ${
        muted
          ? "border-white/[0.04] bg-surface-1/60 opacity-70 hover:opacity-100 hover:bg-surface-2"
          : "border-white/[0.06] bg-surface-2 hover:border-white/[0.12] hover:bg-surface-3"
      }`}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-cream/40 mb-1 truncate">
        {clientName}
      </div>
      <div className="font-display font-semibold text-sm text-cream leading-tight line-clamp-2 mb-2">
        {name}
      </div>
      <div className="flex items-center justify-between text-[10px] text-cream/50">
        {outstandingCents > 0 ? (
          <span className="font-mono tabular-nums text-gold">
            {formatMoney(outstandingCents)} due
          </span>
        ) : (
          <span className="text-cream/30">—</span>
        )}
        {dueDate && (
          <span className="font-mono">
            {new Date(dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>
    </Link>
  );
}

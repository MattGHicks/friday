import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  DollarSign,
  Layers,
  TrendingUp,
  Users,
  FolderOpen,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, startOfMonth, endOfDay, addDays } from "date-fns";
import { QuickActionsBar } from "./quick-actions-bar";
import { OnboardingChecklist } from "./onboarding-checklist";

/* ── Helpers ──────────────────────────────────────────────── */

function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatActivityLabel(action: string, metadata: unknown): string {
  const meta = metadata as Record<string, unknown> | null;
  switch (action) {
    case "FILE_UPLOADED":            return `Uploaded ${meta?.fileName ? `"${meta.fileName}"` : "a file"}`;
    case "INVOICE_SENT":             return "Sent an invoice";
    case "INVOICE_PAID":             return "Invoice marked as paid";
    case "REVIEW_APPROVED":          return "Approved a design review";
    case "REVIEW_CHANGES_REQUESTED": return "Requested changes on a review";
    case "COMMENT_ADDED":            return "Added a comment";
    case "PROJECT_CREATED":          return "Created a project";
    case "STATUS_CHANGED":           return `Status → ${meta?.newStatus ?? "unknown"}`;
    default:                         return action.toLowerCase().replace(/_/g, " ");
  }
}

/* ── Page ──────────────────────────────────────────────────── */

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const monthStart = startOfMonth(new Date());
  const todayEnd = endOfDay(new Date());
  const sevenDaysFromNow = endOfDay(addDays(new Date(), 7));

  const [
    clients,
    projects,
    stages,
    projectsByStageRaw,
    outstandingAgg,
    paidThisMonthAgg,
    overdueInvoices,
    overdueAgg,
    projectsDueSoon,
    recentActivity,
    firstFile,
    firstSentInvoice,
  ] = await Promise.all([
    // Clients (for quick actions + meeting form)
    prisma.client.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, company: true },
      orderBy: { name: "asc" },
    }),
    // Projects (for meeting form)
    prisma.project.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, clientId: true },
      orderBy: { name: "asc" },
    }),
    // Stages (for mini pipeline)
    prisma.pipelineStage.findMany({
      where: { userId: user.id },
      orderBy: { position: "asc" },
    }),
    // Projects grouped per stage (count only)
    prisma.project.groupBy({
      by: ["stageId"],
      where: { userId: user.id },
      _count: true,
    }),
    // Outstanding (sent + viewed + overdue)
    prisma.invoice.aggregate({
      where: {
        userId: user.id,
        status: { in: ["SENT", "VIEWED", "OVERDUE"] },
      },
      _sum: { total: true },
    }),
    // Paid this month
    prisma.invoice.aggregate({
      where: {
        userId: user.id,
        status: "PAID",
        paidAt: { gte: monthStart },
      },
      _sum: { total: true },
    }),
    // Overdue invoices (top 3 for detail list)
    prisma.invoice.findMany({
      where: { userId: user.id, status: "OVERDUE" },
      include: {
        client: { select: { name: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 3,
    }),
    // Overdue total (all overdue, for banner)
    prisma.invoice.aggregate({
      where: { userId: user.id, status: "OVERDUE" },
      _sum: { total: true },
      _count: true,
    }),
    // Projects due in next 7 days
    prisma.project.findMany({
      where: {
        userId: user.id,
        status: { in: ["ACTIVE", "ON_HOLD"] },
        dueDate: { lte: sevenDaysFromNow, gte: monthStart },
      },
      select: { id: true, name: true, dueDate: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    // Recent activity (last 10)
    prisma.activity.findMany({
      where: { project: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { project: { select: { id: true, name: true } } },
    }),
    // Onboarding: any uploaded file
    prisma.file.findFirst({
      where: { project: { userId: user.id } },
      select: { id: true },
    }),
    // Onboarding: any sent/paid invoice
    prisma.invoice.findFirst({
      where: {
        userId: user.id,
        status: { in: ["SENT", "VIEWED", "OVERDUE", "PAID"] },
      },
      select: { id: true },
    }),
  ]);

  const stageCountMap = new Map<string, number>();
  projectsByStageRaw.forEach((row) => {
    if (row.stageId) stageCountMap.set(row.stageId, row._count);
  });
  const totalProjects = projectsByStageRaw.reduce((sum, row) => sum + row._count, 0);

  const outstandingCents = outstandingAgg._sum.total ?? 0;
  const paidCents = paidThisMonthAgg._sum.total ?? 0;
  const overdueTotalCents = overdueAgg._sum.total ?? 0;
  const overdueCount = overdueAgg._count;

  const projectsDueToday = projectsDueSoon.filter(
    (p) => p.dueDate && new Date(p.dueDate) <= todayEnd
  );

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user.name?.split(" ")[0];

  const needsAttentionCount = overdueInvoices.length;

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="animate-fade-up">
        <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.22em] text-cream/35">
          {greeting}
        </p>
        <h1 className="mt-1 font-display text-3xl md:text-4xl font-black tracking-tight text-cream">
          {firstName ? `${firstName}.` : "Welcome back."}
        </h1>
      </div>

      {/* ── Quick actions ──────────────────────────────────── */}
      <div className="animate-fade-up delay-75">
        <QuickActionsBar clients={clients} projects={projects} />
      </div>

      {/* ── Overdue invoice banner ──────────────────────────── */}
      {overdueCount > 0 && (
        <div className="animate-fade-up delay-75">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-fire/25 bg-fire/[0.06] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-fire shrink-0" strokeWidth={1.75} />
              <span className="text-sm text-cream/90">
                <span className="font-semibold text-fire">
                  {overdueCount} {overdueCount === 1 ? "invoice" : "invoices"} overdue
                </span>
                <span className="text-cream/50 mx-1.5">·</span>
                <span className="font-mono font-bold text-cream">
                  {formatMoney(overdueTotalCents)}
                </span>
                <span className="text-cream/50"> outstanding</span>
              </span>
            </div>
            <Link
              href="/projects"
              className="shrink-0 text-xs text-fire/80 hover:text-fire transition-colors flex items-center gap-1"
            >
              View invoices
              <ArrowRight className="w-3 h-3" strokeWidth={2} />
            </Link>
          </div>
        </div>
      )}

      {/* ── Stat strip (4 cols) ────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-up delay-150">
        <Link
          href="/clients"
          className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-surface-2 px-4 py-3.5 hover:border-white/[0.12] hover:bg-surface-3 transition-all"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
            <Users className="w-4 h-4 text-gold" strokeWidth={1.75} />
          </div>
          <div>
            <div className="font-display text-2xl font-black text-cream tabular-nums leading-none">
              {clients.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-cream/40 font-mono mt-0.5">
              {clients.length === 1 ? "Client" : "Clients"}
            </div>
          </div>
        </Link>

        <Link
          href="/projects"
          className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-surface-2 px-4 py-3.5 hover:border-white/[0.12] hover:bg-surface-3 transition-all"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fire/10">
            <FolderOpen className="w-4 h-4 text-fire" strokeWidth={1.75} />
          </div>
          <div>
            <div className="font-display text-2xl font-black text-cream tabular-nums leading-none">
              {totalProjects}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-cream/40 font-mono mt-0.5">
              {totalProjects === 1 ? "Project" : "Projects"}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-surface-2 px-4 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-coral/10">
            <DollarSign className="w-4 h-4 text-coral" strokeWidth={1.75} />
          </div>
          <div>
            <div className="font-display text-2xl font-black text-cream tabular-nums leading-none">
              {formatMoney(outstandingCents)}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-cream/40 font-mono mt-0.5">
              Outstanding
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-surface-2 px-4 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage/10">
            <TrendingUp className="w-4 h-4 text-sage" strokeWidth={1.75} />
          </div>
          <div>
            <div className="font-display text-2xl font-black text-cream tabular-nums leading-none">
              {formatMoney(paidCents)}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-cream/40 font-mono mt-0.5">
              Paid this month
            </div>
          </div>
        </div>
      </div>

      {/* ── Context widgets row (2 cols) ────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2 animate-fade-up delay-225">
        {/* Needs Attention */}
        <Card className="border-white/[0.06] bg-surface-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-fire" strokeWidth={1.75} />
                <h2 className="font-display text-sm font-bold text-cream">
                  Needs attention
                </h2>
              </div>
              {needsAttentionCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-fire/15 border border-fire/25 text-[10px] text-fire font-bold">
                  {needsAttentionCount}
                </span>
              )}
            </div>

            {needsAttentionCount === 0 ? (
              <div className="flex items-center gap-2 text-xs text-cream/40 py-3">
                <CheckCircle2 className="w-4 h-4 text-sage" strokeWidth={1.75} />
                You&apos;re all caught up.
              </div>
            ) : (
              <div className="space-y-2">
                {overdueInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-2 rounded-md bg-fire/[0.04] border border-fire/15"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-cream truncate">
                        {inv.client.name}
                      </div>
                      <div className="text-[10px] text-fire font-mono mt-0.5">
                        Overdue
                      </div>
                    </div>
                    <span className="text-xs font-bold text-cream tabular-nums ml-2">
                      {formatMoney(inv.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today */}
        <Card className="border-white/[0.06] bg-surface-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold" strokeWidth={1.75} />
                <h2 className="font-display text-sm font-bold text-cream">
                  Today
                </h2>
              </div>
              {projectsDueToday.length > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-gold/15 border border-gold/25 text-[10px] text-gold font-bold">
                  {projectsDueToday.length}
                </span>
              )}
            </div>

            {projectsDueToday.length === 0 ? (
              <div className="text-xs text-cream/40 py-3 italic">
                Nothing due today.
              </div>
            ) : (
              <div className="space-y-1.5">
                {projectsDueToday.map((proj) => (
                  <Link
                    key={proj.id}
                    href={`/projects/${proj.id}`}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-surface-3 transition-colors group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-cream truncate group-hover:text-gold transition-colors">
                        {proj.name}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Pipeline snapshot ───────────────────────────────── */}
      {stages.length > 0 && totalProjects > 0 && (
        <div className="animate-fade-up delay-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cream/40" strokeWidth={1.75} />
              <h2 className="font-display text-sm font-bold text-cream">
                Pipeline
              </h2>
              <span className="text-xs text-cream/30 font-mono">
                {totalProjects} {totalProjects === 1 ? "project" : "projects"}
              </span>
            </div>
            <Link
              href="/pipeline"
              className="text-xs text-cream/40 hover:text-fire transition-colors flex items-center gap-1"
            >
              Open pipeline
              <ArrowRight className="w-3 h-3" strokeWidth={2} />
            </Link>
          </div>

          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
            {stages.map((stage) => {
              const count = stageCountMap.get(stage.id) ?? 0;
              const pct = totalProjects > 0 ? (count / totalProjects) * 100 : 0;
              return (
                <Link
                  key={stage.id}
                  href="/pipeline"
                  className="group block p-3 rounded-lg border border-white/[0.06] bg-surface-2 hover:border-white/[0.12] hover:bg-surface-3 transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: stage.color }}
                    />
                    <span className="text-[11px] text-cream/60 font-medium truncate">
                      {stage.name}
                    </span>
                  </div>
                  <div className="font-display text-2xl font-black text-cream tabular-nums leading-none">
                    {count}
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-surface-4 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: stage.color,
                      }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Onboarding checklist ────────────────────────────── */}
      <OnboardingChecklist
        hasClient={clients.length > 0}
        hasProject={totalProjects > 0}
        hasFile={!!firstFile}
        hasInvoice={!!firstSentInvoice}
        canSharePortal={clients.length > 0}
      />

      {/* ── Recent activity ─────────────────────────────────── */}
      {recentActivity.length > 0 && (
        <div className="animate-fade-up delay-300 space-y-3">
          <h2 className="font-display text-sm font-bold text-cream">
            Recent activity
          </h2>
          <div className="rounded-xl border border-white/[0.06] bg-surface-2 overflow-hidden">
            {recentActivity.map((activity, i) => {
              const label = formatActivityLabel(activity.action, activity.metadata);
              const isLast = i === recentActivity.length - 1;
              return (
                <div
                  key={activity.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-3",
                    !isLast && "border-b border-white/[0.04]"
                  )}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-brand-r opacity-70" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm text-cream/85">{label}</span>
                    <span className="mx-1.5 text-cream/20">·</span>
                    <Link
                      href={`/projects/${activity.project.id}`}
                      className="text-xs text-cream/50 hover:text-gold transition-colors"
                    >
                      {activity.project.name}
                    </Link>
                  </div>
                  <span className="shrink-0 text-xs text-cream/30 tabular-nums">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

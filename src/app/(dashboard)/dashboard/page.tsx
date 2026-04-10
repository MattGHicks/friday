import Link from "next/link";
import { Users, FolderKanban, FileText, AlertCircle, ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [
    clientCount,
    activeProjectCount,
    outstandingInvoices,
    overdueCount,
    recentActivity,
  ] = await Promise.all([
    prisma.client.count({ where: { userId: user.id } }),
    prisma.project.count({ where: { userId: user.id, status: "ACTIVE" } }),
    prisma.invoice.aggregate({
      where: { userId: user.id, status: { in: ["SENT", "VIEWED", "OVERDUE"] } },
      _sum: { total: true },
    }),
    prisma.invoice.count({ where: { userId: user.id, status: "OVERDUE" } }),
    prisma.activity.findMany({
      where: { project: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { project: { select: { id: true, name: true } } },
    }),
  ]);

  const outstandingCents = outstandingInvoices._sum.total ?? 0;
  const outstandingDisplay =
    outstandingCents > 0
      ? `$${(outstandingCents / 100).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : "$0";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user.name?.split(" ")[0];

  return (
    <div className="space-y-10">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="animate-fade-up">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {greeting}
        </p>
        <h1 className="mt-1 font-heading text-3xl font-black tracking-tight text-cream">
          {firstName ? `${firstName}.` : "Your workspace."}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your clients.
        </p>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Clients */}
        <Link
          href="/clients"
          className={cn("group animate-fade-up delay-75")}
        >
          <Card className="h-full transition-all duration-300 group-hover:-translate-y-1 group-hover:border-fire/20 group-hover:shadow-[0_0_0_1px_rgba(229,90,58,0.12),_0_12px_48px_rgba(0,0,0,0.7)]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fire/10 ring-1 ring-fire/20">
                  <Users className="h-[18px] w-[18px] text-fire" strokeWidth={1.5} />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/30 transition-all duration-200 group-hover:text-fire/60 group-hover:translate-x-0.5" strokeWidth={1.5} />
              </div>
              <div className="mt-4">
                <p className="font-heading text-3xl font-black tabular-nums text-cream">{clientCount}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">Clients</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Active projects */}
        <Link
          href="/projects"
          className={cn("group animate-fade-up delay-150")}
        >
          <Card className="h-full transition-all duration-300 group-hover:-translate-y-1 group-hover:border-gold/20 group-hover:shadow-[0_0_0_1px_rgba(240,168,48,0.1),_0_12px_48px_rgba(0,0,0,0.7)]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 ring-1 ring-gold/20">
                  <FolderKanban className="h-[18px] w-[18px] text-gold" strokeWidth={1.5} />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/30 transition-all duration-200 group-hover:text-gold/60 group-hover:translate-x-0.5" strokeWidth={1.5} />
              </div>
              <div className="mt-4">
                <p className="font-heading text-3xl font-black tabular-nums text-cream">{activeProjectCount}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">Active projects</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Outstanding */}
        <div className="animate-fade-up delay-225">
          <Card className="h-full">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage/10 ring-1 ring-sage/20">
                  <FileText className="h-[18px] w-[18px] text-sage" strokeWidth={1.5} />
                </div>
              </div>
              <div className="mt-4">
                <p className="font-heading text-3xl font-black tabular-nums text-cream">{outstandingDisplay}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">Outstanding</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Overdue warning ──────────────────────────────────────── */}
      {overdueCount > 0 && (
        <div className="animate-fade-up delay-300">
          <div className="flex items-center gap-3 rounded-xl border border-fire/20 bg-fire/5 px-4 py-3.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-fire" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-cream">
                {overdueCount} overdue invoice{overdueCount !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                Follow up with your clients to collect payment.
              </p>
            </div>
            <Link
              href="/projects"
              className="shrink-0 text-xs font-semibold text-fire hover:text-cream transition-colors"
            >
              View →
            </Link>
          </div>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────── */}
      {clientCount === 0 && (
        <div className="animate-fade-up delay-300">
          <Card>
            <CardContent className="flex flex-col items-center py-16 text-center">
              {/* Gradient icon ring */}
              <div className="relative flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-gradient-brand opacity-20 blur-xl" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-fire/10 ring-1 ring-fire/20">
                  <Users className="h-6 w-6 text-fire" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="mt-5 font-heading text-xl font-bold text-cream">
                Add your first client
              </h2>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground leading-relaxed">
                Get started by adding a client. You&apos;ll be able to create projects,
                share files, and send invoices from here.
              </p>
              <Link
                href="/clients"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "mt-6"
                )}
              >
                Get started
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Recent activity ──────────────────────────────────────── */}
      {recentActivity.length > 0 && (
        <div className="animate-fade-up delay-300 space-y-3">
          <h2 className="font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Recent activity
          </h2>
          <div className="rounded-xl border border-white/[0.06] bg-card overflow-hidden">
            {recentActivity.map((activity, i) => {
              const label = formatActivityLabel(activity.action, activity.metadata);
              const isLast = i === recentActivity.length - 1;
              return (
                <div
                  key={activity.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]",
                    !isLast && "border-b border-white/[0.04]"
                  )}
                >
                  {/* Gradient dot */}
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-brand-r opacity-70" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm text-cream/90">{label}</span>
                    <span className="mx-1.5 text-muted-foreground/30">·</span>
                    <Link
                      href={`/projects/${activity.project.id}`}
                      className="text-xs text-muted-foreground hover:text-gold transition-colors"
                    >
                      {activity.project.name}
                    </Link>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground/50 tabular-nums">
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

function formatActivityLabel(action: string, metadata: unknown): string {
  const meta = metadata as Record<string, unknown> | null;
  switch (action) {
    case "FILE_UPLOADED":             return `Uploaded ${meta?.fileName ? `"${meta.fileName}"` : "a file"}`;
    case "INVOICE_SENT":              return "Sent an invoice";
    case "INVOICE_PAID":              return "Invoice marked as paid";
    case "REVIEW_APPROVED":           return "Approved a design review";
    case "REVIEW_CHANGES_REQUESTED":  return "Requested changes on a review";
    case "COMMENT_ADDED":             return "Added a comment";
    case "PROJECT_CREATED":           return "Created a project";
    case "STATUS_CHANGED":            return `Status changed to ${meta?.newStatus ?? "unknown"}`;
    default:                          return action.toLowerCase().replace(/_/g, " ");
  }
}

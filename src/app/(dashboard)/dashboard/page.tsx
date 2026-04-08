import Link from "next/link";
import { Users, FolderKanban, FileText, AlertCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [clientCount, activeProjectCount, outstandingInvoices, overdueCount, recentActivity] = await Promise.all([
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
      take: 5,
      include: { project: { select: { id: true, name: true } } },
    }),
  ]);

  const outstandingCents = outstandingInvoices._sum.total ?? 0;
  const outstandingDisplay =
    outstandingCents > 0
      ? `$${(outstandingCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "$0";

  // Time-aware greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {greeting}
          {user.name ? `, ${user.name}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s what&apos;s happening with your clients.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/clients" className="group">
          <Card className="border-border/40 shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-golden/20">
                <Users className="h-5 w-5 text-golden" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{clientCount}</p>
                <p className="text-sm text-muted-foreground">Clients</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/projects" className="group">
          <Card className="border-border/40 shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage/20">
                <FolderKanban className="h-5 w-5 text-sage" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{activeProjectCount}</p>
                <p className="text-sm text-muted-foreground">Active projects</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-border/40 shadow-sm transition-shadow duration-200 hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sunset/20">
              <FileText className="h-5 w-5 text-sunset" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{outstandingDisplay}</p>
              <p className="text-sm text-muted-foreground">Outstanding</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue invoice warning */}
      {overdueCount > 0 && (
        <Card className="border-coral/30 bg-coral/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-coral" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {overdueCount} overdue invoice{overdueCount !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                Follow up with your clients to collect payment.
              </p>
            </div>
            <Link
              href="/projects"
              className="text-xs text-coral hover:underline underline-offset-2"
            >
              View projects →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick action — show only if no clients */}
      {clientCount === 0 && (
        <Card className="border-dashed border-border/40">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-golden/20">
              <Users className="h-7 w-7 text-golden" strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 font-heading text-lg font-semibold">
              Add your first client
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Get started by adding a client. You&apos;ll be able to create
              projects, share files, and send invoices from here.
            </p>
            <Link
              href="/clients"
              className={buttonVariants({ className: "mt-6" })}
            >
              Get started
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div>
          <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent activity
          </h2>
          <div className="space-y-1">
            {recentActivity.map((activity) => {
              const label = formatActivityLabel(activity.action, activity.metadata);
              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-golden/50" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm text-foreground">{label}</span>
                    <span className="mx-1.5 text-muted-foreground/40">·</span>
                    <Link
                      href={`/projects/${activity.project.id}`}
                      className="text-xs text-muted-foreground hover:text-golden transition-colors"
                    >
                      {activity.project.name}
                    </Link>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground/60">
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
    case "FILE_UPLOADED": return `Uploaded ${meta?.fileName ? `"${meta.fileName}"` : "a file"}`;
    case "INVOICE_SENT": return "Sent an invoice";
    case "INVOICE_PAID": return "Invoice marked as paid";
    case "REVIEW_APPROVED": return "Approved a design review";
    case "REVIEW_CHANGES_REQUESTED": return "Requested changes on a review";
    case "COMMENT_ADDED": return "Added a comment";
    case "PROJECT_CREATED": return "Created a project";
    case "STATUS_CHANGED": return `Status changed to ${meta?.newStatus ?? "unknown"}`;
    default: return action.toLowerCase().replace(/_/g, " ");
  }
}

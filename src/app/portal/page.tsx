import Link from "next/link";
import { format } from "date-fns";
import {
  FolderKanban,
  FileText,
  CheckCircle2,
  Clock,
  PauseCircle,
  CheckCircle,
  LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getPortalClient } from "@/lib/portal-auth";
import type { ProjectStatus, InvoiceStatus } from "@/generated/prisma/client";
import { PortalSignInForm } from "./sign-in-form";
import { portalSignOut } from "./actions";

const PROJECT_STATUS: Record<
  ProjectStatus,
  {
    label: string;
    className: string;
    icon: React.FC<{ className?: string; strokeWidth?: number }>;
  }
> = {
  ACTIVE: { label: "Active", className: "bg-sage/20 text-sage border-sage/30", icon: Clock },
  ON_HOLD: { label: "On hold", className: "bg-gold/20 text-gold border-gold/30", icon: PauseCircle },
  COMPLETED: { label: "Completed", className: "bg-cream/10 text-cream/70 border-cream/20", icon: CheckCircle2 },
  ARCHIVED: { label: "Archived", className: "bg-muted/50 text-muted-foreground border-border/50", icon: FolderKanban },
};

const INVOICE_STATUS: Record<InvoiceStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-muted/50 text-muted-foreground border-border/50" },
  SENT: { label: "Invoice sent", className: "bg-gold/20 text-gold border-gold/30" },
  VIEWED: { label: "Viewed", className: "bg-gold/10 text-gold/70 border-gold/20" },
  PAID: { label: "Paid", className: "bg-sage/20 text-sage border-sage/30" },
  OVERDUE: { label: "Overdue", className: "bg-coral/20 text-coral border-coral/30" },
};

export default async function PortalHomePage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const { payment } = await searchParams;
  const paymentSuccess = payment === "success";

  const client = await getPortalClient();

  if (!client) {
    return (
      <div className="mx-auto max-w-md py-10">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Sign in to your portal
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the email your designer invited you with.
          </p>
        </div>
        <PortalSignInForm />
      </div>
    );
  }

  const [projects, freelancer] = await Promise.all([
    prisma.project.findMany({
      where: { clientId: client.id, status: { not: "ARCHIVED" } },
      orderBy: { createdAt: "desc" },
      include: {
        files: {
          where: { isDeliverable: true },
          select: { id: true },
        },
        invoices: {
          where: { status: { in: ["SENT", "VIEWED", "OVERDUE", "PAID"] } },
          select: { id: true, total: true, status: true, dueDate: true },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: client.userId },
      select: { welcomeMessage: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      {paymentSuccess && (
        <div className="flex items-center gap-3 rounded-lg border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-sage">
          <CheckCircle className="h-5 w-5 shrink-0" strokeWidth={1.5} />
          <div>
            <span className="font-medium">Payment received.</span>{" "}
            <span className="text-sage/80">Your invoice has been paid. Thank you!</span>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {client.name}
            {client.company ? (
              <span className="ml-2 font-normal text-muted-foreground">
                · {client.company}
              </span>
            ) : null}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {freelancer?.welcomeMessage ??
              "Your project portal — view status, files, and invoices."}
          </p>
        </div>
        <form action={portalSignOut}>
          <button
            type="submit"
            className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
            Sign out
          </button>
        </form>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
              <FolderKanban className="h-6 w-6 text-gold" strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 font-heading text-base font-semibold">No active projects</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Projects will appear here once work begins.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const statusCfg = PROJECT_STATUS[project.status];
            const StatusIcon = statusCfg.icon;

            return (
              <Card key={project.id} className="border-border/40 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/portal/projects/${project.id}`}
                        className="font-heading text-base font-semibold transition-colors duration-150 hover:text-gold"
                      >
                        {project.name}
                      </Link>
                      {project.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[11px] ${statusCfg.className}`}
                    >
                      <StatusIcon className="mr-1 h-3 w-3" strokeWidth={1.5} />
                      {statusCfg.label}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                    {project.dueDate && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
                        Due {format(new Date(project.dueDate), "MMM d, yyyy")}
                      </div>
                    )}
                    {project.files.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {project.files.length} deliverable
                        {project.files.length !== 1 ? "s" : ""}
                      </div>
                    )}
                    {project.invoices.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        {project.invoices.map((inv) => {
                          const invCfg = INVOICE_STATUS[inv.status as InvoiceStatus];
                          return (
                            <Badge
                              key={inv.id}
                              variant="outline"
                              className={`text-[10px] ${invCfg.className}`}
                            >
                              {invCfg.label} · ${(inv.total / 100).toFixed(2)}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/portal/projects/${project.id}`}
                      className="text-xs text-muted-foreground underline-offset-2 transition-colors duration-150 hover:text-gold hover:underline"
                    >
                      View project details →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

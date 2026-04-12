import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { FolderKanban, FileText, CheckCircle2, Clock, PauseCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import type { ProjectStatus, InvoiceStatus } from "@/generated/prisma/client";

const PROJECT_STATUS: Record<ProjectStatus, { label: string; className: string; icon: React.FC<{ className?: string; strokeWidth?: number }> }> = {
  ACTIVE: { label: "Active", className: "bg-sage/20 text-sage border-sage/30", icon: Clock },
  ON_HOLD: { label: "On hold", className: "bg-gold/20 text-gold border-gold/30", icon: PauseCircle },
  COMPLETED: { label: "Completed", className: "bg-brown-400/20 text-brown-300 border-brown-400/30", icon: CheckCircle2 },
  ARCHIVED: { label: "Archived", className: "bg-muted/50 text-muted-foreground border-border/50", icon: FolderKanban },
};

const INVOICE_STATUS: Record<InvoiceStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-muted/50 text-muted-foreground border-border/50" },
  SENT: { label: "Invoice sent", className: "bg-gold/20 text-gold border-gold/30" },
  VIEWED: { label: "Viewed", className: "bg-gold/10 text-gold/70 border-gold/20" },
  PAID: { label: "Paid", className: "bg-sage/20 text-sage border-sage/30" },
  OVERDUE: { label: "Overdue", className: "bg-coral/20 text-coral border-coral/30" },
};

export default async function ClientPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { clientId } = await params;
  const { payment } = await searchParams;
  const paymentSuccess = payment === "success";

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      user: { select: { welcomeMessage: true } },
      projects: {
        where: { status: { not: "ARCHIVED" } },
        orderBy: { createdAt: "desc" },
        include: {
          files: {
            where: { isDeliverable: true },
            select: { id: true, name: true, url: true, mimeType: true },
          },
          invoices: {
            where: { status: { in: ["SENT", "VIEWED", "OVERDUE", "PAID"] } },
            select: { id: true, total: true, status: true, dueDate: true },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
      },
    },
  });

  if (!client) notFound();

  return (
    <div className="space-y-8">
      {/* Payment success banner */}
      {paymentSuccess && (
        <div className="flex items-center gap-3 rounded-lg border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-sage">
          <CheckCircle className="h-5 w-5 shrink-0" strokeWidth={1.5} />
          <div>
            <span className="font-medium">Payment received.</span>{" "}
            <span className="text-sage/80">Your invoice has been paid. Thank you!</span>
          </div>
        </div>
      )}
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {client.name}
          {client.company ? (
            <span className="ml-2 font-normal text-muted-foreground">
              · {client.company}
            </span>
          ) : null}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {client.user.welcomeMessage ?? "Your project portal — view status, files, and invoices."}
        </p>
      </div>

      {/* Projects */}
      {client.projects.length === 0 ? (
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
          {client.projects.map((project) => {
            const statusCfg = PROJECT_STATUS[project.status];
            const StatusIcon = statusCfg.icon;

            return (
              <Card key={project.id} className="border-border/40 shadow-sm">
                <CardContent className="p-5">
                  {/* Project header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/portal/${clientId}/projects/${project.id}`}
                        className="font-heading text-base font-semibold hover:text-gold transition-colors duration-150"
                      >
                        {project.name}
                      </Link>
                      {project.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
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

                  {/* Meta row */}
                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                    {project.dueDate && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
                        Due {format(new Date(project.dueDate), "MMM d, yyyy")}
                      </div>
                    )}

                    {/* Deliverables */}
                    {project.files.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {project.files.length} deliverable{project.files.length !== 1 ? "s" : ""}
                      </div>
                    )}

                    {/* Outstanding invoices */}
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

                  {/* View detail link */}
                  <div className="mt-4">
                    <Link
                      href={`/portal/${clientId}/projects/${project.id}`}
                      className="text-xs text-muted-foreground underline-offset-2 hover:text-gold hover:underline transition-colors duration-150"
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

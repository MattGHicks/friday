import { notFound } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Download,
  FileText,
  Image as ImageIcon,
  File,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import type { ProjectStatus, InvoiceStatus } from "@/generated/prisma/client";
import { PayInvoiceButton } from "./pay-invoice-button";

const PROJECT_STATUS: Record<ProjectStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-sage/20 text-sage border-sage/30" },
  ON_HOLD: { label: "On hold", className: "bg-gold/20 text-gold border-gold/30" },
  COMPLETED: { label: "Completed", className: "bg-brown-400/20 text-brown-300 border-brown-400/30" },
  ARCHIVED: { label: "Archived", className: "bg-muted/50 text-muted-foreground border-border/50" },
};

const INVOICE_STATUS: Record<InvoiceStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-muted/50 text-muted-foreground border-border/50" },
  SENT: { label: "Sent", className: "bg-gold/20 text-gold border-gold/30" },
  VIEWED: { label: "Viewed", className: "bg-gold/10 text-gold/70 border-gold/20" },
  PAID: { label: "Paid", className: "bg-sage/20 text-sage border-sage/30" },
  OVERDUE: { label: "Overdue", className: "bg-coral/20 text-coral border-coral/30" },
};

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/"))
    return <ImageIcon className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} />;
  if (mimeType === "application/pdf" || mimeType.startsWith("text/") || mimeType.includes("document"))
    return <FileText className="h-4 w-4 shrink-0 text-sunset" strokeWidth={1.5} />;
  return <File className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ClientProjectPage({
  params,
}: {
  params: Promise<{ clientId: string; projectId: string }>;
}) {
  const { clientId, projectId } = await params;

  // Verify the project belongs to this client
  const project = await prisma.project.findFirst({
    where: { id: projectId, clientId },
    include: {
      client: { select: { id: true, name: true } },
      columns: {
        orderBy: { position: "asc" },
        include: { cards: { orderBy: { position: "asc" } } },
      },
      files: { orderBy: { createdAt: "desc" } },
      invoices: {
        where: { status: { in: ["SENT", "VIEWED", "OVERDUE", "PAID"] } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) notFound();

  const statusCfg = PROJECT_STATUS[project.status];
  const deliverables = project.files.filter((f) => f.isDeliverable);
  const allFiles = project.files;

  return (
    <div className="space-y-8">
      {/* Back + header */}
      <div>
        <Link
          href={`/portal/${clientId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          {project.client.name}
        </Link>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={`text-[11px] ${statusCfg.className}`}>
                {statusCfg.label}
              </Badge>
              {project.dueDate && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Due {format(new Date(project.dueDate), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Board status */}
      {project.columns.length > 0 && (
        <section>
          <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Project board
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {project.columns.map((column) => (
              <div key={column.id} className="rounded-lg border border-border/40 bg-card/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {column.name}
                  </span>
                  <span className="rounded-full bg-gold/10 px-1.5 py-0.5 text-[11px] font-medium text-gold">
                    {column.cards.length}
                  </span>
                </div>
                {column.cards.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {column.cards.map((card) => (
                      <li
                        key={card.id}
                        className="flex items-start gap-1.5 rounded-md bg-background/60 px-2.5 py-2 text-sm"
                      >
                        <CheckCircle2
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40"
                          strokeWidth={1.5}
                        />
                        <span className="leading-snug">{card.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Deliverables */}
      {deliverables.length > 0 && (
        <section>
          <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Deliverables
          </h2>
          <div className="space-y-2">
            {deliverables.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/50 px-4 py-3"
              >
                <FileTypeIcon mimeType={file.mimeType} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)} ·{" "}
                    {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <a
                  href={file.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-gold/10 hover:text-gold"
                >
                  <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Download
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All files (if different from deliverables) */}
      {allFiles.length > deliverables.length && (
        <section>
          <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            All files
          </h2>
          <div className="space-y-2">
            {allFiles
              .filter((f) => !f.isDeliverable)
              .map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/50 px-4 py-3"
                >
                  <FileTypeIcon mimeType={file.mimeType} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.size)} ·{" "}
                      {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <a
                    href={file.url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-gold/10 hover:text-gold"
                  >
                    <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Download
                  </a>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Invoices */}
      {project.invoices.length > 0 && (
        <section>
          <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Invoices
          </h2>
          <div className="space-y-3">
            {project.invoices.map((inv) => {
              const invCfg = INVOICE_STATUS[inv.status as InvoiceStatus];
              const lineItems = inv.lineItems as Array<{ description: string; quantity: number; unitPrice: number }> | null;
              return (
                <Card key={inv.id} className="border-border/40">
                  <CardContent className="p-4">
                    {/* Invoice header */}
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} />
                      <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        #{inv.id.slice(0, 8).toUpperCase()}
                      </span>
                      <Badge variant="outline" className={`text-[10px] ${invCfg.className}`}>
                        {invCfg.label}
                      </Badge>
                      {inv.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          Due {format(new Date(inv.dueDate), "MMM d, yyyy")}
                        </span>
                      )}
                      <span className="ml-auto font-heading text-base font-semibold tabular-nums">
                        ${(inv.total / 100).toFixed(2)}
                      </span>
                    </div>
                    {/* Line items */}
                    {lineItems && lineItems.length > 0 && (
                      <div className="mt-3 border-t border-border/30 pt-3">
                        <div className="space-y-1.5">
                          {lineItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {item.description}
                                {item.quantity !== 1 && (
                                  <span className="ml-1 opacity-60">× {item.quantity}</span>
                                )}
                              </span>
                              <span className="tabular-nums">
                                ${((item.quantity * item.unitPrice) / 100).toFixed(2)}
                              </span>
                            </div>
                          ))}
                          {inv.tax > 0 && (
                            <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/20 pt-1.5 mt-1.5">
                              <span>Tax</span>
                              <span className="tabular-nums">${(inv.tax / 100).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {inv.notes && (
                      <p className="mt-2 text-xs text-muted-foreground/70 border-t border-border/20 pt-2">
                        {inv.notes}
                      </p>
                    )}
                    {["SENT", "VIEWED", "OVERDUE"].includes(inv.status) && (
                      <PayInvoiceButton invoiceId={inv.id} clientId={clientId} />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

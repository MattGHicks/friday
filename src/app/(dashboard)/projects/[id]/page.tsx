import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FilesPanel } from "./files-panel";
import { InvoicesPanel } from "./invoices-panel";
import { ProjectHeaderActions } from "./project-header-actions";
import { MessagesPanel, type MessageRecord } from "./messages-panel";
import { ProjectDetailsSidebar } from "./project-details-sidebar";
import { StatusStrip } from "./status-strip";
import type { InvoiceRecord } from "./invoices-panel";
import type { ProjectStatus } from "@/generated/prisma/client";

const STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-sage/20 text-sage border-sage/30" },
  ON_HOLD: { label: "On hold", className: "bg-gold/20 text-gold border-gold/30" },
  COMPLETED: { label: "Completed", className: "bg-cream/10 text-cream/70 border-cream/20" },
  ARCHIVED: { label: "Archived", className: "bg-muted/50 text-muted-foreground border-border/50" },
};

const UNPAID_STATUSES = new Set(["SENT", "VIEWED", "OVERDUE"]);

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const [project, clients] = await Promise.all([
    prisma.project.findFirst({
      where: { id, userId: user.id },
      include: {
        client: { select: { id: true, name: true } },
        files: { orderBy: { createdAt: "desc" } },
        invoices: {
          orderBy: { createdAt: "desc" },
          include: { quote: { select: { id: true, total: true, subject: true } } },
        },
        thread: {
          include: {
            messages: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    }),
    prisma.client.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!project) notFound();

  const messages: MessageRecord[] = (project.thread?.messages ?? []).map((m) => ({
    id: m.id,
    authorType: m.authorType,
    authorName: m.authorName,
    authorEmail: m.authorEmail,
    body: m.body,
    systemEventType: m.systemEventType,
    systemMetadata: m.systemMetadata,
    createdAt: m.createdAt,
  }));

  const status = STATUS_CONFIG[project.status];

  // Status strip data — unpaid totals, due date, latest message
  const unpaidInvoices = project.invoices.filter((inv) =>
    UNPAID_STATUSES.has(inv.status)
  );
  const unpaidCents = unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const lastMessageAt =
    messages.length > 0 ? messages[messages.length - 1].createdAt : null;

  // Detect the "accepted quote with outstanding balance" situation. If a deposit
  // invoice was generated from a quote and no follow-up invoice exists yet,
  // surface a clear call-to-action to bill the remainder.
  const depositInvoice = project.invoices.find(
    (inv) => inv.isDeposit && inv.quoteId
  );
  const nonDepositInvoicesFromQuote = depositInvoice
    ? project.invoices.filter(
        (inv) =>
          !inv.isDeposit && inv.quoteId === depositInvoice.quoteId
      )
    : [];
  const quoteTotal = depositInvoice?.quote?.total ?? 0;
  const depositPaid = depositInvoice?.status === "PAID";
  const remainingCents = depositInvoice
    ? Math.max(0, quoteTotal - depositInvoice.total)
    : 0;
  const remainingInvoiceExists = nonDepositInvoicesFromQuote.length > 0;
  const showRemainingBalancePrompt =
    Boolean(depositInvoice) &&
    depositPaid &&
    remainingCents > 0 &&
    !remainingInvoiceExists;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link
          href={`/clients/${project.client.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          {project.client.name}
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>
          <ProjectHeaderActions
            project={{
              id: project.id,
              name: project.name,
              description: project.description,
              status: project.status,
              dueDate: project.dueDate,
              clientId: project.client.id,
            }}
            clients={clients}
          />
        </div>
      </div>

      {/* Slim status strip — one line, no duplicate data */}
      <StatusStrip
        unpaidCents={unpaidCents}
        unpaidCount={unpaidInvoices.length}
        dueDate={project.dueDate}
        lastMessageAt={lastMessageAt}
      />

      {/* 2-column layout on lg: main column + sticky sidebar */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Primary column — Files hero → Invoices → Messages */}
        <div className="flex flex-col gap-10">
          <section>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Files
              </h2>
              <span className="text-xs text-muted-foreground/70">
                {project.files.length}{" "}
                {project.files.length === 1 ? "file" : "files"}
              </span>
            </div>
            <FilesPanel
              projectId={project.id}
              files={project.files.map((f) => ({
                id: f.id,
                name: f.name,
                url: f.url,
                size: f.size,
                mimeType: f.mimeType,
                isDeliverable: f.isDeliverable,
                createdAt: f.createdAt,
              }))}
            />
          </section>

          <section>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Invoices
              </h2>
            </div>
            <InvoicesPanel
              projectId={project.id}
              clientId={project.client.id}
              invoices={project.invoices.map(
                (inv): InvoiceRecord => ({
                  id: inv.id,
                  subtotal: inv.subtotal,
                  tax: inv.tax,
                  total: inv.total,
                  status: inv.status,
                  dueDate: inv.dueDate,
                  notes: inv.notes,
                  lineItems: inv.lineItems,
                  isDeposit: inv.isDeposit,
                  createdAt: inv.createdAt,
                })
              )}
              remainingBalancePrompt={
                showRemainingBalancePrompt && depositInvoice
                  ? {
                      quoteId: depositInvoice.quoteId!,
                      quoteSubject: depositInvoice.quote?.subject ?? project.name,
                      remainingCents,
                    }
                  : null
              }
            />
          </section>

          <section>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Conversation
              </h2>
              <span className="text-xs text-muted-foreground/70">
                {messages.length}{" "}
                {messages.length === 1 ? "message" : "messages"}
              </span>
            </div>
            <MessagesPanel projectId={project.id} messages={messages} />
          </section>
        </div>

        {/* Sidebar */}
        <ProjectDetailsSidebar
          client={project.client}
          status={project.status}
          statusConfig={status}
          startedAt={project.createdAt}
          dueDate={project.dueDate}
        />
      </div>
    </div>
  );
}

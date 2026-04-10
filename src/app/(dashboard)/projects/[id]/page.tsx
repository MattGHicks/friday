import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KanbanBoardLoader } from "./kanban-board-loader";
import { FilesPanel } from "./files-panel";
import { InvoicesPanel } from "./invoices-panel";
import { ProjectHeaderActions } from "./project-header-actions";
import { ActivityPanel } from "./activity-panel";
import type { InvoiceRecord } from "./invoices-panel";
import type { ActivityRecord } from "./activity-panel";
import type { ProjectStatus } from "@/generated/prisma/client";

const STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-sage/20 text-sage border-sage/30" },
  ON_HOLD: { label: "On hold", className: "bg-golden/20 text-golden border-golden/30" },
  COMPLETED: { label: "Completed", className: "bg-brown-400/20 text-brown-300 border-brown-400/30" },
  ARCHIVED: { label: "Archived", className: "bg-muted/50 text-muted-foreground border-border/50" },
};

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, { tab = "tasks" }] = await Promise.all([params, searchParams]);
  const user = await getCurrentUser();
  if (!user) return null;

  const activeTab =
    tab === "files"
      ? "files"
      : tab === "invoices"
      ? "invoices"
      : tab === "activity"
      ? "activity"
      : "tasks";
  const includeFiles = activeTab === "files";
  const includeInvoices = activeTab === "invoices";
  const includeActivity = activeTab === "activity";

  const [project, clients] = await Promise.all([
    prisma.project.findFirst({
      where: { id, userId: user.id },
      include: {
        client: { select: { id: true, name: true } },
        columns: {
          orderBy: { position: "asc" },
          include: { cards: { orderBy: { position: "asc" } } },
        },
        ...(includeFiles ? { files: { orderBy: { createdAt: "desc" } } } : {}),
        ...(includeInvoices
          ? { invoices: { orderBy: { createdAt: "desc" } } }
          : {}),
        ...(includeActivity
          ? { activities: { orderBy: { createdAt: "desc" }, take: 50 } }
          : {}),
      },
    }),
    prisma.client.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!project) notFound();

  const status = STATUS_CONFIG[project.status];

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
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
          {project.name}
        </h1>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="outline" className={`text-[11px] ${status.className}`}>
            {status.label}
          </Badge>
          {project.description && (
            <span className="text-sm text-muted-foreground">{project.description}</span>
          )}
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

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-border/40">
        <Link
          href="?tab=tasks"
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "tasks"
              ? "-mb-px border-b-2 border-golden text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Tasks
        </Link>
        <Link
          href="?tab=files"
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "files"
              ? "-mb-px border-b-2 border-golden text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Files
        </Link>
        <Link
          href="?tab=invoices"
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "invoices"
              ? "-mb-px border-b-2 border-golden text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Invoices
        </Link>
        <Link
          href="?tab=activity"
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "activity"
              ? "-mb-px border-b-2 border-golden text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Activity
        </Link>
      </div>

      {/* Tab content */}
      {activeTab === "tasks" ? (
        <KanbanBoardLoader project={project} />
      ) : activeTab === "files" ? (
        <FilesPanel
          projectId={project.id}
          files={(project.files ?? []).map((f) => ({
            id: f.id,
            name: f.name,
            url: f.url,
            size: f.size,
            mimeType: f.mimeType,
            isDeliverable: f.isDeliverable,
            createdAt: f.createdAt,
          }))}
        />
      ) : activeTab === "invoices" ? (
        <InvoicesPanel
          projectId={project.id}
          clientId={project.client.id}
          invoices={(project.invoices ?? []).map(
            (inv): InvoiceRecord => ({
              id: inv.id,
              subtotal: inv.subtotal,
              tax: inv.tax,
              total: inv.total,
              status: inv.status,
              dueDate: inv.dueDate,
              notes: inv.notes,
              lineItems: inv.lineItems,
              createdAt: inv.createdAt,
            })
          )}
        />
      ) : (
        <ActivityPanel
          activities={(project.activities ?? []).map(
            (a): ActivityRecord => ({
              id: a.id,
              action: a.action,
              metadata: a.metadata,
              createdAt: a.createdAt,
            })
          )}
        />
      )}
    </div>
  );
}

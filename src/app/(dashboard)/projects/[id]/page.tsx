import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FilesPanel } from "./files-panel";
import { InvoicesPanel } from "./invoices-panel";
import { ProjectHeaderActions } from "./project-header-actions";
import { ActivityPanel } from "./activity-panel";
import type { InvoiceRecord } from "./invoices-panel";
import type { ActivityRecord } from "./activity-panel";
import type { ProjectStatus } from "@/generated/prisma/client";

const STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-sage/20 text-sage border-sage/30" },
  ON_HOLD: { label: "On hold", className: "bg-gold/20 text-gold border-gold/30" },
  COMPLETED: { label: "Completed", className: "bg-brown-400/20 text-brown-300 border-brown-400/30" },
  ARCHIVED: { label: "Archived", className: "bg-muted/50 text-muted-foreground border-border/50" },
};

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
        invoices: { orderBy: { createdAt: "desc" } },
        activities: { orderBy: { createdAt: "desc" }, take: 50 },
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
    <div className="flex flex-col gap-8">
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

      {/* Files */}
      <section>
        <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Files
        </h2>
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

      {/* Invoices */}
      <section>
        <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Invoices
        </h2>
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
              createdAt: inv.createdAt,
            })
          )}
        />
      </section>

      {/* Activity */}
      <section>
        <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Activity
        </h2>
        <ActivityPanel
          activities={project.activities.map(
            (a): ActivityRecord => ({
              id: a.id,
              action: a.action,
              metadata: a.metadata,
              createdAt: a.createdAt,
            })
          )}
        />
      </section>
    </div>
  );
}

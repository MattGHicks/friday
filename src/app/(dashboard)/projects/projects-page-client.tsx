"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectFormSheet } from "@/components/dashboard/project-form";
import { deleteProject } from "./actions";
import type { Client, Project, ProjectStatus } from "@/generated/prisma/client";
import { formatDistanceToNow, format } from "date-fns";

type ProjectWithClient = Project & {
  client: Pick<Client, "id" | "name">;
};

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Active",
    className: "bg-sage/20 text-sage border-sage/30",
  },
  ON_HOLD: {
    label: "On hold",
    className: "bg-golden/20 text-golden border-golden/30",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-brown-400/20 text-brown-300 border-brown-400/30",
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-muted/50 text-muted-foreground border-border/50",
  },
};

function ProjectRow({
  project,
  onEdit,
}: {
  project: ProjectWithClient;
  onEdit: (project: Project) => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const status = STATUS_CONFIG[project.status];

  async function handleDelete() {
    setDeleting(true);
    await deleteProject(project.id);
    setDeleteOpen(false);
    setDeleting(false);
  }

  return (
    <>
      <Card className="group border-border/40 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link
                href={`/projects/${project.id}`}
                className="font-heading text-sm font-semibold text-foreground transition-colors hover:text-golden"
              >
                {project.name}
              </Link>
              <Link
                href={`/clients/${project.client.id}`}
                className="mt-0.5 block text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {project.client.name}
              </Link>
              {project.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                  {project.description}
                </p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all duration-200 hover:bg-accent hover:text-foreground group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-[11px] ${status.className}`}
            >
              {status.label}
            </Badge>
            {project.dueDate && (
              <span className="text-[11px] text-muted-foreground">
                Due {format(new Date(project.dueDate), "MMM d, yyyy")}
              </span>
            )}
          </div>

          <p className="mt-2 text-[11px] text-muted-foreground/60">
            Created{" "}
            {formatDistanceToNow(new Date(project.createdAt), {
              addSuffix: true,
            })}
          </p>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{project.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              This will permanently remove this project and all its files,
              reviews, and invoices. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ProjectsPageClient({
  projects,
  clients,
}: {
  projects: ProjectWithClient[];
  clients: Pick<Client, "id" | "name">[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  function handleEdit(project: Project) {
    setEditingProject(project);
    setFormOpen(true);
  }

  function handleOpenChange(open: boolean) {
    setFormOpen(open);
    if (!open) setEditingProject(null);
  }

  const hasClients = clients.length > 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Projects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {projects.length === 0
              ? "Create projects to track work for your clients."
              : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {hasClients && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
            New project
          </Button>
        )}
      </div>

      {/* Projects grid or empty states */}
      {!hasClients ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage/20">
              <FolderKanban className="h-7 w-7 text-sage" strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 font-heading text-lg font-semibold">
              Add a client first
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Projects belong to clients. Add your first client to get started.
            </p>
            <Link
              href="/clients"
              className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Go to clients
            </Link>
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage/20">
              <FolderKanban className="h-7 w-7 text-sage" strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 font-heading text-lg font-semibold">
              No projects yet
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create your first project. Pick a client, set a status, and start
              tracking work.
            </p>
            <Button className="mt-6" onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
              New project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      <ProjectFormSheet
        open={formOpen}
        onOpenChange={handleOpenChange}
        project={editingProject}
        clients={clients}
      />
    </div>
  );
}

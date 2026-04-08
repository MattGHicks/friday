"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  Phone,
  Mail,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { deleteProject } from "@/app/(dashboard)/projects/actions";
import type { Client, Project, ProjectStatus } from "@/generated/prisma/client";
import { formatDistanceToNow, format } from "date-fns";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

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

function ProjectCard({
  project,
  onEdit,
}: {
  project: Project;
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
            <Link href={`/projects/${project.id}`} className="min-w-0 flex-1">
              <h3 className="font-heading text-sm font-semibold text-foreground truncate hover:text-golden transition-colors duration-150">
                {project.name}
              </h3>
              {project.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}
            </Link>

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

export function ClientDetailClient({
  client,
  projects,
}: {
  client: Client;
  projects: Project[];
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

  return (
    <div className="space-y-8">
      {/* Back nav */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Clients
      </Link>

      {/* Client header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-golden/20 text-golden text-lg font-semibold">
              {getInitials(client.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {client.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              {client.company && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {client.company}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                {client.email}
              </span>
              {client.phone && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {client.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {client.notes && (
        <Card className="border-border/40">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{client.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Projects section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Projects</h2>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
            Add project
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card className="border-dashed border-border/40">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage/20">
                <FolderKanban
                  className="h-6 w-6 text-sage"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="mt-3 font-heading text-base font-semibold">
                No projects yet
              </h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Create a project to start tracking work for {client.name}.
              </p>
              <Button size="sm" className="mt-4" onClick={() => setFormOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
                Add project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>

      <ProjectFormSheet
        open={formOpen}
        onOpenChange={handleOpenChange}
        project={editingProject}
        clients={[{ id: client.id, name: client.name }]}
        defaultClientId={client.id}
      />
    </div>
  );
}

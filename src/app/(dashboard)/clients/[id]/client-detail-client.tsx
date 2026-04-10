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
  Link2,
  Check,
  Star,
  Users,
  UserPlus,
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
import { ContactFormSheet } from "@/components/dashboard/contact-form";
import { deleteProject } from "@/app/(dashboard)/projects/actions";
import {
  deleteContact,
  setPrimaryContact,
} from "@/app/(dashboard)/clients/contact-actions";
import type {
  Client,
  Contact,
  Project,
  ProjectStatus,
} from "@/generated/prisma/client";
import { formatDistanceToNow, format } from "date-fns";

/* ── Helpers ──────────────────────────────────────────────── */

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ── Status config ────────────────────────────────────────── */

const STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: "Active",
    className: "bg-sage/20 text-sage border-sage/30",
  },
  ON_HOLD: {
    label: "On hold",
    className: "bg-gold/20 text-gold border-gold/30",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-cream/10 text-cream/60 border-cream/20",
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-muted/50 text-muted-foreground border-border/50",
  },
};

/* ── Contact card ─────────────────────────────────────────── */

function ContactCard({
  contact,
  isOnly,
  onEdit,
}: {
  contact: Contact;
  isOnly: boolean;
  onEdit: (c: Contact) => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [promoting, setPromoting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await deleteContact(contact.id);
    setDeleteOpen(false);
    setDeleting(false);
  }

  async function handleSetPrimary() {
    setPromoting(true);
    await setPrimaryContact(contact.id);
    setPromoting(false);
  }

  return (
    <>
      <div className="group flex items-start gap-3 rounded-xl border border-border/40 bg-surface-2/60 px-4 py-3.5 transition-colors hover:border-border/70 hover:bg-surface-2">
        {/* Avatar */}
        <Avatar className="h-9 w-9 shrink-0 mt-0.5">
          <AvatarFallback
            className={
              contact.isPrimary
                ? "bg-fire/15 text-fire text-xs font-bold"
                : "bg-surface-4 text-cream/50 text-xs font-medium"
            }
          >
            {getInitials(contact.name)}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-semibold text-sm text-foreground leading-tight">
              {contact.name}
            </span>
            {contact.isPrimary && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-fire/10 border border-fire/20 text-[10px] text-fire font-medium">
                <Star className="w-2.5 h-2.5 fill-fire" />
                Primary
              </span>
            )}
          </div>
          {contact.title && (
            <p className="text-xs text-muted-foreground mt-0.5">{contact.title}</p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-3 w-3" strokeWidth={1.5} />
                {contact.email}
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-3 w-3" strokeWidth={1.5} />
                {contact.phone}
              </a>
            )}
          </div>
          {contact.notes && (
            <p className="mt-1.5 text-xs text-muted-foreground/70 italic line-clamp-1">
              {contact.notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100">
            <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onEdit(contact)}>
              <Pencil className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
              Edit
            </DropdownMenuItem>
            {!contact.isPrimary && (
              <DropdownMenuItem
                onClick={handleSetPrimary}
                disabled={promoting}
              >
                <Star className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
                {promoting ? "Setting..." : "Set as primary"}
              </DropdownMenuItem>
            )}
            {!isOnly && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
                  Remove
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {contact.name}?</DialogTitle>
            <DialogDescription>
              This contact will be removed from this client. Their emails and
              data won't be deleted from anywhere else.
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
              {deleting ? "Removing..." : "Remove contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ── Project card ─────────────────────────────────────────── */

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
              <h3 className="font-display text-sm font-semibold text-foreground truncate hover:text-gold transition-colors duration-150">
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

/* ── Main component ───────────────────────────────────────── */

export function ClientDetailClient({
  client,
  contacts,
  projects,
}: {
  client: Client;
  contacts: Contact[];
  projects: Project[];
}) {
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [copied, setCopied] = useState(false);

  const primaryContact = contacts.find((c) => c.isPrimary) ?? contacts[0];

  function handleCopyPortalLink() {
    const url = `${window.location.origin}/portal/${client.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleEditProject(project: Project) {
    setEditingProject(project);
    setProjectFormOpen(true);
  }

  function handleProjectFormOpenChange(open: boolean) {
    setProjectFormOpen(open);
    if (!open) setEditingProject(null);
  }

  function handleEditContact(contact: Contact) {
    setEditingContact(contact);
    setContactFormOpen(true);
  }

  function handleContactFormOpenChange(open: boolean) {
    setContactFormOpen(open);
    if (!open) setEditingContact(null);
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
            <AvatarFallback className="bg-gradient-brand text-[#1A0800] text-lg font-bold">
              {getInitials(client.company ?? client.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {client.company ?? client.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              {/* When there's a company, show the person name as the contact */}
              {client.company && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {client.name}
                </span>
              )}
              {/* Show primary contact email or client email */}
              {(primaryContact?.email ?? client.email) && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {primaryContact?.email ?? client.email}
                </span>
              )}
              {client.phone && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {client.phone}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 text-xs"
          onClick={handleCopyPortalLink}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-sage" strokeWidth={1.5} />
          ) : (
            <Link2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
          {copied ? "Copied!" : "Copy portal link"}
        </Button>
      </div>

      {/* Notes */}
      {client.notes && (
        <Card className="border-border/40">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{client.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Contacts section ─────────────────────────────────── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold">Contacts</h2>
            {contacts.length > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-surface-3 text-[11px] text-muted-foreground font-mono">
                {contacts.length}
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setContactFormOpen(true)}
            className="gap-1.5"
          >
            <UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Add contact
          </Button>
        </div>

        {contacts.length === 0 ? (
          <Card className="border-dashed border-border/40">
            <CardContent className="flex flex-col items-center py-10 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-fire/10">
                <Users className="h-5 w-5 text-fire" strokeWidth={1.5} />
              </div>
              <h3 className="mt-3 font-display text-sm font-semibold">
                No contacts yet
              </h3>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Add the people you work with at {client.company ?? client.name} — a point of
                contact, billing contact, or stakeholder.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 gap-1.5"
                onClick={() => setContactFormOpen(true)}
              >
                <UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
                Add contact
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                isOnly={contacts.length === 1}
                onEdit={handleEditContact}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Projects section ──────────────────────────────────── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold">Projects</h2>
            {projects.length > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-surface-3 text-[11px] text-muted-foreground font-mono">
                {projects.length}
              </span>
            )}
          </div>
          <Button size="sm" onClick={() => setProjectFormOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
            Add project
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card className="border-dashed border-border/40">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage/20">
                <FolderKanban className="h-6 w-6 text-sage" strokeWidth={1.5} />
              </div>
              <h3 className="mt-3 font-display text-base font-semibold">
                No projects yet
              </h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Create a project to start tracking work for {client.company ?? client.name}.
              </p>
              <Button
                size="sm"
                className="mt-4"
                onClick={() => setProjectFormOpen(true)}
              >
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
                onEdit={handleEditProject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Forms */}
      <ProjectFormSheet
        open={projectFormOpen}
        onOpenChange={handleProjectFormOpenChange}
        project={editingProject}
        clients={[{ id: client.id, name: client.name }]}
        defaultClientId={client.id}
      />

      <ContactFormSheet
        open={contactFormOpen}
        onOpenChange={handleContactFormOpenChange}
        clientId={client.id}
        contact={editingContact}
        isOnlyContact={contacts.length <= 1}
      />
    </div>
  );
}

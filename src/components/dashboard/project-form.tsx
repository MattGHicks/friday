"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createProject,
  updateProject,
  type ProjectFormState,
} from "@/app/(dashboard)/projects/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Client, Project, ProjectStatus } from "@/generated/prisma/client";

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending
        ? isEdit
          ? "Saving..."
          : "Creating..."
        : isEdit
          ? "Save changes"
          : "Create project"}
    </Button>
  );
}

export function ProjectFormSheet({
  open,
  onOpenChange,
  project,
  clients,
  defaultClientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  clients: Pick<Client, "id" | "name">[];
  defaultClientId?: string;
}) {
  const isEdit = !!project;
  const action = isEdit ? updateProject : createProject;
  const [state, formAction] = useActionState<ProjectFormState, FormData>(
    action,
    {}
  );

  const [status, setStatus] = useState<ProjectStatus>(
    project?.status ?? "ACTIVE"
  );
  const [clientId, setClientId] = useState(
    project?.clientId ?? defaultClientId ?? clients[0]?.id ?? ""
  );

  // Reset when project changes
  useEffect(() => {
    setStatus(project?.status ?? "ACTIVE");
    setClientId(project?.clientId ?? defaultClientId ?? clients[0]?.id ?? "");
  }, [project, defaultClientId, clients]);

  // Close on success
  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state.success, onOpenChange]);

  const dueDateValue = project?.dueDate
    ? new Date(project.dueDate).toISOString().split("T")[0]
    : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading">
            {isEdit ? `Edit ${project.name}` : "New project"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update this project's details."
              : "Create a new project for a client."}
          </SheetDescription>
        </SheetHeader>

        <form key={project?.id ?? "new"} action={formAction} className="mt-6 space-y-5">
          {isEdit && <input type="hidden" name="projectId" value={project.id} />}
          <input type="hidden" name="clientId" value={clientId} />
          <input type="hidden" name="status" value={status} />

          {state.error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="proj-name">Project name</Label>
            <Input
              id="proj-name"
              name="name"
              placeholder="Brand identity refresh"
              required
              defaultValue={project?.name ?? ""}
            />
          </div>

          {/* Client picker — only shown when not locked to a specific client */}
          {!defaultClientId && !isEdit && (
            <div className="space-y-2">
              <Label htmlFor="proj-client">Client</Label>
              <select
                id="proj-client"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm text-foreground transition-colors outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id} className="bg-popover">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="proj-status">Status</Label>
            <select
              id="proj-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm text-foreground transition-colors outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-popover">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proj-due">
              Due date{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="proj-due"
              name="dueDate"
              type="date"
              defaultValue={dueDateValue}
              className="[color-scheme:dark]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proj-desc">
              Description{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="proj-desc"
              name="description"
              placeholder="Brief overview of scope, goals, or deliverables..."
              rows={3}
              defaultValue={project?.description ?? ""}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <div className="flex-1">
              <SubmitButton isEdit={isEdit} />
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

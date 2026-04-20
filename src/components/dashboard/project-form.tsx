"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
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
  FormPanel,
  FormPanelBody,
  FormPanelContent,
  FormPanelFooter,
  FormPanelHeader,
} from "@/components/ui/form-panel";
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
    <Button type="submit" disabled={pending}>
      {pending
        ? isEdit
          ? "Saving…"
          : "Creating…"
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
  const router = useRouter();
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

  useEffect(() => {
    setStatus(project?.status ?? "ACTIVE");
    setClientId(project?.clientId ?? defaultClientId ?? clients[0]?.id ?? "");
  }, [project, defaultClientId, clients]);

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state.success, onOpenChange, router]);

  const dueDateValue = project?.dueDate
    ? new Date(project.dueDate).toISOString().split("T")[0]
    : "";

  return (
    <FormPanel open={open} onOpenChange={onOpenChange}>
      <FormPanelContent size="md">
        <form key={project?.id ?? "new"} action={formAction} className="flex flex-1 flex-col min-h-0">
          <FormPanelHeader
            title={isEdit ? `Edit ${project.name}` : "New project"}
            description={
              isEdit
                ? "Update this project's details."
                : "Create a new project for a client."
            }
          />
          <FormPanelBody>
            {isEdit && <input type="hidden" name="projectId" value={project.id} />}
            <input type="hidden" name="clientId" value={clientId} />
            <input type="hidden" name="status" value={status} />

            {state.error && (
              <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </div>
            )}

            <div className="space-y-5">
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

              {!defaultClientId && !isEdit && (
                <div className="space-y-2">
                  <Label htmlFor="proj-client">Client</Label>
                  <select
                    id="proj-client"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-white/10 bg-transparent px-3 text-sm text-cream outline-none focus:border-fire/50 focus:ring-2 focus:ring-fire/20"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id} className="bg-surface-2">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="proj-status">Status</Label>
                  <select
                    id="proj-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    className="flex h-9 w-full rounded-lg border border-white/10 bg-transparent px-3 text-sm text-cream outline-none focus:border-fire/50 focus:ring-2 focus:ring-fire/20"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-surface-2">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="proj-desc">
                  Description{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="proj-desc"
                  name="description"
                  placeholder="Brief overview of scope, goals, or deliverables…"
                  rows={3}
                  defaultValue={project?.description ?? ""}
                />
              </div>
            </div>
          </FormPanelBody>
          <FormPanelFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <SubmitButton isEdit={isEdit} />
          </FormPanelFooter>
        </form>
      </FormPanelContent>
    </FormPanel>
  );
}

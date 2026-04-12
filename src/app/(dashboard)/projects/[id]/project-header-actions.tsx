"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, ChevronDown, Check, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProjectFormSheet } from "@/components/dashboard/project-form";
import { quickUpdateStatus } from "@/app/(dashboard)/projects/actions";
import { saveAsTemplate } from "@/app/(dashboard)/projects/template-actions";
import type { ProjectStatus } from "@/generated/prisma/client";

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

interface ProjectHeaderActionsProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    status: ProjectStatus;
    dueDate: Date | null;
    clientId: string;
  };
  clients: { id: string; name: string }[];
}

export function ProjectHeaderActions({ project, clients }: ProjectHeaderActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState(project.name);
  const [templateError, setTemplateError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSavingTemplate, startSaveTemplate] = useTransition();

  function handleStatusChange(status: ProjectStatus) {
    if (status === project.status) return;
    startTransition(async () => {
      await quickUpdateStatus(project.id, status);
      router.refresh();
    });
  }

  function handleSaveTemplate() {
    if (!templateName.trim()) {
      setTemplateError("Template name is required");
      return;
    }
    setTemplateError("");
    startSaveTemplate(async () => {
      const result = await saveAsTemplate(project.id, templateName.trim());
      if (result.success) {
        setTemplateDialogOpen(false);
      } else {
        setTemplateError(result.error);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isPending}
          className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
        >
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="sr-only">Change status</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {STATUS_OPTIONS.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
            >
              <Check
                className={`mr-2 h-3.5 w-3.5 ${
                  project.status === opt.value ? "opacity-100" : "opacity-0"
                }`}
                strokeWidth={2}
              />
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => {
          setTemplateName(project.name);
          setTemplateError("");
          setTemplateDialogOpen(true);
        }}
      >
        <LayoutTemplate className="h-3.5 w-3.5" strokeWidth={1.5} />
        Save as template
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
        Edit
      </Button>

      <ProjectFormSheet
        open={open}
        onOpenChange={setOpen}
        project={project as never}
        clients={clients}
        defaultClientId={project.clientId}
      />

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Save as template</DialogTitle>
            <DialogDescription>
              Saves the current columns and tasks as a reusable template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="template-name">Template name</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Brand identity project"
              onKeyDown={(e) => e.key === "Enter" && handleSaveTemplate()}
            />
            {templateError && (
              <p className="text-sm text-destructive">{templateError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setTemplateDialogOpen(false)}
              disabled={isSavingTemplate}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={isSavingTemplate}>
              {isSavingTemplate ? "Saving..." : "Save template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

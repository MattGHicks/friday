"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectFormSheet } from "@/components/dashboard/project-form";
import { quickUpdateStatus } from "@/app/(dashboard)/projects/actions";
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
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: ProjectStatus) {
    if (status === project.status) return;
    startTransition(async () => {
      await quickUpdateStatus(project.id, status);
      router.refresh();
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
    </>
  );
}

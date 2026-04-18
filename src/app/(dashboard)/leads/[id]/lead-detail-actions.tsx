"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeadFormSheet } from "../lead-form";
import { deleteLead, setLeadStatus } from "../lead-actions";
import type { Lead, PipelineStage } from "@/generated/prisma/client";

export function LeadDetailActions({
  lead,
  stages,
}: {
  lead: Lead;
  stages: Pick<PipelineStage, "id" | "name">[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleArchive() {
    startTransition(async () => {
      await setLeadStatus(lead.id, "ARCHIVED");
      router.push("/leads");
    });
  }

  function handleDelete() {
    if (!confirm("Delete this lead? This can't be undone.")) return;
    startTransition(async () => {
      await deleteLead(lead.id);
      router.push("/leads");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setEditOpen(true)}
        className="gap-1.5"
      >
        <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
        Edit
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/[0.08] bg-surface-2 text-cream/60 hover:bg-surface-3 hover:text-cream transition-colors">
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleArchive} disabled={pending}>
            <Archive className="h-3.5 w-3.5" strokeWidth={1.5} />
            Archive lead
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={pending}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            Delete lead
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LeadFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        lead={lead}
        stages={stages}
      />
    </div>
  );
}

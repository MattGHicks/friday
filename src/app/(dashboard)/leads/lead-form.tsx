"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { createLead, updateLead, type LeadFormState } from "./lead-actions";
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
import type { Lead, PipelineStage } from "@/generated/prisma/client";

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending
        ? isEdit
          ? "Saving…"
          : "Adding…"
        : isEdit
          ? "Save changes"
          : "Add lead"}
    </Button>
  );
}

export function LeadFormSheet({
  open,
  onOpenChange,
  lead,
  stages,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  stages: Pick<PipelineStage, "id" | "name">[];
}) {
  const isEdit = !!lead;
  const action = isEdit ? updateLead : createLead;
  const [state, formAction] = useActionState<LeadFormState, FormData>(
    action,
    {}
  );

  useEffect(() => {
    if (state.success) onOpenChange(false);
  }, [state.success, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">
            {isEdit ? `Edit ${lead.name}` : "Add a lead"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update this lead's information."
              : "Track a new prospect. Convert to a client when they accept a quote."}
          </SheetDescription>
        </SheetHeader>

        <form
          key={lead?.id ?? "new"}
          action={formAction}
          className="mt-6 space-y-5"
        >
          {isEdit && <input type="hidden" name="leadId" value={lead.id} />}

          {state.error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="lead-name">Name</Label>
            <Input
              id="lead-name"
              name="name"
              required
              defaultValue={lead?.name ?? ""}
              placeholder="Jane Doe"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead-email">Email</Label>
              <Input
                id="lead-email"
                name="email"
                type="email"
                defaultValue={lead?.email ?? ""}
                placeholder="jane@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-phone">Phone</Label>
              <Input
                id="lead-phone"
                name="phone"
                defaultValue={lead?.phone ?? ""}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-company">Company</Label>
            <Input
              id="lead-company"
              name="company"
              defaultValue={lead?.company ?? ""}
              placeholder="Acme Co."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead-stage">Stage</Label>
              <select
                id="lead-stage"
                name="pipelineStageId"
                defaultValue={lead?.pipelineStageId ?? ""}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm text-foreground transition-colors outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              >
                <option value="" className="bg-popover">
                  Default stage
                </option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id} className="bg-popover">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-source">Source</Label>
              <Input
                id="lead-source"
                name="source"
                defaultValue={lead?.source ?? ""}
                placeholder="Referral, site, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-notes">
              Notes{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="lead-notes"
              name="notes"
              rows={3}
              defaultValue={lead?.notes ?? ""}
              placeholder="What they're looking for, budget, timeline…"
              className="resize-none text-sm"
            />
          </div>

          <SubmitButton isEdit={isEdit} />
        </form>
      </SheetContent>
    </Sheet>
  );
}

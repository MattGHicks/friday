"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createLead, updateLead, type LeadFormState } from "./lead-actions";
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
import type { Lead, PipelineStage } from "@/generated/prisma/client";

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
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
  const router = useRouter();
  const isEdit = !!lead;
  const action = isEdit ? updateLead : createLead;
  const [state, formAction] = useActionState<LeadFormState, FormData>(
    action,
    {}
  );

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state.success, onOpenChange, router]);

  return (
    <FormPanel open={open} onOpenChange={onOpenChange}>
      <FormPanelContent size="lg">
        <form
          key={lead?.id ?? "new"}
          action={formAction}
          className="flex flex-1 flex-col min-h-0"
        >
          <FormPanelHeader
            title={isEdit ? `Edit ${lead.name}` : "Add a lead"}
            description={
              isEdit
                ? "Update this lead's information."
                : "Track a new prospect. Convert to a client when they accept a quote."
            }
          />
          <FormPanelBody>
            {isEdit && <input type="hidden" name="leadId" value={lead.id} />}
            {state.error && (
              <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </div>
            )}

            <div className="space-y-5">
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
                    className="flex h-9 w-full rounded-lg border border-white/10 bg-transparent px-3 text-sm text-cream outline-none focus:border-fire/50 focus:ring-2 focus:ring-fire/20"
                  >
                    <option value="" className="bg-surface-2">
                      Default stage
                    </option>
                    {stages.map((s) => (
                      <option key={s.id} value={s.id} className="bg-surface-2">
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

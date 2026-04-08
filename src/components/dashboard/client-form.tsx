"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import {
  createClient,
  updateClient,
  type ClientFormState,
} from "@/app/(dashboard)/clients/actions";
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
import type { Client } from "@/generated/prisma/client";

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending
        ? isEdit
          ? "Saving..."
          : "Adding..."
        : isEdit
          ? "Save changes"
          : "Add client"}
    </Button>
  );
}

export function ClientFormSheet({
  open,
  onOpenChange,
  client,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
}) {
  const isEdit = !!client;
  const action = isEdit ? updateClient : createClient;
  const [state, formAction] = useActionState<ClientFormState, FormData>(
    action,
    {}
  );

  // Close sheet on success
  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state.success, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading">
            {isEdit ? `Edit ${client.name}` : "Add a client"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update your client's information."
              : "Add a new client to start managing their projects."}
          </SheetDescription>
        </SheetHeader>

        <form action={formAction} className="mt-6 space-y-5">
          {isEdit && <input type="hidden" name="clientId" value={client.id} />}

          {state.error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Jane Smith"
              required
              defaultValue={client?.name ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jane@company.com"
              required
              defaultValue={client?.email ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">
              Company{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="company"
              name="company"
              placeholder="Acme Design Co."
              defaultValue={client?.company ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              defaultValue={client?.phone ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Communication preferences, project context, anything useful..."
              rows={3}
              defaultValue={client?.notes ?? ""}
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

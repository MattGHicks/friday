"use client";

import { useActionState, useEffect } from "react";
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
import { createContact, updateContact } from "@/app/(dashboard)/clients/contact-actions";
import type { Contact } from "@/generated/prisma/client";

type FormState = { error?: string } | null;

function AddAction(clientId: string) {
  return async function (_prev: FormState, formData: FormData): Promise<FormState> {
    try {
      await createContact(clientId, {
        name: formData.get("name") as string,
        email: (formData.get("email") as string) || undefined,
        phone: (formData.get("phone") as string) || undefined,
        title: (formData.get("title") as string) || undefined,
        notes: (formData.get("notes") as string) || undefined,
        isPrimary: formData.get("isPrimary") === "true",
      });
      return null;
    } catch (e) {
      return { error: (e as Error).message };
    }
  };
}

function EditAction(contactId: string) {
  return async function (_prev: FormState, formData: FormData): Promise<FormState> {
    try {
      await updateContact(contactId, {
        name: formData.get("name") as string,
        email: (formData.get("email") as string) || undefined,
        phone: (formData.get("phone") as string) || undefined,
        title: (formData.get("title") as string) || undefined,
        notes: (formData.get("notes") as string) || undefined,
        isPrimary: formData.get("isPrimary") === "true",
      });
      return null;
    } catch (e) {
      return { error: (e as Error).message };
    }
  };
}

interface ContactFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  contact?: Contact | null;
  isOnlyContact?: boolean;
}

export function ContactFormSheet({
  open,
  onOpenChange,
  clientId,
  contact,
  isOnlyContact,
}: ContactFormSheetProps) {
  const isEditing = !!contact;
  const action = isEditing ? EditAction(contact.id) : AddAction(clientId);

  const [state, formAction, isPending] = useActionState(action, null);

  // Close on success
  useEffect(() => {
    if (state === null && !isPending) {
      // state null + not pending = successful submit reset
    }
  }, [state, isPending]);

  function handleSubmit(formData: FormData) {
    formAction(formData);
    // Optimistically close — revalidatePath will refresh the server data
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display">
            {isEditing ? "Edit contact" : "Add contact"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update this contact's information."
              : "Add a person at this client — a point of contact, billing contact, or stakeholder."}
          </SheetDescription>
        </SheetHeader>

        <form key={contact?.id ?? "new"} action={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Sarah Chen"
              defaultValue={contact?.name ?? ""}
              required
            />
          </div>

          {/* Title / Role */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Role / Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Marketing Lead, CEO, Billing..."
              defaultValue={contact?.title ?? ""}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="sarah@acme.com"
              defaultValue={contact?.email ?? ""}
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              defaultValue={contact?.phone ?? ""}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Prefers Slack over email, cc on all invoices..."
              rows={2}
              defaultValue={contact?.notes ?? ""}
              className="resize-none"
            />
          </div>

          {/* Primary contact toggle */}
          {!isOnlyContact && (
            <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-surface-3/30 px-4 py-3">
              <input
                type="checkbox"
                id="isPrimary"
                name="isPrimary"
                value="true"
                defaultChecked={contact?.isPrimary ?? false}
                className="h-4 w-4 rounded border-border accent-fire"
              />
              <div>
                <Label htmlFor="isPrimary" className="text-sm font-medium cursor-pointer">
                  Primary contact
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receives portal links and invoice emails
                </p>
              </div>
            </div>
          )}

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending
                ? isEditing
                  ? "Saving..."
                  : "Adding..."
                : isEditing
                ? "Save changes"
                : "Add contact"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

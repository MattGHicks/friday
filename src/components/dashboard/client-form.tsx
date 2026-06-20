"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  createClient,
  updateClient,
  type ClientFormState,
} from "@/app/(dashboard)/clients/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FormPanel,
  FormPanelBody,
  FormPanelContent,
  FormPanelFooter,
  FormPanelHeader,
} from "@/components/ui/form-panel";
import type { Client } from "@/generated/prisma/client";

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
  const router = useRouter();
  const isEdit = !!client;
  const action = isEdit ? updateClient : createClient;
  const [state, formAction] = useActionState<ClientFormState, FormData>(
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
      <FormPanelContent size="md">
        <form key={client?.id ?? "new"} action={formAction} className="flex flex-1 flex-col min-h-0">
          <FormPanelHeader
            title={isEdit ? `Edit ${client.name}` : "Add a client"}
            description={
              isEdit
                ? "Update your client's information."
                : "Add a new client to start managing their projects."
            }
          />
          <FormPanelBody>
            {isEdit && <input type="hidden" name="clientId" value={client.id} />}
            {state.error && (
              <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </div>
            )}
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                  <PhoneInput
                    id="phone"
                    name="phone"
                    placeholder="(555) 123-4567"
                    defaultValue={client?.phone ?? ""}
                  />
                </div>
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
                  placeholder="Communication preferences, project context, anything useful…"
                  rows={3}
                  defaultValue={client?.notes ?? ""}
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

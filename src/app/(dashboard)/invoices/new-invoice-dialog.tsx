"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { createInvoice } from "@/app/(dashboard)/projects/[id]/invoice-actions";
import { formatMoney } from "@/lib/format";

type LineItemDraft = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function emptyLineItem(): LineItemDraft {
  return { id: makeId(), description: "", quantity: "1", unitPrice: "" };
}

function calcSubtotalCents(items: LineItemDraft[]): number {
  return items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = Math.round((parseFloat(item.unitPrice) || 0) * 100);
    return sum + qty * price;
  }, 0);
}

export function NewInvoiceDialog({
  open,
  onOpenChange,
  clients,
  projects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: { id: string; name: string; company: string | null }[];
  projects: { id: string; name: string; clientId: string }[];
}) {
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([emptyLineItem()]);
  const [taxPercent, setTaxPercent] = useState("0");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableProjects = useMemo(
    () => projects.filter((p) => p.clientId === clientId),
    [projects, clientId]
  );

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setClientId("");
      setProjectId("");
      setLineItems([emptyLineItem()]);
      setTaxPercent("0");
      setNotes("");
      setDueDate("");
      setError(null);
    }
  }, [open]);

  // Reset project when client changes
  useEffect(() => {
    setProjectId(availableProjects[0]?.id ?? "");
  }, [clientId, availableProjects]);

  const subtotalCents = calcSubtotalCents(lineItems);
  const taxCents = Math.round(
    subtotalCents * ((parseFloat(taxPercent) || 0) / 100)
  );
  const totalCents = subtotalCents + taxCents;

  const updateItem = useCallback(
    (id: string, field: keyof Omit<LineItemDraft, "id">, value: string) => {
      setLineItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addItem = useCallback(() => {
    setLineItems((prev) => [...prev, emptyLineItem()]);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!clientId) return setError("Select a client.");
    if (!projectId) return setError("Select a project.");
    if (lineItems.length === 0) return setError("Add at least one line item.");

    const parsedItems = lineItems.map((item) => ({
      id: item.id,
      description: item.description.trim(),
      quantity: parseFloat(item.quantity) || 1,
      unitPrice: Math.round((parseFloat(item.unitPrice) || 0) * 100),
    }));

    if (parsedItems.some((item) => !item.description)) {
      return setError("All line items need a description.");
    }

    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set("clientId", clientId);
    fd.set("lineItemsJson", JSON.stringify(parsedItems));
    fd.set("taxPercent", taxPercent);
    fd.set("notes", notes);
    fd.set("dueDate", dueDate);

    setPending(true);
    const result = await createInvoice(fd);
    setPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      onOpenChange(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">New invoice</SheetTitle>
          <SheetDescription>
            Create a draft invoice. You can send it once it&apos;s ready.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inv-client">Client</Label>
              <select
                id="inv-client"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm text-foreground transition-colors outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              >
                <option value="" className="bg-popover">
                  Select a client…
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id} className="bg-popover">
                    {c.company ?? c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inv-project">Project</Label>
              <select
                id="inv-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                disabled={!clientId}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm text-foreground transition-colors outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:opacity-50"
              >
                {availableProjects.length === 0 ? (
                  <option value="" className="bg-popover">
                    {clientId ? "No active projects" : "Pick a client first"}
                  </option>
                ) : (
                  availableProjects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-popover">
                      {p.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_70px_100px_32px] gap-2 px-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Description
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Qty
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Unit price
              </span>
              <span />
            </div>

            {lineItems.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_70px_100px_32px] items-center gap-2"
              >
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.id, "description", e.target.value)
                  }
                  className="h-8 text-sm"
                />
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(item.id, "quantity", e.target.value)
                  }
                  className="h-8 text-sm"
                />
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(item.id, "unitPrice", e.target.value)
                    }
                    className="h-8 pl-5 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={lineItems.length === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-coral/10 hover:text-coral disabled:pointer-events-none disabled:opacity-30"
                  aria-label="Remove line item"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="mt-1 flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-gold/10 hover:text-gold"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
              Add line item
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="inv-tax">Tax %</Label>
                <Input
                  id="inv-tax"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className="h-8 w-24 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-due">Due date</Label>
                <Input
                  id="inv-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-8 w-44 text-sm [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <div className="rounded-lg border border-border/40 bg-background/40 p-4">
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatMoney(subtotalCents)}</span>
                  </div>
                  {taxCents > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Tax ({taxPercent}%)
                      </span>
                      <span>{formatMoney(taxCents)}</span>
                    </div>
                  )}
                  <div className="mt-1 flex items-center justify-between border-t border-border/40 pt-2 font-semibold">
                    <span>Total</span>
                    <span className="text-gold">{formatMoney(totalCents)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inv-notes">
              Notes{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="inv-notes"
              placeholder="Payment instructions, terms, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? "Saving…" : "Create draft"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

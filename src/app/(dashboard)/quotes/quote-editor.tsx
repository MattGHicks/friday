"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveQuote, sendQuote } from "./quote-actions";
import { formatMoney } from "@/lib/format";
import type { DepositType } from "@/generated/prisma/client";

type LineItemDraft = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // cents
};

function newLineItem(): LineItemDraft {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: 1,
    unitPrice: 0,
  };
}

export type QuoteEditorTarget =
  | { kind: "lead"; leadId: string }
  | { kind: "client"; clientId: string };

export function QuoteEditorDialog({
  open,
  onOpenChange,
  target,
  existing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: QuoteEditorTarget;
  existing?: {
    id: string;
    subject: string;
    notes: string | null;
    depositType: DepositType;
    depositAmount: number;
    subtotal: number;
    validUntil: Date | null;
    lineItems: {
      description: string;
      quantity: number;
      unitPrice: number;
    }[];
  } | null;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState(existing?.subject ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [depositType, setDepositType] = useState<DepositType>(
    existing?.depositType ?? "PERCENT"
  );
  const [depositValue, setDepositValue] = useState<number>(() => {
    if (!existing) return 50;
    if (existing.depositType === "PERCENT") {
      return existing.subtotal > 0
        ? Math.round((existing.depositAmount / existing.subtotal) * 100)
        : 50;
    }
    return Math.round(existing.depositAmount / 100);
  });
  const [validUntil, setValidUntil] = useState<string>(
    existing?.validUntil
      ? new Date(existing.validUntil).toISOString().slice(0, 10)
      : ""
  );
  const [lineItems, setLineItems] = useState<LineItemDraft[]>(() =>
    existing
      ? existing.lineItems.map((li) => ({
          id: crypto.randomUUID(),
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
        }))
      : [newLineItem()]
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const subtotal = lineItems.reduce(
    (sum, li) => sum + li.quantity * li.unitPrice,
    0
  );
  const depositAmount =
    depositType === "PERCENT"
      ? Math.round(subtotal * (Math.max(0, Math.min(depositValue, 100)) / 100))
      : Math.max(0, Math.min(depositValue * 100, subtotal));

  function updateItem(id: string, changes: Partial<LineItemDraft>) {
    setLineItems((items) =>
      items.map((li) => (li.id === id ? { ...li, ...changes } : li))
    );
  }
  function removeItem(id: string) {
    setLineItems((items) =>
      items.length === 1 ? items : items.filter((li) => li.id !== id)
    );
  }

  async function handleSave(options: { sendAfter: boolean }) {
    setError(null);
    startTransition(async () => {
      const result = await saveQuote({
        leadId: target.kind === "lead" ? target.leadId : null,
        clientId: target.kind === "client" ? target.clientId : null,
        quoteId: existing?.id,
        subject,
        lineItems: lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
        })),
        depositType,
        depositValue:
          depositType === "PERCENT" ? depositValue : depositValue * 100,
        validUntil: validUntil || null,
        notes: notes || null,
      });
      if (result.error || !result.quoteId) {
        setError(result.error ?? "Could not save quote");
        return;
      }
      if (options.sendAfter) {
        const sent = await sendQuote(result.quoteId);
        if (sent.error) {
          setError(sent.error);
          return;
        }
      }
      router.refresh();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit quote" : "New quote"}</DialogTitle>
          <DialogDescription>
            Draft a line-itemized quote. Send it and the recipient gets a public
            link to accept.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quote-subject">Subject</Label>
            <Input
              id="quote-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brand refresh + marketing site"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Line items</Label>
              <button
                type="button"
                onClick={() => setLineItems([...lineItems, newLineItem()])}
                className="inline-flex items-center gap-1 text-xs text-fire hover:text-gold transition-colors"
              >
                <Plus className="h-3 w-3" strokeWidth={2} />
                Add line
              </button>
            </div>
            <div className="space-y-2">
              {lineItems.map((li) => (
                <div
                  key={li.id}
                  className="grid grid-cols-[1fr_64px_96px_32px] items-center gap-2"
                >
                  <Input
                    value={li.description}
                    onChange={(e) =>
                      updateItem(li.id, { description: e.target.value })
                    }
                    placeholder="What are you delivering?"
                  />
                  <Input
                    type="number"
                    min={1}
                    value={li.quantity}
                    onChange={(e) =>
                      updateItem(li.id, {
                        quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                      })
                    }
                    className="text-right"
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={li.unitPrice / 100 || ""}
                    onChange={(e) =>
                      updateItem(li.id, {
                        unitPrice: Math.round(
                          (parseFloat(e.target.value) || 0) * 100
                        ),
                      })
                    }
                    placeholder="0.00"
                    className="text-right"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(li.id)}
                    disabled={lineItems.length === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-cream/40 transition-colors hover:text-destructive disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Deposit</Label>
              <div className="flex gap-2">
                <select
                  value={depositType}
                  onChange={(e) =>
                    setDepositType(e.target.value as DepositType)
                  }
                  className="flex h-9 w-28 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                >
                  <option value="PERCENT" className="bg-popover">
                    Percent
                  </option>
                  <option value="FIXED" className="bg-popover">
                    Fixed $
                  </option>
                </select>
                <Input
                  type="number"
                  min={0}
                  value={depositValue}
                  onChange={(e) =>
                    setDepositValue(parseFloat(e.target.value) || 0)
                  }
                  className="text-right"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {formatMoney(depositAmount)} due up front
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valid-until">Valid until</Label>
              <Input
                id="valid-until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote-notes">
              Notes{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="quote-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything the recipient should know before accepting…"
              className="resize-none text-sm"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-surface-2/60 px-4 py-3">
            <span className="text-sm text-cream/60">Total</span>
            <span className="font-display text-lg font-bold text-gold">
              {formatMoney(subtotal)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave({ sendAfter: false })}
              disabled={pending}
            >
              {pending ? "Saving…" : "Save draft"}
            </Button>
            <Button
              onClick={() => handleSave({ sendAfter: true })}
              disabled={pending}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" strokeWidth={2} />
              {pending ? "Sending…" : "Save & send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

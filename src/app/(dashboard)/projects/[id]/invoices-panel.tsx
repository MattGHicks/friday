"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, FileText, Send, CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createInvoice, updateInvoiceStatus, deleteInvoice } from "./invoice-actions";
import { formatMoney } from "@/lib/format";

export type InvoiceRecord = {
  id: string;
  subtotal: number; // cents
  tax: number; // cents
  total: number; // cents
  status: string; // InvoiceStatus enum value
  dueDate: Date | null;
  notes: string | null;
  lineItems: unknown; // Json
  createdAt: Date;
};

type LineItemDraft = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string; // dollars as string
};

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-muted/50 text-muted-foreground border-border/50",
  },
  SENT: {
    label: "Sent",
    className: "bg-gold/20 text-gold border-gold/30",
  },
  VIEWED: {
    label: "Viewed",
    className: "bg-gold/10 text-gold/70 border-gold/20",
  },
  PAID: {
    label: "Paid",
    className: "bg-sage/20 text-sage border-sage/30",
  },
  OVERDUE: {
    label: "Overdue",
    className: "bg-coral/20 text-coral border-coral/30",
  },
};

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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

// ── Invoice create form ───────────────────────────────────────────────────────

function CreateInvoiceForm({
  projectId,
  clientId,
  onCancel,
  onSuccess,
}: {
  projectId: string;
  clientId: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([emptyLineItem()]);
  const [taxPercent, setTaxPercent] = useState("0");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotalCents = calcSubtotalCents(lineItems);
  const taxCents = Math.round(subtotalCents * ((parseFloat(taxPercent) || 0) / 100));
  const totalCents = subtotalCents + taxCents;

  const updateItem = useCallback(
    (id: string, field: keyof Omit<LineItemDraft, "id">, value: string) => {
      setLineItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
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

    if (lineItems.length === 0) {
      setError("Add at least one line item.");
      return;
    }

    const parsedItems = lineItems.map((item) => ({
      id: item.id,
      description: item.description.trim(),
      quantity: parseFloat(item.quantity) || 1,
      unitPrice: Math.round((parseFloat(item.unitPrice) || 0) * 100),
    }));

    if (parsedItems.some((item) => !item.description)) {
      setError("All line items need a description.");
      return;
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
      onSuccess();
    }
  }

  return (
    <Card className="border-border/40 bg-card/60">
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <h3 className="font-heading text-base font-semibold">New invoice</h3>

          {/* Line items table */}
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[1fr_80px_100px_32px] gap-2 px-1">
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
                className="grid grid-cols-[1fr_80px_100px_32px] items-center gap-2"
              >
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
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
                    onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
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
              className="mt-1 flex items-center gap-1.5 self-start rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-gold/10 hover:text-gold"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
              Add line item
            </button>
          </div>

          {/* Totals + secondary fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Left: tax, due date, notes */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="taxPercent" className="text-xs">
                  Tax %
                </Label>
                <Input
                  id="taxPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="0"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className="h-8 w-24 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dueDate" className="text-xs">
                  Due date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-8 w-44 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes" className="text-xs">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Payment instructions, terms, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>
            </div>

            {/* Right: running total */}
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

          {error && (
            <p className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2 self-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving…" : "Create invoice"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Single invoice row ────────────────────────────────────────────────────────

function InvoiceRow({ invoice }: { invoice: InvoiceRecord }) {
  const [pending, setPending] = useState(false);
  const config = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.DRAFT;
  const shortId = invoice.id.slice(0, 8).toUpperCase();

  async function handleMarkSent() {
    setPending(true);
    await updateInvoiceStatus(invoice.id, "SENT" as never);
    setPending(false);
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border/40 bg-card/60 px-4 py-3 transition-colors hover:bg-card/80">
      {/* Icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gold/10">
        <FileText className="h-4 w-4 text-gold" strokeWidth={1.5} />
      </div>

      {/* Main info */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            #{shortId}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] ${config.className}`}
          >
            {config.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Created {formatDate(invoice.createdAt)}</span>
          {invoice.dueDate && (() => {
            const isPastDue = new Date(invoice.dueDate) < new Date() && invoice.status !== "PAID";
            return (
              <span className={isPastDue ? "text-coral font-medium" : ""}>
                {isPastDue ? "Overdue · " : "Due "}
                {formatDate(invoice.dueDate)}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Total */}
      <span className="font-heading text-base font-semibold tabular-nums">
        {formatMoney(invoice.total)}
      </span>

      {/* Actions */}
      {invoice.status === "DRAFT" && (
        <button
          onClick={handleMarkSent}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-gold/10 hover:text-gold disabled:pointer-events-none disabled:opacity-50"
          title="Mark as sent"
        >
          <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>Mark sent</span>
        </button>
      )}
      {invoice.status === "DRAFT" && (
        <button
          onClick={async () => {
            setPending(true);
            await deleteInvoice(invoice.id);
            setPending(false);
          }}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-coral/10 hover:text-coral disabled:pointer-events-none disabled:opacity-50"
          title="Delete draft"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>Delete</span>
        </button>
      )}
      {(invoice.status === "SENT" || invoice.status === "VIEWED" || invoice.status === "OVERDUE") && (
        <button
          onClick={async () => {
            setPending(true);
            await updateInvoiceStatus(invoice.id, "PAID" as never);
            setPending(false);
          }}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-sage/10 hover:text-sage disabled:pointer-events-none disabled:opacity-50"
          title="Mark as paid"
        >
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>Mark paid</span>
        </button>
      )}
      {invoice.status === "PAID" && (
        <CheckCircle2
          className="h-4 w-4 shrink-0 text-sage"
          strokeWidth={1.5}
        />
      )}
      <a
        href={`/api/invoices/${invoice.id}/pdf`}
        download
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        title="Download PDF"
      >
        <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
        <span>PDF</span>
      </a>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function InvoicesPanel({
  projectId,
  clientId,
  invoices,
}: {
  projectId: string;
  clientId: string;
  invoices: InvoiceRecord[];
}) {
  const [showForm, setShowForm] = useState(false);

  const totalPaid = invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalOutstanding = invoices
    .filter((inv) => inv.status === "SENT" || inv.status === "VIEWED" || inv.status === "OVERDUE")
    .reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className="animate-fade-up flex flex-col gap-4">
      {/* Summary row — only when there are invoices */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/40 bg-card/60 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Total invoiced
            </p>
            <p className="mt-1 font-heading text-xl font-semibold tabular-nums">
              {formatMoney(invoices.reduce((sum, inv) => sum + inv.total, 0))}
            </p>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/60 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Outstanding
            </p>
            <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-gold">
              {formatMoney(totalOutstanding)}
            </p>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/60 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Paid
            </p>
            <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-sage">
              {formatMoney(totalPaid)}
            </p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold text-muted-foreground">
          {invoices.length === 0
            ? "No invoices yet"
            : `${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`}
        </h2>
        {!showForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm(true)}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Create invoice
          </Button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <CreateInvoiceForm
          projectId={projectId}
          clientId={clientId}
          onCancel={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {/* Invoice list */}
      {invoices.length > 0 ? (
        <div className="flex flex-col gap-2">
          {invoices.map((invoice) => (
            <InvoiceRow key={invoice.id} invoice={invoice} />
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border/40 border-dashed px-6 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
              <FileText className="h-5 w-5 text-gold" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium">No invoices yet</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Create your first invoice for this project.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(true)}
              className="mt-1 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
              Create invoice
            </Button>
          </div>
        )
      )}
    </div>
  );
}

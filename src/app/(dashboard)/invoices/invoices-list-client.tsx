"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  FileText,
  Download,
  CheckCircle2,
  Send,
  Trash2,
  X,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  updateInvoiceStatus,
  deleteInvoice,
} from "@/app/(dashboard)/projects/[id]/invoice-actions";
import { NewInvoiceDialog } from "./new-invoice-dialog";
import { formatMoney } from "@/lib/format";
import type { InvoiceStatus } from "@/generated/prisma/client";

type InvoiceRow = {
  id: string;
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  dueDate: Date | null;
  notes: string | null;
  lineItems: unknown;
  createdAt: Date;
  client: { id: string; name: string; company: string | null };
  project: { id: string; name: string };
};

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  DRAFT: { label: "Draft", className: "bg-muted/50 text-muted-foreground border-border/50" },
  SENT: { label: "Sent", className: "bg-gold/20 text-gold border-gold/30" },
  VIEWED: { label: "Viewed", className: "bg-gold/10 text-gold/70 border-gold/20" },
  PAID: { label: "Paid", className: "bg-sage/20 text-sage border-sage/30" },
  OVERDUE: { label: "Overdue", className: "bg-coral/20 text-coral border-coral/30" },
};

const STATUS_FILTERS: { value: "all" | "outstanding" | InvoiceStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "outstanding", label: "Outstanding" },
  { value: "DRAFT", label: "Drafts" },
  { value: "PAID", label: "Paid" },
];

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function InvoiceRowItem({ invoice }: { invoice: InvoiceRow }) {
  const [pending, setPending] = useState(false);
  const config = STATUS_CONFIG[invoice.status];
  const shortId = invoice.id.slice(0, 8).toUpperCase();

  async function handleMarkSent() {
    setPending(true);
    await updateInvoiceStatus(invoice.id, "SENT" as InvoiceStatus);
    setPending(false);
  }

  async function handleMarkPaid() {
    setPending(true);
    await updateInvoiceStatus(invoice.id, "PAID" as InvoiceStatus);
    setPending(false);
  }

  async function handleDelete() {
    setPending(true);
    await deleteInvoice(invoice.id);
    setPending(false);
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border/40 bg-card/60 px-4 py-3 transition-colors hover:bg-card/80">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gold/10">
        <FileText className="h-4 w-4 text-gold" strokeWidth={1.5} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            #{shortId}
          </span>
          <Badge variant="outline" className={`text-[10px] ${config.className}`}>
            {config.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href={`/clients/${invoice.client.id}`}
            className="hover:text-foreground transition-colors truncate"
          >
            {invoice.client.company ?? invoice.client.name}
          </Link>
          <span className="opacity-40">·</span>
          <Link
            href={`/projects/${invoice.project.id}`}
            className="hover:text-foreground transition-colors truncate"
          >
            {invoice.project.name}
          </Link>
        </div>
      </div>

      <div className="hidden md:flex flex-col items-end text-xs text-muted-foreground w-[110px] shrink-0">
        <span>Created {formatDate(invoice.createdAt)}</span>
        {invoice.dueDate && (() => {
          const isPastDue =
            new Date(invoice.dueDate) < new Date() && invoice.status !== "PAID";
          return (
            <span className={isPastDue ? "text-coral font-medium" : ""}>
              {isPastDue ? "Overdue · " : "Due "}
              {formatDate(invoice.dueDate)}
            </span>
          );
        })()}
      </div>

      <span className="font-heading text-base font-semibold tabular-nums w-[90px] text-right shrink-0">
        {formatMoney(invoice.total)}
      </span>

      <div className="flex items-center gap-1">
        {invoice.status === "DRAFT" && (
          <>
            <button
              onClick={handleMarkSent}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-gold/10 hover:text-gold disabled:pointer-events-none disabled:opacity-50"
              title="Mark as sent"
            >
              <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">Send</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-coral/10 hover:text-coral disabled:pointer-events-none disabled:opacity-50"
              title="Delete draft"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </>
        )}
        {(invoice.status === "SENT" ||
          invoice.status === "VIEWED" ||
          invoice.status === "OVERDUE") && (
          <button
            onClick={handleMarkPaid}
            disabled={pending}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-sage/10 hover:text-sage disabled:pointer-events-none disabled:opacity-50"
            title="Mark as paid"
          >
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">Mark paid</span>
          </button>
        )}
        {invoice.status === "PAID" && (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-sage mx-2" strokeWidth={1.5} />
        )}
        <a
          href={`/api/invoices/${invoice.id}/pdf`}
          download
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          title="Download PDF"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
        </a>
      </div>
    </div>
  );
}

export function InvoicesListClient({
  invoices,
  clients,
  projects,
}: {
  invoices: InvoiceRow[];
  clients: { id: string; name: string; company: string | null }[];
  projects: { id: string; name: string; clientId: string }[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | "outstanding" | InvoiceStatus>("all");
  const [newOpen, setNewOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return invoices.filter((inv) => {
      if (statusFilter === "outstanding") {
        if (!["SENT", "VIEWED", "OVERDUE"].includes(inv.status)) return false;
      } else if (statusFilter !== "all") {
        if (inv.status !== statusFilter) return false;
      }
      if (q) {
        const clientMatch = (inv.client.company ?? inv.client.name)
          .toLowerCase()
          .includes(q);
        const projMatch = inv.project.name.toLowerCase().includes(q);
        const idMatch = inv.id.toLowerCase().includes(q);
        if (!clientMatch && !projMatch && !idMatch) return false;
      }
      return true;
    });
  }, [invoices, search, statusFilter]);

  const totals = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "PAID");
    const outstanding = invoices.filter((i) =>
      ["SENT", "VIEWED", "OVERDUE"].includes(i.status)
    );
    return {
      paid: paid.reduce((s, i) => s + i.total, 0),
      outstanding: outstanding.reduce((s, i) => s + i.total, 0),
      total: invoices
        .filter((i) => i.status !== "DRAFT")
        .reduce((s, i) => s + i.total, 0),
    };
  }, [invoices]);

  const hasFilters = search || statusFilter !== "all";

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-cream">
            Invoices
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {filtered.length} of {invoices.length}{" "}
            {invoices.length === 1 ? "invoice" : "invoices"}
          </p>
        </div>
        <Button
          onClick={() => setNewOpen(true)}
          disabled={projects.length === 0}
          className="gap-1.5"
          title={
            projects.length === 0
              ? "Create a project first"
              : undefined
          }
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          New invoice
        </Button>
      </div>

      {invoices.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/40 bg-card/60 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Total invoiced
            </p>
            <p className="mt-1 font-heading text-xl font-semibold tabular-nums">
              {formatMoney(totals.total)}
            </p>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/60 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Outstanding
            </p>
            <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-gold">
              {formatMoney(totals.outstanding)}
            </p>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/60 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Paid
            </p>
            <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-sage">
              {formatMoney(totals.paid)}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cream/25 pointer-events-none"
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder="Search client, project, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-surface-2 pl-9 pr-3 py-2 text-sm text-cream placeholder:text-cream/25 focus:outline-none focus:border-fire/40 transition-colors"
          />
        </div>

        <div className="flex items-center rounded-lg border border-white/[0.08] bg-surface-2 p-0.5">
          {STATUS_FILTERS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150",
                statusFilter === opt.value
                  ? "bg-white/[0.08] text-cream"
                  : "text-cream/40 hover:text-cream/70"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            className="inline-flex items-center gap-1 text-xs text-cream/40 hover:text-cream/70 transition-colors"
          >
            <X className="w-3 h-3" strokeWidth={2} />
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-surface-2 py-16 flex flex-col items-center text-center">
          <Receipt className="h-8 w-8 text-cream/15 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-cream/40">
            {invoices.length === 0
              ? "No invoices yet."
              : "No invoices match your filters."}
          </p>
          {invoices.length === 0 && projects.length > 0 && (
            <button
              onClick={() => setNewOpen(true)}
              className="mt-3 text-xs text-fire hover:text-gold transition-colors"
            >
              Create your first invoice →
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((invoice) => (
            <InvoiceRowItem key={invoice.id} invoice={invoice} />
          ))}
        </div>
      )}

      <NewInvoiceDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        clients={clients}
        projects={projects}
      />
    </div>
  );
}

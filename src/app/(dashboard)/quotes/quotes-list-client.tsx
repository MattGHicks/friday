"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  FileText,
  Send,
  Trash2,
  X,
  ExternalLink,
  Copy,
  Check,
  Receipt,
  Sparkles,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { sendQuote, deleteQuote } from "./quote-actions";
import { NewQuoteDialog } from "./new-quote-dialog";
import { formatMoney } from "@/lib/format";
import type { QuoteStatus } from "@/generated/prisma/client";

type QuoteRow = {
  id: string;
  subject: string;
  subtotal: number;
  total: number;
  depositAmount: number;
  status: QuoteStatus;
  publicToken: string;
  validUntil: Date | null;
  sentAt: Date | null;
  acceptedAt: Date | null;
  createdAt: Date;
  lead: { id: string; name: string; company: string | null } | null;
  client: { id: string; name: string; company: string | null } | null;
};

type LeadOption = { id: string; name: string; company: string | null; email: string | null };
type ClientOption = { id: string; name: string; company: string | null; email: string };

const STATUS_CONFIG: Record<
  QuoteStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-muted/50 text-muted-foreground border-border/50",
  },
  SENT: { label: "Sent", className: "bg-fire/10 text-fire border-fire/30" },
  VIEWED: { label: "Viewed", className: "bg-gold/10 text-gold border-gold/30" },
  ACCEPTED: {
    label: "Accepted",
    className: "bg-sage/20 text-sage border-sage/30",
  },
  DECLINED: {
    label: "Declined",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-muted/30 text-muted-foreground/60 border-border/40",
  },
};

const STATUS_FILTERS: {
  value: "all" | "outstanding" | QuoteStatus;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "outstanding", label: "Outstanding" },
  { value: "DRAFT", label: "Drafts" },
  { value: "ACCEPTED", label: "Accepted" },
];

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function QuoteRowItem({
  quote,
  publicBaseUrl,
}: {
  quote: QuoteRow;
  publicBaseUrl: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const config = STATUS_CONFIG[quote.status];
  const shortId = quote.id.slice(0, 8).toUpperCase();
  const publicUrl = `${publicBaseUrl}/portal/quotes/${quote.publicToken}`;
  const recipient = quote.lead ?? quote.client;
  const recipientHref = quote.lead
    ? `/leads/${quote.lead.id}`
    : quote.client
      ? `/clients/${quote.client.id}`
      : "#";

  async function handleSend() {
    setPending(true);
    const result = await sendQuote(quote.id);
    if (result.error) alert(result.error);
    router.refresh();
    setPending(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this draft quote?")) return;
    setPending(true);
    const result = await deleteQuote(quote.id);
    if (result.error) alert(result.error);
    router.refresh();
    setPending(false);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      prompt("Copy this link:", publicUrl);
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border/40 bg-card/60 px-4 py-3 transition-colors hover:bg-card/80">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-fire/10">
        {quote.lead ? (
          <Sparkles className="h-4 w-4 text-fire" strokeWidth={1.5} />
        ) : (
          <FileText className="h-4 w-4 text-fire" strokeWidth={1.5} />
        )}
      </div>

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
          <span className="truncate text-sm text-cream">{quote.subject}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {recipient ? (
            <Link
              href={recipientHref}
              className="hover:text-foreground transition-colors truncate"
            >
              {recipient.company ?? recipient.name}
            </Link>
          ) : (
            <span className="italic">No recipient</span>
          )}
          <span className="opacity-40">·</span>
          <span>{quote.lead ? "Lead" : "Client"}</span>
        </div>
      </div>

      <div className="hidden md:flex flex-col items-end text-xs text-muted-foreground w-[120px] shrink-0">
        <span>Created {formatDate(quote.createdAt)}</span>
        {quote.sentAt && <span>Sent {formatDate(quote.sentAt)}</span>}
      </div>

      <span className="font-heading text-base font-semibold tabular-nums w-[90px] text-right shrink-0">
        {formatMoney(quote.total)}
      </span>

      <div className="flex items-center gap-1">
        {quote.status === "DRAFT" && (
          <>
            <button
              onClick={handleSend}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-fire/10 hover:text-fire disabled:pointer-events-none disabled:opacity-50"
              title="Send"
            >
              <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">Send</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
              title="Delete draft"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </>
        )}
        {quote.status !== "DRAFT" && (
          <>
            <button
              onClick={handleCopy}
              title="Copy public link"
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-sage" strokeWidth={2} />
              ) : (
                <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
              )}
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open public quote"
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export function QuotesListClient({
  quotes,
  leads,
  clients,
  publicBaseUrl,
}: {
  quotes: QuoteRow[];
  leads: LeadOption[];
  clients: ClientOption[];
  publicBaseUrl: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | "outstanding" | QuoteStatus>("all");
  const [newOpen, setNewOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return quotes.filter((quote) => {
      if (statusFilter === "outstanding") {
        if (!["SENT", "VIEWED"].includes(quote.status)) return false;
      } else if (statusFilter !== "all") {
        if (quote.status !== statusFilter) return false;
      }
      if (q) {
        const recipient = quote.lead ?? quote.client;
        const recipientName = recipient
          ? (recipient.company ?? recipient.name).toLowerCase()
          : "";
        if (
          !recipientName.includes(q) &&
          !quote.subject.toLowerCase().includes(q) &&
          !quote.id.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [quotes, search, statusFilter]);

  const totals = useMemo(() => {
    const accepted = quotes.filter((q) => q.status === "ACCEPTED");
    const outstanding = quotes.filter((q) =>
      ["SENT", "VIEWED"].includes(q.status)
    );
    return {
      accepted: accepted.reduce((s, q) => s + q.total, 0),
      outstanding: outstanding.reduce((s, q) => s + q.total, 0),
      total: quotes
        .filter((q) => q.status !== "DRAFT")
        .reduce((s, q) => s + q.total, 0),
    };
  }, [quotes]);

  const hasFilters = search || statusFilter !== "all";
  const canCreate = leads.length > 0 || clients.length > 0;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-cream">
            Quotes
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {filtered.length} of {quotes.length}{" "}
            {quotes.length === 1 ? "quote" : "quotes"}
          </p>
        </div>
        <Button
          onClick={() => setNewOpen(true)}
          disabled={!canCreate}
          className="gap-1.5"
          title={!canCreate ? "Create a lead or client first" : undefined}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          New quote
        </Button>
      </div>

      {quotes.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/40 bg-card/60 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Total quoted
            </p>
            <p className="mt-1 font-heading text-xl font-semibold tabular-nums">
              {formatMoney(totals.total)}
            </p>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/60 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Outstanding
            </p>
            <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-fire">
              {formatMoney(totals.outstanding)}
            </p>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/60 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Accepted
            </p>
            <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-sage">
              {formatMoney(totals.accepted)}
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
            placeholder="Search subject, recipient, or ID…"
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
            {quotes.length === 0
              ? "No quotes yet."
              : "No quotes match your filters."}
          </p>
          {quotes.length === 0 && canCreate && (
            <button
              onClick={() => setNewOpen(true)}
              className="mt-3 text-xs text-fire hover:text-gold transition-colors"
            >
              Send your first quote →
            </button>
          )}
          {!canCreate && (
            <p className="mt-3 inline-flex items-center gap-1 text-xs text-cream/40">
              <Users className="h-3 w-3" strokeWidth={1.5} />
              Add a lead or client first
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((quote) => (
            <QuoteRowItem
              key={quote.id}
              quote={quote}
              publicBaseUrl={publicBaseUrl}
            />
          ))}
        </div>
      )}

      <NewQuoteDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        leads={leads}
        clients={clients}
      />
    </div>
  );
}

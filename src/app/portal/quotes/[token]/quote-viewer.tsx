"use client";

import { useState, useTransition } from "react";
import { Check, X, Loader2, AlertTriangle, FileSignature } from "lucide-react";
import type { QuoteStatus, DepositType } from "@/generated/prisma/client";
import { acceptQuote, declineQuote } from "./actions";
import { formatMoney } from "@/lib/format";

type QuoteViewerProps = {
  quote: {
    id: string;
    subject: string;
    status: QuoteStatus;
    subtotal: number;
    total: number;
    depositAmount: number;
    depositType: DepositType;
    validUntil: Date | null;
    sentAt: Date | null;
    acceptedAt: Date | null;
    declinedAt: Date | null;
    notes: string | null;
    publicToken: string;
    lineItems: {
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }[];
  };
  freelancerName: string;
  recipientName: string;
  recipientCompany: string | null;
};

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function QuoteViewer({
  quote,
  freelancerName,
  recipientName,
  recipientCompany,
}: QuoteViewerProps) {
  const [status, setStatus] = useState<QuoteStatus>(quote.status);
  const [error, setError] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmingDecline, setConfirmingDecline] = useState(false);

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptQuote(quote.publicToken);
      if (result.error) {
        setError(result.error);
        return;
      }
      setStatus("ACCEPTED");
      setInvoiceId(result.invoiceId ?? null);
    });
  }

  function handleDecline() {
    setError(null);
    startTransition(async () => {
      const result = await declineQuote(quote.publicToken);
      if (result.error) {
        setError(result.error);
        return;
      }
      setStatus("DECLINED");
      setConfirmingDecline(false);
    });
  }

  const isTerminal = status === "ACCEPTED" || status === "DECLINED";

  return (
    <div className="animate-fade-up space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-white/[0.06] bg-surface-2 px-6 py-6">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-cream/40">
          <FileSignature className="h-3 w-3" strokeWidth={1.5} />
          Quote
        </div>
        <h1 className="mt-2 font-display text-2xl font-bold text-cream">
          {quote.subject}
        </h1>
        <p className="mt-1 text-sm text-cream/60">
          From <span className="text-gold">{freelancerName}</span> to{" "}
          <span className="text-cream">
            {recipientCompany ?? recipientName}
          </span>
        </p>
        {quote.sentAt && (
          <p className="mt-0.5 text-xs text-cream/40">
            Sent {formatDate(quote.sentAt)}
            {quote.validUntil && ` · Valid until ${formatDate(quote.validUntil)}`}
          </p>
        )}
      </div>

      {/* Status banner */}
      {status === "ACCEPTED" && (
        <div className="rounded-lg border border-sage/30 bg-sage/10 px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-medium text-sage">
            <Check className="h-4 w-4" strokeWidth={2} />
            Quote accepted
          </div>
          <p className="mt-1 text-xs text-cream/60">
            A deposit invoice has been generated.
            {invoiceId && " You'll receive an email with the payment link."}
          </p>
        </div>
      )}
      {status === "DECLINED" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <X className="h-4 w-4" strokeWidth={2} />
            Quote declined
          </div>
          <p className="mt-1 text-xs text-cream/60">
            {freelancerName} has been notified.
          </p>
        </div>
      )}
      {status === "EXPIRED" && (
        <div className="rounded-lg border border-muted/40 bg-muted/10 px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-medium text-cream/60">
            <AlertTriangle className="h-4 w-4" strokeWidth={2} />
            Quote expired
          </div>
          <p className="mt-1 text-xs text-cream/40">
            Reach out to {freelancerName} for a fresh quote.
          </p>
        </div>
      )}

      {/* Line items */}
      <div className="rounded-xl border border-white/[0.06] bg-surface-2">
        <div className="grid grid-cols-[1fr_60px_110px_110px] gap-3 border-b border-white/[0.04] px-5 py-3 text-[10px] font-mono uppercase tracking-wider text-cream/40">
          <span>Description</span>
          <span className="text-center">Qty</span>
          <span className="text-right">Rate</span>
          <span className="text-right">Amount</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {quote.lineItems.map((li) => (
            <div
              key={li.id}
              className="grid grid-cols-[1fr_60px_110px_110px] gap-3 px-5 py-3 text-sm"
            >
              <span className="text-cream">{li.description}</span>
              <span className="text-center text-cream/60 tabular-nums">
                {li.quantity}
              </span>
              <span className="text-right text-cream/60 tabular-nums">
                {formatMoney(li.unitPrice)}
              </span>
              <span className="text-right text-cream tabular-nums">
                {formatMoney(li.total)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-white/[0.04] px-5 py-4 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-cream/60">Total</span>
            <span className="font-display text-xl font-bold text-gold tabular-nums">
              {formatMoney(quote.total)}
            </span>
          </div>
          {quote.depositAmount > 0 && (
            <div className="flex items-center justify-between text-xs text-cream/60">
              <span>Deposit to start</span>
              <span className="tabular-nums text-fire">
                {formatMoney(quote.depositAmount)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="rounded-xl border border-white/[0.06] bg-surface-2 px-6 py-5">
          <h2 className="mb-2 text-[10px] font-mono uppercase tracking-wider text-cream/40">
            Notes
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-cream/70">
            {quote.notes}
          </p>
        </div>
      )}

      {/* Accept / decline */}
      {!isTerminal && status !== "EXPIRED" && (
        <div className="rounded-xl border border-white/[0.06] bg-surface-2 px-6 py-6">
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <p className="mb-4 text-sm text-cream/70">
            Accepting this quote will kick off the project and generate a
            deposit invoice for{" "}
            <span className="font-medium text-gold">
              {formatMoney(quote.depositAmount)}
            </span>
            .
          </p>

          {confirmingDecline ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-cream/60">
                Decline this quote? {freelancerName} will be notified.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingDecline(false)}
                  disabled={pending}
                  className="rounded-md px-3 py-2 text-sm text-cream/60 hover:text-cream transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-destructive/80 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive disabled:opacity-50"
                >
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  ) : (
                    <X className="h-4 w-4" strokeWidth={2} />
                  )}
                  Yes, decline
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleAccept}
                disabled={pending}
                className="bg-gradient-brand inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-background shadow-lg shadow-fire/20 transition-all hover:shadow-fire/40 disabled:opacity-50"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                ) : (
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                )}
                Accept &amp; start project
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDecline(true)}
                disabled={pending}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-surface-3/40 px-4 py-3 text-sm text-cream/60 transition-colors hover:border-white/15 hover:text-cream disabled:opacity-50 sm:w-auto"
              >
                Decline
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

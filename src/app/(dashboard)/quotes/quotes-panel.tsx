"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Send,
  Pencil,
  Trash2,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuoteEditorDialog, type QuoteEditorTarget } from "./quote-editor";
import { sendQuote, deleteQuote } from "./quote-actions";
import type { DepositType, QuoteStatus } from "@/generated/prisma/client";

type QuoteRow = {
  id: string;
  subject: string;
  total: number;
  depositAmount: number;
  depositType: DepositType;
  subtotal: number;
  status: QuoteStatus;
  publicToken: string;
  validUntil: Date | null;
  sentAt: Date | null;
  acceptedAt: Date | null;
  notes: string | null;
  lineItems: { description: string; quantity: number; unitPrice: number }[];
};

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

const STATUS_STYLES: Record<QuoteStatus, string> = {
  DRAFT: "bg-white/[0.04] text-cream/50 border-white/10",
  SENT: "bg-fire/10 text-fire border-fire/30",
  VIEWED: "bg-gold/10 text-gold border-gold/30",
  ACCEPTED: "bg-sage/10 text-sage border-sage/30",
  DECLINED: "bg-destructive/10 text-destructive border-destructive/30",
  EXPIRED: "bg-white/[0.04] text-cream/30 border-white/10",
};

export function QuotesPanel({
  target,
  recipientHasEmail,
  quotes,
  publicBaseUrl,
}: {
  target: QuoteEditorTarget;
  recipientHasEmail: boolean;
  quotes: QuoteRow[];
  publicBaseUrl: string;
}) {
  const router = useRouter();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<QuoteRow | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openNew() {
    setEditingQuote(null);
    setEditorOpen(true);
  }
  function openEdit(q: QuoteRow) {
    setEditingQuote(q);
    setEditorOpen(true);
  }

  async function handleSend(quoteId: string) {
    startTransition(async () => {
      const result = await sendQuote(quoteId);
      if (result.error) alert(result.error);
      router.refresh();
    });
  }

  async function handleDelete(quoteId: string) {
    if (!confirm("Delete this draft quote?")) return;
    startTransition(async () => {
      const result = await deleteQuote(quoteId);
      if (result.error) alert(result.error);
      router.refresh();
    });
  }

  async function copyLink(quote: QuoteRow) {
    const url = `${publicBaseUrl}/portal/quotes/${quote.publicToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(quote.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      prompt("Copy this link:", url);
    }
  }

  const sendTitle = recipientHasEmail
    ? "Send"
    : target.kind === "lead"
      ? "Add an email to this lead first"
      : "This client has no email address";

  return (
    <section className="rounded-xl border border-white/[0.06] bg-surface-2 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-base font-semibold text-cream">
            Quotes
          </h2>
          <p className="text-xs text-cream/40 mt-0.5">
            {target.kind === "lead"
              ? "Send a quote to turn this lead into a paying client."
              : "Quote this client for follow-on work."}
          </p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          New quote
        </Button>
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/[0.06] py-8 text-center text-sm text-cream/40">
          No quotes yet.
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04] rounded-lg border border-white/[0.04]">
          {quotes.map((q) => {
            const publicUrl = `${publicBaseUrl}/portal/quotes/${q.publicToken}`;
            return (
              <div
                key={q.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-surface-3/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-cream truncate">
                      {q.subject}
                    </span>
                    <span
                      className={`inline-flex text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-full border uppercase tracking-wider ${STATUS_STYLES[q.status]}`}
                    >
                      {q.status.toLowerCase()}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-cream/40 flex items-center gap-3">
                    <span>{formatMoney(q.total)}</span>
                    {q.depositAmount > 0 && (
                      <span>• {formatMoney(q.depositAmount)} deposit</span>
                    )}
                    {q.sentAt && (
                      <span>
                        • Sent{" "}
                        {new Date(q.sentAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                    {q.acceptedAt && (
                      <span className="text-sage">
                        • Accepted{" "}
                        {new Date(q.acceptedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {q.status === "DRAFT" && (
                    <>
                      <button
                        onClick={() => openEdit(q)}
                        disabled={pending}
                        title="Edit"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-cream/40 hover:text-cream hover:bg-white/[0.06] transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => handleSend(q.id)}
                        disabled={pending || !recipientHasEmail}
                        title={sendTitle}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-fire hover:text-gold hover:bg-white/[0.06] transition-colors disabled:opacity-40 disabled:hover:text-fire"
                      >
                        <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        disabled={pending}
                        title="Delete"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-cream/40 hover:text-destructive hover:bg-white/[0.06] transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </>
                  )}
                  {q.status !== "DRAFT" && (
                    <>
                      <button
                        onClick={() => copyLink(q)}
                        title="Copy public link"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-cream/40 hover:text-cream hover:bg-white/[0.06] transition-colors"
                      >
                        {copiedId === q.id ? (
                          <Check className="h-3.5 w-3.5 text-sage" strokeWidth={2} />
                        ) : (
                          <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                        )}
                      </button>
                      <Link
                        href={publicUrl}
                        target="_blank"
                        title="Open public quote"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-cream/40 hover:text-cream hover:bg-white/[0.06] transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <QuoteEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        target={target}
        existing={
          editingQuote
            ? {
                id: editingQuote.id,
                subject: editingQuote.subject,
                notes: editingQuote.notes,
                depositType: editingQuote.depositType,
                depositAmount: editingQuote.depositAmount,
                subtotal: editingQuote.subtotal,
                validUntil: editingQuote.validUntil,
                lineItems: editingQuote.lineItems,
              }
            : null
        }
      />
    </section>
  );
}

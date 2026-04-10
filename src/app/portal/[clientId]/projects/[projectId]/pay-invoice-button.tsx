"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

interface PayInvoiceButtonProps {
  invoiceId: string;
  clientId: string;
}

export function PayInvoiceButton({ invoiceId, clientId }: PayInvoiceButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, clientId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to start payment. Please try again.");
        setLoading(false);
        return;
      }
      // Redirect to Stripe-hosted checkout
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 border-t border-border/30 pt-3">
      {error && (
        <p className="mb-2 text-xs text-coral">{error}</p>
      )}
      <button
        onClick={handlePay}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-fire to-gold px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
        ) : (
          <CreditCard className="h-4 w-4" strokeWidth={1.5} />
        )}
        {loading ? "Redirecting…" : "Pay now"}
      </button>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { connectStripe, disconnectStripe } from "./stripe-connect-actions";

type Props = {
  stripeAccountId: string | null;
};

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Connection cancelled.",
  missing_params: "Connection failed — missing parameters.",
  no_account_id: "Connection failed — no account ID returned.",
  invalid_state: "Connection failed — session mismatch. Try again.",
  token_exchange_failed: "Connection failed — could not verify with Stripe.",
};

export function StripeConnectCard({ stripeAccountId }: Props) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const connected = !!stripeAccountId;
  const justConnected = searchParams.get("stripe_connected") === "1";
  const stripeError = searchParams.get("stripe_error");

  function handleConnect() {
    startTransition(async () => {
      await connectStripe();
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      const result = await disconnectStripe();
      if (result.success) {
        // Reload to clear stale state
        window.location.href = "/settings";
      }
    });
  }

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <h2 className="font-heading text-sm font-semibold">Payments</h2>
          {connected && (
            <Badge
              variant="outline"
              className="ml-auto text-xs border-sage/40 text-sage bg-sage/10"
            >
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success / error feedback from OAuth redirect */}
        {justConnected && (
          <div className="flex items-center gap-2 rounded-md bg-sage/10 px-3 py-2 text-sm text-sage">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Stripe account connected. Clients can now pay invoices online.
          </div>
        )}
        {stripeError && (
          <div className="flex items-center gap-2 rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {ERROR_MESSAGES[stripeError] ?? "Something went wrong. Please try again."}
          </div>
        )}

        {connected ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your Stripe account is connected. Clients will see a pay button on sent invoices.
            </p>
            <div className="flex items-center gap-2">
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Open Stripe Dashboard
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-muted-foreground/30">·</span>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isPending}
                className="text-xs text-coral/70 hover:text-coral transition-colors disabled:opacity-50"
              >
                {isPending ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect Stripe to accept payments directly from your client portal. No platform fees — standard Stripe rates only.
            </p>
            <Button
              type="button"
              onClick={handleConnect}
              disabled={isPending}
              size="sm"
            >
              {isPending ? "Redirecting to Stripe…" : "Connect Stripe"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

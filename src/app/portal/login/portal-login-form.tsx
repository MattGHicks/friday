"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendPortalMagicLink, type MagicLinkState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Sending…" : "Send magic link"}
    </Button>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  no_account: "No portal account found for that email. Contact your designer.",
  auth_failed: "The sign-in link was invalid or expired. Please try again.",
  auth_callback_failed: "Something went wrong. Please try again.",
};

export function PortalLoginForm({
  next,
  serverError,
}: {
  next: string;
  serverError?: string;
}) {
  const [state, formAction] = useActionState<MagicLinkState, FormData>(
    sendPortalMagicLink,
    {}
  );

  const displayError =
    state.error ?? (serverError ? (ERROR_MESSAGES[serverError] ?? "Something went wrong. Please try again.") : undefined);

  if (state.success) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="w-full max-w-sm animate-fade-up text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sage/10">
            <CheckCircle className="h-7 w-7 text-sage" strokeWidth={1.5} />
          </div>
          <h2 className="font-heading text-xl font-semibold text-cream">
            Check your inbox
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a magic link to your email. Click it to access your portal.
          </p>
          <p className="mt-4 text-xs text-muted-foreground/60">
            The link expires in 60 minutes. No password needed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="w-full max-w-sm animate-fade-up space-y-5">
        <div className="rounded-2xl border border-white/[0.07] bg-card p-6 shadow-[0_4px_40px_rgba(0,0,0,0.6)]">
          {/* Icon + heading */}
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10">
              <Mail className="h-[18px] w-[18px] text-gold" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-cream">
                Sign in to your portal
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Enter your email — we&apos;ll send a magic link.
              </p>
            </div>
          </div>

          {displayError && (
            <div className="mb-4 rounded-lg border border-fire/20 bg-fire/5 px-3.5 py-2.5 text-sm text-fire">
              {displayError}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                required
                autoComplete="email"
                autoFocus
                className="h-10 border-white/[0.08] bg-surface-3 text-cream placeholder:text-muted-foreground/50 focus:border-fire/40 focus:ring-fire/20"
              />
            </div>
            <SubmitButton />
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground/50">
          Need help?{" "}
          <span className="text-muted-foreground">
            Contact your designer directly.
          </span>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestPortalMagicLink,
  type PortalSignInState,
} from "./actions";

const INITIAL: PortalSignInState = { status: "idle" };

export function PortalSignInForm() {
  const [state, formAction, pending] = useActionState(
    requestPortalMagicLink,
    INITIAL
  );

  if (state.status === "sent") {
    return (
      <div className="rounded-xl border border-sage/30 bg-sage/10 px-5 py-6 text-center">
        <CheckCircle2
          className="mx-auto h-8 w-8 text-sage"
          strokeWidth={1.5}
        />
        <h2 className="mt-3 font-display text-lg font-semibold">
          Check your email
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          If this email has portal access, we&apos;ve sent you a sign-in link.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm">
          Your email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          disabled={pending}
        />
      </div>
      {state.status === "error" && (
        <p className="text-xs text-coral">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} className="w-full gap-2">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
        ) : (
          <Mail className="h-4 w-4" strokeWidth={1.5} />
        )}
        {pending ? "Sending link…" : "Email me a sign-in link"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        We&apos;ll send a one-time link to sign you into your project portal.
      </p>
    </form>
  );
}

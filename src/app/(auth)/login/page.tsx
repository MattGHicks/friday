"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { login, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OAuthButtons } from "../oauth-buttons";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState<AuthState, FormData>(login, {});

  return (
    <div className="animate-fade-up space-y-5">
      {/* Card */}
      <div className="rounded-2xl border border-white/[0.07] bg-card p-6 shadow-[0_4px_40px_rgba(0,0,0,0.6)]">
        <div className="mb-5">
          <h2 className="font-heading text-lg font-bold text-cream">Welcome back</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        {state.error && (
          <div className="mb-4 rounded-lg border border-fire/20 bg-fire/5 px-3.5 py-2.5 text-sm text-fire">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="h-10 border-white/[0.08] bg-surface-3 text-cream placeholder:text-muted-foreground/50 focus:border-fire/40 focus:ring-fire/20"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              minLength={6}
              className="h-10 border-white/[0.08] bg-surface-3 text-cream placeholder:text-muted-foreground/50 focus:border-fire/40 focus:ring-fire/20"
            />
          </div>

          <SubmitButton />
        </form>

        <OAuthButtons />
      </div>

      {/* Sign up link */}
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold text-gold hover:text-cream transition-colors underline underline-offset-4"
        >
          Sign up free
        </Link>
      </p>
    </div>
  );
}

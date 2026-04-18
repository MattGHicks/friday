import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface-0 px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(229,90,58,0.12), transparent 70%)",
        }}
      />

      <Link
        href="/"
        className="mb-10 inline-block animate-fade-up opacity-90 transition-opacity hover:opacity-100"
      >
        <Logo className="h-8 w-auto" />
      </Link>

      <h1 className="animate-fade-up delay-75 bg-gradient-brand bg-clip-text font-heading text-[clamp(5rem,14vw,9rem)] font-semibold leading-none tracking-tight text-transparent">
        404
      </h1>

      <p className="mt-6 animate-fade-up delay-150 font-heading text-2xl font-medium text-cream">
        This page has clocked out.
      </p>
      <p className="mt-3 max-w-md animate-fade-up delay-225 text-sm text-muted-foreground">
        The link may be broken, or the page may have moved. Let&apos;s get you
        back somewhere useful.
      </p>

      <div className="mt-10 flex animate-fade-up delay-300 flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-gradient-to-r from-fire to-gold px-6 text-sm font-medium text-surface-0 shadow-sm transition-opacity hover:opacity-90"
        >
          Back to dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.08] bg-surface-2/40 px-6 text-sm font-medium text-cream transition-colors hover:border-fire/30 hover:bg-surface-3"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

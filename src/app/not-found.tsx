import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="font-heading text-2xl font-bold tracking-tight text-golden">
        friday
      </span>
      <h1 className="mt-6 font-heading text-6xl font-semibold tabular-nums text-foreground">
        404
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">
        This page doesn&apos;t exist.
      </p>
      <p className="mt-1 text-sm text-muted-foreground/60">
        The link may be broken or the page may have been removed.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Back to dashboard
      </Link>
    </div>
  );
}

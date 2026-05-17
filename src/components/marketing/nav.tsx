import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/[0.04] bg-surface-0/80 px-6 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
        <Link href="/" className="shrink-0">
          <Logo className="h-5 w-auto" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-cream/60 sm:flex">
          <Link href="/pricing" className="transition-colors hover:text-cream">
            Pricing
          </Link>
          <Link href="/help" className="transition-colors hover:text-cream">
            Help
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm text-cream/60 transition-colors hover:text-cream"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className={cn(buttonVariants({ size: "sm" }), "bg-gradient-brand text-white")}
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}

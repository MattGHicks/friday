import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing — Friday",
  description:
    "Simple, honest pricing for freelance designers. Start free, upgrade when your client roster grows.",
  alternates: { canonical: "https://itsfriday.dev/pricing" },
};

// TODO: actual prices are not committed yet. Decide before launch.
const TIERS = [
  {
    name: "Free",
    tag: "Try it out",
    price: "$0",
    cadence: "/ forever",
    description: "Perfect for trying Friday with your first paid project.",
    cta: { label: "Start free", href: "/signup" },
    featured: false,
    features: [
      "1 active client",
      "1 active project",
      "Branded client portal",
      "Quotes + invoices",
      "Stripe payments (you keep 100%)",
      "Pin-drop design review",
    ],
  },
  {
    name: "Pro",
    tag: "Most freelancers",
    price: "TBD", // TODO: lock pricing pre-launch
    cadence: "/ month",
    description: "For freelancers running a real client roster.",
    cta: { label: "Start free trial", href: "/signup" },
    featured: true,
    features: [
      "Unlimited clients + projects",
      "Custom brand color, logo, welcome message",
      "Inbound email replies into Friday",
      "Calendar feed (ICS export)",
      "Priority email support",
      "Everything in Free",
    ],
  },
  {
    name: "Studio",
    tag: "Small studios",
    price: "TBD", // TODO: lock pricing pre-launch
    cadence: "/ month",
    description: "For two-to-five-person studios running multiple lanes.",
    cta: { label: "Talk to us", href: "mailto:hello@itsfriday.dev" },
    featured: false,
    features: [
      "Up to 5 seats",
      "Per-seat brand kits",
      "Shared client pipeline",
      "Concierge onboarding",
      "Everything in Pro",
    ],
  },
] as const;

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-surface-0 text-cream">
      <MarketingNav />

      <main className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl space-y-12">
          <header className="space-y-4 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fire">
              Pricing
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              One calm space for every paid project.
            </h1>
            <p className="mx-auto max-w-xl text-sm text-cream/60 leading-relaxed">
              Start free. Upgrade when your client roster grows. No platform fees, no per-transaction take — Stripe rates only.
            </p>
          </header>

          <div className="grid gap-6 sm:grid-cols-3">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={cn(
                  "relative flex flex-col rounded-xl border bg-surface-1 p-6",
                  tier.featured
                    ? "border-fire/40 shadow-lg shadow-fire/[0.04]"
                    : "border-white/[0.06]",
                )}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand px-3 py-0.5 text-[10px] font-mono uppercase tracking-wider text-white">
                    {tier.tag}
                  </div>
                )}
                <div className="space-y-1">
                  <h2 className="font-display text-xl font-bold">{tier.name}</h2>
                  <p className="text-xs text-cream/40">{tier.description}</p>
                </div>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold tracking-tight">
                    {tier.price}
                  </span>
                  <span className="text-xs text-cream/40">{tier.cadence}</span>
                </div>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-cream/70">
                      <Check
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fire"
                        strokeWidth={2}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.cta.href}
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "mt-6 w-full",
                    tier.featured && "bg-gradient-brand text-white",
                  )}
                >
                  {tier.cta.label}
                </Link>
              </div>
            ))}
          </div>

          <section className="rounded-xl border border-white/[0.06] bg-surface-1 p-8">
            <h2 className="font-display text-lg font-bold">Questions before you sign up</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <Faq
                q="Do you take a cut of my client payments?"
                a="No. Stripe Connect Standard means clients pay directly to your Stripe account. You pay Stripe's standard rate; we never touch the money."
              />
              <Faq
                q="Can I use my own domain?"
                a="Custom domains are on the post-launch roadmap. For now, your portal lives at itsfriday.dev branded with your logo + color."
              />
              <Faq
                q="What happens to my data if I cancel?"
                a="Your account stays in read-only mode for 30 days so you can export. After that, project data is purged from the database."
              />
              <Faq
                q="Can clients use Friday for free?"
                a="Yes. Clients never pay Friday — they just open your portal. Their cost is the invoice you send them."
              />
            </div>
          </section>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-cream">{q}</p>
      <p className="text-sm text-cream/55 leading-relaxed">{a}</p>
    </div>
  );
}

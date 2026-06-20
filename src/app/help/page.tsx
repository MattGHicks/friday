import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: "Help — Friday",
  description:
    "How to set up your brand, send your first quote, and get paid. Friday is built for freelance designers.",
  alternates: { canonical: "https://itsfriday.dev/help" },
};

const SECTIONS = [
  { id: "getting-started", label: "Getting started" },
  { id: "brand-setup", label: "Brand setup" },
  { id: "first-quote", label: "Your first quote" },
  { id: "getting-paid", label: "Getting paid" },
  { id: "faq", label: "FAQ" },
] as const;

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-surface-0 text-cream">
      <MarketingNav />

      <main className="px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[200px_1fr]">
          {/* Sticky table of contents */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-cream/40">
              Contents
            </p>
            <nav className="space-y-1.5">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-sm text-cream/60 transition-colors hover:text-cream"
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </aside>

          <article className="space-y-16 max-w-2xl">
            <header className="space-y-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fire">
                Help
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight">
                How to use Friday.
              </h1>
              <p className="text-sm text-cream/55 leading-relaxed">
                Plain answers for the freelance designer just getting started. No jargon, no fluff.
              </p>
            </header>

            <Section id="getting-started" title="Getting started">
              <p>
                Friday replaces the mess of Notion + Google Drive + email threads + HoneyBook with one branded space.
                Clients see your work. You see what's outstanding. Both of you stop chasing each other.
              </p>
              <p>
                Sign up free at <Link href="/signup" className="text-fire underline-offset-2 hover:underline">itsfriday.dev/signup</Link>.
                You'll land on the dashboard with a six-step checklist. Knock it down top to bottom — it covers everything you need
                before sending your first project to a client.
              </p>
            </Section>

            <Section id="brand-setup" title="Brand setup">
              <p>
                Open <strong>Settings</strong> and add three things: a display name (shown on quote and invoice emails), a logo,
                and a brand color. Logos can be PNG, JPG, SVG, or WEBP under 512 KB. Your brand color is the accent on every
                page of the client portal — so pick something that holds up against a near-black background.
              </p>
              <p>
                The welcome message is optional. If you set one, it shows at the top of every client's portal page. Keep it short
                and personal — something a client would actually read.
              </p>
            </Section>

            <Section id="first-quote" title="Your first quote">
              <p>
                Two paths: start from a <strong>Lead</strong> if the client isn't booked yet, or from a <strong>Client</strong> if they already are.
                Either way, click <strong>New quote</strong>, add line items, set a deposit (percent or fixed amount), and save as a draft.
              </p>
              <p>
                When you're ready, hit <strong>Send</strong>. Friday emails the client a link to a hosted quote page.
                They can accept or decline with one click. On accept, Friday automatically creates the project, deposit invoice, and a
                Stripe Checkout link for the deposit. You don't have to do any of that manually.
              </p>
            </Section>

            <Section id="getting-paid" title="Getting paid">
              <p>
                Connect Stripe from <strong>Settings → Payments</strong> (one-click OAuth). After that, every invoice you send has a
                pay button on the portal. Clients pay with card, Apple Pay, or Google Pay. Money lands in your Stripe account on
                the standard Stripe payout schedule. Friday never touches it.
              </p>
              <p>
                No platform fees. You pay Stripe's standard rate (2.9% + $0.30 in the US) and that's it.
              </p>
            </Section>

            <Section id="faq" title="FAQ">
              <Question
                q="Can I use Friday for non-design work?"
                a="Yes. The flows are designed around projects, files, quotes, and invoices — anything that fits that shape works."
              />
              <Question
                q="How do clients sign in?"
                a="Magic link by email. They enter their address, click the link Friday sends, and land on their portal. No password to remember."
              />
              <Question
                q="Can clients respond to portal messages via email?"
                a="Yes. The message email comes from reply+<token>@itsfriday.dev — when they hit reply, their response lands back in the project thread automatically."
              />
              <Question
                q="What about a mobile app?"
                a="The whole portal is mobile-responsive. Friday works as well on a client's phone as on their laptop. A native app may come later."
              />
              <Question
                q="Something's broken or missing — who do I tell?"
                a={
                  <>
                    Email <a href="mailto:hello@itsfriday.dev" className="text-fire underline-offset-2 hover:underline">hello@itsfriday.dev</a>.
                    Friday is built by a freelance designer, so feedback lands directly with the person writing the code.
                  </>
                }
              />
            </Section>
          </article>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <h2 className="font-display text-xl font-bold tracking-tight border-b border-white/[0.06] pb-2">
        {title}
      </h2>
      <div className="space-y-4 text-sm text-cream/70 leading-relaxed [&_strong]:font-medium [&_strong]:text-cream">
        {children}
      </div>
    </section>
  );
}

function Question({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-cream">{q}</p>
      <p className="text-sm text-cream/55 leading-relaxed">{a}</p>
    </div>
  );
}

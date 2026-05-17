import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: "Terms — Friday",
  description: "Terms of service for Friday.",
  alternates: { canonical: "https://itsfriday.dev/terms" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-0 text-cream">
      <MarketingNav />

      <main className="px-6 py-16">
        <article className="mx-auto max-w-2xl space-y-8">
          <header className="space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fire">
              Legal
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight">Terms of Service</h1>
            <p className="text-xs font-mono text-cream/40">
              Placeholder — final terms reviewed by counsel before launch.
            </p>
          </header>

          <div className="space-y-6 text-sm text-cream/70 leading-relaxed">
            <p>
              Welcome to Friday. By creating an account or using the service, you agree to these terms.
              Friday provides a client portal, quoting, invoicing, and file-delivery service for freelance
              designers. The service is provided as-is, with reasonable effort but no warranty.
            </p>

            <p>
              You're responsible for the content you upload and for your relationship with your own clients.
              You retain ownership of your work. Friday does not take a cut of client payments — those go
              directly to your Stripe account under standard Stripe terms.
            </p>

            <p>
              Friday may terminate accounts that violate these terms or applicable law. We may update these
              terms with notice. Continued use after an update means you accept the new terms.
            </p>

            <p className="text-xs text-cream/40">
              Final draft pending. Contact <a href="mailto:hello@itsfriday.dev" className="text-fire underline-offset-2 hover:underline">hello@itsfriday.dev</a> with questions.
            </p>
          </div>
        </article>
      </main>

      <MarketingFooter />
    </div>
  );
}

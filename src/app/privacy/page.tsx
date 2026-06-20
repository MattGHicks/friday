import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: "Privacy — Friday",
  description: "Privacy policy for Friday.",
  alternates: { canonical: "https://itsfriday.dev/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-0 text-cream">
      <MarketingNav />

      <main className="px-6 py-16">
        <article className="mx-auto max-w-2xl space-y-8">
          <header className="space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fire">
              Legal
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight">Privacy</h1>
            <p className="text-xs font-mono text-cream/40">
              Placeholder — final policy reviewed by counsel before launch.
            </p>
          </header>

          <div className="space-y-6 text-sm text-cream/70 leading-relaxed">
            <p>
              Friday stores the data you give us to run the service: your account email, your clients'
              names and emails, project data, files you upload, and invoice records. We do not sell this
              data, and we do not share it with third parties except as needed to operate the service
              (Supabase for storage, Stripe for payments, Resend for email).
            </p>

            <p>
              Files you upload sit in Supabase Storage. Magic-link authentication runs through Supabase Auth.
              Payment data is processed by Stripe — we do not store card numbers. Emails are sent through
              Resend. Each of those vendors has its own privacy policy worth a glance.
            </p>

            <p>
              You can export or delete your data anytime by emailing <a href="mailto:hello@itsfriday.dev" className="text-fire underline-offset-2 hover:underline">hello@itsfriday.dev</a>.
              On account closure, your data stays in read-only mode for 30 days before being purged.
            </p>

            <p className="text-xs text-cream/40">
              Final draft pending. Questions? Email above.
            </p>
          </div>
        </article>
      </main>

      <MarketingFooter />
    </div>
  );
}

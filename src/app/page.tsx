import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import {
  MessageSquareDot,
  Receipt,
  FolderOpen,
  Columns3,
  Check,
  ArrowRight,
  Lock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Friday — Branded Client Portal for Freelance Designers",
  description:
    "Stop juggling Notion, Google Drive, and HoneyBook. Friday gives freelance designers one branded space for design review, invoicing, and file delivery.",
  keywords: [
    "client portal for freelance designers",
    "freelance designer client portal",
    "HoneyBook alternative",
    "design review tool for freelancers",
    "freelance invoicing software",
    "client portal software",
  ],
  alternates: {
    canonical: "https://itsfriday.dev",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Friday — Branded Client Portal for Freelance Designers",
    description:
      "Stop juggling Notion, Google Drive, and HoneyBook. Friday gives freelance designers one branded space for design review, invoicing, and file delivery.",
    url: "https://itsfriday.dev",
    siteName: "Friday",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Friday — a branded client portal showing pin-drop design review, project status, and invoicing in a dark-mode interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Friday — Branded Client Portal for Freelance Designers",
    description:
      "Stop juggling Notion, Google Drive, and HoneyBook. Friday gives freelance designers one branded space for design review, invoicing, and file delivery.",
    images: [
      {
        url: "/og-image.png",
        alt: "Friday — a branded client portal showing pin-drop design review, project status, and invoicing in a dark-mode interface",
      },
    ],
  },
};

/* ─── Static data ──────────────────────────────────────────── */

const features = [
  {
    icon: MessageSquareDot,
    title: "Design Review",
    description:
      "Clients drop numbered pins directly on your work. Threaded replies, resolve threads, one-click approval — no more feedback in fourteen emails.",
  },
  {
    icon: Receipt,
    title: "Invoicing",
    description:
      "Line-item invoices with live totals. Send, track, and get paid — all in the same space as the work, not buried in a separate app.",
  },
  {
    icon: FolderOpen,
    title: "File Delivery",
    description:
      "Upload deliverables, star the finals. Clients see exactly what's ready to download. No more 'which version is the right one?'",
  },
  {
    icon: Columns3,
    title: "Quotes that close",
    description:
      "Line-itemized quotes with a public accept link. The deposit invoice fires the moment a client says yes — no back-and-forth to get started.",
  },
];

const steps = [
  {
    number: "01",
    title: "Add a lead, send a quote",
    description:
      "Two minutes to go from new prospect to a branded quote in their inbox. Line items, deposit, valid-until — all on one page.",
  },
  {
    number: "02",
    title: "They accept, project kicks off",
    description:
      "A client magic-link portal opens on accept, the deposit invoice is ready, and the project is waiting for the first kickoff file.",
  },
  {
    number: "03",
    title: "Review, approve, get paid",
    description:
      "Clients comment on designs, you revise. They approve. Invoice is right there when the work is done.",
  },
];

const replacedTools = [
  "Notion",
  "Google Drive",
  "Email threads",
  "HoneyBook",
  "WeTransfer",
  "Dropbox",
];

const testimonials = [
  {
    quote:
      "My clients used to send feedback in 12-email threads with screenshots attached. Now they just drop pins. Honestly embarrassed I waited this long.",
    name: "Jordan Lee",
    role: "Brand Identity Designer",
    gradient: "from-fire to-gold",
    initials: "JL",
  },
  {
    quote:
      "The portal link is the first thing I send at kickoff now. Clients know exactly where things stand. No more 'can you resend that file?' at midnight.",
    name: "Priya Menon",
    role: "UI & Product Designer",
    gradient: "from-gold to-cream",
    initials: "PM",
  },
  {
    quote:
      "I got paid faster just because the invoice lives next to the work. Client sees the finals, invoice is right there. Two clicks and done.",
    name: "Marcus Reid",
    role: "Freelance Illustrator",
    gradient: "from-fire via-gold to-cream",
    initials: "MR",
  },
];

/* ─── Page ─────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-cream overflow-x-hidden">
      {/* ── Sticky Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="absolute inset-0 bg-[#0A0A0A]/85 backdrop-blur-xl border-b border-white/[0.05]" />
        <div className="relative max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Logo className="h-5 w-auto" />
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-cream/50 hover:text-cream text-sm"
              )}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "sm" }), "text-sm px-5")}
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-20 text-center">
        {/* Deep ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] translate-y-1/2 rounded-full blur-[160px] opacity-[0.18]"
          style={{
            background:
              "radial-gradient(ellipse at center, #E55A3A 0%, #F0A830 40%, transparent 72%)",
          }}
        />
        {/* Top glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] -translate-y-1/2 rounded-full blur-[120px] opacity-[0.06]"
          style={{ background: "#F0A830" }}
        />

        {/* Badge */}
        <div className="animate-fade-up delay-0 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-fire/25 bg-fire/[0.08] text-[11px] text-fire font-medium tracking-widest uppercase mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-fire animate-pulse" />
          Now in beta
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up delay-75 font-display font-black leading-[0.92] tracking-tight mb-7">
          <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-[88px] text-cream/90">
            Feedback in email.
          </span>
          <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-[88px] text-gradient-brand">
            Files in Drive.
          </span>
          <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-[88px] text-cream/90">
            Both end today.
          </span>
        </h1>

        {/* Sub */}
        <p className="animate-fade-up delay-150 text-lg md:text-xl text-cream/45 max-w-[520px] leading-relaxed mb-10">
          Friday gives freelance designers one branded space — design review,
          file delivery, and invoicing in a single link your clients actually
          use.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up delay-225 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ size: "lg" }),
              "text-base px-9 gap-2 group"
            )}
          >
            Start for free
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "text-base px-9"
            )}
          >
            Sign in
          </Link>
        </div>

        {/* Mockup */}
        <div className="animate-fade-up delay-400 relative mt-20 w-full max-w-4xl mx-auto">
          <AppMockup />
          {/* Fade-out at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ── Stack strip ── */}
      <section className="relative py-14 px-6 bg-[#070707] border-y border-white/[0.04]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-cream/25 mb-6">
            Replace your entire freelance stack
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {replacedTools.map((tool) => (
              <span
                key={tool}
                className="relative text-sm text-cream/20 font-medium"
              >
                <span className="line-through decoration-fire/40 decoration-1">
                  {tool}
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Section label */}
          <div className="text-center mb-16">
            <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-fire mb-4">
              Everything in one place
            </p>
            <h2 className="font-display font-black text-4xl md:text-5xl text-cream leading-[1.05] tracking-tight">
              Built for how designers
              <br />
              actually work.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={cn(
                    "group relative p-7 rounded-2xl border border-white/[0.06] bg-[#111111]",
                    "hover:border-fire/20 hover:bg-[#131313] transition-all duration-300",
                    "animate-fade-up",
                    i === 0 && "delay-0",
                    i === 1 && "delay-75",
                    i === 2 && "delay-150",
                    i === 3 && "delay-225"
                  )}
                >
                  {/* Subtle corner glow on hover */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: "radial-gradient(circle at 0% 0%, rgba(229,90,58,0.05) 0%, transparent 60%)" }}
                  />
                  <div className="relative flex gap-5">
                    <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-fire/[0.08] border border-fire/[0.12] flex items-center justify-center group-hover:bg-fire/[0.13] transition-colors">
                      <Icon className="w-5 h-5 text-fire" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-[17px] text-cream mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-cream/45 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-28 px-6 bg-[#070707] border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-gold mb-4">
              Simple by design
            </p>
            <h2 className="font-display font-black text-4xl md:text-5xl text-cream leading-[1.05] tracking-tight">
              Three steps to a calm project.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10 md:gap-8">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className={cn(
                  "animate-fade-up",
                  i === 0 && "delay-0",
                  i === 1 && "delay-150",
                  i === 2 && "delay-300"
                )}
              >
                <div className="font-display font-black text-[56px] leading-none text-gradient-brand mb-5 tabular-nums">
                  {step.number}
                </div>
                <h3 className="font-display font-bold text-xl text-cream mb-2.5">
                  {step.title}
                </h3>
                <p className="text-sm text-cream/45 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portal preview strip ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl border border-white/[0.07] bg-[#111111] overflow-hidden p-8 md:p-12">
            {/* BG glow */}
            <div
              aria-hidden
              className="absolute right-0 bottom-0 w-96 h-96 translate-x-1/3 translate-y-1/3 rounded-full blur-[100px] opacity-20 pointer-events-none"
              style={{ background: "radial-gradient(#F0A830, #E55A3A, transparent)" }}
            />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-3.5 h-3.5 text-gold" />
                  <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-gold">
                    Client portal
                  </span>
                </div>
                <h3 className="font-display font-black text-3xl md:text-4xl text-cream leading-tight mb-4">
                  A portal your clients
                  <br />
                  <span className="text-gradient-brand">actually use.</span>
                </h3>
                <p className="text-sm text-cream/45 leading-relaxed mb-6">
                  One magic-link email in, and they land on their private
                  portal: project status, files, invoices — all branded to your
                  studio. No passwords to remember, nothing for you to set up
                  per client.
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    "View project status in real time",
                    "Download deliverables instantly",
                    "Leave comments on design files",
                    "See and pay invoices",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-fire/10 border border-fire/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-fire" strokeWidth={3} />
                      </div>
                      <span className="text-sm text-cream/60">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <PortalMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-28 px-6 bg-[#070707] border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-fire mb-4">
              From the community
            </p>
            <h2 className="font-display font-black text-4xl md:text-5xl text-cream leading-[1.05] tracking-tight">
              Designers who stopped
              <br />
              juggling tools.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className={cn(
                  "group relative p-7 rounded-2xl border border-white/[0.06] bg-[#141414]",
                  "hover:border-fire/15 hover:bg-[#161616] transition-all duration-300",
                  "animate-fade-up flex flex-col",
                  i === 0 && "delay-0",
                  i === 1 && "delay-150",
                  i === 2 && "delay-300"
                )}
              >
                {/* Opening quote mark */}
                <span
                  aria-hidden
                  className="block font-display text-[64px] leading-none text-fire/15 select-none mb-1 -mt-2"
                >
                  &ldquo;
                </span>

                <p className="font-body italic text-[15px] text-cream/60 leading-relaxed flex-1 mb-7">
                  {t.quote}
                </p>

                <div className="flex items-center gap-3">
                  {/* Gradient avatar */}
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-[#1A0800]",
                      t.gradient
                    )}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-[13px] font-display font-semibold text-cream/80">
                      {t.name}
                    </div>
                    <div className="text-[11px] text-cream/35">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, #E55A3A 0%, #F0A830 40%, transparent 70%)",
          }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="font-display font-black text-5xl md:text-6xl lg:text-7xl text-cream leading-[0.95] tracking-tight mb-5">
            Give your clients
            <br />
            <span className="text-gradient-brand-animated">a Friday.</span>
          </h2>
          <p className="text-cream/40 mb-10 text-lg">
            Free to start. No credit card required.
          </p>
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ size: "lg" }),
              "text-base px-12 gap-2 group"
            )}
          >
            Create your portal
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Logo className="h-4 w-auto opacity-30 hover:opacity-60 transition-opacity" />
          <p className="text-[11px] text-cream/20 font-mono">
            © {new Date().getFullYear()} Friday. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─── App mockup component ─────────────────────────────────── */

function AppMockup() {
  return (
    <div
      className="relative rounded-xl overflow-hidden border border-white/[0.07]"
      style={{
        boxShadow:
          "0 48px 140px rgba(229,90,58,0.10), 0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#090909] border-b border-white/[0.05]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-white/[0.08]" />
          <div className="w-3 h-3 rounded-full bg-white/[0.08]" />
          <div className="w-3 h-3 rounded-full bg-white/[0.08]" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.05] text-[11px] text-cream/25 font-mono">
            <Lock className="w-2.5 h-2.5 text-cream/20" />
            portal.itsfriday.dev/acme-design
          </div>
        </div>
      </div>

      {/* App content */}
      <div className="bg-[#141414] p-5">
        {/* Project header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="font-mono text-[10px] tracking-widest uppercase text-cream/30 mb-1.5">
              Acme Design Studio
            </div>
            <div className="font-display font-bold text-xl text-cream leading-tight">
              Brand Redesign 2025
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-fire/[0.08] border border-fire/20">
              <span className="w-1.5 h-1.5 rounded-full bg-fire animate-pulse" />
              <span className="text-[11px] text-fire font-medium">In Review</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-cream/30 mb-0.5 font-mono">Outstanding</div>
            <div className="font-display font-bold text-xl text-gold">$4,200</div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-5 gap-3">
          {/* Design canvas with annotations */}
          <div className="col-span-3 relative rounded-lg bg-[#1C1C1C] border border-white/[0.05] overflow-hidden aspect-[16/10]">
            {/* Fake design content */}
            <div className="absolute inset-0 p-4">
              <div
                className="h-full rounded opacity-30"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(229,90,58,0.2) 0%, rgba(240,168,48,0.1) 50%, transparent 100%)",
                }}
              />
            </div>
            <div className="absolute inset-0 p-5 flex flex-col">
              <div className="w-20 h-2.5 rounded-sm bg-fire/50 mb-2" />
              <div className="w-32 h-1.5 rounded-sm bg-cream/15 mb-1" />
              <div className="w-24 h-1.5 rounded-sm bg-cream/10 mb-3" />
              <div className="flex-1 rounded-md border border-white/[0.06] bg-white/[0.02] flex items-center justify-center">
                <div className="text-cream/10 text-xs font-mono">Hero Section</div>
              </div>
            </div>
            {/* Annotation pins */}
            <div
              className="absolute top-5 right-8 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg text-[#1A0800] cursor-pointer hover:scale-110 transition-transform"
              style={{ background: "linear-gradient(135deg, #E55A3A, #F0A830)" }}
            >
              1
            </div>
            <div
              className="absolute bottom-6 right-12 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg text-[#1A0800] cursor-pointer hover:scale-110 transition-transform"
              style={{ background: "linear-gradient(135deg, #F0A830, #F7D49A)" }}
            >
              2
            </div>
            <div className="absolute top-9 left-6 w-6 h-6 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-[10px] font-bold text-cream/60">
              3
            </div>
          </div>

          {/* Comment thread */}
          <div className="col-span-2 flex flex-col gap-2">
            {/* Active comment */}
            <div className="p-3 rounded-lg bg-[#1C1C1C] border border-fire/15">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-fire to-gold flex-shrink-0" />
                <div className="text-[10px] text-cream/40">Sarah C. · 2h ago</div>
              </div>
              <p className="text-[11px] text-cream/70 leading-relaxed">
                Love the direction — can we try the wordmark in cream?
              </p>
            </div>

            {/* Reply */}
            <div className="p-3 rounded-lg bg-[#1C1C1C] border border-white/[0.05]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 rounded-full bg-[#2A2A2A] flex-shrink-0 flex items-center justify-center text-[9px] text-cream/40 font-bold">
                  Y
                </div>
                <div className="text-[10px] text-cream/40">You · 1h ago</div>
              </div>
              <p className="text-[11px] text-cream/70 leading-relaxed">
                Updated! See pin #2 for the new version.
              </p>
            </div>

            {/* Approved badge */}
            <div className="p-2.5 rounded-lg bg-[#0F1A12] border border-sage/25 flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5 text-sage" strokeWidth={3} />
              </div>
              <span className="text-[11px] text-sage font-medium">
                Approved by client
              </span>
            </div>

            {/* Invoice preview */}
            <div className="mt-auto p-3 rounded-lg bg-[#1C1C1C] border border-white/[0.05]">
              <div className="font-mono text-[10px] text-cream/30 uppercase tracking-wider mb-2">
                Invoice #003
              </div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-cream/50">Brand identity</span>
                <span className="text-cream/70">$3,000</span>
              </div>
              <div className="flex justify-between text-[11px] mb-2">
                <span className="text-cream/50">Revisions</span>
                <span className="text-cream/70">$1,200</span>
              </div>
              <div className="border-t border-white/[0.06] pt-2 flex justify-between">
                <span className="text-[11px] text-cream/50 font-medium">Total</span>
                <span className="text-[12px] text-gold font-bold">$4,200</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Portal mockup (client view) ──────────────────────────── */

function PortalMockup() {
  return (
    <div
      className="rounded-xl overflow-hidden border border-white/[0.07] bg-[#0F0F0F]"
      style={{
        boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {/* Portal header */}
      <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
        <div className="font-display font-bold text-sm text-cream">Momentum Creative</div>
        <div className="text-[10px] font-mono text-cream/25">client portal</div>
      </div>

      {/* Portal content */}
      <div className="p-4 space-y-2.5">
        {/* Welcome */}
        <p className="text-[11px] text-cream/35 leading-relaxed mb-3">
          Hi Sarah — here's where you can track your project, review designs, and download your files.
        </p>

        {/* Project card */}
        <div className="rounded-lg border border-white/[0.06] bg-[#141414] p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-display font-bold text-cream">Brand Redesign</span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-fire/[0.08] border border-fire/20">
              <span className="w-1 h-1 rounded-full bg-fire" />
              <span className="text-[10px] text-fire">In Review</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            {["Discovery", "Concepts", "Refinement", "Delivery"].map(
              (col, i) => (
                <div
                  key={col}
                  className="flex-1 rounded px-1.5 py-1.5 bg-[#1C1C1C] border border-white/[0.04]"
                >
                  <div className="text-[9px] text-cream/30 font-mono mb-1">
                    {col}
                  </div>
                  <div
                    className={cn(
                      "h-1 rounded-full",
                      i === 0 && "bg-fire/60",
                      i === 1 && "bg-fire/60",
                      i === 2 && "bg-gold/60",
                      i === 3 && "bg-white/10"
                    )}
                  />
                </div>
              )
            )}
          </div>
        </div>

        {/* Deliverables */}
        <div className="rounded-lg border border-white/[0.06] bg-[#141414] p-3">
          <div className="text-[10px] font-mono text-cream/30 uppercase tracking-wider mb-2">
            Files ready
          </div>
          {[
            { name: "friday-brand-final.pdf", size: "4.2 MB" },
            { name: "logo-package.zip", size: "18 MB" },
          ].map((file) => (
            <div
              key={file.name}
              className="flex items-center justify-between py-1.5"
            >
              <span className="text-[11px] text-cream/60 truncate">{file.name}</span>
              <span className="text-[10px] text-cream/30 font-mono ml-3 flex-shrink-0">
                {file.size}
              </span>
            </div>
          ))}
        </div>

        {/* Invoice */}
        <div className="rounded-lg border border-gold/15 bg-gold/[0.04] p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-gold/60 uppercase tracking-wider mb-0.5">
                Invoice #003
              </div>
              <div className="font-display font-bold text-sm text-gold">$4,200.00</div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-gold/10 border border-gold/20 text-[10px] text-gold font-medium">
              Sent
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

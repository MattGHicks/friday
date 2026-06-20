import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/[0.05] px-6 py-12 mt-24">
      <div className="mx-auto max-w-6xl grid grid-cols-2 gap-8 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1 space-y-3">
          <Logo className="h-4 w-auto opacity-50" />
          <p className="text-[11px] text-cream/30 leading-relaxed max-w-[200px]">
            A branded client portal for freelance designers.
          </p>
        </div>

        <FooterColumn
          heading="Product"
          links={[
            { href: "/", label: "Home" },
            { href: "/pricing", label: "Pricing" },
            { href: "/help", label: "Help" },
          ]}
        />

        <FooterColumn
          heading="Account"
          links={[
            { href: "/login", label: "Sign in" },
            { href: "/signup", label: "Start free" },
          ]}
        />

        <FooterColumn
          heading="Legal"
          links={[
            { href: "/terms", label: "Terms" },
            { href: "/privacy", label: "Privacy" },
          ]}
        />
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-white/[0.04] pt-6 sm:flex-row">
        <p className="text-[11px] text-cream/20 font-mono">
          © {new Date().getFullYear()} Friday. All rights reserved.
        </p>
        <p className="text-[11px] text-cream/20">
          Made for designers who'd rather design.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-cream/40">
        {heading}
      </h3>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-xs text-cream/60 transition-colors hover:text-cream"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

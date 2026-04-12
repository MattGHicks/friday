import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Friday — Your Project Portal",
  description: "View your project status, files, and invoices.",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Minimal top bar */}
      <header className="border-b border-border/40 px-6 py-3">
        <span className="font-heading text-lg font-semibold tracking-tight text-gold">
          friday
        </span>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">{children}</main>
      <footer className="border-t border-border/30 px-6 py-4 text-center">
        <span className="text-xs text-muted-foreground/50">
          Powered by{" "}
          <span className="font-heading font-medium text-gold/60">friday</span>
        </span>
      </footer>
    </div>
  );
}

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
      {children}
      <footer className="border-t border-border/30 px-6 py-4 text-center">
        <span className="text-xs text-muted-foreground/50">
          Powered by{" "}
          <span className="font-heading font-medium text-gold/60">friday</span>
        </span>
      </footer>
    </div>
  );
}

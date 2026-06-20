import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";

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
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50">
          Powered by
          <Logo className="h-3 w-auto opacity-60" />
        </span>
      </footer>
    </div>
  );
}

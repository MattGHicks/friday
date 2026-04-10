import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Ambient radial glow — fire colour bleeds up from bottom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 h-[480px] w-[640px] -translate-x-1/2 translate-y-1/3 rounded-full opacity-20 blur-[120px]"
        style={{ background: "radial-gradient(ellipse, #E55A3A 0%, #F0A830 40%, transparent 70%)" }}
      />
      {/* Subtle top vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent"
      />

      <div className="relative z-10 w-full max-w-sm space-y-8">
        {/* Wordmark */}
        <div className="flex flex-col items-center gap-2">
          <Logo className="h-10 w-auto" />
          <p className="text-sm text-muted-foreground">It&apos;s Friday. Every day.</p>
        </div>

        {children}
      </div>
    </div>
  );
}

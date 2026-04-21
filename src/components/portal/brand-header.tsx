type BrandHeaderProps = {
  freelancer?: {
    name: string | null;
    logoUrl: string | null;
    brandColor: string;
  } | null;
};

export function PortalBrandHeader({ freelancer }: BrandHeaderProps) {
  if (!freelancer) {
    return (
      <header className="border-b border-border/40 px-6 py-3">
        <span className="font-heading text-lg font-semibold tracking-tight text-gold">
          friday
        </span>
      </header>
    );
  }

  const displayName = freelancer.name?.trim() || "Your designer";

  return (
    <header className="border-b border-border/40 px-6 py-3">
      <div className="flex items-center gap-3">
        {freelancer.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={freelancer.logoUrl}
            alt={displayName}
            className="h-7 w-7 shrink-0 rounded-sm object-contain"
          />
        ) : (
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm font-heading text-sm font-semibold text-surface-0"
            style={{ backgroundColor: freelancer.brandColor }}
            aria-hidden
          >
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}
        <span
          className="font-heading text-base font-semibold tracking-tight"
          style={{ color: freelancer.brandColor }}
        >
          {displayName}
        </span>
      </div>
    </header>
  );
}

import Link from "next/link";
import { CheckCircle2, Circle, User, UserPlus, FolderOpen, Upload, Receipt, Share2 } from "lucide-react";

interface OnboardingChecklistProps {
  hasDisplayName: boolean;
  hasClient: boolean;
  hasProject: boolean;
  hasFile: boolean;
  hasInvoice: boolean;
  hasSharedPortal: boolean;
}

const steps = [
  {
    key: "hasDisplayName" as const,
    label: "Add your display name",
    description: "Shows in quote emails and your public quote links.",
    href: "/settings",
    icon: User,
  },
  {
    key: "hasClient" as const,
    label: "Add your first client",
    description: "Create a client profile to get started.",
    href: "/clients",
    icon: UserPlus,
  },
  {
    key: "hasProject" as const,
    label: "Create a project",
    description: "Organise your work with a project board.",
    href: "/projects",
    icon: FolderOpen,
  },
  {
    key: "hasFile" as const,
    label: "Upload a file or deliverable",
    description: "Share work with your client through the portal.",
    href: "/projects",
    icon: Upload,
  },
  {
    key: "hasInvoice" as const,
    label: "Send an invoice",
    description: "Get paid — create and send your first invoice.",
    href: "/projects",
    icon: Receipt,
  },
  {
    key: "hasSharedPortal" as const,
    label: "Invite a client to their portal",
    description: "Send a magic-link invite so a client can see their project.",
    href: "/clients",
    icon: Share2,
  },
];

export function OnboardingChecklist({
  hasDisplayName,
  hasClient,
  hasProject,
  hasFile,
  hasInvoice,
  hasSharedPortal,
}: OnboardingChecklistProps) {
  const completed = { hasDisplayName, hasClient, hasProject, hasFile, hasInvoice, hasSharedPortal };
  const doneCount = Object.values(completed).filter(Boolean).length;
  const allDone = doneCount === steps.length;

  if (allDone) return null;

  return (
    <div className="animate-fade-up rounded-xl border border-white/[0.06] bg-surface-2 p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-sm font-bold text-cream">Get started</h2>
          <p className="mt-0.5 text-xs text-cream/40">
            {doneCount} of {steps.length} steps complete
          </p>
        </div>
        <div className="flex h-8 w-32 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-fire/70 transition-all duration-500"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2">
        {steps.map(({ key, label, description, href, icon: Icon }) => {
          const done = completed[key];
          return (
            <li key={key}>
              <Link
                href={href}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-fire" strokeWidth={1.75} />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-cream/20 group-hover:text-cream/40 transition-colors" strokeWidth={1.75} />
                )}
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${done ? "text-cream/30" : "text-gold group-hover:text-fire"}`}
                  strokeWidth={1.5}
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium leading-snug transition-colors ${done ? "text-cream/30 line-through" : "text-cream group-hover:text-cream"}`}>
                    {label}
                  </p>
                  {!done && (
                    <p className="text-xs text-cream/40">{description}</p>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

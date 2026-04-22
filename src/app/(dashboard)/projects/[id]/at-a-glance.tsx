import { Banknote, Calendar, MessageSquare } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { formatMoney } from "@/lib/format";

type Props = {
  unpaidCents: number;
  unpaidCount: number;
  dueDate: Date | null;
  lastMessageAt: Date | null;
};

function formatDueDate(dueDate: Date): { label: string; tone: "default" | "warn" | "danger" } {
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = dueDate.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / msPerDay);

  if (diffDays < 0) {
    const overdueBy = Math.abs(diffDays);
    return {
      label: `Overdue by ${overdueBy}d`,
      tone: "danger",
    };
  }
  if (diffDays === 0) return { label: "Due today", tone: "warn" };
  if (diffDays <= 7) return { label: `Due in ${diffDays}d`, tone: "warn" };
  return { label: `Due in ${diffDays}d`, tone: "default" };
}

export function AtAGlance({
  unpaidCents,
  unpaidCount,
  dueDate,
  lastMessageAt,
}: Props) {
  const due = dueDate ? formatDueDate(dueDate) : null;
  const lastMessage = lastMessageAt
    ? `${formatDistanceToNowStrict(lastMessageAt)} ago`
    : "No messages yet";

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border/50 bg-surface-1/40 px-4 py-3 text-sm">
      <Stat
        icon={Banknote}
        label={
          unpaidCents > 0
            ? `${formatMoney(unpaidCents)} unpaid`
            : "Nothing outstanding"
        }
        sub={unpaidCount > 0 ? `${unpaidCount} invoice${unpaidCount === 1 ? "" : "s"}` : null}
        tone={unpaidCents > 0 ? "warn" : "muted"}
      />
      <Divider />
      <Stat
        icon={Calendar}
        label={due?.label ?? "No due date"}
        sub={
          dueDate
            ? dueDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : null
        }
        tone={due?.tone === "danger" ? "danger" : due?.tone === "warn" ? "warn" : "muted"}
      />
      <Divider />
      <Stat
        icon={MessageSquare}
        label={lastMessage === "No messages yet" ? lastMessage : `Last message ${lastMessage}`}
        sub={null}
        tone="muted"
      />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  sub,
  tone,
}: {
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
  label: string;
  sub: string | null;
  tone: "default" | "warn" | "danger" | "muted";
}) {
  const toneClass =
    tone === "danger"
      ? "text-coral"
      : tone === "warn"
        ? "text-gold"
        : tone === "muted"
          ? "text-muted-foreground"
          : "text-foreground";

  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${toneClass}`} strokeWidth={1.5} />
      <span className={`font-medium ${toneClass}`}>{label}</span>
      {sub && <span className="text-xs text-muted-foreground/70">· {sub}</span>}
    </div>
  );
}

function Divider() {
  return <span className="hidden h-4 w-px bg-border/50 md:inline-block" aria-hidden />;
}

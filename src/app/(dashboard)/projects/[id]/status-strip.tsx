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
  const diffDays = Math.round((dueDate.getTime() - now.getTime()) / msPerDay);
  if (diffDays < 0) return { label: `Overdue by ${Math.abs(diffDays)}d`, tone: "danger" };
  if (diffDays === 0) return { label: "Due today", tone: "warn" };
  if (diffDays <= 7) return { label: `Due in ${diffDays}d`, tone: "warn" };
  return { label: `Due in ${diffDays}d`, tone: "default" };
}

/**
 * Slim single-line status strip. Three datapoints, no duplication with the
 * sidebar. Readable at a glance; no subtitles, no giant rounded card.
 */
export function StatusStrip({
  unpaidCents,
  unpaidCount,
  dueDate,
  lastMessageAt,
}: Props) {
  const due = dueDate ? formatDueDate(dueDate) : null;

  const dueTone =
    due?.tone === "danger"
      ? "text-coral"
      : due?.tone === "warn"
        ? "text-gold"
        : "text-foreground/80";

  const moneyTone = unpaidCents > 0 ? "text-gold" : "text-muted-foreground";

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
      <div className="flex items-center gap-1.5">
        <Banknote className={`h-3.5 w-3.5 ${moneyTone}`} strokeWidth={1.5} />
        <span className={moneyTone}>
          {unpaidCents > 0
            ? `${formatMoney(unpaidCents)} outstanding${
                unpaidCount > 1 ? ` · ${unpaidCount} invoices` : ""
              }`
            : "Nothing outstanding"}
        </span>
      </div>

      <span className="h-3 w-px bg-border/60" aria-hidden />

      <div className="flex items-center gap-1.5">
        <Calendar className={`h-3.5 w-3.5 ${dueTone}`} strokeWidth={1.5} />
        <span className={dueTone}>{due?.label ?? "No due date"}</span>
      </div>

      <span className="h-3 w-px bg-border/60" aria-hidden />

      <div className="flex items-center gap-1.5">
        <MessageSquare
          className="h-3.5 w-3.5 text-muted-foreground"
          strokeWidth={1.5}
        />
        <span className="text-muted-foreground">
          {lastMessageAt
            ? `Last message ${formatDistanceToNowStrict(lastMessageAt)} ago`
            : "No messages yet"}
        </span>
      </div>
    </div>
  );
}

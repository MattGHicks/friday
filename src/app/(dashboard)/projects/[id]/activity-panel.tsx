import { formatDistanceToNow } from "date-fns";

export type ActivityRecord = {
  id: string;
  action: string;
  metadata: unknown;
  createdAt: Date;
};

function getDescription(action: string, metadata: unknown): { label: string; detail?: string } {
  const meta = metadata as Record<string, unknown> | null;

  switch (action) {
    case "FILE_UPLOADED":
      return {
        label: "Uploaded a file",
        detail: meta?.fileName as string | undefined,
      };
    case "INVOICE_SENT":
      return { label: "Sent an invoice" };
    case "INVOICE_PAID":
      return { label: "Invoice marked as paid" };
    case "REVIEW_APPROVED":
      return { label: "Approved a design review" };
    case "REVIEW_CHANGES_REQUESTED":
      return { label: "Requested changes on a design review" };
    case "COMMENT_ADDED":
      return { label: "Added a comment" };
    case "PROJECT_CREATED":
      return { label: "Created this project" };
    case "STATUS_CHANGED":
      return {
        label: "Changed project status",
        detail: meta?.newStatus as string | undefined,
      };
    default:
      return {
        label: action.toLowerCase().replace(/_/g, " "),
      };
  }
}

interface ActivityPanelProps {
  activities: ActivityRecord[];
}

export function ActivityPanel({ activities }: ActivityPanelProps) {
  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        No activity yet. Activity will appear here as work progresses.
      </div>
    );
  }

  return (
    <div className="relative border-l-2 border-border/30 pl-6 space-y-6">
      {activities.map((activity) => {
        const { label, detail } = getDescription(activity.action, activity.metadata);
        return (
          <div key={activity.id} className="relative">
            {/* Timeline dot */}
            <span className="absolute -left-[1.8125rem] top-1 w-2 h-2 rounded-full bg-gold/50" />

            <div className="flex flex-col gap-0.5">
              <p className="text-sm text-foreground leading-snug">
                {label}
                {detail && (
                  <span className="ml-1.5 text-muted-foreground font-mono text-xs">
                    {detail}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

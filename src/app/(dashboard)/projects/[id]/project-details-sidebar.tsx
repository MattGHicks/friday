import Link from "next/link";
import { User, Calendar, Sparkles, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@/generated/prisma/client";

type Props = {
  client: { id: string; name: string };
  status: ProjectStatus;
  statusConfig: { label: string; className: string };
  startedAt: Date;
  dueDate: Date | null;
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProjectDetailsSidebar({
  client,
  status: _status,
  statusConfig,
  startedAt,
  dueDate,
}: Props) {
  return (
    <aside className="flex flex-col gap-5 rounded-lg border border-border/50 bg-surface-1/30 p-5 text-sm lg:sticky lg:top-6">
      <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Details
      </h3>
      <dl className="flex flex-col gap-4">
        <Row icon={User} label="Client">
          <Link
            href={`/clients/${client.id}`}
            className="font-medium text-foreground transition-colors hover:text-fire"
          >
            {client.name}
          </Link>
        </Row>

        <Row icon={Sparkles} label="Status">
          <Badge
            variant="outline"
            className={`text-[11px] ${statusConfig.className}`}
          >
            {statusConfig.label}
          </Badge>
        </Row>

        <Row icon={Calendar} label="Started">
          <span className="text-foreground">{formatDate(startedAt)}</span>
        </Row>

        <Row icon={Clock} label="Due">
          <span className="text-foreground">
            {dueDate ? formatDate(dueDate) : (
              <span className="text-muted-foreground/70">—</span>
            )}
          </span>
        </Row>
      </dl>
    </aside>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
        strokeWidth={1.5}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd>{children}</dd>
      </div>
    </div>
  );
}

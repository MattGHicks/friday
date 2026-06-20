import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeadsPipelineClient } from "../leads-pipeline-client";

/**
 * Leads board — the drag-and-drop kanban scoped to prospect stages.
 *
 * This is the "sales process" view. The top-level /pipeline now shows
 * the full project lifecycle (Leads → Quoted → Active → Completed) across
 * all work, not just prospects.
 */
export default async function LeadsBoardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [stages, leads] = await Promise.all([
    prisma.pipelineStage.findMany({
      where: { userId: user.id },
      orderBy: { position: "asc" },
      include: { _count: { select: { leads: true } } },
    }),
    prisma.lead.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: [{ stagePosition: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  return <LeadsPipelineClient stages={stages} leads={leads} />;
}

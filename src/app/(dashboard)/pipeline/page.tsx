import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeadsPipelineClient } from "../leads/leads-pipeline-client";

export default async function PipelinePage() {
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

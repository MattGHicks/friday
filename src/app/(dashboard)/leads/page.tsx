import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeadsListClient } from "./leads-list-client";

export default async function LeadsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [leads, stages] = await Promise.all([
    prisma.lead.findMany({
      where: { userId: user.id },
      include: {
        pipelineStage: { select: { id: true, name: true, color: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.pipelineStage.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
      orderBy: { position: "asc" },
    }),
  ]);

  return <LeadsListClient leads={leads} stages={stages} />;
}

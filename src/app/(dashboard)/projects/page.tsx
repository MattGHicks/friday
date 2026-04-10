import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectsPipelineClient } from "./projects-pipeline-client";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [stages, projects, clients] = await Promise.all([
    prisma.pipelineStage.findMany({
      where: { userId: user.id },
      orderBy: { position: "asc" },
    }),
    prisma.project.findMany({
      where: { userId: user.id },
      include: {
        client: { select: { id: true, name: true, company: true } },
        _count: { select: { invoices: true, files: true } },
      },
      orderBy: [{ stagePosition: "asc" }, { createdAt: "desc" }],
    }),
    prisma.client.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ProjectsPipelineClient
      stages={stages}
      projects={projects}
      clients={clients}
    />
  );
}

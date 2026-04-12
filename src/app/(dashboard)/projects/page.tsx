import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectsListClient } from "./projects-list-client";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [stages, projects, clients, templates] = await Promise.all([
    prisma.pipelineStage.findMany({
      where: { userId: user.id },
      orderBy: { position: "asc" },
    }),
    prisma.project.findMany({
      where: { userId: user.id },
      include: {
        client: { select: { id: true, name: true, company: true } },
        stage:  { select: { id: true, name: true, color: true } },
        _count: { select: { invoices: true, files: true } },
      },
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.client.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.projectTemplate.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <ProjectsListClient
      projects={projects}
      stages={stages}
      clients={clients}
      templates={templates}
    />
  );
}

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectsPageClient } from "./projects-page-client";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [projects, clients] = await Promise.all([
    prisma.project.findMany({
      where: { userId: user.id },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <ProjectsPageClient projects={projects} clients={clients} />;
}

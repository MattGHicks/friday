import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KanbanBoardLoader } from "./kanban-board-loader";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
    include: {
      client: { select: { id: true, name: true } },
      columns: {
        orderBy: { position: "asc" },
        include: {
          cards: { orderBy: { position: "asc" } },
        },
      },
    },
  });

  if (!project) notFound();

  return <KanbanBoardLoader project={project} />;
}

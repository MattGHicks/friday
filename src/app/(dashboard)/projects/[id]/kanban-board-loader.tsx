"use client";

import dynamic from "next/dynamic";
import type { Card, Column, Project } from "@/generated/prisma/client";

type ProjectWithData = Project & {
  client: { id: string; name: string };
  columns: (Column & { cards: Card[] })[];
};

// ssr: false prevents dnd-kit hydration mismatch (aria-describedby IDs differ between server/client)
const KanbanBoard = dynamic(
  () => import("./kanban-board").then((m) => ({ default: m.KanbanBoard })),
  { ssr: false }
);

export function KanbanBoardLoader({ project }: { project: ProjectWithData }) {
  return <KanbanBoard project={project} />;
}

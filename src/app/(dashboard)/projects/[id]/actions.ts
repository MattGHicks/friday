"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ── Columns ──────────────────────────────────────────────────

export async function createColumn(projectId: string, name: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!project) return { error: "Project not found" };

  const maxPos = await prisma.column.findFirst({
    where: { projectId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.column.create({
    data: {
      projectId,
      name: name.trim(),
      position: (maxPos?.position ?? -1) + 1,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function renameColumn(columnId: string, name: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const column = await prisma.column.findFirst({
    where: { id: columnId },
    include: { project: { select: { userId: true, id: true } } },
  });
  if (!column || column.project.userId !== user.id) return { error: "Not found" };

  await prisma.column.update({ where: { id: columnId }, data: { name: name.trim() } });

  revalidatePath(`/projects/${column.project.id}`);
  return { success: true };
}

export async function deleteColumn(columnId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const column = await prisma.column.findFirst({
    where: { id: columnId },
    include: { project: { select: { userId: true, id: true } } },
  });
  if (!column || column.project.userId !== user.id) return { error: "Not found" };

  await prisma.column.delete({ where: { id: columnId } });

  revalidatePath(`/projects/${column.project.id}`);
  return { success: true };
}

// ── Cards ─────────────────────────────────────────────────────

const cardSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullish().transform((v) => v || null),
  dueDate: z.string().nullish().transform((v) => (v ? new Date(v) : null)),
});

export async function createCard(columnId: string, title: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const column = await prisma.column.findFirst({
    where: { id: columnId },
    include: { project: { select: { userId: true, id: true } } },
  });
  if (!column || column.project.userId !== user.id) return { error: "Not found" };

  const parsed = cardSchema.safeParse({ title, description: null, dueDate: null });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const maxPos = await prisma.card.findFirst({
    where: { columnId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.card.create({
    data: {
      columnId,
      projectId: column.projectId,
      title: parsed.data.title,
      description: parsed.data.description,
      dueDate: parsed.data.dueDate,
      position: (maxPos?.position ?? -1) + 1,
    },
  });

  revalidatePath(`/projects/${column.project.id}`);
  return { success: true };
}

export async function updateCard(
  cardId: string,
  title: string,
  description: string,
  dueDate: string
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const card = await prisma.card.findFirst({
    where: { id: cardId },
    include: { column: { include: { project: { select: { userId: true, id: true } } } } },
  });
  if (!card || card.column.project.userId !== user.id) return { error: "Not found" };

  const parsed = cardSchema.safeParse({ title, description: description || null, dueDate: dueDate || null });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.card.update({
    where: { id: cardId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      dueDate: parsed.data.dueDate,
    },
  });

  revalidatePath(`/projects/${card.column.project.id}`);
  return { success: true };
}

export async function deleteCard(cardId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const card = await prisma.card.findFirst({
    where: { id: cardId },
    include: { column: { include: { project: { select: { userId: true, id: true } } } } },
  });
  if (!card || card.column.project.userId !== user.id) return { error: "Not found" };

  await prisma.card.delete({ where: { id: cardId } });

  revalidatePath(`/projects/${card.column.project.id}`);
  return { success: true };
}

// ── Drag-and-drop reorder ────────────────────────────────────

export async function moveCard(
  cardId: string,
  targetColumnId: string,
  newPosition: number
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const card = await prisma.card.findFirst({
    where: { id: cardId },
    include: { column: { include: { project: { select: { userId: true, id: true } } } } },
  });
  if (!card || card.column.project.userId !== user.id) return { error: "Not found" };

  const projectId = card.column.project.id;

  // Re-number cards in target column to make room
  const targetCards = await prisma.card.findMany({
    where: { columnId: targetColumnId, id: { not: cardId } },
    orderBy: { position: "asc" },
  });

  // Insert card at newPosition
  const updatedCards = [
    ...targetCards.slice(0, newPosition),
    { id: cardId },
    ...targetCards.slice(newPosition),
  ];

  await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: { columnId: targetColumnId, position: newPosition },
    }),
    ...updatedCards.map((c, i) =>
      prisma.card.update({ where: { id: c.id }, data: { position: i } })
    ),
  ]);

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function setupDefaultBoard(projectId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!project) return { error: "Not found" };

  const defaultColumns = ["To Do", "In Progress", "Review", "Done"];
  await prisma.$transaction(
    defaultColumns.map((name, i) =>
      prisma.column.create({ data: { projectId, name, position: i } })
    )
  );

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function reorderColumns(projectId: string, columnIds: string[]) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!project) return { error: "Not found" };

  await prisma.$transaction(
    columnIds.map((id, i) =>
      prisma.column.update({ where: { id }, data: { position: i } })
    )
  );

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

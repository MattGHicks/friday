"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ── Create stage ──────────────────────────────────────────── */

export async function createPipelineStage(data: {
  name: string;
  color?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Append at the end
  const last = await prisma.pipelineStage.findFirst({
    where: { userId: user.id },
    orderBy: { position: "desc" },
  });

  await prisma.pipelineStage.create({
    data: {
      userId: user.id,
      name: data.name.trim(),
      color: data.color ?? "#E55A3A",
      position: (last?.position ?? -1) + 1,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

/* ── Update stage ──────────────────────────────────────────── */

export async function updatePipelineStage(
  stageId: string,
  data: { name?: string; color?: string }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const stage = await prisma.pipelineStage.findFirst({
    where: { id: stageId, userId: user.id },
  });
  if (!stage) throw new Error("Stage not found");

  await prisma.pipelineStage.update({
    where: { id: stageId },
    data: {
      name: data.name?.trim() ?? stage.name,
      color: data.color ?? stage.color,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

/* ── Delete stage ──────────────────────────────────────────── */

export async function deletePipelineStage(stageId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const stage = await prisma.pipelineStage.findFirst({
    where: { id: stageId, userId: user.id },
    include: { _count: { select: { projects: true } } },
  });
  if (!stage) throw new Error("Stage not found");

  // Don't allow deleting the last stage
  const totalStages = await prisma.pipelineStage.count({
    where: { userId: user.id },
  });
  if (totalStages <= 1) {
    throw new Error("You must have at least one pipeline stage");
  }

  // If projects are in this stage, move them to the default stage (or first available)
  if (stage._count.projects > 0) {
    const fallback = await prisma.pipelineStage.findFirst({
      where: {
        userId: user.id,
        id: { not: stageId },
        OR: [{ isDefault: true }],
      },
    }) ?? await prisma.pipelineStage.findFirst({
      where: { userId: user.id, id: { not: stageId } },
      orderBy: { position: "asc" },
    });

    if (fallback) {
      await prisma.project.updateMany({
        where: { stageId: stageId },
        data: { stageId: fallback.id },
      });
    }
  }

  // If we're deleting the default, promote another to default
  await prisma.pipelineStage.delete({ where: { id: stageId } });

  if (stage.isDefault) {
    const next = await prisma.pipelineStage.findFirst({
      where: { userId: user.id },
      orderBy: { position: "asc" },
    });
    if (next) {
      await prisma.pipelineStage.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
    }
  }

  revalidatePath("/settings");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

/* ── Reorder stages ────────────────────────────────────────── */

export async function reorderPipelineStages(orderedStageIds: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Verify all belong to this user
  const stages = await prisma.pipelineStage.findMany({
    where: { id: { in: orderedStageIds }, userId: user.id },
    select: { id: true },
  });
  if (stages.length !== orderedStageIds.length) {
    throw new Error("Stage ownership mismatch");
  }

  await prisma.$transaction(
    orderedStageIds.map((id, index) =>
      prisma.pipelineStage.update({
        where: { id },
        data: { position: index },
      })
    )
  );

  revalidatePath("/settings");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

/* ── Set default stage ─────────────────────────────────────── */

export async function setDefaultPipelineStage(stageId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const stage = await prisma.pipelineStage.findFirst({
    where: { id: stageId, userId: user.id },
  });
  if (!stage) throw new Error("Stage not found");

  await prisma.pipelineStage.updateMany({
    where: { userId: user.id },
    data: { isDefault: false },
  });
  await prisma.pipelineStage.update({
    where: { id: stageId },
    data: { isDefault: true },
  });

  revalidatePath("/settings");
}

/* ── Move project to a stage (drag-drop) ──────────────────── */

export async function moveProjectToStage(
  projectId: string,
  stageId: string,
  newPosition: number
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!project) throw new Error("Project not found");

  const stage = await prisma.pipelineStage.findFirst({
    where: { id: stageId, userId: user.id },
  });
  if (!stage) throw new Error("Stage not found");

  await prisma.project.update({
    where: { id: projectId },
    data: { stageId, stagePosition: newPosition },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

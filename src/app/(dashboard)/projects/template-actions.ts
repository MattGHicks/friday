"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ActivityType } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { logActivity } from "@/app/(dashboard)/projects/[id]/log-activity";


// ── Types ─────────────────────────────────────────────────────

export type TemplateCard = { title: string; position: number };
export type TemplateColumn = { name: string; position: number; cards: TemplateCard[] };
export type TemplateStructure = { columns: TemplateColumn[] };

export type ProjectTemplate = {
  id: string;
  name: string;
  structure: TemplateStructure;
  createdAt: Date;
};

// ── Save as Template ──────────────────────────────────────────

const saveTemplateSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1, "Template name is required").max(100),
});

export async function saveAsTemplate(
  projectId: string,
  name: string
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = saveTemplateSchema.safeParse({ projectId, name });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  // Verify ownership + load columns/cards
  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, userId: user.id },
    include: {
      columns: {
        orderBy: { position: "asc" },
        include: { cards: { orderBy: { position: "asc" }, select: { title: true, position: true } } },
      },
    },
  });
  if (!project) return { success: false, error: "Project not found" };

  const structure: TemplateStructure = {
    columns: project.columns.map((col) => ({
      name: col.name,
      position: col.position,
      cards: col.cards.map((c) => ({ title: c.title, position: c.position })),
    })),
  };

  const template = await prisma.projectTemplate.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      structure: structure as unknown as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/projects");
  return { success: true, id: template.id };
}

// ── List Templates ────────────────────────────────────────────

export async function listTemplates(): Promise<ProjectTemplate[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const rows = await prisma.projectTemplate.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, structure: true, createdAt: true },
  });

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    structure: r.structure as unknown as TemplateStructure,
    createdAt: r.createdAt,
  }));
}

// ── Delete Template ───────────────────────────────────────────

export async function deleteTemplate(
  templateId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const existing = await prisma.projectTemplate.findFirst({
    where: { id: templateId, userId: user.id },
  });
  if (!existing) return { success: false, error: "Template not found" };

  await prisma.projectTemplate.delete({ where: { id: templateId } });
  return { success: true };
}

// ── Create Project from Template ──────────────────────────────

const createFromTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  clientId: z.string().min(1, "Client is required"),
  templateId: z.string().min(1),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).default("ACTIVE"),
  dueDate: z.string().optional().transform((v) => (v ? new Date(v) : null)),
});

export type CreateFromTemplateState = {
  error?: string;
  success?: boolean;
};

export async function createProjectFromTemplate(
  _prevState: CreateFromTemplateState,
  formData: FormData
): Promise<CreateFromTemplateState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = createFromTemplateSchema.safeParse({
    name: formData.get("name"),
    clientId: formData.get("clientId"),
    templateId: formData.get("templateId"),
    status: formData.get("status") || "ACTIVE",
    dueDate: formData.get("dueDate"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Verify client ownership
  const client = await prisma.client.findFirst({
    where: { id: parsed.data.clientId, userId: user.id },
  });
  if (!client) return { error: "Client not found" };

  // Verify template ownership
  const template = await prisma.projectTemplate.findFirst({
    where: { id: parsed.data.templateId, userId: user.id },
  });
  if (!template) return { error: "Template not found" };

  const structure = template.structure as unknown as TemplateStructure;

  // Find default pipeline stage
  const defaultStage = await prisma.pipelineStage.findFirst({
    where: { userId: user.id, isDefault: true },
  });
  const lastInStage = defaultStage
    ? await prisma.project.findFirst({
        where: { userId: user.id, stageId: defaultStage.id },
        orderBy: { stagePosition: "desc" },
        select: { stagePosition: true },
      })
    : null;

  try {
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        clientId: parsed.data.clientId,
        name: parsed.data.name,
        status: parsed.data.status,
        dueDate: parsed.data.dueDate,
        stageId: defaultStage?.id ?? null,
        stagePosition: (lastInStage?.stagePosition ?? -1) + 1,
      },
    });

    // Replicate template columns + cards
    for (const col of structure.columns) {
      const column = await prisma.column.create({
        data: { projectId: project.id, name: col.name, position: col.position },
      });
      if (col.cards.length > 0) {
        await prisma.card.createMany({
          data: col.cards.map((c) => ({
            columnId: column.id,
            projectId: project.id,
            title: c.title,
            position: c.position,
          })),
        });
      }
    }

    await logActivity(project.id, user.id, ActivityType.PROJECT_CREATED, {
      fromTemplate: template.name,
    });
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath("/projects");
  revalidatePath(`/clients/${parsed.data.clientId}`);
  return { success: true };
}

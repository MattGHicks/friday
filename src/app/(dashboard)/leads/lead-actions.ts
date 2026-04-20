"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { LeadStatus } from "@/generated/prisma/client";

const leadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null))
    .refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "Invalid email"
    ),
  phone: z.string().optional().transform((v) => v?.trim() || null),
  company: z.string().optional().transform((v) => v?.trim() || null),
  source: z.string().optional().transform((v) => v?.trim() || null),
  notes: z.string().optional().transform((v) => v?.trim() || null),
  pipelineStageId: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),
});

export type LeadFormState = {
  error?: string;
  success?: boolean;
};

export async function createLead(
  _prev: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    source: formData.get("source"),
    notes: formData.get("notes"),
    pipelineStageId: formData.get("pipelineStageId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Land new leads in the user's default pipeline stage if no stage chosen
  let stageId = parsed.data.pipelineStageId;
  if (!stageId) {
    const defaultStage = await prisma.pipelineStage.findFirst({
      where: { userId: user.id, isDefault: true },
    });
    stageId = defaultStage?.id ?? null;
  }

  const lastInStage = stageId
    ? await prisma.lead.findFirst({
        where: { userId: user.id, pipelineStageId: stageId },
        orderBy: { stagePosition: "desc" },
        select: { stagePosition: true },
      })
    : null;

  await prisma.lead.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      company: parsed.data.company,
      source: parsed.data.source,
      notes: parsed.data.notes,
      pipelineStageId: stageId,
      stagePosition: (lastInStage?.stagePosition ?? -1) + 1,
    },
  });

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateLead(
  _prev: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const leadId = formData.get("leadId") as string;
  if (!leadId) return { error: "Lead not found" };

  const existing = await prisma.lead.findFirst({
    where: { id: leadId, userId: user.id },
  });
  if (!existing) return { error: "Lead not found" };

  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    source: formData.get("source"),
    notes: formData.get("notes"),
    pipelineStageId: formData.get("pipelineStageId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      company: parsed.data.company,
      source: parsed.data.source,
      notes: parsed.data.notes,
      pipelineStageId: parsed.data.pipelineStageId ?? existing.pipelineStageId,
    },
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/pipeline");
  return { success: true };
}

export async function moveLeadToStage(
  leadId: string,
  stageId: string,
  newPosition: number
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId: user.id },
  });
  if (!lead) throw new Error("Lead not found");

  const stage = await prisma.pipelineStage.findFirst({
    where: { id: stageId, userId: user.id },
  });
  if (!stage) throw new Error("Stage not found");

  await prisma.lead.update({
    where: { id: leadId },
    data: { pipelineStageId: stageId, stagePosition: newPosition },
  });

  revalidatePath("/pipeline");
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function setLeadStatus(leadId: string, status: LeadStatus) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId: user.id },
  });
  if (!lead) return { error: "Lead not found" };

  await prisma.lead.update({ where: { id: leadId }, data: { status } });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/pipeline");
  return { success: true };
}

export async function deleteLead(leadId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId: user.id },
  });
  if (!lead) return { error: "Lead not found" };

  await prisma.lead.delete({ where: { id: leadId } });

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  return { success: true };
}

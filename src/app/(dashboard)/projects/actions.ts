"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ActivityType } from "@/generated/prisma/client";
import { logActivity } from "@/app/(dashboard)/projects/[id]/log-activity";

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().transform((v) => v || null),
  clientId: z.string().min(1, "Client is required"),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).default("ACTIVE"),
  dueDate: z.string().optional().transform((v) => (v ? new Date(v) : null)),
});

export type ProjectFormState = {
  error?: string;
  success?: boolean;
};

export async function createProject(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    clientId: formData.get("clientId"),
    status: formData.get("status") || "ACTIVE",
    dueDate: formData.get("dueDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Verify the client belongs to this user
  const client = await prisma.client.findFirst({
    where: { id: parsed.data.clientId, userId: user.id },
  });
  if (!client) return { error: "Client not found" };

  try {
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        clientId: parsed.data.clientId,
        name: parsed.data.name,
        description: parsed.data.description,
        status: parsed.data.status,
        dueDate: parsed.data.dueDate,
      },
    });

    // Create default columns
    await prisma.column.createMany({
      data: [
        { projectId: project.id, name: "To Do", position: 0 },
        { projectId: project.id, name: "In Progress", position: 1 },
        { projectId: project.id, name: "Done", position: 2 },
      ],
    });

    await logActivity(project.id, user.id, ActivityType.PROJECT_CREATED);
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath("/projects");
  revalidatePath(`/clients/${parsed.data.clientId}`);
  return { success: true };
}

export async function updateProject(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const projectId = formData.get("projectId") as string;
  if (!projectId) return { error: "Project not found" };

  // Verify ownership
  const existing = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!existing) return { error: "Project not found" };

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    clientId: formData.get("clientId") || existing.clientId,
    status: formData.get("status") || existing.status,
    dueDate: formData.get("dueDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        status: parsed.data.status,
        dueDate: parsed.data.dueDate,
      },
    });
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  // Log status change if it changed
  if (parsed.data.status !== existing.status) {
    await logActivity(projectId, user.id, ActivityType.STATUS_CHANGED, {
      oldStatus: existing.status,
      newStatus: parsed.data.status,
    });
  }

  revalidatePath("/projects");
  revalidatePath(`/clients/${existing.clientId}`);
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function quickUpdateStatus(
  projectId: string,
  status: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED"
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const existing = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!existing) return { error: "Project not found" };

  await prisma.project.update({ where: { id: projectId }, data: { status } });

  await logActivity(projectId, user.id, ActivityType.STATUS_CHANGED, {
    oldStatus: existing.status,
    newStatus: status,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath(`/clients/${existing.clientId}`);
  return { success: true };
}

export async function deleteProject(projectId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const existing = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!existing) return { error: "Project not found" };

  await prisma.project.delete({ where: { id: projectId } });

  revalidatePath("/projects");
  revalidatePath(`/clients/${existing.clientId}`);
  return { success: true };
}

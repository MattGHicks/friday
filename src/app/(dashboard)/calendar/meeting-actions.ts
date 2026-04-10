"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MeetingType } from "@/generated/prisma/client";

export type MeetingFormState = {
  error?: string;
  success?: boolean;
  meetingId?: string;
};

const meetingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().transform((v) => v || null),
  type: z.nativeEnum(MeetingType),
  startTime: z.string().min(1, "Start time is required").transform((v) => new Date(v)),
  endTime: z.string().min(1, "End time is required").transform((v) => new Date(v)),
  clientId: z.string().optional().transform((v) => v || null),
  projectId: z.string().optional().transform((v) => v || null),
  location: z.string().optional().transform((v) => v || null),
  notes: z.string().optional().transform((v) => v || null),
});

export async function createMeeting(
  _prevState: MeetingFormState,
  formData: FormData
): Promise<MeetingFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = meetingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    clientId: formData.get("clientId"),
    projectId: formData.get("projectId"),
    location: formData.get("location"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { startTime, endTime } = parsed.data;
  if (endTime <= startTime) {
    return { error: "End time must be after start time" };
  }

  // Verify client ownership if provided
  if (parsed.data.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: parsed.data.clientId, userId: user.id },
    });
    if (!client) return { error: "Client not found" };
  }

  // Verify project ownership if provided
  if (parsed.data.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, userId: user.id },
    });
    if (!project) return { error: "Project not found" };
  }

  let meetingId: string;
  try {
    const meeting = await prisma.meeting.create({
      data: {
        userId: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        type: parsed.data.type,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        clientId: parsed.data.clientId,
        projectId: parsed.data.projectId,
        location: parsed.data.location,
        notes: parsed.data.notes,
      },
    });
    meetingId = meeting.id;
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath("/calendar");
  return { success: true, meetingId };
}

export async function updateMeeting(
  _prevState: MeetingFormState,
  formData: FormData
): Promise<MeetingFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const meetingId = formData.get("meetingId") as string;
  if (!meetingId) return { error: "Meeting not found" };

  // Verify ownership
  const existing = await prisma.meeting.findFirst({
    where: { id: meetingId, userId: user.id },
  });
  if (!existing) return { error: "Meeting not found" };

  const parsed = meetingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    clientId: formData.get("clientId"),
    projectId: formData.get("projectId"),
    location: formData.get("location"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { startTime, endTime } = parsed.data;
  if (endTime <= startTime) {
    return { error: "End time must be after start time" };
  }

  // Verify client ownership if provided
  if (parsed.data.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: parsed.data.clientId, userId: user.id },
    });
    if (!client) return { error: "Client not found" };
  }

  // Verify project ownership if provided
  if (parsed.data.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, userId: user.id },
    });
    if (!project) return { error: "Project not found" };
  }

  try {
    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        type: parsed.data.type,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        clientId: parsed.data.clientId,
        projectId: parsed.data.projectId,
        location: parsed.data.location,
        notes: parsed.data.notes,
      },
    });
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath("/calendar");
  return { success: true, meetingId };
}

export async function deleteMeeting(meetingId: string): Promise<MeetingFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  // Verify ownership
  const existing = await prisma.meeting.findFirst({
    where: { id: meetingId, userId: user.id },
  });
  if (!existing) return { error: "Meeting not found" };

  await prisma.meeting.delete({ where: { id: meetingId } });

  revalidatePath("/calendar");
  return { success: true };
}

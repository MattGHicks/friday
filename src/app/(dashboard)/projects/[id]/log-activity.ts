"use server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ActivityType, ActorType } from "@/generated/prisma/client";

export async function logActivity(
  projectId: string,
  actorId: string,
  action: ActivityType,
  metadata?: Record<string, unknown>
) {
  try {
    await prisma.activity.create({
      data: {
        projectId,
        actorId,
        actorType: ActorType.USER,
        action,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch {
    // Never let activity logging crash the main action
  }
}

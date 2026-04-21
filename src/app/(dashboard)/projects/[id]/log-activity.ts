"use server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ActivityType, ActorType } from "@/generated/prisma/client";

type LogActivityOpts = {
  userId: string;
  actorId: string;
  action: ActivityType;
  projectId?: string | null;
  actorType?: ActorType;
  metadata?: Record<string, unknown>;
};

export async function logActivity(opts: LogActivityOpts) {
  try {
    await prisma.activity.create({
      data: {
        userId: opts.userId,
        projectId: opts.projectId ?? null,
        actorId: opts.actorId,
        actorType: opts.actorType ?? ActorType.USER,
        action: opts.action,
        metadata: opts.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch {
    // Never let activity logging crash the main action
  }
}

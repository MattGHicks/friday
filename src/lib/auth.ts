import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma/client";

/**
 * Default pipeline stages seeded for every new user.
 * Designer-focused workflow.
 */
const DEFAULT_PIPELINE_STAGES = [
  { name: "Lead", position: 0, color: "#6B6258", isDefault: false },
  { name: "Discovery", position: 1, color: "#F0A830", isDefault: true }, // new projects land here
  { name: "In Progress", position: 2, color: "#E55A3A", isDefault: false },
  { name: "In Review", position: 3, color: "#F0A830", isDefault: false },
  { name: "Delivered", position: 4, color: "#5A8A6A", isDefault: false },
  { name: "Archived", position: 5, color: "#8A7A6A", isDefault: false },
] as const;

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) return null;

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
  });

  if (existing) {
    // Keep email in sync (in case the user updated it in Supabase)
    if (existing.email !== supabaseUser.email) {
      return prisma.user.update({
        where: { id: supabaseUser.id },
        data: { email: supabaseUser.email! },
      });
    }
    return existing;
  }

  // One email = one role. If this email is already a portal client,
  // do not auto-create a freelancer User record.
  if (supabaseUser.email) {
    const clientWithEmail = await prisma.client.findFirst({
      where: { email: { equals: supabaseUser.email, mode: "insensitive" } },
      select: { id: true },
    });
    if (clientWithEmail) return null;
  }

  // First time — create user and seed default pipeline stages atomically.
  // Guard against concurrent RSC renders racing to create the same row.
  try {
    return await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email!,
        },
      });
      await tx.pipelineStage.createMany({
        data: DEFAULT_PIPELINE_STAGES.map((stage) => ({
          userId: created.id,
          ...stage,
        })),
      });
      return created;
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      const raced = await prisma.user.findUnique({
        where: { id: supabaseUser.id },
      });
      if (raced) return raced;
    }
    throw err;
  }
}

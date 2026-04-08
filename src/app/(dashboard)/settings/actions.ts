"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const settingsSchema = z.object({
  name: z.string().max(100).optional().transform((v) => v?.trim() || null),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
  welcomeMessage: z.string().max(500).optional().transform((v) => v?.trim() || null),
});

export type SettingsFormState = {
  error?: string;
  success?: boolean;
};

export async function updateSettings(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = settingsSchema.safeParse({
    name: formData.get("name"),
    brandColor: formData.get("brandColor") || undefined,
    welcomeMessage: formData.get("welcomeMessage"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      brandColor: parsed.data.brandColor,
      welcomeMessage: parsed.data.welcomeMessage,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

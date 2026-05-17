"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

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

const BRAND_BUCKET = "brand-assets";
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
const MAX_LOGO_BYTES = 512 * 1024; // 512 KB

function extensionFor(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/svg+xml":
      return "svg";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

async function ensureBrandBucket(supabase: ReturnType<typeof createAdminClient>) {
  const { error } = await supabase.storage.createBucket(BRAND_BUCKET, {
    public: true,
  });
  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw error;
  }
}

export async function uploadLogo(
  formData: FormData
): Promise<{ error?: string; success?: boolean; logoUrl?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) return { error: "No file provided" };
  if (file.size > MAX_LOGO_BYTES)
    return { error: "Logo must be under 512 KB" };
  if (!ALLOWED_LOGO_TYPES.includes(file.type))
    return { error: "Use PNG, JPG, SVG, or WEBP" };

  const supabase = createAdminClient();
  try {
    await ensureBrandBucket(supabase);
  } catch {
    return { error: "Storage is not available. Please try again." };
  }

  const ext = extensionFor(file.type);
  const storagePath = `${user.id}/logo-${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BRAND_BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) return { error: "Upload failed. Please try again." };

  const {
    data: { publicUrl },
  } = supabase.storage.from(BRAND_BUCKET).getPublicUrl(storagePath);

  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { logoUrl: true },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { logoUrl: publicUrl },
  });

  if (existing?.logoUrl) {
    const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BRAND_BUCKET}/`;
    if (existing.logoUrl.startsWith(prefix)) {
      await supabase.storage
        .from(BRAND_BUCKET)
        .remove([existing.logoUrl.slice(prefix.length)])
        .catch(() => {});
    }
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true, logoUrl: publicUrl };
}

export async function removeLogo(): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { logoUrl: true },
  });
  if (!existing?.logoUrl) return { success: true };

  await prisma.user.update({
    where: { id: user.id },
    data: { logoUrl: null },
  });

  const supabase = createAdminClient();
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BRAND_BUCKET}/`;
  if (existing.logoUrl.startsWith(prefix)) {
    await supabase.storage
      .from(BRAND_BUCKET)
      .remove([existing.logoUrl.slice(prefix.length)])
      .catch(() => {});
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

function generateFeedToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function ensureCalendarFeedToken(): Promise<{
  token?: string;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { calendarFeedToken: true },
  });
  if (fresh?.calendarFeedToken) return { token: fresh.calendarFeedToken };

  const token = generateFeedToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { calendarFeedToken: token },
  });
  revalidatePath("/settings");
  return { token };
}

export async function rotateCalendarFeedToken(): Promise<{
  token?: string;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const token = generateFeedToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { calendarFeedToken: token },
  });
  revalidatePath("/settings");
  return { token };
}


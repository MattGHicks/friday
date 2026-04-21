"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActorType, ActivityType } from "@/generated/prisma/client";
import { logActivity } from "./log-activity";
import { sendEmail } from "@/lib/resend";
import { buildFileUploadedEmail } from "@/lib/email/file-uploaded";

const BUCKET = "project-files";

function sanitizeFilename(name: string): string {
  return name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-]/g, "")
    .replace(/-+/g, "-");
}

async function ensureBucket(supabase: ReturnType<typeof createAdminClient>) {
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
  });
  // Ignore "already exists" error
  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw error;
  }
}

export async function uploadFile(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const projectId = formData.get("projectId") as string | null;
  const file = formData.get("file") as File | null;

  if (!projectId) return { error: "Project ID is required" };
  if (!file || file.size === 0) return { error: "No file provided" };

  // Verify project ownership and load client + user for email notification
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
    include: {
      client: { select: { name: true, email: true } },
      user: { select: { name: true, email: true } },
    },
  });
  if (!project) return { error: "Project not found" };

  const supabase = createAdminClient();

  try {
    await ensureBucket(supabase);
  } catch {
    return { error: "Storage is not available. Please try again." };
  }

  const sanitized = sanitizeFilename(file.name);
  const storagePath = `${user.id}/${projectId}/${Date.now()}-${sanitized}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { error: "Upload failed. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  try {
    await prisma.file.create({
      data: {
        projectId,
        uploadedById: user.id,
        uploaderType: ActorType.USER,
        name: file.name,
        url: publicUrl,
        size: file.size,
        mimeType: file.type,
      },
    });
  } catch {
    // Roll back the storage upload if DB write fails
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { error: "Something went wrong. Please try again." };
  }

  await logActivity({
    userId: user.id,
    projectId,
    actorId: user.id,
    action: ActivityType.FILE_UPLOADED,
    metadata: { fileName: file.name },
  });

  // Notify the client by email — fire-and-forget, never block the upload response
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://itsfriday.dev";
  const portalUrl = `${appUrl}/portal/projects/${projectId}`;
  const { subject, html, text } = buildFileUploadedEmail({
    freelancerName: project.user.name ?? project.user.email,
    clientName: project.client.name,
    projectName: project.name,
    fileName: file.name,
    portalUrl,
  });
  sendEmail({ to: project.client.email, subject, html, text }).catch(
    (err) => void console.error("[uploadFile] email send failed:", err)
  );

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function toggleDeliverable(
  fileId: string
): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const file = await prisma.file.findFirst({
    where: { id: fileId },
    include: { project: { select: { userId: true, id: true } } },
  });

  if (!file) return { error: "File not found" };
  if (file.project.userId !== user.id) return { error: "File not found" };

  await prisma.file.update({
    where: { id: fileId },
    data: { isDeliverable: !file.isDeliverable },
  });

  revalidatePath(`/projects/${file.project.id}`);
  return { success: true };
}

export async function deleteFile(
  fileId: string
): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  // Load file and verify ownership via its project
  const file = await prisma.file.findFirst({
    where: { id: fileId },
    include: { project: { select: { userId: true, id: true } } },
  });

  if (!file) return { error: "File not found" };
  if (file.project.userId !== user.id) return { error: "File not found" };

  const projectId = file.project.id;

  // Derive storage path from the public URL
  const supabase = createAdminClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const prefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/`;
  const storagePath = file.url.startsWith(prefix)
    ? file.url.slice(prefix.length)
    : null;

  // Delete from DB first
  await prisma.file.delete({ where: { id: fileId } });

  // Best-effort storage deletion — don't fail the action if it errors
  if (storagePath) {
    await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => {});
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

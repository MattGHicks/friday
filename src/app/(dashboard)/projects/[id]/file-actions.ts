"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActorType, ActivityType } from "@/generated/prisma/client";
import { logActivity } from "./log-activity";
import { sendEmail } from "@/lib/resend";
import { buildFileUploadedEmail } from "@/lib/email/file-uploaded";
import { createSystemMessage } from "@/lib/messaging";

const BUCKET = "project-files";

// Hard cap on file size — enough for typical design deliverables (PSDs, large PDFs,
// video mock-ups) without accidentally letting someone upload a 10GB ISO.
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

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

/**
 * Step 1 of upload flow: mint a signed upload URL.
 *
 * The client uploads the file bytes directly to Supabase Storage so the file
 * never passes through Vercel's function body (which is capped at 4.5MB).
 */
export async function createUploadUrl(
  projectId: string,
  filename: string,
  size: number
): Promise<
  | { error: string }
  | { success: true; path: string; token: string; bucket: string }
> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  if (!projectId) return { error: "Project ID is required" };
  if (!filename) return { error: "Filename is required" };
  if (!size || size <= 0) return { error: "File is empty" };
  if (size > MAX_FILE_SIZE) {
    return { error: `File is too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` };
  }

  // Verify project ownership before handing out an upload URL
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
    select: { id: true },
  });
  if (!project) return { error: "Project not found" };

  const supabase = createAdminClient();

  try {
    await ensureBucket(supabase);
  } catch {
    return { error: "Storage is not available. Please try again." };
  }

  const sanitized = sanitizeFilename(filename);
  const path = `${user.id}/${projectId}/${Date.now()}-${sanitized}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[createUploadUrl] failed:", error);
    return { error: "Could not create upload URL. Please try again." };
  }

  return { success: true, path: data.path, token: data.token, bucket: BUCKET };
}

/**
 * Step 2 of upload flow: record the uploaded file in the DB and run side
 * effects (activity log, system message, email notification).
 *
 * Called after the client successfully PUTs bytes to the signed URL.
 */
export async function finalizeUpload(
  projectId: string,
  storagePath: string,
  name: string,
  size: number,
  mimeType: string
): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  if (!projectId) return { error: "Project ID is required" };
  if (!storagePath) return { error: "Missing storage path" };

  // Guard: storagePath must belong to this user + project. createUploadUrl
  // embeds `${userId}/${projectId}/...`, so anything else is a tampered request.
  const expectedPrefix = `${user.id}/${projectId}/`;
  if (!storagePath.startsWith(expectedPrefix)) {
    return { error: "Invalid storage path" };
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
    include: {
      client: { select: { name: true, email: true } },
      user: {
        select: {
          name: true,
          email: true,
          logoUrl: true,
          brandColor: true,
        },
      },
    },
  });
  if (!project) return { error: "Project not found" };

  const supabase = createAdminClient();

  // Confirm the object exists before we record it. Prevents orphan DB rows if
  // the client claims to have uploaded but didn't.
  const parentDir = storagePath.slice(0, storagePath.lastIndexOf("/"));
  const baseName = storagePath.slice(storagePath.lastIndexOf("/") + 1);
  const { data: listData, error: listError } = await supabase.storage
    .from(BUCKET)
    .list(parentDir, { limit: 1, search: baseName });
  if (listError || !listData || listData.length === 0) {
    return { error: "Upload was not received. Please try again." };
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
        name,
        url: publicUrl,
        size,
        mimeType,
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
    metadata: { fileName: name },
  });

  await createSystemMessage({
    projectId,
    type: "FILE_UPLOADED",
    metadata: { fileName: name },
  });

  // Notify the client by email — fire-and-forget, never block the upload response
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://itsfriday.dev";
  const portalUrl = `${appUrl}/portal/projects/${projectId}`;
  const freelancerDisplayName = project.user.name ?? project.user.email;
  const { subject, html, text } = buildFileUploadedEmail({
    freelancerName: freelancerDisplayName,
    freelancerLogoUrl: project.user.logoUrl,
    freelancerBrandColor: project.user.brandColor,
    clientName: project.client.name,
    projectName: project.name,
    fileName: name,
    portalUrl,
  });
  sendEmail({
    to: project.client.email,
    subject,
    html,
    text,
    from: `${freelancerDisplayName} <hello@itsfriday.dev>`,
    replyTo: project.user.email,
  }).then(
    (result) => {
      if (!result.success) {
        console.error("[finalizeUpload] email send failed:", result.error);
      }
    },
    (err) => console.error("[finalizeUpload] email send threw:", err)
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

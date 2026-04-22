"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MessageAuthorType } from "@/generated/prisma/client";
import { ensureThread, replyToAddressFor } from "@/lib/messaging";
import { sendEmail } from "@/lib/resend";
import { buildNewMessageEmail } from "@/lib/email/new-message";

const MAX_BODY_CHARS = 10_000;

export async function sendFreelancerMessage(
  projectId: string,
  body: string
): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const trimmed = body.trim();
  if (!trimmed) return { error: "Message cannot be empty" };
  if (trimmed.length > MAX_BODY_CHARS)
    return { error: "Message is too long" };

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
    include: {
      client: { select: { name: true, email: true } },
    },
  });
  if (!project) return { error: "Project not found" };

  const thread = await ensureThread(projectId);

  await prisma.message.create({
    data: {
      threadId: thread.id,
      authorType: MessageAuthorType.USER,
      authorUserId: user.id,
      authorName: user.name ?? user.email,
      authorEmail: user.email,
      body: trimmed,
    },
  });

  // Notify client by email — fire-and-forget
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://itsfriday.dev";
  const portalUrl = `${appUrl}/portal/projects/${projectId}`;
  const freelancerDisplayName = user.name ?? user.email;
  const clientFirstName = project.client.name.split(" ")[0];

  const { subject, html, text } = buildNewMessageEmail({
    freelancerName: freelancerDisplayName,
    freelancerLogoUrl: user.logoUrl,
    freelancerBrandColor: user.brandColor,
    senderName: freelancerDisplayName,
    clientFirstName,
    projectName: project.name,
    bodyText: trimmed,
    portalUrl,
  });

  // Use a stable mailbox as From (plus-addressed senders trip spam filters
  // and some provider validation). The reply token goes in Reply-To only —
  // Gmail and friends honor Reply-To when the user hits Reply, so inbound
  // routing still works.
  sendEmail({
    to: project.client.email,
    subject,
    html,
    text,
    from: `${freelancerDisplayName} <messages@itsfriday.dev>`,
    replyTo: replyToAddressFor(thread.inboundToken),
  }).then(
    (result) => {
      if (!result.success) {
        console.error(
          "[sendFreelancerMessage] email send failed:",
          result.error
        );
      }
    },
    (err) =>
      console.error("[sendFreelancerMessage] email send threw:", err)
  );

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function regenerateInboundToken(
  projectId: string
): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
    select: { id: true },
  });
  if (!project) return { error: "Project not found" };

  const thread = await ensureThread(projectId);

  const token = Array.from({ length: 24 }, () =>
    "abcdefghijklmnopqrstuvwxyz0123456789".charAt(
      Math.floor(Math.random() * 36)
    )
  ).join("");

  await prisma.thread.update({
    where: { id: thread.id },
    data: { inboundToken: token },
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

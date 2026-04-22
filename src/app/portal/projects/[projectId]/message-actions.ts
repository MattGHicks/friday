"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getPortalClient } from "@/lib/portal-auth";
import { MessageAuthorType } from "@/generated/prisma/client";
import { ensureThread, replyToAddressFor } from "@/lib/messaging";
import { sendEmail } from "@/lib/resend";
import { buildNewMessageEmail } from "@/lib/email/new-message";

const MAX_BODY_CHARS = 10_000;

export async function sendClientMessage(
  projectId: string,
  body: string
): Promise<{ error?: string; success?: boolean }> {
  const client = await getPortalClient();
  if (!client) return { error: "Not authenticated" };

  const trimmed = body.trim();
  if (!trimmed) return { error: "Message cannot be empty" };
  if (trimmed.length > MAX_BODY_CHARS)
    return { error: "Message is too long" };

  const project = await prisma.project.findFirst({
    where: { id: projectId, clientId: client.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          logoUrl: true,
          brandColor: true,
        },
      },
    },
  });
  if (!project) return { error: "Project not found" };

  const thread = await ensureThread(projectId);

  await prisma.message.create({
    data: {
      threadId: thread.id,
      authorType: MessageAuthorType.CLIENT,
      authorClientId: client.id,
      authorName: client.name,
      authorEmail: client.email,
      body: trimmed,
    },
  });

  // Notify freelancer by email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://itsfriday.dev";
  const freelancerUrl = `${appUrl}/projects/${projectId}`;
  const freelancerDisplayName = project.user.name ?? project.user.email;
  const freelancerFirstName = freelancerDisplayName.split(" ")[0];

  const { subject, html, text } = buildNewMessageEmail({
    freelancerName: freelancerDisplayName,
    freelancerLogoUrl: project.user.logoUrl,
    freelancerBrandColor: project.user.brandColor,
    senderName: client.name,
    clientFirstName: freelancerFirstName,
    projectName: project.name,
    bodyText: trimmed,
    portalUrl: freelancerUrl,
  });

  // Use a stable From mailbox; the reply token goes in Reply-To so inbound
  // routing still works when the freelancer hits Reply in their mail client.
  sendEmail({
    to: project.user.email,
    subject,
    html,
    text,
    from: `${client.name} <messages@itsfriday.dev>`,
    replyTo: replyToAddressFor(thread.inboundToken),
  }).then(
    (result) => {
      if (!result.success) {
        console.error(
          "[sendClientMessage] email send failed:",
          result.error
        );
      }
    },
    (err) => console.error("[sendClientMessage] email send threw:", err)
  );

  revalidatePath(`/portal/projects/${projectId}`);
  return { success: true };
}

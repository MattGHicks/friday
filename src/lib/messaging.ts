import { prisma } from "@/lib/prisma";
import { SystemEventType, MessageAuthorType } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";

const REPLY_DOMAIN = "itsfriday.dev";
const REPLY_LOCAL = "reply";

export async function ensureThread(projectId: string): Promise<{
  id: string;
  inboundToken: string;
}> {
  const existing = await prisma.thread.findUnique({
    where: { projectId },
    select: { id: true, inboundToken: true },
  });
  if (existing) return existing;

  return prisma.thread.create({
    data: { projectId },
    select: { id: true, inboundToken: true },
  });
}

export function replyToAddressFor(token: string): string {
  return `${REPLY_LOCAL}+${token}@${REPLY_DOMAIN}`;
}

// Parse the inbound-routing token from a To address. Supports:
//   reply+TOKEN@itsfriday.dev
//   anything+TOKEN@... (tolerant)
export function parseTokenFromAddress(address: string | undefined | null): string | null {
  if (!address) return null;
  const match = address.match(/\+([a-z0-9]{10,})@/i);
  return match?.[1] ?? null;
}

// Strip HTML tags and collapse whitespace. Used when we only have HTML body
// for an inbound email but want plain text for storage/display.
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Strip quoted-reply sections from an inbound email body. Handles the common
// "On DATE, NAME <email> wrote:" marker and leading ">" quote prefixes.
export function stripQuotedReply(text: string): string {
  const lines = text.split("\n");
  const cutIndex = lines.findIndex(
    (line) =>
      /^On .+wrote:$/i.test(line.trim()) ||
      /^-----Original Message-----/i.test(line.trim()) ||
      /^From: .+<.+@.+>/i.test(line.trim())
  );
  const trimmed = cutIndex >= 0 ? lines.slice(0, cutIndex) : lines;
  return trimmed
    .filter((line) => !line.trim().startsWith(">"))
    .join("\n")
    .trim();
}

type SystemMessageOpts = {
  projectId: string;
  type: SystemEventType;
  metadata?: Record<string, unknown>;
};

// Create a SYSTEM message in the project's thread. Wraps in try/catch so
// it never crashes the parent action (same pattern as logActivity).
export async function createSystemMessage(opts: SystemMessageOpts): Promise<void> {
  try {
    const thread = await ensureThread(opts.projectId);
    await prisma.message.create({
      data: {
        threadId: thread.id,
        authorType: MessageAuthorType.SYSTEM,
        body: "", // system messages are rendered from type + metadata
        systemEventType: opts.type,
        systemMetadata: opts.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    console.error("[createSystemMessage] failed:", err);
  }
}

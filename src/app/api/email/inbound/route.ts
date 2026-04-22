import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { MessageAuthorType } from "@/generated/prisma/client";
import {
  parseTokenFromAddress,
  htmlToPlainText,
  stripQuotedReply,
} from "@/lib/messaging";

// Resend inbound webhook. Configure in Resend:
//   - Inbound domain points at this app
//   - Webhook URL: https://itsfriday.dev/api/email/inbound
//   - Optional: set INBOUND_WEBHOOK_SECRET and have Resend sign requests
//
// Payload shape is tolerant — we extract from top-level fields or nested
// `data.email`. Unknown senders still get recorded as a CLIENT-type message
// so nothing is silently dropped.

type ResendAddress =
  | string
  | { email?: string; address?: string; name?: string }
  | Array<string | { email?: string; address?: string; name?: string }>;

type InboundPayload = {
  from?: ResendAddress;
  to?: ResendAddress;
  subject?: string;
  text?: string;
  html?: string;
  headers?: Record<string, string> | Array<{ name: string; value: string }>;
  data?: InboundPayload;
  email?: InboundPayload;
};

// simple in-memory rate limit — per token, 20 messages per minute
const rateBucket = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function checkRate(token: string): boolean {
  const now = Date.now();
  const bucket = rateBucket.get(token);
  if (!bucket || bucket.resetAt < now) {
    rateBucket.set(token, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT) return false;
  bucket.count += 1;
  return true;
}

function firstAddress(input: ResendAddress | undefined): {
  email: string;
  name: string | null;
} | null {
  if (!input) return null;
  const arr = Array.isArray(input) ? input : [input];
  for (const entry of arr) {
    if (typeof entry === "string") {
      const match = entry.match(/^(?:"?([^"<]*)"?\s*)?<?([^\s<>]+@[^\s<>]+)>?$/);
      if (match) return { email: match[2], name: match[1]?.trim() || null };
    } else if (entry && typeof entry === "object") {
      const email = entry.email ?? entry.address;
      if (email) return { email, name: entry.name ?? null };
    }
  }
  return null;
}

function allAddresses(input: ResendAddress | undefined): string[] {
  if (!input) return [];
  const arr = Array.isArray(input) ? input : [input];
  const out: string[] = [];
  for (const entry of arr) {
    if (typeof entry === "string") {
      out.push(entry);
    } else if (entry && typeof entry === "object") {
      const email = entry.email ?? entry.address;
      if (email) out.push(email);
    }
  }
  return out;
}

export async function POST(req: NextRequest) {
  // Optional signature check
  const secret = process.env.INBOUND_WEBHOOK_SECRET;
  if (secret) {
    const provided =
      req.headers.get("x-webhook-secret") ??
      req.headers.get("x-resend-signature");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: InboundPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Resend wraps payload; unwrap if needed
  const email = payload.email ?? payload.data?.email ?? payload.data ?? payload;

  const toList = allAddresses(email.to);
  let token: string | null = null;
  for (const addr of toList) {
    token = parseTokenFromAddress(addr);
    if (token) break;
  }

  if (!token) {
    console.warn("[inbound] no token found in To addresses:", toList);
    return NextResponse.json({ error: "No routing token" }, { status: 400 });
  }

  if (!checkRate(token)) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  const thread = await prisma.thread.findUnique({
    where: { inboundToken: token },
    include: {
      project: {
        select: {
          id: true,
          userId: true,
          clientId: true,
          client: { select: { id: true, email: true, name: true } },
          user: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });

  if (!thread) {
    console.warn("[inbound] no thread for token:", token);
    // Return 200 so Resend doesn't retry forever on a stale token
    return NextResponse.json({ ignored: true });
  }

  const from = firstAddress(email.from);
  if (!from) {
    return NextResponse.json({ error: "No from address" }, { status: 400 });
  }

  // Prefer plain text; fall back to stripped HTML
  const rawText =
    email.text ??
    (email.html ? htmlToPlainText(email.html) : "");
  const body = stripQuotedReply(rawText).trim();

  if (!body) {
    console.warn("[inbound] empty body after strip");
    return NextResponse.json({ ignored: true });
  }

  // Truncate to hard cap for safety
  const BODY_CAP = 10_000;
  const truncated = body.length > BODY_CAP ? body.slice(0, BODY_CAP) : body;

  // Classify by sender email: freelancer-origin → USER, anyone else → CLIENT.
  // This lets both sides reply-round-trip into the same thread.
  const fromEmail = from.email.toLowerCase();
  const isFreelancer =
    thread.project.user.email.toLowerCase() === fromEmail;
  const knownClient =
    thread.project.client.email.toLowerCase() === fromEmail
      ? thread.project.client
      : null;

  await prisma.message.create({
    data: {
      threadId: thread.id,
      authorType: isFreelancer
        ? MessageAuthorType.USER
        : MessageAuthorType.CLIENT,
      authorUserId: isFreelancer ? thread.project.user.id : null,
      authorClientId: isFreelancer ? null : knownClient?.id ?? null,
      authorName:
        from.name ??
        (isFreelancer ? thread.project.user.name : knownClient?.name) ??
        null,
      authorEmail: from.email,
      body: truncated,
    },
  });

  return NextResponse.json({ success: true, projectId: thread.project.id });
}

// GET for a quick health check — useful when configuring the webhook
export async function GET() {
  return NextResponse.json({ ok: true, route: "email/inbound" });
}

"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export type InviteState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "error"; error: string };

/**
 * Sends a Supabase magic-link invite to the client's email.
 * The link lands on /auth/callback?next=/portal and establishes a portal session.
 */
export async function sendPortalInvite(clientId: string): Promise<InviteState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", error: "Not authenticated" };

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId: user.id },
    select: { email: true },
  });
  if (!client) return { status: "error", error: "Client not found" };

  // Block invites to freelancer emails — one email = one role
  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: client.email, mode: "insensitive" } },
    select: { id: true },
  });
  if (existingUser) {
    return {
      status: "error",
      error:
        "This email is registered as a freelancer account. Use a different email for the client portal.",
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://itsfriday.dev";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: client.email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?next=/portal`,
    },
  });

  if (error) {
    return { status: "error", error: error.message };
  }

  await prisma.user.updateMany({
    where: { id: user.id, firstPortalInviteSentAt: null },
    data: { firstPortalInviteSentAt: new Date() },
  }).catch(() => {});

  return { status: "sent" };
}

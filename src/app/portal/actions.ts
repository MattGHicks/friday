"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export type PortalSignInState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "error"; error: string };

const emailSchema = z.string().email("Please enter a valid email");

/**
 * Self-serve magic-link request from the portal sign-in form.
 * Only sends a link if the email matches a Client record — prevents
 * the portal from being used as a freelancer-signup backdoor.
 */
export async function requestPortalMagicLink(
  _prev: PortalSignInState,
  formData: FormData
): Promise<PortalSignInState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0].message };
  }

  const email = parsed.data;

  const client = await prisma.client.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });

  if (!client) {
    // Do not reveal which emails are registered; show the same success state.
    return { status: "sent" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://itsfriday.dev";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?next=/portal`,
    },
  });

  if (error) {
    return { status: "error", error: error.message };
  }

  return { status: "sent" };
}

export async function portalSignOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

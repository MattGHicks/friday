"use server";

import { createClient } from "@/lib/supabase/server";

export type MagicLinkState = {
  success?: boolean;
  error?: string;
};

export async function sendPortalMagicLink(
  _prev: MagicLinkState,
  formData: FormData
): Promise<MagicLinkState> {
  const email = formData.get("email");
  if (typeof email !== "string" || !email.trim()) {
    return { error: "Please enter your email address." };
  }

  const next = formData.get("next");
  const nextPath = typeof next === "string" && next.startsWith("/portal/") ? next : "";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectTo = `${appUrl}/portal/auth/callback${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      shouldCreateUser: true,
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    return { error: "Something went wrong. Please try again." };
  }

  return { success: true };
}

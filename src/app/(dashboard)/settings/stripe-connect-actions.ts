"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

/**
 * Generates a Stripe Connect OAuth URL and redirects the user to Stripe
 * to begin the Standard account connection flow.
 */
export async function connectStripe(): Promise<never> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const clientId = process.env.STRIPE_CLIENT_ID;
  if (!clientId) {
    throw new Error("STRIPE_CLIENT_ID is not configured");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectUri = `${appUrl}/api/stripe/connect/callback`;

  const authorizeUrl = stripe.oauth.authorizeUrl({
    client_id: clientId,
    response_type: "code",
    scope: "read_write",
    redirect_uri: redirectUri,
    // Pass userId as state so we can link the account back on callback
    state: user.id,
  });

  redirect(authorizeUrl);
}

/**
 * Disconnects the user's Stripe account by deauthorizing and clearing
 * the stored stripeAccountId.
 */
export async function disconnectStripe(): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeAccountId: true },
  });

  if (!dbUser?.stripeAccountId) {
    return { success: false, error: "No Stripe account connected" };
  }

  const clientId = process.env.STRIPE_CLIENT_ID;

  try {
    // Deauthorize the connected account from our platform
    if (clientId) {
      await stripe.oauth.deauthorize({
        client_id: clientId,
        stripe_user_id: dbUser.stripeAccountId,
      });
    }
  } catch {
    // Deauthorize can fail if the account already revoked access — still clear locally
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeAccountId: null },
  });

  return { success: true };
}

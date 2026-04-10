import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

/**
 * Stripe Connect OAuth callback.
 *
 * Stripe redirects here after the user authorizes (or denies) our app.
 * Query params:
 *   code  — authorization code to exchange for account ID
 *   state — userId we passed in the authorize URL
 *   error — present if the user denied (e.g. "access_denied")
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const userId = searchParams.get("state");

  const settingsUrl = new URL("/settings", request.nextUrl.origin);

  // User declined or something went wrong on Stripe's side
  if (error || !code || !userId) {
    settingsUrl.searchParams.set("stripe_error", error ?? "missing_params");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const tokenResponse = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    const stripeAccountId = tokenResponse.stripe_user_id;

    if (!stripeAccountId) {
      settingsUrl.searchParams.set("stripe_error", "no_account_id");
      return NextResponse.redirect(settingsUrl);
    }

    // Verify the userId from state exists (basic CSRF guard)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      settingsUrl.searchParams.set("stripe_error", "invalid_state");
      return NextResponse.redirect(settingsUrl);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { stripeAccountId },
    });

    settingsUrl.searchParams.set("stripe_connected", "1");
    return NextResponse.redirect(settingsUrl);
  } catch (err) {
    console.error("[stripe/connect/callback]", err);
    settingsUrl.searchParams.set("stripe_error", "token_exchange_failed");
    return NextResponse.redirect(settingsUrl);
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/portal/login?error=auth_callback_failed`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return NextResponse.redirect(`${origin}/portal/login?error=auth_callback_failed`);
  }

  // Find a client whose email matches the authenticated session
  const client = await prisma.client.findFirst({
    where: { email: { equals: data.user.email, mode: "insensitive" } },
    select: { id: true },
  });

  if (!client) {
    // Email not registered as a client — sign them out and show error
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/portal/login?error=no_account`);
  }

  // If a specific portal path was requested, verify it belongs to this client
  if (next && next.startsWith(`/portal/${client.id}`)) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Default: send to their portal home
  return NextResponse.redirect(`${origin}/portal/${client.id}`);
}

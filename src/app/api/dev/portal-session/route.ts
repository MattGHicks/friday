import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Dev-only: inject a Supabase session from tokens produced by scripts/dev-tokens.mjs.
// Refuses to run unless NODE_ENV === "development" — bypasses email + PKCE for
// Chrome DevTools MCP automated testing where interactive auth isn't possible.
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("forbidden", { status: 403 });
  }
  const { access_token, refresh_token } = await request.json();
  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "access_token and refresh_token required" }, { status: 400 });
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

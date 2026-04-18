#!/usr/bin/env node
// Generates a magic link for an email via the Supabase admin API.
// Creates the auth user if it doesn't exist. Bypasses SMTP rate limits.
// Usage: node scripts/generate-magic-link.mjs <email> [redirect-path]

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const [, , email, redirectPath = "/portal"] = process.argv;
if (!email) {
  console.error("usage: generate-magic-link.mjs <email> [redirect-path]");
  process.exit(1);
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";
const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent(redirectPath)}`;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data, error } = await supabase.auth.admin.generateLink({
  type: "magiclink",
  email,
  options: { redirectTo },
});

if (error) {
  console.error("error:", error);
  process.exit(1);
}

console.log(data.properties.action_link);

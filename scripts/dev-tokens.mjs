#!/usr/bin/env node
// Dev-only: generate portal session tokens by verifying a magic-link hashed_token.
// Bypasses SMTP. Outputs access_token + refresh_token that can be injected via
// supabase.auth.setSession() in the browser.
// Usage: node scripts/dev-tokens.mjs <email>

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const [, , email] = process.argv;
if (!email) {
  console.error("usage: dev-tokens.mjs <email>");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email,
});
if (error) {
  console.error("generateLink error:", error);
  process.exit(1);
}

// Use the hashed_token to verifyOtp on a plain client — returns a real session.
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const plain = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: verifyData, error: verifyError } = await plain.auth.verifyOtp({
  type: "magiclink",
  token_hash: data.properties.hashed_token,
});
if (verifyError) {
  console.error("verifyOtp error:", verifyError);
  process.exit(1);
}

console.log(JSON.stringify({
  access_token: verifyData.session.access_token,
  refresh_token: verifyData.session.refresh_token,
  user_id: verifyData.user.id,
  email: verifyData.user.email,
}));

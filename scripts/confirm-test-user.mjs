#!/usr/bin/env node
// Creates or confirms a test user via the Supabase admin API.
// Usage: node scripts/confirm-test-user.mjs <email> <password>

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Load .env.local manually
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error("usage: confirm-test-user.mjs <email> <password>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Try to find existing user
const { data: list, error: listErr } = await supabase.auth.admin.listUsers();
if (listErr) {
  console.error("list error:", listErr);
  process.exit(1);
}

const existing = list.users.find(
  (u) => u.email?.toLowerCase() === email.toLowerCase()
);

if (existing) {
  const { error } = await supabase.auth.admin.updateUserById(existing.id, {
    email_confirm: true,
    password,
  });
  if (error) {
    console.error("update error:", error);
    process.exit(1);
  }
  console.log(`confirmed existing user: ${email} (${existing.id})`);
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("create error:", error);
    process.exit(1);
  }
  console.log(`created user: ${email} (${data.user.id})`);
}

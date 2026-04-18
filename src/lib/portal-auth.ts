import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Client } from "@/generated/prisma/client";

/**
 * Resolves the Client record for the currently-signed-in portal session.
 * Portal sessions are scoped by email — Client.email must match the auth email.
 * Returns null if no session or no matching client.
 */
export async function getPortalClient(): Promise<Client | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  return prisma.client.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
  });
}

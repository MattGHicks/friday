import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Client } from "@/generated/prisma/client";

/**
 * Verifies the current Supabase session belongs to the client identified by clientId.
 * Returns the Client if the session email matches, null otherwise.
 *
 * Use in portal server components to gate access:
 *   const client = await getPortalClient(clientId);
 *   if (!client) redirect("/portal/login?error=auth_failed");
 */
export async function getPortalClient(clientId: string): Promise<Client | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client) return null;

  // Verify the session email matches this client — prevents accessing other portals
  if (client.email.toLowerCase() !== user.email.toLowerCase()) return null;

  return client;
}

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma/client";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) return null;

  // Upsert ensures Prisma record always exists and stays in sync
  const user = await prisma.user.upsert({
    where: { id: supabaseUser.id },
    create: {
      id: supabaseUser.id,
      email: supabaseUser.email!,
    },
    update: {
      email: supabaseUser.email!,
    },
  });

  return user;
}

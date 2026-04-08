import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, brandColor: true, welcomeMessage: true, plan: true, createdAt: true },
  });

  if (!dbUser) return null;

  return <SettingsClient user={dbUser} />;
}

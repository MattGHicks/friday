import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ImportClient } from "./import-client";

export default async function ImportPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const existingClients = await prisma.client.findMany({
    where: { userId: user.id },
    select: { id: true, email: true, name: true, company: true },
  });

  return <ImportClient existingClients={existingClients} />;
}

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClientsPageClient } from "./clients-page-client";

export default async function ClientsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const clients = await prisma.client.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { projects: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ClientsPageClient
      clients={clients.map((c) => ({
        ...c,
        projectCount: c._count.projects,
      }))}
    />
  );
}

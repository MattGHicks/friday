import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClientDetailClient } from "./client-detail-client";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const client = await prisma.client.findFirst({
    where: { id, userId: user.id },
    include: {
      projects: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) notFound();

  return <ClientDetailClient client={client} projects={client.projects} />;
}

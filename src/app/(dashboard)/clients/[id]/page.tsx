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
      contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      projects: { orderBy: { createdAt: "desc" } },
      invoices: { select: { total: true, status: true } },
    },
  });

  if (!client) notFound();

  const totalInvoiced = client.invoices
    .filter((inv) => inv.status !== "DRAFT")
    .reduce((sum, inv) => sum + inv.total, 0);

  const outstandingAmount = client.invoices
    .filter((inv) => ["SENT", "VIEWED", "OVERDUE"].includes(inv.status))
    .reduce((sum, inv) => sum + inv.total, 0);

  const paidAmount = client.invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.total, 0);

  return (
    <ClientDetailClient
      client={client}
      contacts={client.contacts}
      projects={client.projects}
      invoiceStats={{ totalInvoiced, outstandingAmount, paidAmount }}
    />
  );
}

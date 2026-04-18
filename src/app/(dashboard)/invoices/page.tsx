import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InvoicesListClient } from "./invoices-list-client";

export default async function InvoicesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [invoices, clients, projects] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId: user.id },
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, company: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: { userId: user.id, status: { in: ["ACTIVE", "ON_HOLD"] } },
      select: { id: true, name: true, clientId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <InvoicesListClient invoices={invoices} clients={clients} projects={projects} />
  );
}

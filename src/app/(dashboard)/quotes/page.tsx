import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuotesListClient } from "./quotes-list-client";

export default async function QuotesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [quotes, leads, clients] = await Promise.all([
    prisma.quote.findMany({
      where: { userId: user.id },
      include: {
        lead: { select: { id: true, name: true, company: true } },
        client: { select: { id: true, name: true, company: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lead.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      select: { id: true, name: true, company: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, company: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const publicBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://itsfriday.dev";

  return (
    <QuotesListClient
      quotes={quotes}
      leads={leads}
      clients={clients}
      publicBaseUrl={publicBaseUrl}
    />
  );
}

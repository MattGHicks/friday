import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { CalendarClient } from "./calendar-client";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { month } = await searchParams;

  // Parse month param (YYYY-MM) or default to current month
  let year: number;
  let monthIndex: number;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    year = y;
    monthIndex = m - 1; // 0-indexed
  } else {
    const now = new Date();
    year = now.getFullYear();
    monthIndex = now.getMonth();
  }

  const initialMonth = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  // Fetch meetings in ±2 month window so prev/next nav is instant
  const windowStart = startOfMonth(subMonths(new Date(year, monthIndex, 1), 2));
  const windowEnd = endOfMonth(addMonths(new Date(year, monthIndex, 1), 2));

  const [meetings, clients, projects] = await Promise.all([
    prisma.meeting.findMany({
      where: {
        userId: user.id,
        startTime: { gte: windowStart, lte: windowEnd },
      },
      include: {
        client: { select: { name: true, company: true } },
        project: { select: { name: true } },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.client.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, company: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, clientId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <CalendarClient
      meetings={meetings}
      clients={clients}
      projects={projects}
      initialMonth={initialMonth}
    />
  );
}

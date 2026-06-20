import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function esc(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function fmtIcsUtc(dt: Date): string {
  return dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { calendarFeedToken: token },
    select: { id: true, name: true },
  });
  if (!user) {
    return new NextResponse("Invalid token", { status: 404 });
  }

  const meetings = await prisma.meeting.findMany({
    where: { userId: user.id },
    include: {
      client: { select: { name: true, company: true } },
      project: { select: { name: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const now = fmtIcsUtc(new Date());
  const calName = user.name ? `${user.name} — Friday` : "Friday";

  const events = meetings
    .map((m) => {
      const lines = [
        "BEGIN:VEVENT",
        `UID:${m.id}@itsfriday.dev`,
        `DTSTAMP:${now}`,
        `DTSTART:${fmtIcsUtc(m.startTime)}`,
        `DTEND:${fmtIcsUtc(m.endTime)}`,
        `SUMMARY:${esc(m.title)}`,
      ];
      const descLines: string[] = [];
      if (m.description) descLines.push(m.description);
      if (m.notes) descLines.push(m.notes);
      if (m.client) {
        const clientLabel = m.client.company
          ? `${m.client.name} · ${m.client.company}`
          : m.client.name;
        descLines.push(`Client: ${clientLabel}`);
      }
      if (m.project) descLines.push(`Project: ${m.project.name}`);
      if (descLines.length > 0) {
        lines.push(`DESCRIPTION:${esc(descLines.join("\n"))}`);
      }
      if (m.location) lines.push(`LOCATION:${esc(m.location)}`);
      lines.push("END:VEVENT");
      return lines.join("\r\n");
    })
    .join("\r\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Friday//Calendar Feed//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(calName)}`,
    events,
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}

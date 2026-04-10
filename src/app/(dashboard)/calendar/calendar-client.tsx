"use client";

import { useState, useCallback } from "react";
import {
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MeetingFormSheet } from "@/components/dashboard/meeting-form";
import { MEETING_TYPE_CONFIG } from "@/components/dashboard/meeting-type-config";

export type MeetingWithRelations = {
  id: string;
  title: string;
  type: string;
  startTime: Date | string;
  endTime: Date | string;
  location: string | null;
  notes: string | null;
  description: string | null;
  clientId: string | null;
  projectId: string | null;
  client: { name: string; company: string | null } | null;
  project: { name: string } | null;
};

interface CalendarClientProps {
  meetings: MeetingWithRelations[];
  clients: { id: string; name: string; company: string | null }[];
  projects: { id: string; name: string; clientId: string }[];
  initialMonth: string; // "YYYY-MM"
}

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getCalendarCells(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Date[] = [];

  // Fill previous month's trailing days
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push(new Date(year, month, -i));
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }
  // Next month overflow to fill 42 cells (6 rows)
  let next = 1;
  while (cells.length < 42) {
    cells.push(new Date(year, month + 1, next++));
  }
  return cells;
}

function formatTime(dt: Date | string): string {
  const d = dt instanceof Date ? dt : new Date(dt);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  const hh = h % 12 || 12;
  return m === 0 ? `${hh}${ampm}` : `${hh}:${String(m).padStart(2, "0")}${ampm}`;
}

function toDateString(dt: Date | string): string {
  const d = dt instanceof Date ? dt : new Date(dt);
  return d.toISOString().split("T")[0];
}

export function CalendarClient({
  meetings,
  clients,
  projects,
  initialMonth,
}: CalendarClientProps) {
  // Parse initial month from prop
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const [y, mo] = initialMonth.split("-").map(Number);
    return new Date(y, mo - 1, 1);
  });

  const year = currentMonthDate.getFullYear();
  const monthIndex = currentMonthDate.getMonth();
  const cells = getCalendarCells(year, monthIndex);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingWithRelations | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>("");

  // Selected day for detail panel
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  function navigate(delta: number) {
    setCurrentMonthDate((prev) =>
      delta > 0 ? addMonths(prev, 1) : subMonths(prev, 1)
    );
    setSelectedDay(null);
  }

  function goToToday() {
    const now = new Date();
    setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(null);
  }

  function openNewMeeting(date?: Date) {
    setEditingMeeting(null);
    if (date) {
      setDefaultDate(toDateString(date));
    } else {
      setDefaultDate(toDateString(new Date()));
    }
    setSheetOpen(true);
  }

  function openEditMeeting(meeting: MeetingWithRelations) {
    setEditingMeeting(meeting);
    setDefaultDate("");
    setSheetOpen(true);
  }

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setEditingMeeting(null);
    }
  }, []);

  // Build a map: dateString -> meetings[]
  const meetingsByDay = new Map<string, MeetingWithRelations[]>();
  for (const m of meetings) {
    const key = toDateString(m.startTime);
    if (!meetingsByDay.has(key)) meetingsByDay.set(key, []);
    meetingsByDay.get(key)!.push(m);
  }

  const selectedDayMeetings = selectedDay
    ? (meetingsByDay.get(toDateString(selectedDay)) ?? [])
    : [];

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-cream">
            {format(currentMonthDate, "MMMM yyyy")}
          </h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-cream/50 hover:text-cream hover:bg-surface-3"
              onClick={() => navigate(-1)}
              title="Previous month"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-cream/50 hover:text-cream hover:bg-surface-3"
              onClick={() => navigate(1)}
              title="Next month"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-cream/50 hover:text-cream hover:bg-surface-3"
            onClick={goToToday}
          >
            Today
          </Button>
        </div>

        <Button
          size="sm"
          onClick={() => openNewMeeting()}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          New meeting
        </Button>
      </div>

      <div className="flex gap-6 items-start">
        {/* ── Calendar grid ──────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map((day, i) => (
              <div
                key={day}
                className={cn(
                  "py-2 text-center text-[11px] font-mono font-semibold uppercase tracking-wider",
                  i === 0 || i === 6 ? "text-cream/25" : "text-cream/35"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid cells */}
          <div className="grid grid-cols-7 border-l border-t border-white/[0.04] rounded-xl overflow-hidden">
            {cells.map((cell, idx) => {
              const isCurrentMonth = isSameMonth(cell, currentMonthDate);
              const isWeekend = idx % 7 === 0 || idx % 7 === 6;
              const todayCell = isToday(cell);
              const isSelected = selectedDay ? isSameDay(cell, selectedDay) : false;
              const dateKey = toDateString(cell);
              const dayMeetings = meetingsByDay.get(dateKey) ?? [];
              const visibleMeetings = dayMeetings.slice(0, 3);
              const overflowCount = dayMeetings.length - visibleMeetings.length;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDay(cell);
                    if (isCurrentMonth) openNewMeeting(cell);
                  }}
                  className={cn(
                    "relative border-r border-b border-white/[0.04] p-1.5 min-h-[100px] cursor-pointer transition-colors group",
                    isWeekend && "bg-white/[0.015]",
                    todayCell && "bg-fire/[0.04]",
                    isSelected && !todayCell && "bg-white/[0.03]",
                    "hover:bg-surface-3/60"
                  )}
                >
                  {/* Date number */}
                  <div className="flex justify-end mb-1">
                    {todayCell ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-brand text-[11px] font-bold text-white">
                        {cell.getDate()}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium transition-colors",
                          isCurrentMonth
                            ? "text-cream/60 group-hover:text-cream"
                            : "text-cream/20"
                        )}
                      >
                        {cell.getDate()}
                      </span>
                    )}
                  </div>

                  {/* Meeting pills — only for current month */}
                  {isCurrentMonth && (
                    <div className="flex flex-col gap-0.5">
                      {visibleMeetings.map((mtg) => {
                        const cfg = MEETING_TYPE_CONFIG[mtg.type as keyof typeof MEETING_TYPE_CONFIG] ?? MEETING_TYPE_CONFIG.GENERAL;
                        return (
                          <button
                            key={mtg.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditMeeting(mtg);
                            }}
                            className={cn(
                              "group/pill flex w-full items-center gap-1 rounded-md border px-1.5 py-0.5 text-left text-[10px] leading-tight transition-all hover:brightness-110",
                              cfg.bg,
                              cfg.border
                            )}
                          >
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ background: cfg.color }}
                            />
                            <span className={cn("flex-1 truncate font-medium", cfg.text)}>
                              {formatTime(mtg.startTime)}{" "}
                              <span className="font-normal opacity-80">{mtg.title}</span>
                            </span>
                          </button>
                        );
                      })}
                      {overflowCount > 0 && (
                        <span className="px-1.5 text-[10px] text-cream/30">
                          +{overflowCount} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Side panel — selected day detail ─────────────────── */}
        {selectedDay && (
          <div className="w-64 shrink-0 rounded-xl border border-white/[0.06] bg-surface-2 p-4 animate-fade-in-scale">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-cream/35">
                  {format(selectedDay, "EEEE")}
                </div>
                <div className="font-display text-lg font-bold text-cream">
                  {format(selectedDay, "MMMM d")}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-cream/40 hover:text-cream hover:bg-surface-3"
                onClick={() => {
                  openNewMeeting(selectedDay);
                }}
                title="New meeting on this day"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              </Button>
            </div>

            {selectedDayMeetings.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CalendarDays
                  className="mb-2 h-8 w-8 text-cream/15"
                  strokeWidth={1.25}
                />
                <p className="text-xs text-cream/30">No meetings</p>
                <button
                  type="button"
                  onClick={() => openNewMeeting(selectedDay)}
                  className="mt-2 text-xs text-cream/40 underline underline-offset-2 hover:text-cream/60 transition-colors"
                >
                  Schedule one
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDayMeetings.map((mtg) => {
                  const cfg = MEETING_TYPE_CONFIG[mtg.type as keyof typeof MEETING_TYPE_CONFIG] ?? MEETING_TYPE_CONFIG.GENERAL;
                  return (
                    <button
                      key={mtg.id}
                      type="button"
                      onClick={() => openEditMeeting(mtg)}
                      className={cn(
                        "w-full rounded-lg border p-3 text-left transition-all hover:brightness-110",
                        cfg.bg,
                        cfg.border
                      )}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: cfg.color }}
                        />
                        <span className={cn("text-[10px] font-semibold uppercase tracking-wider", cfg.text)}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-cream leading-tight mb-1.5">
                        {mtg.title}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-cream/50">
                        <Clock className="h-2.5 w-2.5" strokeWidth={1.5} />
                        {formatTime(mtg.startTime)} – {formatTime(mtg.endTime)}
                      </div>
                      {mtg.location && (
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-cream/40 truncate">
                          <MapPin className="h-2.5 w-2.5 shrink-0" strokeWidth={1.5} />
                          {mtg.location}
                        </div>
                      )}
                      {mtg.client && (
                        <div className="mt-1 text-[10px] text-cream/40 truncate">
                          {mtg.client.name}
                          {mtg.client.company ? ` · ${mtg.client.company}` : ""}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Meeting form sheet ──────────────────────────────────── */}
      <MeetingFormSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        meeting={editingMeeting}
        clients={clients}
        projects={projects}
        defaultDate={defaultDate}
      />
    </div>
  );
}

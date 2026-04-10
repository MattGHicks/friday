"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createMeeting,
  updateMeeting,
  deleteMeeting,
  type MeetingFormState,
} from "@/app/(dashboard)/calendar/meeting-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Trash2 } from "lucide-react";
import { MeetingType } from "@/generated/prisma/client";
import { MEETING_TYPE_CONFIG } from "./meeting-type-config";
import { cn } from "@/lib/utils";

export type MeetingRecord = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  startTime: Date | string;
  endTime: Date | string;
  clientId: string | null;
  projectId: string | null;
  location: string | null;
  notes: string | null;
};

interface MeetingFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: MeetingRecord | null;
  clients: { id: string; name: string; company: string | null }[];
  projects: { id: string; name: string; clientId: string }[];
  /** YYYY-MM-DD — pre-fills the date for new meetings */
  defaultDate?: string;
}

const SELECT_CLASS =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm text-foreground transition-colors outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

function toDateString(dt: Date | string): string {
  const d = typeof dt === "string" ? new Date(dt) : dt;
  return d.toISOString().split("T")[0];
}

function toTimeString(dt: Date | string): string {
  const d = typeof dt === "string" ? new Date(dt) : dt;
  return d.toTimeString().slice(0, 5); // "HH:MM"
}

function combineDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}`).toISOString();
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending
        ? isEdit
          ? "Saving..."
          : "Scheduling..."
        : isEdit
          ? "Save changes"
          : "Schedule meeting"}
    </Button>
  );
}

export function MeetingFormSheet({
  open,
  onOpenChange,
  meeting,
  clients,
  projects,
  defaultDate,
}: MeetingFormSheetProps) {
  const isEdit = !!meeting;
  const action = isEdit ? updateMeeting : createMeeting;

  const [state, formAction] = useActionState<MeetingFormState, FormData>(
    action,
    {}
  );

  const [meetingType, setMeetingType] = useState<MeetingType>(
    (meeting?.type as MeetingType) ?? "GENERAL"
  );
  const [selectedClientId, setSelectedClientId] = useState<string>(
    meeting?.clientId ?? ""
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    meeting?.projectId ?? ""
  );
  const [date, setDate] = useState<string>(
    meeting?.startTime
      ? toDateString(meeting.startTime)
      : (defaultDate ?? "")
  );
  const [startTime, setStartTime] = useState<string>(
    meeting?.startTime ? toTimeString(meeting.startTime) : "10:00"
  );
  const [endTime, setEndTime] = useState<string>(
    meeting?.endTime ? toTimeString(meeting.endTime) : "11:00"
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset all fields when the meeting prop changes
  useEffect(() => {
    setMeetingType((meeting?.type as MeetingType) ?? "GENERAL");
    setSelectedClientId(meeting?.clientId ?? "");
    setSelectedProjectId(meeting?.projectId ?? "");
    setDate(
      meeting?.startTime
        ? toDateString(meeting.startTime)
        : (defaultDate ?? "")
    );
    setStartTime(meeting?.startTime ? toTimeString(meeting.startTime) : "10:00");
    setEndTime(meeting?.endTime ? toTimeString(meeting.endTime) : "11:00");
  }, [meeting, defaultDate]);

  // Close on success
  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state.success, onOpenChange]);

  // Projects filtered to the selected client
  const filteredProjects = selectedClientId
    ? projects.filter((p) => p.clientId === selectedClientId)
    : projects;

  function handleClientChange(newClientId: string) {
    setSelectedClientId(newClientId);
    setSelectedProjectId((prev) => {
      const stillValid = projects.some(
        (p) => p.id === prev && p.clientId === newClientId
      );
      return stillValid ? prev : "";
    });
  }

  function handleSubmit(formData: FormData) {
    if (date && startTime) {
      formData.set("startTime", combineDateTime(date, startTime));
    }
    if (date && endTime) {
      formData.set("endTime", combineDateTime(date, endTime));
    }
    formAction(formData);
  }

  async function handleDelete() {
    if (!meeting) return;
    setIsDeleting(true);
    try {
      await deleteMeeting(meeting.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display">
            {isEdit ? "Edit meeting" : "New meeting"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update this meeting's details."
              : "Schedule a meeting with a client or for a project."}
          </SheetDescription>
        </SheetHeader>

        <form
          key={meeting?.id ?? "new"}
          action={handleSubmit}
          className="mt-6 space-y-5"
        >
          {isEdit && (
            <input type="hidden" name="meetingId" value={meeting.id} />
          )}
          <input type="hidden" name="type" value={meetingType} />
          <input type="hidden" name="clientId" value={selectedClientId} />
          <input type="hidden" name="projectId" value={selectedProjectId} />

          {state.error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="meeting-title">Title</Label>
            <Input
              id="meeting-title"
              name="title"
              placeholder="Q2 kickoff call"
              required
              defaultValue={meeting?.title ?? ""}
            />
          </div>

          {/* Type pills */}
          <div className="space-y-2">
            <Label>Meeting type</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(MEETING_TYPE_CONFIG) as MeetingType[]).map((t) => {
                const cfg = MEETING_TYPE_CONFIG[t];
                const isSelected = meetingType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setMeetingType(t)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-medium transition-all",
                      isSelected
                        ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                        : "border-white/[0.07] bg-surface-3 text-cream/50 hover:border-white/[0.12] hover:text-cream/70"
                    )}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="meeting-date">Date</Label>
            <Input
              id="meeting-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="[color-scheme:dark]"
            />
          </div>

          {/* Start / End time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="meeting-start">Start time</Label>
              <Input
                id="meeting-start"
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="[color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-end">End time</Label>
              <Input
                id="meeting-end"
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="[color-scheme:dark]"
              />
            </div>
          </div>

          {/* Client */}
          <div className="space-y-2">
            <Label htmlFor="meeting-client">
              Client{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <select
              id="meeting-client"
              value={selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="" className="bg-popover">
                No client
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id} className="bg-popover">
                  {c.name}
                  {c.company ? ` — ${c.company}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Project — filtered by selected client */}
          <div className="space-y-2">
            <Label htmlFor="meeting-project">
              Project{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <select
              id="meeting-project"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className={SELECT_CLASS}
              disabled={filteredProjects.length === 0}
            >
              <option value="" className="bg-popover">
                No project
              </option>
              {filteredProjects.map((p) => (
                <option key={p.id} value={p.id} className="bg-popover">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="meeting-location">
              Location{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="meeting-location"
              name="location"
              placeholder="Zoom link, office address…"
              defaultValue={meeting?.location ?? ""}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="meeting-description">
              Description{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="meeting-description"
              name="description"
              placeholder="Agenda, context, or goals…"
              rows={2}
              defaultValue={meeting?.description ?? ""}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="meeting-notes">
              Notes{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="meeting-notes"
              name="notes"
              placeholder="Talking points, action items…"
              rows={3}
              defaultValue={meeting?.notes ?? ""}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {isEdit && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={isDeleting}
                title="Delete meeting"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <div className="flex-1">
              <SubmitButton isEdit={isEdit} />
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

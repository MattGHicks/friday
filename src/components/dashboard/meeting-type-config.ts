import { MeetingType } from "@/generated/prisma/client";

export const MEETING_TYPE_CONFIG: Record<
  MeetingType,
  { label: string; color: string; bg: string; border: string; text: string }
> = {
  DISCOVERY:    { label: "Discovery",    color: "#F0A830", bg: "bg-gold/15",        border: "border-gold/25",       text: "text-gold" },
  KICKOFF:      { label: "Kickoff",      color: "#E55A3A", bg: "bg-fire/15",        border: "border-fire/25",       text: "text-fire" },
  CHECK_IN:     { label: "Check-in",     color: "#5A8A6A", bg: "bg-sage/15",        border: "border-sage/25",       text: "text-sage" },
  REVIEW:       { label: "Review",       color: "#F5EDD0", bg: "bg-cream/10",       border: "border-cream/20",      text: "text-cream/70" },
  PRESENTATION: { label: "Presentation", color: "#A78BFA", bg: "bg-purple-400/15",  border: "border-purple-400/25", text: "text-purple-400" },
  GENERAL:      { label: "General",      color: "#888888", bg: "bg-white/[0.06]",   border: "border-white/10",      text: "text-cream/40" },
} as const;

"use client";

import { useState } from "react";
import { Sparkles, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { QuoteEditorDialog, type QuoteEditorTarget } from "./quote-editor";

type LeadOption = { id: string; name: string; company: string | null; email: string | null };
type ClientOption = { id: string; name: string; company: string | null; email: string };

export function NewQuoteDialog({
  open,
  onOpenChange,
  leads,
  clients,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leads: LeadOption[];
  clients: ClientOption[];
}) {
  const [mode, setMode] = useState<"lead" | "client">(
    leads.length > 0 ? "lead" : "client"
  );
  const [selectedId, setSelectedId] = useState<string>("");
  const [target, setTarget] = useState<QuoteEditorTarget | null>(null);

  function reset() {
    setSelectedId("");
    setTarget(null);
  }

  function handleContinue() {
    if (!selectedId) return;
    const next: QuoteEditorTarget =
      mode === "lead"
        ? { kind: "lead", leadId: selectedId }
        : { kind: "client", clientId: selectedId };
    setTarget(next);
    onOpenChange(false);
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) reset();
          onOpenChange(v);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New quote</DialogTitle>
            <DialogDescription>
              Quote a new lead to win the work, or quote an existing client for
              follow-on work.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode("lead");
                  setSelectedId("");
                }}
                disabled={leads.length === 0}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                  mode === "lead"
                    ? "border-fire/40 bg-fire/5"
                    : "border-white/[0.06] bg-surface-2 hover:border-white/15",
                  leads.length === 0 && "opacity-40 cursor-not-allowed"
                )}
              >
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-cream">
                  <Sparkles className="h-3.5 w-3.5 text-fire" strokeWidth={2} />
                  Lead
                </div>
                <p className="text-[11px] text-cream/40">
                  New prospect, not yet a client
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("client");
                  setSelectedId("");
                }}
                disabled={clients.length === 0}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                  mode === "client"
                    ? "border-fire/40 bg-fire/5"
                    : "border-white/[0.06] bg-surface-2 hover:border-white/15",
                  clients.length === 0 && "opacity-40 cursor-not-allowed"
                )}
              >
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-cream">
                  <Users className="h-3.5 w-3.5 text-fire" strokeWidth={2} />
                  Existing client
                </div>
                <p className="text-[11px] text-cream/40">Follow-on work</p>
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-cream/60">
                {mode === "lead" ? "Select a lead" : "Select a client"}
              </label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              >
                <option value="" className="bg-popover">
                  — Choose {mode === "lead" ? "a lead" : "a client"} —
                </option>
                {(mode === "lead" ? leads : clients).map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-popover">
                    {opt.company ? `${opt.name} · ${opt.company}` : opt.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-md px-3 py-2 text-sm text-cream/60 hover:text-cream transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!selectedId}
                className="inline-flex items-center gap-1 rounded-md bg-fire px-3 py-2 text-sm font-medium text-white hover:bg-fire/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {target && (
        <QuoteEditorDialog
          open={Boolean(target)}
          onOpenChange={(v) => {
            if (!v) {
              setTarget(null);
              reset();
            }
          }}
          target={target}
        />
      )}
    </>
  );
}

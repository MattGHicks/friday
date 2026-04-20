"use client";

import { useState } from "react";
import { Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FormPanel,
  FormPanelBody,
  FormPanelContent,
  FormPanelFooter,
  FormPanelHeader,
} from "@/components/ui/form-panel";
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
      <FormPanel
        open={open}
        onOpenChange={(v) => {
          if (!v) reset();
          onOpenChange(v);
        }}
      >
        <FormPanelContent size="md">
          <FormPanelHeader
            title="New quote"
            description="Quote a new lead to win the work, or quote an existing client for follow-on work."
          />
          <FormPanelBody>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                  <div className="inline-flex items-center gap-1.5 text-sm font-medium text-cream">
                    <Sparkles className="h-4 w-4 text-fire" strokeWidth={2} />
                    Lead
                  </div>
                  <p className="text-xs text-cream/50">
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
                  <div className="inline-flex items-center gap-1.5 text-sm font-medium text-cream">
                    <Users className="h-4 w-4 text-fire" strokeWidth={2} />
                    Existing client
                  </div>
                  <p className="text-xs text-cream/50">Follow-on work</p>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-cream/70">
                  {mode === "lead" ? "Select a lead" : "Select a client"}
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-white/10 bg-transparent px-3 text-sm text-cream outline-none focus:border-fire/50 focus:ring-2 focus:ring-fire/20"
                >
                  <option value="" className="bg-surface-2">
                    — Choose {mode === "lead" ? "a lead" : "a client"} —
                  </option>
                  {(mode === "lead" ? leads : clients).map((opt) => (
                    <option key={opt.id} value={opt.id} className="bg-surface-2">
                      {opt.company ? `${opt.name} · ${opt.company}` : opt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </FormPanelBody>
          <FormPanelFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleContinue} disabled={!selectedId}>
              Continue
            </Button>
          </FormPanelFooter>
        </FormPanelContent>
      </FormPanel>

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

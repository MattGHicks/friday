"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Sparkles,
  ArrowRight,
  Mail,
  Phone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LeadFormSheet } from "./lead-form";
import type { Lead, PipelineStage } from "@/generated/prisma/client";

type LeadWithStage = Lead & {
  pipelineStage: Pick<PipelineStage, "id" | "name" | "color"> | null;
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:   "text-gold border-gold/30 bg-gold/10",
  WON:      "text-sage border-sage/30 bg-sage/10",
  LOST:     "text-cream/40 border-white/10 bg-white/[0.03]",
  ARCHIVED: "text-cream/25 border-white/[0.06] bg-white/[0.02]",
};

function FilterPill({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-white/[0.08] bg-surface-2 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
            value === opt.value
              ? "bg-white/[0.08] text-cream"
              : "text-cream/40 hover:text-cream/70"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function LeadsListClient({
  leads,
  stages,
}: {
  leads: LeadWithStage[];
  stages: Pick<PipelineStage, "id" | "name">[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "all" | "archived">("active");
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return leads.filter((lead) => {
      if (q) {
        const hay = [lead.name, lead.company, lead.email, lead.source]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter === "active" && lead.status !== "ACTIVE") return false;
      if (statusFilter === "archived" && lead.status !== "ARCHIVED" && lead.status !== "LOST")
        return false;
      return true;
    });
  }, [leads, search, statusFilter]);

  const hasFilters = search || statusFilter !== "active";

  function clearFilters() {
    setSearch("");
    setStatusFilter("active");
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-cream">
            Leads
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {filtered.length} of {leads.length}{" "}
            {leads.length === 1 ? "lead" : "leads"}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          New lead
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cream/25 pointer-events-none"
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder="Search leads…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-surface-2 pl-9 pr-3 py-2 text-sm text-cream placeholder:text-cream/25 focus:outline-none focus:border-fire/40 transition-colors"
          />
        </div>
        <FilterPill
          options={[
            { value: "active", label: "Active" },
            { value: "all", label: "All" },
            { value: "archived", label: "Archived" },
          ]}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as "active" | "all" | "archived")}
        />
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs text-cream/40 hover:text-cream/70 transition-colors"
          >
            <X className="w-3 h-3" strokeWidth={2} />
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-surface-2 py-16 flex flex-col items-center text-center">
          <Sparkles className="h-8 w-8 text-cream/15 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-cream/40">
            {hasFilters ? "No leads match your filters." : "No leads yet."}
          </p>
          {!hasFilters && (
            <button
              onClick={() => setFormOpen(true)}
              className="mt-3 text-xs text-fire hover:text-gold transition-colors"
            >
              Add your first lead →
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-surface-2 overflow-hidden">
          {filtered.map((lead, i) => {
            const isLast = i === filtered.length - 1;
            return (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className={cn(
                  "flex items-center gap-4 px-5 py-3.5 hover:bg-surface-3 transition-colors group",
                  !isLast && "border-b border-white/[0.04]"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-cream group-hover:text-gold transition-colors truncate leading-snug">
                    {lead.name}
                    {lead.company && (
                      <span className="ml-2 text-cream/40 font-normal">
                        — {lead.company}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-cream/40 mt-0.5">
                    {lead.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3 h-3" strokeWidth={1.5} />
                        <span className="truncate max-w-[180px]">
                          {lead.email}
                        </span>
                      </span>
                    )}
                    {lead.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3" strokeWidth={1.5} />
                        {lead.phone}
                      </span>
                    )}
                    {lead.source && (
                      <span className="italic text-cream/30">via {lead.source}</span>
                    )}
                  </div>
                </div>

                {lead.pipelineStage && (
                  <div className="hidden sm:flex items-center gap-1.5 w-[120px] shrink-0">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: lead.pipelineStage.color }}
                    />
                    <span className="text-xs text-cream/50 truncate">
                      {lead.pipelineStage.name}
                    </span>
                  </div>
                )}

                <span
                  className={cn(
                    "hidden md:inline-flex text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border w-[72px] justify-center shrink-0",
                    STATUS_STYLES[lead.status]
                  )}
                >
                  {lead.status.toLowerCase()}
                </span>

                <ArrowRight
                  className="w-3.5 h-3.5 text-cream/15 group-hover:text-cream/40 transition-colors shrink-0"
                  strokeWidth={1.5}
                />
              </Link>
            );
          })}
        </div>
      )}

      <LeadFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        lead={null}
        stages={stages}
      />
    </div>
  );
}

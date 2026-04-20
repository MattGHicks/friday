"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  Calendar,
  FileText,
  Receipt,
  Plus,
  FolderKanban,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectFormSheet } from "@/components/dashboard/project-form";
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import type { Project, Client } from "@/generated/prisma/client";

type ProjectWithExtras = Project & {
  client: Pick<Client, "id" | "name" | "company">;
  _count: { invoices: number; files: number };
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:    "text-sage border-sage/30 bg-sage/10",
  ON_HOLD:   "text-gold border-gold/30 bg-gold/10",
  COMPLETED: "text-cream/50 border-white/15 bg-white/[0.04]",
  ARCHIVED:  "text-cream/25 border-white/[0.06] bg-white/[0.02]",
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
            "px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150",
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

export function ProjectsListClient({
  projects: initialProjects,
  clients,
}: {
  projects: ProjectWithExtras[];
  clients: Pick<Client, "id" | "name">[];
}) {
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState<"active" | "all" | "archived">("active");
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return initialProjects.filter((p) => {
      if (q) {
        const nameMatch   = p.name.toLowerCase().includes(q);
        const clientMatch = (p.client.company ?? p.client.name).toLowerCase().includes(q);
        if (!nameMatch && !clientMatch) return false;
      }
      if (showFilter === "active"   && (p.status === "ARCHIVED" || p.status === "COMPLETED")) return false;
      if (showFilter === "archived" && p.status !== "ARCHIVED") return false;
      return true;
    });
  }, [initialProjects, search, showFilter]);

  const hasFilters = search || showFilter !== "active";

  function clearFilters() {
    setSearch("");
    setShowFilter("active");
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-cream">
            Projects
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {filtered.length} of {initialProjects.length}{" "}
            {initialProjects.length === 1 ? "project" : "projects"}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          New project
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
            placeholder="Search projects or clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-surface-2 pl-9 pr-3 py-2 text-sm text-cream placeholder:text-cream/25 focus:outline-none focus:border-fire/40 transition-colors"
          />
        </div>

        <FilterPill
          options={[
            { value: "active",   label: "Active" },
            { value: "all",      label: "All" },
            { value: "archived", label: "Archived" },
          ]}
          value={showFilter}
          onChange={(v) => setShowFilter(v as "active" | "all" | "archived")}
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
          <FolderKanban
            className="h-8 w-8 text-cream/15 mb-3"
            strokeWidth={1.5}
          />
          <p className="text-sm text-cream/40">
            {hasFilters
              ? "No projects match your filters."
              : "No projects yet."}
          </p>
          {!hasFilters && (
            <button
              onClick={() => setFormOpen(true)}
              className="mt-3 text-xs text-fire hover:text-gold transition-colors"
            >
              Create your first project →
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-surface-2 overflow-hidden">
          {filtered.map((project, i) => {
            const isLast = i === filtered.length - 1;
            const overdue =
              project.dueDate &&
              isPast(new Date(project.dueDate)) &&
              project.status !== "COMPLETED" &&
              project.status !== "ARCHIVED";

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={cn(
                  "flex items-center gap-4 px-5 py-3.5 hover:bg-surface-3 transition-colors group",
                  !isLast && "border-b border-white/[0.04]"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-cream group-hover:text-gold transition-colors truncate leading-snug">
                    {project.name}
                  </div>
                  <div className="text-[11px] text-cream/40 truncate mt-0.5">
                    {project.client.company || project.client.name}
                  </div>
                </div>

                <span
                  className={cn(
                    "hidden md:inline-flex text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border w-[90px] justify-center shrink-0",
                    STATUS_STYLES[project.status]
                  )}
                >
                  {STATUS_LABELS[project.status]}
                </span>

                <div className="hidden lg:flex items-center gap-1 w-[70px] shrink-0">
                  {project.dueDate ? (
                    <>
                      <Calendar
                        className={cn(
                          "w-3 h-3 shrink-0",
                          overdue ? "text-fire" : "text-cream/30"
                        )}
                        strokeWidth={1.5}
                      />
                      <span
                        className={cn(
                          "text-xs",
                          overdue ? "text-fire" : "text-cream/40"
                        )}
                      >
                        {format(new Date(project.dueDate), "MMM d")}
                      </span>
                    </>
                  ) : null}
                </div>

                <div className="hidden md:flex items-center gap-3 text-cream/25 w-[50px] shrink-0">
                  {project._count.files > 0 && (
                    <span className="flex items-center gap-0.5 text-xs">
                      <FileText className="w-3 h-3" strokeWidth={1.5} />
                      {project._count.files}
                    </span>
                  )}
                  {project._count.invoices > 0 && (
                    <span className="flex items-center gap-0.5 text-xs">
                      <Receipt className="w-3 h-3" strokeWidth={1.5} />
                      {project._count.invoices}
                    </span>
                  )}
                </div>

                <ArrowRight
                  className="w-3.5 h-3.5 text-cream/15 group-hover:text-cream/40 transition-colors shrink-0"
                  strokeWidth={1.5}
                />
              </Link>
            );
          })}
        </div>
      )}

      <ProjectFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        project={null}
        clients={clients}
      />
    </div>
  );
}

"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Calendar,
  FileText,
  Receipt,
  Layers,
  Settings as SettingsIcon,
  FolderKanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectFormSheet } from "@/components/dashboard/project-form";
import { moveProjectToStage } from "@/app/(dashboard)/settings/pipeline-actions";
import type {
  PipelineStage,
  Project,
  Client,
} from "@/generated/prisma/client";
import { format, isPast } from "date-fns";

/* ── Types ─────────────────────────────────────────────────── */

type ProjectWithExtras = Project & {
  client: Pick<Client, "id" | "name" | "company">;
  _count: { invoices: number; files: number };
};

/* ── Sortable project card ─────────────────────────────────── */

function ProjectCard({ project }: { project: ProjectWithExtras }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: project.id,
    data: { project },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  const overdue = project.dueDate && isPast(new Date(project.dueDate));

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group cursor-grab active:cursor-grabbing rounded-lg border border-white/[0.06] bg-surface-2 p-3 transition-colors hover:border-white/[0.12] hover:bg-surface-3"
    >
      <Link
        href={`/projects/${project.id}`}
        onClick={(e) => e.stopPropagation()}
        className="block"
      >
        {/* Client */}
        <div className="text-[10px] font-mono uppercase tracking-wider text-cream/40 mb-1 truncate">
          {project.client.company || project.client.name}
        </div>
        {/* Title */}
        <div className="font-display font-semibold text-sm text-cream leading-tight mb-2 line-clamp-2 group-hover:text-gold transition-colors">
          {project.name}
        </div>
        {/* Description */}
        {project.description && (
          <p className="text-[11px] text-cream/40 line-clamp-2 mb-2.5 leading-snug">
            {project.description}
          </p>
        )}
        {/* Footer meta */}
        <div className="flex items-center justify-between text-[10px] text-cream/40">
          <div className="flex items-center gap-2">
            {project.dueDate && (
              <span
                className={`inline-flex items-center gap-1 ${
                  overdue ? "text-fire" : "text-cream/40"
                }`}
              >
                <Calendar className="w-3 h-3" strokeWidth={1.5} />
                {format(new Date(project.dueDate), "MMM d")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {project._count.files > 0 && (
              <span className="inline-flex items-center gap-1">
                <FileText className="w-3 h-3" strokeWidth={1.5} />
                {project._count.files}
              </span>
            )}
            {project._count.invoices > 0 && (
              <span className="inline-flex items-center gap-1">
                <Receipt className="w-3 h-3" strokeWidth={1.5} />
                {project._count.invoices}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ── Stage column (droppable) ──────────────────────────────── */

function StageColumn({
  stage,
  projects,
}: {
  stage: PipelineStage;
  projects: ProjectWithExtras[];
}) {
  return (
    <div className="flex flex-col w-[85vw] sm:w-60 shrink-0 h-full snap-start snap-always">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ background: stage.color }}
          />
          <span className="font-display font-semibold text-sm text-cream">
            {stage.name}
          </span>
          <span className="text-xs text-cream/30 font-mono">
            {projects.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <SortableContext
        items={projects.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className="flex-1 min-h-[120px] rounded-xl border border-white/[0.04] bg-surface-1/40 p-2 space-y-2"
          data-stage-id={stage.id}
        >
          {projects.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-[11px] text-cream/20 font-mono italic">
              Drop projects here
            </div>
          ) : (
            projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

/* ── Main pipeline component ───────────────────────────────── */

export function ProjectsPipelineClient({
  stages,
  projects: initialProjects,
  clients,
}: {
  stages: PipelineStage[];
  projects: ProjectWithExtras[];
  clients: Pick<Client, "id" | "name">[];
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [activeProject, setActiveProject] = useState<ProjectWithExtras | null>(
    null
  );
  const [formOpen, setFormOpen] = useState(false);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Group projects by stage
  const projectsByStage = useMemo(() => {
    const grouped = new Map<string, ProjectWithExtras[]>();
    stages.forEach((s) => grouped.set(s.id, []));
    projects.forEach((p) => {
      if (p.stageId && grouped.has(p.stageId)) {
        grouped.get(p.stageId)!.push(p);
      }
    });
    return grouped;
  }, [stages, projects]);

  function findStageOfProject(projectId: string): string | null {
    const project = projects.find((p) => p.id === projectId);
    return project?.stageId ?? null;
  }

  function handleDragStart(event: DragStartEvent) {
    const project = projects.find((p) => p.id === event.active.id);
    setActiveProject(project ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveProject(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the over container (stage)
    let targetStageId: string | null = null;
    let targetIndex = 0;

    // Case 1: dropped on another project (in some stage)
    const overProject = projects.find((p) => p.id === overId);
    if (overProject) {
      targetStageId = overProject.stageId;
      const stageProjects = projectsByStage.get(targetStageId!) ?? [];
      targetIndex = stageProjects.findIndex((p) => p.id === overId);
    } else {
      // Case 2: dropped on a stage column (empty area)
      const overStage = stages.find((s) => s.id === overId);
      if (overStage) {
        targetStageId = overStage.id;
        targetIndex = (projectsByStage.get(overStage.id) ?? []).length;
      }
    }

    if (!targetStageId) return;

    const sourceStageId = findStageOfProject(activeId);
    if (!sourceStageId) return;

    // Optimistic update
    const movedProject = projects.find((p) => p.id === activeId);
    if (!movedProject) return;

    let newProjects: ProjectWithExtras[];
    if (sourceStageId === targetStageId) {
      // Reorder within same stage
      const stageProjects = projectsByStage.get(targetStageId) ?? [];
      const oldIndex = stageProjects.findIndex((p) => p.id === activeId);
      const reordered = arrayMove(stageProjects, oldIndex, targetIndex);
      newProjects = projects.map((p) => {
        if (p.stageId !== targetStageId) return p;
        const newPos = reordered.findIndex((rp) => rp.id === p.id);
        return { ...p, stagePosition: newPos };
      });
    } else {
      // Move to different stage
      newProjects = projects.map((p) =>
        p.id === activeId
          ? { ...p, stageId: targetStageId!, stagePosition: targetIndex }
          : p
      );
    }

    setProjects(newProjects);

    startTransition(async () => {
      await moveProjectToStage(activeId, targetStageId!, targetIndex);
    });
  }

  return (
    <div className="flex flex-col flex-1 -mx-6 md:-mx-10 -my-8">
      {/* Header */}
      <div className="px-6 md:px-10 pt-8 pb-5 border-b border-white/[0.04]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Pipeline
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Drag projects between stages to update their status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
              title="Edit pipeline stages"
            >
              <SettingsIcon className="h-4 w-4" strokeWidth={1.5} />
            </Link>
            <Button onClick={() => setFormOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" strokeWidth={2} />
              New project
            </Button>
          </div>
        </div>
      </div>

      {/* Pipeline board */}
      {stages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6 md:px-10 py-12">
          <div className="text-center max-w-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-fire/10 mb-3">
              <Layers className="h-6 w-6 text-fire" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-lg font-semibold mb-1">
              No pipeline stages yet
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Set up your pipeline stages in Settings to start using the board.
            </p>
            <Link href="/settings">
              <Button size="sm">Go to settings</Button>
            </Link>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6 md:px-10 py-12">
          <div className="text-center max-w-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-fire/10 mb-3">
              <FolderKanban className="h-6 w-6 text-fire" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-lg font-semibold mb-1">
              No projects yet
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first project and start tracking it across your pipeline.
            </p>
            <Button size="sm" onClick={() => setFormOpen(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Create project
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 md:px-10 py-6 min-h-0 snap-x snap-mandatory scroll-smooth">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-3 h-full pb-4">
              {stages.map((stage) => (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  projects={projectsByStage.get(stage.id) ?? []}
                />
              ))}
            </div>

            <DragOverlay>
              {activeProject ? (
                <div className="rounded-lg border border-fire/30 bg-surface-3 p-3 shadow-2xl rotate-2 w-[280px]">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-cream/40 mb-1 truncate">
                    {activeProject.client.company || activeProject.client.name}
                  </div>
                  <div className="font-display font-semibold text-sm text-cream leading-tight">
                    {activeProject.name}
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
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

"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
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
  Mail,
  Phone,
  Layers,
  Settings as SettingsIcon,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadFormSheet } from "./lead-form";
import { PipelineStagesModal } from "./pipeline-stages-modal";
import { moveLeadToStage } from "./lead-actions";
import type { Lead, PipelineStage } from "@/generated/prisma/client";

type StageWithCount = PipelineStage & { _count: { leads: number } };

function LeadCard({ lead }: { lead: Lead }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, data: { lead } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group cursor-grab active:cursor-grabbing rounded-lg border border-white/[0.06] bg-surface-2 p-3 transition-colors hover:border-white/[0.12] hover:bg-surface-3"
    >
      <Link
        href={`/leads/${lead.id}`}
        onClick={(e) => e.stopPropagation()}
        className="block"
      >
        {lead.company && (
          <div className="text-[10px] font-mono uppercase tracking-wider text-cream/40 mb-1 truncate">
            {lead.company}
          </div>
        )}
        <div className="font-display font-semibold text-sm text-cream leading-tight mb-2 line-clamp-2 group-hover:text-gold transition-colors">
          {lead.name}
        </div>
        {lead.notes && (
          <p className="text-[11px] text-cream/40 line-clamp-2 mb-2.5 leading-snug">
            {lead.notes}
          </p>
        )}
        <div className="flex items-center justify-between text-[10px] text-cream/40">
          <div className="flex items-center gap-2">
            {lead.source && (
              <span className="italic text-cream/30">via {lead.source}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {lead.email && (
              <Mail className="w-3 h-3" strokeWidth={1.5} />
            )}
            {lead.phone && (
              <Phone className="w-3 h-3" strokeWidth={1.5} />
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

function StageColumn({
  stage,
  leads,
}: {
  stage: PipelineStage;
  leads: Lead[];
}) {
  // Register the whole column body as a droppable. Without this, dnd-kit
  // only tracks the individual lead cards as drop targets — so dropping
  // onto an *empty* column (or the padding around cards) does nothing
  // and the drag snaps back. With it, handleDragEnd sees `over.id === stage.id`
  // for those cases and moves the lead to the end of the stage.
  const { isOver, setNodeRef } = useDroppable({
    id: stage.id,
    data: { stageId: stage.id, type: "stage" },
  });

  return (
    <div className="flex flex-col w-[85vw] sm:w-60 shrink-0 h-full snap-start snap-always">
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
            {leads.length}
          </span>
        </div>
      </div>

      <SortableContext
        items={leads.map((l) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          data-stage-id={stage.id}
          className={`flex-1 min-h-[120px] rounded-xl border p-2 space-y-2 transition-colors ${
            isOver
              ? "border-fire/40 bg-fire/[0.04]"
              : "border-white/[0.04] bg-surface-1/40"
          }`}
        >
          {leads.length === 0 ? (
            <div
              className={`flex items-center justify-center h-24 text-[11px] font-mono italic transition-colors ${
                isOver ? "text-fire/70" : "text-cream/20"
              }`}
            >
              {isOver ? "Release to drop" : "Drop leads here"}
            </div>
          ) : (
            leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function LeadsPipelineClient({
  stages,
  leads: initialLeads,
}: {
  stages: StageWithCount[];
  leads: Lead[];
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [stagesModalOpen, setStagesModalOpen] = useState(false);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Collision strategy: prefer whatever the pointer is directly inside
  // (so hovering over a lead card picks that card, hovering over column
  // padding picks the column). Fall back to rectangle intersection if
  // the pointer is outside every droppable — prevents "no target" snap-backs
  // when the user's cursor strays a few pixels past a column edge.
  const collisionDetection: CollisionDetection = (args) => {
    const pointer = pointerWithin(args);
    if (pointer.length > 0) return pointer;
    return rectIntersection(args);
  };

  const leadsByStage = useMemo(() => {
    const grouped = new Map<string, Lead[]>();
    stages.forEach((s) => grouped.set(s.id, []));
    leads.forEach((l) => {
      if (l.pipelineStageId && grouped.has(l.pipelineStageId)) {
        grouped.get(l.pipelineStageId)!.push(l);
      }
    });
    return grouped;
  }, [stages, leads]);

  function findStageOfLead(leadId: string): string | null {
    const lead = leads.find((l) => l.id === leadId);
    return lead?.pipelineStageId ?? null;
  }

  function handleDragStart(event: DragStartEvent) {
    const lead = leads.find((l) => l.id === event.active.id);
    setActiveLead(lead ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveLead(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    let targetStageId: string | null = null;
    let targetIndex = 0;

    const overLead = leads.find((l) => l.id === overId);
    if (overLead) {
      targetStageId = overLead.pipelineStageId;
      const stageLeads = targetStageId
        ? (leadsByStage.get(targetStageId) ?? [])
        : [];
      targetIndex = stageLeads.findIndex((l) => l.id === overId);
    } else {
      const overStage = stages.find((s) => s.id === overId);
      if (overStage) {
        targetStageId = overStage.id;
        targetIndex = (leadsByStage.get(overStage.id) ?? []).length;
      }
    }

    if (!targetStageId) return;

    const sourceStageId = findStageOfLead(activeId);
    if (!sourceStageId) return;

    const movedLead = leads.find((l) => l.id === activeId);
    if (!movedLead) return;

    let newLeads: Lead[];
    if (sourceStageId === targetStageId) {
      const stageLeads = leadsByStage.get(targetStageId) ?? [];
      const oldIndex = stageLeads.findIndex((l) => l.id === activeId);
      const reordered = arrayMove(stageLeads, oldIndex, targetIndex);
      newLeads = leads.map((l) => {
        if (l.pipelineStageId !== targetStageId) return l;
        const newPos = reordered.findIndex((rl) => rl.id === l.id);
        return { ...l, stagePosition: newPos };
      });
    } else {
      newLeads = leads.map((l) =>
        l.id === activeId
          ? { ...l, pipelineStageId: targetStageId!, stagePosition: targetIndex }
          : l
      );
    }

    setLeads(newLeads);

    startTransition(async () => {
      await moveLeadToStage(activeId, targetStageId!, targetIndex);
    });
  }

  return (
    <div className="flex flex-col flex-1 -mx-6 md:-mx-10 -my-8">
      <div className="px-6 md:px-10 pt-8 pb-5 border-b border-white/[0.04]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Pipeline
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Drag leads between stages to track where they are in your sales process.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStagesModalOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
              title="Edit pipeline stages"
              aria-label="Edit pipeline stages"
            >
              <SettingsIcon className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <Button onClick={() => setFormOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" strokeWidth={2} />
              New lead
            </Button>
          </div>
        </div>
      </div>

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
              Set up your lead pipeline stages to start using the board.
            </p>
            <Button size="sm" onClick={() => setStagesModalOpen(true)}>
              Edit stages
            </Button>
          </div>
        </div>
      ) : leads.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6 md:px-10 py-12">
          <div className="text-center max-w-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-fire/10 mb-3">
              <Sparkles className="h-6 w-6 text-fire" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-lg font-semibold mb-1">
              No leads yet
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first lead and move them across stages as they warm up.
            </p>
            <Button size="sm" onClick={() => setFormOpen(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Add lead
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 md:px-10 py-6 min-h-0 snap-x snap-mandatory scroll-smooth">
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-3 h-full pb-4">
              {stages.map((stage) => (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  leads={leadsByStage.get(stage.id) ?? []}
                />
              ))}
            </div>

            <DragOverlay>
              {activeLead ? (
                <div className="rounded-lg border border-fire/30 bg-surface-3 p-3 shadow-2xl rotate-2 w-[280px]">
                  {activeLead.company && (
                    <div className="text-[10px] font-mono uppercase tracking-wider text-cream/40 mb-1 truncate">
                      {activeLead.company}
                    </div>
                  )}
                  <div className="font-display font-semibold text-sm text-cream leading-tight">
                    {activeLead.name}
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      <LeadFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        lead={null}
        stages={stages}
      />
      <PipelineStagesModal
        open={stagesModalOpen}
        onOpenChange={setStagesModalOpen}
        stages={stages}
      />
    </div>
  );
}

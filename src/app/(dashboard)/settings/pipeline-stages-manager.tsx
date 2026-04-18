"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Star,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createPipelineStage,
  updatePipelineStage,
  deletePipelineStage,
  reorderPipelineStages,
  setDefaultPipelineStage,
} from "./pipeline-actions";
import type { PipelineStage } from "@/generated/prisma/client";
import { MoreHorizontal } from "lucide-react";

const PRESET_COLORS = [
  "#E55A3A", // fire
  "#F0A830", // gold
  "#5A8A6A", // sage
  "#6B6258", // stone
  "#8A7A6A", // bronze
  "#B8AE9C", // sand
  "#C94420", // ember
  "#F7D49A", // cream peach
];

type StageWithCount = PipelineStage & {
  _count: { leads: number };
};

/* ── Sortable stage row ────────────────────────────────────── */

function StageRow({
  stage,
  onEdit,
  onDelete,
  onSetDefault,
  isOnly,
}: {
  stage: StageWithCount;
  onEdit: (s: StageWithCount) => void;
  onDelete: (s: StageWithCount) => void;
  onSetDefault: (id: string) => void;
  isOnly: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-3 rounded-lg border border-border/40 bg-surface-2/60 px-3 py-2.5 transition-colors hover:border-border/70 hover:bg-surface-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground transition-colors active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div
        className="h-7 w-1 rounded-full flex-shrink-0"
        style={{ background: stage.color }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-sm text-foreground truncate">
            {stage.name}
          </span>
          {stage.isDefault && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-fire/10 border border-fire/20 text-[10px] text-fire font-medium">
              <Star className="w-2.5 h-2.5 fill-fire" />
              Default
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
          {stage._count.leads}{" "}
          {stage._count.leads === 1 ? "lead" : "leads"}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100">
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => onEdit(stage)}>
            <Pencil className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
            Edit
          </DropdownMenuItem>
          {!stage.isDefault && (
            <DropdownMenuItem onClick={() => onSetDefault(stage.id)}>
              <Star className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
              Set as default
            </DropdownMenuItem>
          )}
          {!isOnly && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(stage)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* ── Edit/Add inline form ──────────────────────────────────── */

function StageEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: { name: string; color: string };
  onSave: (data: { name: string; color: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0]);

  return (
    <div className="rounded-lg border border-fire/30 bg-surface-2 p-3 space-y-3">
      <Input
        placeholder="Stage name (e.g. In Review)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        className="h-9"
      />
      <div className="flex items-center gap-1.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={`h-6 w-6 rounded-full transition-transform ${
              color === c
                ? "ring-2 ring-offset-2 ring-offset-surface-2 ring-cream/60 scale-110"
                : "hover:scale-110"
            }`}
            style={{ background: c }}
            aria-label={`Pick color ${c}`}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="flex-1 gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => name.trim() && onSave({ name: name.trim(), color })}
          disabled={!name.trim()}
          className="flex-1 gap-1.5"
        >
          <Check className="h-3.5 w-3.5" />
          Save
        </Button>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────── */

export function PipelineStagesManager({
  stages: initialStages,
}: {
  stages: StageWithCount[];
}) {
  const [stages, setStages] = useState(initialStages);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<StageWithCount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StageWithCount | null>(null);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stages.findIndex((s) => s.id === active.id);
    const newIndex = stages.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(stages, oldIndex, newIndex);
    setStages(reordered);

    startTransition(async () => {
      await reorderPipelineStages(reordered.map((s) => s.id));
    });
  }

  function handleAdd(data: { name: string; color: string }) {
    startTransition(async () => {
      await createPipelineStage(data);
      setAdding(false);
      // Optimistic — server will revalidate
      setStages([
        ...stages,
        {
          id: `temp-${Date.now()}`,
          userId: "",
          name: data.name,
          color: data.color,
          position: stages.length,
          isDefault: false,
          createdAt: new Date(),
          _count: { leads: 0 },
        },
      ]);
    });
  }

  function handleSaveEdit(data: { name: string; color: string }) {
    if (!editing) return;
    const target = editing;
    startTransition(async () => {
      await updatePipelineStage(target.id, data);
      setStages(
        stages.map((s) =>
          s.id === target.id ? { ...s, name: data.name, color: data.color } : s
        )
      );
      setEditing(null);
    });
  }

  function handleSetDefault(stageId: string) {
    startTransition(async () => {
      await setDefaultPipelineStage(stageId);
      setStages(
        stages.map((s) => ({ ...s, isDefault: s.id === stageId }))
      );
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    startTransition(async () => {
      await deletePipelineStage(target.id);
      setStages(stages.filter((s) => s.id !== target.id));
    });
  }

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="font-display text-sm font-semibold">
              Lead pipeline stages
            </h2>
          </div>
          {!adding && !editing && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => setAdding(true)}
            >
              <Plus className="h-3 w-3" strokeWidth={2} />
              Add stage
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Customize the stages leads flow through before they convert. Drag to reorder.
        </p>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={stages.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5">
              {stages.map((stage) =>
                editing?.id === stage.id ? (
                  <StageEditor
                    key={stage.id}
                    initial={{ name: stage.name, color: stage.color }}
                    onSave={handleSaveEdit}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <StageRow
                    key={stage.id}
                    stage={stage}
                    onEdit={setEditing}
                    onDelete={setDeleteTarget}
                    onSetDefault={handleSetDefault}
                    isOnly={stages.length === 1}
                  />
                )
              )}

              {adding && (
                <StageEditor
                  onSave={handleAdd}
                  onCancel={() => setAdding(false)}
                />
              )}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{deleteTarget?.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              {deleteTarget && deleteTarget._count.leads > 0
                ? `${deleteTarget._count.leads} ${
                    deleteTarget._count.leads === 1 ? "lead" : "leads"
                  } in this stage will be moved to your default stage.`
                : "This stage has no leads in it. Safe to delete."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              Delete stage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

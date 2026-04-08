"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  GripVertical,
  CalendarDays,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createColumn,
  renameColumn,
  deleteColumn,
  createCard,
  updateCard,
  deleteCard,
  moveCard,
  reorderColumns,
} from "./actions";
import { format } from "date-fns";
import type { Card, Column, Project, ProjectStatus } from "@/generated/prisma/client";

type CardWithColumn = Card;
type ColumnWithCards = Column & { cards: CardWithColumn[] };
type ProjectWithData = Project & {
  client: { id: string; name: string };
  columns: ColumnWithCards[];
};

const STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-sage/20 text-sage border-sage/30" },
  ON_HOLD: { label: "On hold", className: "bg-golden/20 text-golden border-golden/30" },
  COMPLETED: { label: "Completed", className: "bg-brown-400/20 text-brown-300 border-brown-400/30" },
  ARCHIVED: { label: "Archived", className: "bg-muted/50 text-muted-foreground border-border/50" },
};

// ── Card component ────────────────────────────────────────────

function KanbanCard({
  card,
  isDragging = false,
  onEdit,
  onDelete,
}: {
  card: CardWithColumn;
  isDragging?: boolean;
  onEdit: (card: Card) => void;
  onDelete: (cardId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } =
    useSortable({ id: card.id, data: { type: "card", card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg border border-border/40 bg-card p-3 shadow-sm transition-shadow duration-150 ${
        isDragging ? "shadow-lg ring-1 ring-golden/30" : "hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 cursor-grab text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground leading-snug">{card.title}</p>
          {card.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{card.description}</p>
          )}
          {card.dueDate && (
            <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
              <CalendarDays className="h-3 w-3" strokeWidth={1.5} />
              {format(new Date(card.dueDate), "MMM d")}
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100">
            <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(card)}>
              <Pencil className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(card.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ── Add card inline form ──────────────────────────────────────

function AddCardForm({
  columnId,
  onDone,
}: {
  columnId: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = (fd.get("title") as string).trim();
    if (!title) { onDone(); return; }
    startTransition(async () => {
      await createCard(columnId, title);
      router.refresh();
      onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <input
        ref={inputRef}
        autoFocus
        name="title"
        placeholder="Card title..."
        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
      />
      <div className="mt-2 flex items-center gap-1">
        <Button type="submit" size="sm" disabled={isPending} className="h-7 px-3 text-xs">
          {isPending ? "Adding..." : "Add"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone} className="h-7 px-2">
          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Button>
      </div>
    </form>
  );
}

// ── Edit card form ────────────────────────────────────────────

function EditCardForm({
  card,
  onDone,
}: {
  card: Card;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get("title") as string;
    const description = fd.get("description") as string ?? "";
    const dueDate = fd.get("dueDate") as string ?? "";
    startTransition(async () => {
      await updateCard(card.id, title, description, dueDate);
      router.refresh();
      onDone();
    });
  }

  return (
    <div className="rounded-lg border border-golden/30 bg-card p-3 shadow-md">
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          autoFocus
          name="title"
          defaultValue={card.title}
          required
          className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none"
        />
        <textarea
          name="description"
          defaultValue={card.description ?? ""}
          placeholder="Description (optional)"
          rows={2}
          className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none resize-none"
        />
        <input
          name="dueDate"
          type="date"
          defaultValue={card.dueDate ? new Date(card.dueDate).toISOString().split("T")[0] : ""}
          className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:border-ring focus:outline-none [color-scheme:dark]"
        />
        <div className="flex gap-1.5 pt-1">
          <Button type="submit" size="sm" disabled={isPending} className="h-7 flex-1 text-xs">
            <Check className="mr-1.5 h-3 w-3" strokeWidth={2} />
            {isPending ? "Saving..." : "Save"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onDone} className="h-7 px-2">
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Column component ──────────────────────────────────────────

function KanbanColumn({
  column,
  editingCardId,
  onEditCard,
  onEditCardDone,
  onDeleteCard,
}: {
  column: ColumnWithCards;
  editingCardId: string | null;
  onEditCard: (card: Card) => void;
  onEditCardDone: () => void;
  onDeleteCard: (cardId: string) => void;
}) {
  const router = useRouter();
  const [addingCard, setAddingCard] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: "column", column } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cardIds = column.cards.map((c) => c.id);

  function handleRename(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = new FormData(e.currentTarget).get("name") as string;
    if (name.trim()) {
      startTransition(async () => {
        await renameColumn(column.id, name);
        setEditingName(false);
        router.refresh();
      });
    }
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteColumn(column.id);
      router.refresh();
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex w-72 shrink-0 flex-col rounded-xl border border-border/40 bg-muted/30 p-3"
    >
      {/* Column header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" strokeWidth={1.5} />
          </button>
          {editingName ? (
            <form onSubmit={handleRename} className="flex-1">
              <input
                autoFocus
                name="name"
                defaultValue={column.name}
                className="w-full rounded border border-input bg-background px-2 py-0.5 text-sm font-semibold text-foreground focus:border-ring focus:outline-none"
                onBlur={() => setEditingName(false)}
              />
            </form>
          ) : (
            <h3 className="truncate text-sm font-semibold text-foreground">
              {column.name}
            </h3>
          )}
          <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {column.cards.length}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground">
            <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditingName(true)}>
              <Pencil className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={isPending}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
              Delete column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cards */}
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 min-h-[40px]">
          {column.cards.map((card) =>
            editingCardId === card.id ? (
              <EditCardForm key={card.id} card={card} onDone={onEditCardDone} />
            ) : (
              <KanbanCard
                key={card.id}
                card={card}
                onEdit={onEditCard}
                onDelete={onDeleteCard}
              />
            )
          )}
        </div>
      </SortableContext>

      {/* Add card */}
      {addingCard ? (
        <AddCardForm columnId={column.id} onDone={() => setAddingCard(false)} />
      ) : (
        <button
          onClick={() => setAddingCard(true)}
          className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          Add card
        </button>
      )}
    </div>
  );
}

// ── Main board ────────────────────────────────────────────────

export function KanbanBoard({ project }: { project: ProjectWithData }) {
  const router = useRouter();
  const [columns, setColumns] = useState<ColumnWithCards[]>(project.columns);
  const [activeCard, setActiveCard] = useState<CardWithColumn | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Sync columns from server when props change (after router.refresh())
  useEffect(() => {
    setColumns(project.columns);
  }, [project.columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const columnIds = columns.map((c) => c.id);
  const status = STATUS_CONFIG[project.status];

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    if (active.data.current?.type === "card") {
      setActiveCard(active.data.current.card);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type;
    if (activeType !== "card") return;

    const activeCard = active.data.current?.card as CardWithColumn;
    const overColumnId =
      over.data.current?.type === "column"
        ? (over.id as string)
        : (over.data.current?.card as CardWithColumn)?.columnId;

    if (!overColumnId || activeCard.columnId === overColumnId) return;

    // Optimistically move card to new column
    setColumns((cols) =>
      cols.map((col) => {
        if (col.id === activeCard.columnId) {
          return { ...col, cards: col.cards.filter((c) => c.id !== activeCard.id) };
        }
        if (col.id === overColumnId) {
          return { ...col, cards: [...col.cards, { ...activeCard, columnId: overColumnId }] };
        }
        return col;
      })
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);

    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type;

    if (activeType === "column") {
      const oldIndex = columnIds.indexOf(active.id as string);
      const newIndex = columnIds.indexOf(over.id as string);
      if (oldIndex === newIndex) return;

      const reordered = [...columns];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      setColumns(reordered);

      startTransition(async () => { await reorderColumns(project.id, reordered.map((c) => c.id)); });
      return;
    }

    if (activeType === "card") {
      const activeCardData = active.data.current?.card as CardWithColumn;
      const targetColumnId =
        over.data.current?.type === "column"
          ? (over.id as string)
          : (over.data.current?.card as CardWithColumn)?.columnId;

      if (!targetColumnId) return;

      const targetCol = columns.find((c) => c.id === targetColumnId);
      const newPosition = targetCol
        ? targetCol.cards.findIndex((c) => c.id === over.id)
        : 0;

      startTransition(async () => {
        await moveCard(activeCardData.id, targetColumnId, Math.max(0, newPosition));
      });
    }
  }

  function handleAddColumn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = new FormData(e.currentTarget).get("name") as string;
    if (!name.trim()) { setAddingColumn(false); return; }
    startTransition(async () => {
      await createColumn(project.id, name);
      setAddingColumn(false);
      router.refresh();
    });
  }

  async function handleDeleteCard(cardId: string) {
    setColumns((cols) =>
      cols.map((col) => ({ ...col, cards: col.cards.filter((c) => c.id !== cardId) }))
    );
    startTransition(async () => {
      await deleteCard(cardId);
      router.refresh();
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/clients/${project.client.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            {project.client.name}
          </Link>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
            {project.name}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline" className={`text-[11px] ${status.className}`}>
              {status.label}
            </Badge>
            {project.description && (
              <span className="text-sm text-muted-foreground">{project.description}</span>
            )}
          </div>
        </div>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                editingCardId={editingCardId}
                onEditCard={(card) => setEditingCardId(card.id)}
                onEditCardDone={() => setEditingCardId(null)}
                onDeleteCard={handleDeleteCard}
              />
            ))}
          </SortableContext>

          {/* Add column */}
          <div className="w-72 shrink-0">
            {addingColumn ? (
              <form
                onSubmit={handleAddColumn}
                className="rounded-xl border border-dashed border-border/60 p-3"
              >
                <input
                  autoFocus
                  name="name"
                  placeholder="Column name..."
                  className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
                <div className="mt-2 flex gap-1.5">
                  <Button type="submit" size="sm" disabled={isPending} className="h-7 flex-1 text-xs">
                    Add column
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setAddingColumn(false)} className="h-7 px-2">
                    <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </Button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setAddingColumn(true)}
                className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border/50 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                <Plus className="h-4 w-4" strokeWidth={1.5} />
                Add column
              </button>
            )}
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeCard && (
            <KanbanCard
              card={activeCard}
              isDragging
              onEdit={() => {}}
              onDelete={() => {}}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

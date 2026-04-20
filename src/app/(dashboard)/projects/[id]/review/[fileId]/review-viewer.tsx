"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  MessageSquare,
  Send,
  X,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  addAnnotation,
  addReply,
  toggleAnnotationResolved,
  updateReviewStatus,
} from "../../review-actions";

// ── Types ────────────────────────────────────────────────────────────────────

type Reply = {
  id: string;
  comment: string;
  createdAt: Date;
};

type AnnotationItem = {
  id: string;
  x: number;
  y: number;
  comment: string;
  isResolved: boolean;
  createdAt: Date;
  replies: Reply[];
};

export type Props = {
  projectId: string;
  projectName: string;
  reviewId: string;
  reviewStatus: string;
  file: {
    id: string;
    name: string;
    url: string;
    mimeType: string;
  };
  annotations: AnnotationItem[];
};

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string }
> = {
  PENDING: {
    label: "Pending review",
    badgeClass: "bg-gold/20 text-gold border-gold/30",
  },
  CHANGES_REQUESTED: {
    label: "Changes requested",
    badgeClass: "bg-coral/20 text-coral border-coral/30",
  },
  APPROVED: {
    label: "Approved",
    badgeClass: "bg-sage/20 text-sage border-sage/30",
  },
};

// ── Pending pin popover ──────────────────────────────────────────────────────

type PendingPin = {
  x: number; // percentage
  y: number; // percentage
  clientX: number; // px from container left, for popover placement
  clientY: number; // px from container top, for popover placement
};

// ── Component ────────────────────────────────────────────────────────────────

export function ReviewViewer({
  projectId,
  projectName,
  reviewId,
  reviewStatus: initialStatus,
  file,
  annotations: initialAnnotations,
}: Props) {
  const router = useRouter();
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const sidebarRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [, startTransition] = useTransition();

  const [annotations, setAnnotations] =
    useState<AnnotationItem[]>(initialAnnotations);
  const [reviewStatus, setReviewStatus] = useState(initialStatus);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [newPinComment, setNewPinComment] = useState("");
  const [addingPin, setAddingPin] = useState(false);

  // Per-annotation reply input state
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);

  // ── Image click → place pending pin ────────────────────────────────────────

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    // Don't place a pin when clicking an existing pin
    if ((e.target as HTMLElement).closest("[data-pin]")) return;
    // Don't place a pin if already showing one
    if (pendingPin) {
      setPendingPin(null);
      setNewPinComment("");
      return;
    }

    const container = imageContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    // clientX/Y relative to container for popover placement
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    setPendingPin({ x, y, clientX, clientY });
    setNewPinComment("");
  }

  async function handleAddPin() {
    if (!pendingPin || !newPinComment.trim() || addingPin) return;
    setAddingPin(true);

    // Optimistic
    const tempId = `temp-${Date.now()}`;
    const optimistic: AnnotationItem = {
      id: tempId,
      x: pendingPin.x,
      y: pendingPin.y,
      comment: newPinComment.trim(),
      isResolved: false,
      createdAt: new Date(),
      replies: [],
    };
    setAnnotations((prev) => [...prev, optimistic]);
    setPendingPin(null);
    setNewPinComment("");

    const { annotation, error } = await addAnnotation(
      reviewId,
      pendingPin.x,
      pendingPin.y,
      newPinComment.trim()
    );

    if (error || !annotation) {
      // Roll back
      setAnnotations((prev) => prev.filter((a) => a.id !== tempId));
    } else {
      // Replace temp with real
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === tempId
            ? {
                id: annotation.id,
                x: annotation.x,
                y: annotation.y,
                comment: annotation.comment,
                isResolved: annotation.isResolved,
                createdAt: annotation.createdAt,
                replies: [],
              }
            : a
        )
      );
    }
    setAddingPin(false);
  }

  // ── Toggle resolved ─────────────────────────────────────────────────────────

  async function handleToggleResolved(annotationId: string) {
    // Optimistic
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === annotationId ? { ...a, isResolved: !a.isResolved } : a
      )
    );
    const { error } = await toggleAnnotationResolved(annotationId);
    if (error) {
      // Roll back
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === annotationId ? { ...a, isResolved: !a.isResolved } : a
        )
      );
    }
  }

  // ── Add reply ───────────────────────────────────────────────────────────────

  async function handleAddReply(annotationId: string) {
    const text = (replyTexts[annotationId] ?? "").trim();
    if (!text || sendingReply) return;
    setSendingReply(annotationId);

    const tempReply: Reply = {
      id: `temp-reply-${Date.now()}`,
      comment: text,
      createdAt: new Date(),
    };
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === annotationId
          ? { ...a, replies: [...a.replies, tempReply] }
          : a
      )
    );
    setReplyTexts((prev) => ({ ...prev, [annotationId]: "" }));

    const { reply, error } = await addReply(annotationId, text);
    if (error || !reply) {
      // Roll back
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === annotationId
            ? {
                ...a,
                replies: a.replies.filter((r) => r.id !== tempReply.id),
              }
            : a
        )
      );
      setReplyTexts((prev) => ({ ...prev, [annotationId]: text }));
    } else {
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === annotationId
            ? {
                ...a,
                replies: a.replies.map((r) =>
                  r.id === tempReply.id
                    ? {
                        id: reply.id,
                        comment: reply.comment,
                        createdAt: reply.createdAt,
                      }
                    : r
                ),
              }
            : a
        )
      );
    }
    setSendingReply(null);
  }

  // ── Update status ───────────────────────────────────────────────────────────

  function handleUpdateStatus(
    status: "PENDING" | "CHANGES_REQUESTED" | "APPROVED"
  ) {
    const prev = reviewStatus;
    setReviewStatus(status);
    startTransition(async () => {
      const { error } = await updateReviewStatus(reviewId, status);
      if (error) {
        setReviewStatus(prev);
      } else {
        router.refresh();
      }
    });
  }

  // ── Scroll to sidebar annotation ────────────────────────────────────────────

  function handlePinClick(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
    const el = sidebarRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const statusCfg = STATUS_CONFIG[reviewStatus] ?? STATUS_CONFIG.PENDING;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border/40 px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/projects/${projectId}?tab=files`}
            className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">{projectName}</span>
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <p className="truncate font-heading text-sm font-medium">
            {file.name}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge
            variant="outline"
            className={`text-[11px] ${statusCfg.badgeClass}`}
          >
            {statusCfg.label}
          </Badge>
          {reviewStatus !== "APPROVED" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-sage/30 bg-sage/10 text-sage text-xs hover:bg-sage/20"
              onClick={() => handleUpdateStatus("APPROVED")}
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
              Approve
            </Button>
          )}
          {reviewStatus !== "CHANGES_REQUESTED" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-coral/30 bg-coral/10 text-coral text-xs hover:bg-coral/20"
              onClick={() => handleUpdateStatus("CHANGES_REQUESTED")}
            >
              Request changes
            </Button>
          )}
          {reviewStatus !== "PENDING" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => handleUpdateStatus("PENDING")}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Image panel */}
        <div className="relative flex min-w-0 flex-1 items-start justify-center overflow-auto bg-surface-0/80 p-6">
          <div
            ref={imageContainerRef}
            className="relative inline-block cursor-crosshair select-none rounded-lg shadow-2xl"
            onClick={handleImageClick}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={file.url}
              alt={file.name}
              className="block max-w-full rounded-lg"
              draggable={false}
            />

            {/* Existing annotation pins */}
            {annotations.map((a, i) => (
              <button
                key={a.id}
                data-pin
                onClick={(e) => {
                  e.stopPropagation();
                  handlePinClick(a.id);
                }}
                style={{ left: `${a.x}%`, top: `${a.y}%` }}
                className={[
                  "absolute -translate-x-1/2 -translate-y-1/2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-xs font-bold shadow-md transition-all duration-150",
                  a.isResolved
                    ? "bg-sage/70 text-white"
                    : "bg-gold text-surface-0",
                  selectedId === a.id
                    ? "ring-2 ring-white ring-offset-1 ring-offset-transparent scale-110"
                    : "hover:scale-110",
                ].join(" ")}
                title={`Pin ${i + 1}: ${a.comment}`}
              >
                {i + 1}
              </button>
            ))}

            {/* Pending pin (not yet submitted) */}
            {pendingPin && (
              <div
                style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Ghost pin */}
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/50 text-surface-0 text-xs font-bold ring-2 ring-gold shadow-md">
                  {annotations.length + 1}
                </div>
                {/* Popover */}
                <div className="absolute left-8 top-0 z-10 w-64 rounded-lg border border-border/60 bg-surface-2 p-3 shadow-xl">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Add comment
                    </span>
                    <button
                      onClick={() => {
                        setPendingPin(null);
                        setNewPinComment("");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                  <Textarea
                    autoFocus
                    value={newPinComment}
                    onChange={(e) => setNewPinComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        handleAddPin();
                      }
                      if (e.key === "Escape") {
                        setPendingPin(null);
                        setNewPinComment("");
                      }
                    }}
                    placeholder="Describe the change needed…"
                    className="min-h-[72px] resize-none text-sm"
                    rows={3}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground/60">
                      ⌘↵ to add
                    </span>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleAddPin}
                      disabled={!newPinComment.trim() || addingPin}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {annotations.length === 0 && !pendingPin && (
            <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-8">
              <p className="rounded-full bg-surface-0/80 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
                Click anywhere on the image to add a comment
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex w-80 shrink-0 flex-col border-l border-border/40">
          {/* Sidebar header */}
          <div className="flex shrink-0 items-center gap-2 border-b border-border/40 px-4 py-3">
            <MessageSquare className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-sm font-medium">
              Comments
            </span>
            {annotations.length > 0 && (
              <span className="ml-auto rounded-full bg-gold/20 px-2 py-0.5 text-[11px] font-medium text-gold">
                {annotations.length}
              </span>
            )}
          </div>

          {/* Annotation list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {annotations.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                  <MessageSquare
                    className="h-5 w-5 text-gold"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="mt-3 text-sm font-medium">No comments yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Click on the image to leave feedback.
                </p>
              </div>
            ) : (
              annotations.map((annotation, i) => (
                <div
                  key={annotation.id}
                  ref={(el) => {
                    sidebarRefs.current[annotation.id] = el;
                  }}
                >
                  <Card
                    className={[
                      "border-border/40 transition-all duration-150 cursor-pointer",
                      selectedId === annotation.id
                        ? "border-gold/40 bg-gold/5"
                        : "hover:border-border/70",
                    ].join(" ")}
                    onClick={() =>
                      setSelectedId((prev) =>
                        prev === annotation.id ? null : annotation.id
                      )
                    }
                  >
                    <CardContent className="p-3">
                      {/* Pin number + meta */}
                      <div className="flex items-start gap-2.5">
                        <div
                          className={[
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                            annotation.isResolved
                              ? "bg-sage/20 text-sage"
                              : "bg-gold/20 text-gold",
                          ].join(" ")}
                        >
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-snug">
                            {annotation.comment}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(annotation.createdAt),
                              { addSuffix: true }
                            )}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleResolved(annotation.id);
                          }}
                          className={[
                            "mt-0.5 shrink-0 transition-colors",
                            annotation.isResolved
                              ? "text-sage hover:text-sage/70"
                              : "text-muted-foreground/40 hover:text-sage",
                          ].join(" ")}
                          title={
                            annotation.isResolved
                              ? "Mark unresolved"
                              : "Mark resolved"
                          }
                        >
                          {annotation.isResolved ? (
                            <CheckCircle2
                              className="h-4 w-4"
                              strokeWidth={1.5}
                            />
                          ) : (
                            <Circle className="h-4 w-4" strokeWidth={1.5} />
                          )}
                        </button>
                      </div>

                      {/* Replies */}
                      {annotation.replies.length > 0 && (
                        <div className="mt-2.5 space-y-2 border-l-2 border-border/30 pl-3">
                          {annotation.replies.map((reply) => (
                            <div key={reply.id}>
                              <p className="text-xs leading-snug">
                                {reply.comment}
                              </p>
                              <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                                {formatDistanceToNow(
                                  new Date(reply.createdAt),
                                  { addSuffix: true }
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply input (shown when selected) */}
                      {selectedId === annotation.id && (
                        <div
                          className="mt-2.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex gap-2">
                            <Textarea
                              value={replyTexts[annotation.id] ?? ""}
                              onChange={(e) =>
                                setReplyTexts((prev) => ({
                                  ...prev,
                                  [annotation.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  (e.metaKey || e.ctrlKey)
                                ) {
                                  handleAddReply(annotation.id);
                                }
                              }}
                              placeholder="Reply…"
                              className="min-h-[56px] flex-1 resize-none text-xs"
                              rows={2}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="mt-auto h-8 w-8 shrink-0 text-muted-foreground hover:text-gold"
                              disabled={
                                !replyTexts[annotation.id]?.trim() ||
                                sendingReply === annotation.id
                              }
                              onClick={() => handleAddReply(annotation.id)}
                            >
                              <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
                              <span className="sr-only">Send reply</span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

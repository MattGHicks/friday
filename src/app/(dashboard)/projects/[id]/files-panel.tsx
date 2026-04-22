"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  Download,
  MessageSquare,
  Trash2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  createUploadUrl,
  finalizeUpload,
  deleteFile,
  toggleDeliverable,
} from "./file-actions";

export type FileRecord = {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  isDeliverable: boolean;
  createdAt: Date;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (isImage(mimeType)) {
    return <ImageIcon className="h-5 w-5 shrink-0 text-gold" strokeWidth={1.5} />;
  }
  if (
    mimeType === "application/pdf" ||
    mimeType.startsWith("text/") ||
    mimeType.includes("document") ||
    mimeType.includes("word") ||
    mimeType.includes("sheet") ||
    mimeType.includes("presentation")
  ) {
    return (
      <FileText className="h-5 w-5 shrink-0 text-sunset" strokeWidth={1.5} />
    );
  }
  return (
    <FileIcon
      className="h-5 w-5 shrink-0 text-muted-foreground"
      strokeWidth={1.5}
    />
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function FilesPanel({
  projectId,
  files: initialFiles,
}: {
  projectId: string;
  files: FileRecord[];
}) {
  const router = useRouter();
  const [files, setFiles] = useState<FileRecord[]>(initialFiles);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<
    | { kind: "idle" }
    | { kind: "uploading"; name: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [, startDeleteTransition] = useTransition();
  const [, startToggleTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  async function uploadOne(file: File) {
    setUploadState({ kind: "uploading", name: file.name });

    const ticket = await createUploadUrl(projectId, file.name, file.size);
    if ("error" in ticket) {
      setUploadState({ kind: "error", message: ticket.error });
      return;
    }

    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from(ticket.bucket)
      .uploadToSignedUrl(ticket.path, ticket.token, file, {
        contentType: file.type || "application/octet-stream",
      });
    if (uploadError) {
      setUploadState({
        kind: "error",
        message: "Upload failed. Please try again.",
      });
      return;
    }

    const result = await finalizeUpload(
      projectId,
      ticket.path,
      file.name,
      file.size,
      file.type || "application/octet-stream"
    );
    if (result.error) {
      setUploadState({ kind: "error", message: result.error });
      return;
    }

    setUploadState({ kind: "idle" });
    router.refresh();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    void uploadOne(picked);
    e.target.value = "";
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    if (uploadState.kind === "uploading") return;
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    void uploadOne(dropped);
  }

  async function handleToggleDeliverable(fileId: string) {
    setTogglingId(fileId);
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, isDeliverable: !f.isDeliverable } : f
      )
    );
    startToggleTransition(async () => {
      await toggleDeliverable(fileId);
      setTogglingId(null);
      router.refresh();
    });
  }

  async function handleDelete(fileId: string) {
    setDeletingId(fileId);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    startDeleteTransition(async () => {
      await deleteFile(fileId);
      setDeletingId(null);
      router.refresh();
    });
  }

  const uploading = uploadState.kind === "uploading";
  const deliverables = files.filter((f) => f.isDeliverable);
  const workingFiles = files.filter((f) => !f.isDeliverable);
  const hasFiles = files.length > 0;

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative flex flex-col gap-6"
    >
      {/* Hidden input shared by all upload triggers */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Drag overlay — shows when user drags a file anywhere over this panel */}
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-gold bg-gold/10 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-gold" strokeWidth={1.5} />
            <p className="text-sm font-medium text-gold">Drop to upload</p>
          </div>
        </div>
      )}

      {/* Upload banner — prominent when empty, compact button when files exist */}
      {!hasFiles ? (
        <EmptyDropzone
          onClick={() => !uploading && fileInputRef.current?.click()}
          uploading={uploading}
          uploadingName={uploading ? uploadState.name : null}
        />
      ) : (
        <div className="flex items-center justify-between rounded-md border border-border/40 bg-surface-1/40 px-3 py-2">
          {uploading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
              <span>Uploading {uploadState.name}…</span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/80">
              Drag a file anywhere in this section, or use the button →
            </p>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
            Upload
          </Button>
        </div>
      )}

      {uploadState.kind === "error" && (
        <p className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">
          {uploadState.message}
        </p>
      )}

      {/* Deliverables — the starred files, shown first as a small visual grid */}
      {deliverables.length > 0 && (
        <div>
          <div className="mb-2 flex items-baseline gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gold">
              Deliverables
            </h3>
            <span className="text-xs text-muted-foreground/60">
              {deliverables.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {deliverables.map((file) => (
              <DeliverableCard
                key={file.id}
                file={file}
                projectId={projectId}
                onToggle={handleToggleDeliverable}
                onDelete={handleDelete}
                isDeleting={deletingId === file.id}
                isToggling={togglingId === file.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Working files — list view */}
      {workingFiles.length > 0 && (
        <div>
          {deliverables.length > 0 && (
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Working files
            </h3>
          )}
          <div className="flex flex-col gap-1">
            {workingFiles.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                projectId={projectId}
                onToggle={handleToggleDeliverable}
                onDelete={handleDelete}
                isDeleting={deletingId === file.id}
                isToggling={togglingId === file.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Empty-state dropzone (big, inviting) ─────────────────────────────────────

function EmptyDropzone({
  onClick,
  uploading,
  uploadingName,
}: {
  onClick: () => void;
  uploading: boolean;
  uploadingName: string | null;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={[
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center transition-colors duration-200",
        uploading
          ? "cursor-not-allowed border-gold/40 bg-gold/5"
          : "cursor-pointer border-border/60 hover:border-gold/40 hover:bg-gold/5",
      ].join(" ")}
    >
      {uploading ? (
        <>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
          <p className="text-sm text-muted-foreground">
            Uploading {uploadingName}…
          </p>
        </>
      ) : (
        <>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
            <Upload className="h-5 w-5 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium">
              Drop files here or click to upload
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Images, PDFs, documents — up to 500MB
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ── Deliverable card (visual) ────────────────────────────────────────────────

function DeliverableCard({
  file,
  projectId,
  onToggle,
  onDelete,
  isDeleting,
  isToggling,
}: {
  file: FileRecord;
  projectId: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  isToggling: boolean;
}) {
  const image = isImage(file.mimeType);

  return (
    <div
      className={[
        "group relative flex flex-col overflow-hidden rounded-lg border border-gold/20 bg-gold/[0.03] transition-all duration-150",
        isDeleting ? "opacity-40" : "hover:border-gold/40",
      ].join(" ")}
    >
      <div className="relative aspect-[4/3] w-full bg-surface-1/60">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.url}
            alt={file.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileTypeIcon mimeType={file.mimeType} />
          </div>
        )}
        {/* Hover action bar */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-gradient-to-t from-black/80 to-transparent px-2 py-2 opacity-0 transition-opacity group-hover:opacity-100">
          {image && (
            <a
              href={`/projects/${projectId}/review/${file.id}`}
              title="Open review"
              className="flex h-7 w-7 items-center justify-center rounded-md bg-black/40 text-white hover:bg-black/60"
            >
              <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.5} />
            </a>
          )}
          <a
            href={file.url}
            download
            target="_blank"
            rel="noreferrer"
            title="Download"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-black/40 text-white hover:bg-black/60"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
          </a>
          <button
            type="button"
            onClick={() => onToggle(file.id)}
            disabled={isToggling}
            title="Remove from deliverables"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-black/40 text-gold hover:bg-black/60"
          >
            <Star className="h-3.5 w-3.5" strokeWidth={1.5} fill="currentColor" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(file.id)}
            disabled={isDeleting}
            title="Delete"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-black/40 text-white hover:bg-coral/60"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div className="px-3 py-2">
        <p className="truncate text-xs font-medium" title={file.name}>
          {file.name}
        </p>
        <p className="text-[10px] text-muted-foreground/80">
          {formatBytes(file.size)} ·{" "}
          {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

// ── File row (list view, for working files) ──────────────────────────────────

function FileRow({
  file,
  projectId,
  onToggle,
  onDelete,
  isDeleting,
  isToggling,
}: {
  file: FileRecord;
  projectId: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  isToggling: boolean;
}) {
  const image = isImage(file.mimeType);

  return (
    <div
      className={[
        "group flex items-center gap-3 rounded-md border border-border/40 bg-card/60 px-3 py-2 transition-colors duration-150",
        isDeleting ? "opacity-40" : "hover:bg-card/80",
      ].join(" ")}
    >
      {/* Thumbnail or icon */}
      {image ? (
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border/40 bg-surface-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={file.url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-1">
          <FileTypeIcon mimeType={file.mimeType} />
        </div>
      )}

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={file.name}>
          {file.name}
        </p>
        <p className="text-[11px] text-muted-foreground/80">
          {formatBytes(file.size)} ·{" "}
          {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 transition-colors ${
            file.isDeliverable
              ? "text-gold hover:text-gold/70"
              : "text-muted-foreground hover:text-gold"
          }`}
          onClick={() => onToggle(file.id)}
          disabled={isToggling}
          title={
            file.isDeliverable
              ? "Remove from deliverables"
              : "Mark as deliverable"
          }
        >
          <Star
            className="h-3.5 w-3.5"
            strokeWidth={1.5}
            fill={file.isDeliverable ? "currentColor" : "none"}
          />
          <span className="sr-only">
            {file.isDeliverable ? "Remove from" : "Add to"} deliverables
          </span>
        </Button>
        {image && (
          <a
            href={`/projects/${projectId}/review/${file.id}`}
            className={
              buttonVariants({ variant: "ghost", size: "icon" }) +
              " h-7 w-7 text-muted-foreground hover:text-gold"
            }
            title="Open review"
          >
            <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="sr-only">Review {file.name}</span>
          </a>
        )}
        <a
          href={file.url}
          download
          target="_blank"
          rel="noreferrer"
          className={
            buttonVariants({ variant: "ghost", size: "icon" }) +
            " h-7 w-7 text-muted-foreground hover:text-foreground"
          }
          title="Download"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="sr-only">Download {file.name}</span>
        </a>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(file.id)}
          disabled={isDeleting}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="sr-only">Delete {file.name}</span>
        </Button>
      </div>
    </div>
  );
}

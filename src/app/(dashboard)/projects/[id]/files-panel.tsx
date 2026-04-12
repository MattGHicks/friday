"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { formatDistanceToNow } from "date-fns";
import { Upload, FileText, Image, File, Download, MessageSquare, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { uploadFile, deleteFile, toggleDeliverable } from "./file-actions";

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

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) {
    return <Image className="h-5 w-5 shrink-0 text-gold" strokeWidth={1.5} />;
  }
  if (
    mimeType === "application/pdf" ||
    mimeType.startsWith("text/") ||
    mimeType.includes("document") ||
    mimeType.includes("word") ||
    mimeType.includes("sheet") ||
    mimeType.includes("presentation")
  ) {
    return <FileText className="h-5 w-5 shrink-0 text-sunset" strokeWidth={1.5} />;
  }
  return <File className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.5} />;
}

// Inner component that reads useFormStatus for upload pending state
function DropZoneContent() {
  const { pending } = useFormStatus();

  if (pending) {
    return (
      <>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
        <p className="text-sm text-muted-foreground">Uploading…</p>
      </>
    );
  }

  return (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
        <Upload className="h-5 w-5 text-gold" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-medium">Drop files here or click to upload</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Images, PDFs, documents, and more
        </p>
      </div>
    </>
  );
}

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
  const [, startDeleteTransition] = useTransition();
  const [, startToggleTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync when server re-renders with fresh data
  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  function handleDropZoneClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange() {
    if (!fileInputRef.current?.files?.length) return;
    formRef.current?.requestSubmit();
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles.length || !fileInputRef.current) return;

    // DataTransfer → FileList cannot be assigned directly; use a DataTransfer object
    const dt = new DataTransfer();
    dt.items.add(droppedFiles[0]);
    fileInputRef.current.files = dt.files;
    formRef.current?.requestSubmit();
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
    // Optimistic removal
    setDeletingId(fileId);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    startDeleteTransition(async () => {
      await deleteFile(fileId);
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <form ref={formRef} action={uploadFile as (formData: FormData) => void}>
        <input type="hidden" name="projectId" value={projectId} />
        <input
          ref={fileInputRef}
          type="file"
          name="file"
          className="hidden"
          onChange={handleFileChange}
        />
        <div
          role="button"
          tabIndex={0}
          onClick={handleDropZoneClick}
          onKeyDown={(e) => e.key === "Enter" && handleDropZoneClick()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 px-6 py-8 text-center transition-colors duration-200 hover:border-gold/40 hover:bg-gold/5"
        >
          <DropZoneContent />
        </div>
      </form>

      {/* File list */}
      {files.length === 0 ? (
        <Card className="border-border/40">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
              <Upload className="h-6 w-6 text-gold" strokeWidth={1.5} />
            </div>
            <h3 className="mt-4 font-heading text-base font-semibold">No files yet</h3>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Upload deliverables, references, or assets for this project.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {files.map((file) => (
            <Card
              key={file.id}
              className={[
                "border-border/40 transition-opacity duration-150",
                deletingId === file.id ? "opacity-40" : "",
              ].join(" ")}
            >
              <CardContent className="flex items-center gap-3 px-4 py-3">
                {/* Icon */}
                <FileTypeIcon mimeType={file.mimeType} />

                {/* Name + meta */}
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-medium leading-tight"
                    title={file.name}
                  >
                    {file.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatBytes(file.size)} ·{" "}
                    {formatDistanceToNow(new Date(file.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 transition-colors ${
                      file.isDeliverable
                        ? "text-gold hover:text-gold/70"
                        : "text-muted-foreground hover:text-gold"
                    }`}
                    onClick={() => handleToggleDeliverable(file.id)}
                    disabled={togglingId === file.id}
                    title={
                      file.isDeliverable
                        ? "Remove from deliverables"
                        : "Mark as deliverable"
                    }
                  >
                    <Star
                      className="h-4 w-4"
                      strokeWidth={1.5}
                      fill={file.isDeliverable ? "currentColor" : "none"}
                    />
                    <span className="sr-only">
                      {file.isDeliverable ? "Remove from" : "Add to"} deliverables
                    </span>
                  </Button>
                  {file.mimeType.startsWith("image/") && (
                    <a
                      href={`/projects/${projectId}/review/${file.id}`}
                      className={
                        buttonVariants({ variant: "ghost", size: "icon" }) +
                        " h-8 w-8 text-muted-foreground hover:text-gold"
                      }
                      title="Open review"
                    >
                      <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
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
                      " h-8 w-8 text-muted-foreground hover:text-foreground"
                    }
                  >
                    <Download className="h-4 w-4" strokeWidth={1.5} />
                    <span className="sr-only">Download {file.name}</span>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(file.id)}
                    disabled={deletingId === file.id}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    <span className="sr-only">Delete {file.name}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

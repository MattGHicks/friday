"use client";

import { useRef, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Send,
  FileUp,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Banknote,
  FileSignature,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendClientMessage } from "./message-actions";
import type {
  MessageAuthorType,
  SystemEventType,
} from "@/generated/prisma/client";

export type PortalMessageRecord = {
  id: string;
  authorType: MessageAuthorType;
  authorName: string | null;
  body: string;
  systemEventType: SystemEventType | null;
  systemMetadata: unknown;
  createdAt: Date;
};

type Props = {
  projectId: string;
  messages: PortalMessageRecord[];
  brandColor: string;
};

const SYSTEM_ICON: Record<SystemEventType, React.FC<{ className?: string; strokeWidth?: number }>> = {
  FILE_UPLOADED: FileUp,
  REVIEW_APPROVED: CheckCircle2,
  REVIEW_CHANGES_REQUESTED: AlertCircle,
  INVOICE_SENT: Receipt,
  INVOICE_PAID: Banknote,
  QUOTE_SENT: FileSignature,
  QUOTE_ACCEPTED: CheckCircle2,
};

function systemLabel(
  type: SystemEventType,
  metadata: Record<string, unknown> | null
): string {
  switch (type) {
    case "FILE_UPLOADED":
      return `File uploaded${metadata?.fileName ? `: ${metadata.fileName}` : ""}`;
    case "REVIEW_APPROVED":
      return "Design approved";
    case "REVIEW_CHANGES_REQUESTED":
      return "Changes requested";
    case "INVOICE_SENT":
      return metadata?.isDeposit ? "Deposit invoice sent" : "Invoice sent";
    case "INVOICE_PAID":
      return "Invoice paid";
    case "QUOTE_SENT":
      return "Quote sent";
    case "QUOTE_ACCEPTED":
      return "Quote accepted";
  }
}

export function PortalMessages({ projectId, messages, brandColor }: Props) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      const result = await sendClientMessage(projectId, trimmed);
      if (result.error) {
        setError(result.error);
        return;
      }
      setBody("");
      textareaRef.current?.focus();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/40 bg-card/40 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No messages yet. Send a note below — your designer will get it by
            email.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((msg) => {
            if (msg.authorType === "SYSTEM" && msg.systemEventType) {
              const Icon = SYSTEM_ICON[msg.systemEventType];
              const label = systemLabel(
                msg.systemEventType,
                msg.systemMetadata as Record<string, unknown> | null
              );
              return (
                <div
                  key={msg.id}
                  className="flex items-center gap-2 px-1 text-xs text-muted-foreground"
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span>{label}</span>
                  <span className="opacity-60">·</span>
                  <span className="opacity-60">
                    {formatDistanceToNow(new Date(msg.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              );
            }

            const isClient = msg.authorType === "CLIENT";
            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${isClient ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">
                    {msg.authorName ?? "Unknown"}
                  </span>
                  <span className="opacity-60">
                    {formatDistanceToNow(new Date(msg.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div
                  className="max-w-[85%] whitespace-pre-wrap rounded-xl border px-4 py-2.5 text-sm leading-relaxed"
                  style={
                    isClient
                      ? {
                          borderColor: `${brandColor}40`,
                          backgroundColor: `${brandColor}15`,
                        }
                      : undefined
                  }
                >
                  {!isClient && (
                    <div className="border-border/40 bg-card/60" />
                  )}
                  <div className={isClient ? "" : "text-foreground"}>{msg.body}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border border-border/40 bg-card/40 p-3">
        <Textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          rows={3}
          className="resize-none border-none bg-transparent text-sm focus-visible:ring-0"
          disabled={pending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground/70">
            ⌘/Ctrl+Enter to send
          </p>
          <div className="flex items-center gap-2">
            {error && <p className="text-xs text-coral">{error}</p>}
            <Button
              size="sm"
              onClick={handleSend}
              disabled={pending || !body.trim()}
              className="gap-1.5"
              style={{ backgroundColor: brandColor, color: "#0f0f0f" }}
            >
              <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
              {pending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

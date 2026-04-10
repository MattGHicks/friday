"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { deleteClient } from "@/app/(dashboard)/clients/actions";
import type { Client } from "@/generated/prisma/client";
import { formatDistanceToNow } from "date-fns";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Warm avatar background colors that match the brand
const avatarColors = [
  "bg-golden/20 text-golden",
  "bg-sunset/20 text-sunset",
  "bg-sage/20 text-sage",
  "bg-[#C08B5C]/20 text-[#C08B5C]",
  "bg-[#9C8B7A]/25 text-[#C5BCAC]",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function ClientCard({
  client,
  projectCount,
  onEdit,
}: {
  client: Client;
  projectCount: number;
  onEdit: (client: Client) => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await deleteClient(client.id);
    setDeleteOpen(false);
    setDeleting(false);
  }

  return (
    <>
      <Card className="group border-border/40 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            {/* Clickable area → client detail */}
            <Link href={`/clients/${client.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback
                  className={`text-sm font-semibold ${getAvatarColor(client.company ?? client.name)}`}
                >
                  {getInitials(client.company ?? client.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                {/* Company name leads; person name is secondary contact label */}
                <h3 className="font-heading text-sm font-semibold text-foreground truncate">
                  {client.company ?? client.name}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {client.company ? client.name : client.email}
                </p>
              </div>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all duration-200 hover:bg-accent hover:text-foreground group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(client)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Link href={`/clients/${client.id}`} className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{client.email}</p>
            {projectCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {projectCount} project{projectCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </Link>

          <p className="mt-2 text-[11px] text-muted-foreground/60">
            Added{" "}
            {formatDistanceToNow(new Date(client.createdAt), {
              addSuffix: true,
            })}
          </p>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {client.name}?</DialogTitle>
            <DialogDescription>
              This will permanently remove this client and all their associated
              projects and files. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

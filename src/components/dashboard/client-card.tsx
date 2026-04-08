"use client";

import { useState } from "react";
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
  "bg-golden/15 text-golden",
  "bg-sunset/15 text-sunset",
  "bg-sage/15 text-sage",
  "bg-[#8B7EC8]/15 text-[#8B7EC8]",
  "bg-[#5B9BD5]/15 text-[#5B9BD5]",
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
      <Card className="group border-border/60 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback
                  className={`text-sm font-semibold ${getAvatarColor(client.name)}`}
                >
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  {client.name}
                </h3>
                {client.company && (
                  <p className="text-xs text-muted-foreground">
                    {client.company}
                  </p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all duration-200 hover:bg-accent hover:text-foreground group-hover:opacity-100"
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

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{client.email}</p>
            {projectCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {projectCount} project{projectCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

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

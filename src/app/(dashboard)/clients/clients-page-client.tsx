"use client";

import { useState } from "react";
import { Plus, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ClientCard } from "@/components/dashboard/client-card";
import { ClientFormSheet } from "@/components/dashboard/client-form";
import type { Client } from "@/generated/prisma/client";

type ClientWithCount = Client & { projectCount: number };

export function ClientsPageClient({
  clients,
}: {
  clients: ClientWithCount[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.company ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : clients;

  function handleEdit(client: Client) {
    setEditingClient(client);
    setFormOpen(true);
  }

  function handleOpenChange(open: boolean) {
    setFormOpen(open);
    if (!open) setEditingClient(null);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Clients
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {clients.length === 0
              ? "Add clients to start managing their projects."
              : `${clients.length} client${clients.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
          Add client
        </Button>
      </div>

      {/* Search — only when there are clients */}
      {clients.length > 0 && (
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" strokeWidth={1.5} />
          <Input
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      )}

      {/* Client grid or empty state */}
      {clients.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-golden/10">
              <Users className="h-7 w-7 text-golden" strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 font-heading text-lg font-semibold">
              No clients yet
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add your first client to get started. You&apos;ll be able to
              create projects, track progress, and send invoices.
            </p>
            <Button onClick={() => setFormOpen(true)} className="mt-6">
              <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Add your first client
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No clients match &ldquo;{search}&rdquo;.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              projectCount={client.projectCount}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Add/Edit form sheet */}
      <ClientFormSheet
        open={formOpen}
        onOpenChange={handleOpenChange}
        client={editingClient}
      />
    </div>
  );
}

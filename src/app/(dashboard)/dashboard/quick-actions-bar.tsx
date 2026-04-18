"use client";

import { useState } from "react";
import {
  UserPlus,
  FolderPlus,
  Receipt,
  FileSignature,
  CalendarPlus,
  Plus,
} from "lucide-react";
import { ClientFormSheet } from "@/components/dashboard/client-form";
import { ProjectFormSheet } from "@/components/dashboard/project-form";
import { MeetingFormSheet } from "@/components/dashboard/meeting-form";
import { NewInvoiceDialog } from "@/app/(dashboard)/invoices/new-invoice-dialog";
import { NewQuoteDialog } from "@/app/(dashboard)/quotes/new-quote-dialog";
import { cn } from "@/lib/utils";

interface QuickActionsBarProps {
  clients: { id: string; name: string; company: string | null; email: string }[];
  projects: { id: string; name: string; clientId: string }[];
  leads: { id: string; name: string; company: string | null; email: string | null }[];
}

export function QuickActionsBar({ clients, projects, leads }: QuickActionsBarProps) {
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [meetingFormOpen, setMeetingFormOpen] = useState(false);
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);

  const canQuote = leads.length > 0 || clients.length > 0;

  const actions = [
    {
      label: "New client",
      icon: UserPlus,
      onClick: () => setClientFormOpen(true),
      enabled: true,
    },
    {
      label: "New project",
      icon: FolderPlus,
      onClick: () => setProjectFormOpen(true),
      enabled: clients.length > 0,
      disabledReason: "Add a client first",
    },
    {
      label: "New quote",
      icon: FileSignature,
      onClick: () => setQuoteFormOpen(true),
      enabled: canQuote,
      disabledReason: "Add a lead or client first",
    },
    {
      label: "New invoice",
      icon: Receipt,
      onClick: () => setInvoiceFormOpen(true),
      enabled: clients.length > 0 && projects.length > 0,
      disabledReason:
        clients.length === 0 ? "Add a client first" : "Add a project first",
    },
    {
      label: "New meeting",
      icon: CalendarPlus,
      onClick: () => setMeetingFormOpen(true),
      enabled: true,
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const baseClass = cn(
            "group inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
            action.enabled
              ? "border-white/[0.08] bg-surface-2/60 text-cream hover:border-fire/30 hover:bg-surface-3 hover:text-cream"
              : "border-white/[0.04] bg-surface-2/30 text-cream/30 cursor-not-allowed"
          );

          const content = (
            <>
              <Icon
                className={cn(
                  "w-4 h-4 transition-colors",
                  action.enabled
                    ? "text-fire group-hover:text-gold"
                    : "text-cream/20"
                )}
                strokeWidth={1.75}
              />
              {action.label}
              {action.enabled && (
                <Plus className="w-3 h-3 text-cream/30 group-hover:text-cream/60 transition-colors" strokeWidth={2} />
              )}
            </>
          );

          if (!action.enabled) {
            return (
              <div
                key={action.label}
                className={baseClass}
                title={action.disabledReason}
              >
                {content}
              </div>
            );
          }

          return (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={baseClass}
            >
              {content}
            </button>
          );
        })}
      </div>

      <ClientFormSheet open={clientFormOpen} onOpenChange={setClientFormOpen} />
      <ProjectFormSheet
        open={projectFormOpen}
        onOpenChange={setProjectFormOpen}
        project={null}
        clients={clients}
      />
      <MeetingFormSheet
        open={meetingFormOpen}
        onOpenChange={setMeetingFormOpen}
        clients={clients}
        projects={projects}
      />
      <NewInvoiceDialog
        open={invoiceFormOpen}
        onOpenChange={setInvoiceFormOpen}
        clients={clients}
        projects={projects}
      />
      <NewQuoteDialog
        open={quoteFormOpen}
        onOpenChange={setQuoteFormOpen}
        leads={leads}
        clients={clients}
      />
    </>
  );
}

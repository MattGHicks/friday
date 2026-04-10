"use client";

import { useState } from "react";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import { Separator } from "@/components/ui/separator";
import { Emblem } from "@/components/brand/emblem";
import { Logo } from "@/components/brand/logo";

export function Sidebar({
  name,
  email,
}: {
  name?: string | null;
  email: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden flex-col border-r border-sidebar-border bg-sidebar md:flex",
        "transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      {/* ── Wordmark ────────────────────────────────── */}
      <div
        className={cn(
          "flex h-[60px] shrink-0 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-0" : "px-5"
        )}
      >
        {collapsed ? (
          <Emblem className="h-8 w-8" />
        ) : (
          <Logo className="h-8 w-auto" />
        )}
      </div>

      {/* ── Navigation ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        <SidebarNav collapsed={collapsed} />
      </div>

      <Separator className="bg-sidebar-border" />

      {/* ── User ────────────────────────────────────── */}
      <div className="p-2.5">
        <UserMenu name={name} email={email} collapsed={collapsed} />
      </div>

      <Separator className="bg-sidebar-border" />

      {/* ── Collapse toggle ─────────────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "flex h-10 items-center text-muted-foreground",
          "transition-colors duration-200 hover:text-cream hover:bg-white/[0.04]",
          collapsed ? "justify-center" : "px-5"
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <PanelLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        ) : (
          <PanelLeftClose className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
      </button>
    </aside>
  );
}

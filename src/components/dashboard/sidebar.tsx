"use client";

import { useState } from "react";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import { Separator } from "@/components/ui/separator";

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
        "hidden flex-col border-r border-border bg-secondary md:flex",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Wordmark */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-border px-4",
          collapsed && "justify-center px-0"
        )}
      >
        {collapsed ? (
          <span className="font-heading text-lg font-bold text-golden">f</span>
        ) : (
          <span className="font-heading text-lg font-bold tracking-tight text-golden">
            friday
          </span>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav collapsed={collapsed} />
      </div>

      <Separator />

      {/* User section */}
      <div className="p-3">
        <UserMenu name={name} email={email} collapsed={collapsed} />
      </div>

      <Separator />

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-10 items-center justify-center text-muted-foreground transition-colors duration-200 hover:text-foreground"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <PanelLeft className="h-4 w-4" strokeWidth={1.5} />
        ) : (
          <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />
        )}
      </button>
    </aside>
  );
}

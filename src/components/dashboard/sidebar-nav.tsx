"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  Upload,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { label: "Dashboard", href: "/dashboard",  icon: LayoutDashboard, enabled: true },
  { label: "Clients",   href: "/clients",    icon: Users,           enabled: true },
  { label: "Projects",  href: "/projects",   icon: FolderKanban,    enabled: true },
  { label: "Invoices",  href: "/invoices",   icon: FileText,        enabled: false },
  { label: "Files",     href: "/files",      icon: Upload,          enabled: false },
  { label: "Settings",  href: "/settings",   icon: Settings,        enabled: true },
];

export function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 px-2.5">
      {navItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        const content = (
          <Link
            key={item.href}
            href={item.enabled ? item.href : "#"}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
              // Active state
              isActive
                ? "bg-white/[0.06] text-cream font-medium"
                : item.enabled
                  ? "text-muted-foreground font-normal hover:bg-white/[0.04] hover:text-cream"
                  : "cursor-not-allowed text-muted-foreground/30",
              collapsed && "justify-center px-0"
            )}
            aria-disabled={!item.enabled}
            tabIndex={item.enabled ? 0 : -1}
          >
            {/* Gradient left-border for active item */}
            {isActive && (
              <span className="bg-gradient-brand-vertical absolute left-0 top-1/2 h-5 w-[2.5px] -translate-y-1/2 rounded-r-full" />
            )}

            {/* Icon — gradient when active */}
            <span className={cn(
              "relative flex shrink-0 items-center justify-center",
              collapsed ? "h-5 w-5" : "h-[18px] w-[18px]"
            )}>
              {isActive ? (
                <>
                  {/* Gradient icon via clip */}
                  <item.icon
                    className="h-full w-full"
                    style={{ color: "#F0A830" }}
                    strokeWidth={2}
                  />
                </>
              ) : (
                <item.icon
                  className={cn(
                    "h-full w-full transition-colors duration-200",
                    item.enabled ? "group-hover:text-cream/70" : ""
                  )}
                  strokeWidth={1.5}
                />
              )}
            </span>

            {/* Label */}
            {!collapsed && <span className="flex-1">{item.label}</span>}

            {/* Soon badge */}
            {!collapsed && !item.enabled && (
              <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/40 bg-white/[0.04]">
                Soon
              </span>
            )}
          </Link>
        );

        if (collapsed) {
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger className="w-full">{content}</TooltipTrigger>
              <TooltipContent side="right" sideOffset={14}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        }

        return content;
      })}
    </nav>
  );
}

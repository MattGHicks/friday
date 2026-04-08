"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Route group (dashboard) is invisible in URL — paths are at root level
const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Users,
    enabled: true,
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
    enabled: true,
  },
  {
    label: "Invoices",
    href: "/invoices",
    icon: FileText,
    enabled: false,
  },
  {
    label: "Files",
    href: "/files",
    icon: Upload,
    enabled: false,
  },
];

export function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
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
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
              isActive
                ? "bg-golden/10 text-foreground"
                : item.enabled
                  ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                  : "cursor-not-allowed text-muted-foreground/40",
              collapsed && "justify-center px-0"
            )}
            aria-disabled={!item.enabled}
            tabIndex={item.enabled ? 0 : -1}
          >
            {/* Golden left border for active item */}
            {isActive && (
              <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-golden" />
            )}
            <item.icon
              className={cn(
                "shrink-0 transition-colors duration-200",
                isActive ? "text-golden" : "",
                collapsed ? "h-5 w-5" : "h-[18px] w-[18px]"
              )}
              strokeWidth={1.5}
            />
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && !item.enabled && (
              <span className="ml-auto text-[10px] font-normal uppercase tracking-wider text-muted-foreground/40">
                Soon
              </span>
            )}
          </Link>
        );

        if (collapsed) {
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger className="w-full">
                {content}
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
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

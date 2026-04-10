"use client";

import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/app/(auth)/actions";

function getInitials(name?: string | null, email?: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email ? email[0].toUpperCase() : "?";
}

export function UserMenu({
  name,
  email,
  collapsed,
}: {
  name?: string | null;
  email: string;
  collapsed: boolean;
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left",
          "transition-colors duration-200 hover:bg-white/[0.05]",
          "outline-none focus-visible:ring-1 focus-visible:ring-fire/40",
          collapsed && "justify-center px-0"
        )}
        aria-label="User menu"
      >
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="bg-gradient-brand text-[10px] font-bold text-[#1A0800]">
            {getInitials(name, email)}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            {name && (
              <p className="truncate text-xs font-semibold text-cream">
                {name}
              </p>
            )}
            <p className="truncate text-[11px] text-muted-foreground">{email}</p>
          </div>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side={collapsed ? "right" : "top"}
        className="w-56 bg-popover border-white/[0.08]"
        sideOffset={8}
      >
        <div className="px-2 py-2">
          <p className="text-sm font-semibold text-cream">{name || email}</p>
          {name && <p className="text-xs text-muted-foreground">{email}</p>}
        </div>
        <DropdownMenuSeparator className="bg-white/[0.06]" />
        <DropdownMenuItem
          onClick={() => router.push("/settings")}
          className="gap-2.5 text-muted-foreground hover:text-cream focus:text-cream"
        >
          <Settings className="h-3.5 w-3.5" strokeWidth={1.5} />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/[0.06]" />
        <DropdownMenuItem
          onClick={() => logout()}
          className="gap-2.5 text-fire/80 hover:text-fire focus:text-fire"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


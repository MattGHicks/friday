"use client";

import { LogOut, Settings } from "lucide-react";
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-200 hover:bg-accent"
        aria-label="User menu"
      >
          <Avatar className="h-8 w-8 shrink-0 border-2 border-golden/20">
            <AvatarFallback className="bg-golden/10 text-xs font-semibold text-golden">
              {getInitials(name, email)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              {name && (
                <p className="truncate text-sm font-medium text-foreground">
                  {name}
                </p>
              )}
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={collapsed ? "right" : "top"} className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{name || email}</p>
          {name && <p className="text-xs text-muted-foreground">{email}</p>}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Settings className="mr-2 h-4 w-4" strokeWidth={1.5} />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import { Separator } from "@/components/ui/separator";

export function MobileNav({
  name,
  email,
}: {
  name?: string | null;
  email: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 md:hidden">
      <span className="font-heading text-lg font-bold tracking-tight text-golden">
        friday
      </span>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="inline-flex h-8 items-center justify-center rounded-lg px-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-sidebar p-0">
          <SheetHeader className="flex h-14 items-center border-b border-sidebar-border px-4">
            <SheetTitle className="font-heading text-lg font-bold tracking-tight text-golden">
              friday
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-1 flex-col">
            <div className="flex-1 py-4" onClick={() => setOpen(false)}>
              <SidebarNav collapsed={false} />
            </div>
            <Separator />
            <div className="p-3">
              <UserMenu name={name} email={email} collapsed={false} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

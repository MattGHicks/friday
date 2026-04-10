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
import { Logo } from "@/components/brand/logo";

export function MobileNav({
  name,
  email,
}: {
  name?: string | null;
  email: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-[60px] items-center justify-between border-b border-sidebar-border bg-sidebar px-4 md:hidden">
      <Logo className="h-7 w-auto" />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-cream"
          aria-label="Open menu"
        >
          <Menu className="h-4.5 w-4.5" strokeWidth={1.5} />
        </SheetTrigger>

        <SheetContent side="left" className="w-[240px] bg-sidebar p-0 border-r border-sidebar-border">
          <SheetHeader className="flex h-[60px] items-center border-b border-sidebar-border px-5">
            <SheetTitle className="sr-only">Friday</SheetTitle>
            <Logo className="h-7 w-auto" />
          </SheetHeader>

          <div className="flex flex-1 flex-col">
            <div className="flex-1 py-3" onClick={() => setOpen(false)}>
              <SidebarNav collapsed={false} />
            </div>
            <Separator className="bg-sidebar-border" />
            <div className="p-2.5">
              <UserMenu name={name} email={email} collapsed={false} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

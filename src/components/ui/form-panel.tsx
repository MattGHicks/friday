"use client";

/**
 * FormPanel — the single modal primitive for any form-shaped surface.
 *
 * Why this exists: Friday used to mix Dialog (tiny centered modal) and
 * Sheet (narrow side-panel) inconsistently, and neither felt right on
 * mobile. FormPanel resolves that:
 *   - Desktop: large centered panel (up to max-w-3xl) with sticky
 *     header + scrollable body + sticky footer. Never cramped.
 *   - Mobile (< sm): fills the viewport edge-to-edge so users aren't
 *     squinting at a shrunken dialog.
 *
 * Keep confirm dialogs using the raw Dialog primitive. FormPanel is for
 * things that need the user to actually *fill in* data.
 *
 * Layout contract:
 *   <FormPanel open onOpenChange>
 *     <FormPanelHeader title="…" description="…" />
 *     <FormPanelBody>…fields…</FormPanelBody>
 *     <FormPanelFooter>…buttons…</FormPanelFooter>
 *   </FormPanel>
 */

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function FormPanelRoot({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="form-panel" {...props} />;
}

function FormPanelPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="form-panel-portal" {...props} />;
}

function FormPanelOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="form-panel-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/60 duration-150",
        "supports-backdrop-filter:backdrop-blur-sm",
        "data-open:animate-in data-open:fade-in-0",
        "data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  );
}

type FormPanelContentProps = DialogPrimitive.Popup.Props & {
  /** Maximum width on desktop. Default "xl" ≈ max-w-3xl. */
  size?: "md" | "lg" | "xl" | "2xl";
  showCloseButton?: boolean;
};

const SIZE_CLASS = {
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-3xl",
  "2xl": "sm:max-w-4xl",
} as const;

function FormPanelContent({
  className,
  size = "xl",
  showCloseButton = true,
  children,
  ...props
}: FormPanelContentProps) {
  return (
    <FormPanelPortal>
      <FormPanelOverlay />
      <DialogPrimitive.Popup
        data-slot="form-panel-content"
        className={cn(
          // Mobile: fill the viewport.
          "fixed inset-0 z-50 flex flex-col bg-surface-1 text-cream outline-none",
          "duration-200",
          "data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-4",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-4",
          // Desktop: centered panel, rounded, max height.
          "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
          "sm:w-[calc(100vw-3rem)] sm:max-h-[calc(100vh-3rem)]",
          "sm:rounded-2xl sm:border sm:border-white/[0.06] sm:shadow-[0_0_0_1px_rgba(255,255,255,0.04),_0_24px_64px_rgba(0,0,0,0.6)]",
          "sm:data-open:zoom-in-95 sm:data-closed:zoom-out-95",
          "sm:data-open:slide-in-from-bottom-0 sm:data-closed:slide-out-to-bottom-0",
          SIZE_CLASS[size],
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="form-panel-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 right-3 z-10"
                size="icon-sm"
                aria-label="Close"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </FormPanelPortal>
  );
}

function FormPanelHeader({
  className,
  title,
  description,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
}) {
  const hasSlottedTitle = title !== undefined || description !== undefined;
  return (
    <div
      data-slot="form-panel-header"
      className={cn(
        "flex flex-col gap-1 border-b border-white/[0.05] px-5 py-4 pr-12 sm:px-7 sm:py-5",
        className
      )}
      {...props}
    >
      {hasSlottedTitle && (
        <>
          {title !== undefined && (
            <DialogPrimitive.Title className="font-display text-lg font-semibold tracking-tight text-cream sm:text-xl">
              {title}
            </DialogPrimitive.Title>
          )}
          {description !== undefined && (
            <DialogPrimitive.Description className="text-sm text-cream/55">
              {description}
            </DialogPrimitive.Description>
          )}
        </>
      )}
      {children}
    </div>
  );
}

function FormPanelBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-panel-body"
      className={cn(
        "flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6",
        className
      )}
      {...props}
    />
  );
}

function FormPanelFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-panel-footer"
      className={cn(
        "flex flex-col-reverse gap-2 border-t border-white/[0.05] bg-surface-2/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-7",
        className
      )}
      {...props}
    />
  );
}

function FormPanelTitle(props: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title data-slot="form-panel-title" {...props} />;
}

function FormPanelDescription(props: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description data-slot="form-panel-description" {...props} />
  );
}

function FormPanelClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="form-panel-close" {...props} />;
}

export {
  FormPanelRoot as FormPanel,
  FormPanelContent,
  FormPanelHeader,
  FormPanelBody,
  FormPanelFooter,
  FormPanelTitle,
  FormPanelDescription,
  FormPanelClose,
};

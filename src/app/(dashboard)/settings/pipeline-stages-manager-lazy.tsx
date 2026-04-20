"use client";

/**
 * Client-only wrapper for PipelineStagesManager.
 *
 * Why this file exists: @dnd-kit auto-generates element IDs (via
 * `useUniqueId`) that can differ between SSR and hydration when the
 * parent tree contains multiple DndContext instances in the same
 * document. That raises a `aria-describedby="DndDescribedBy-N"` mismatch
 * React flags as a hydration error.
 *
 * Lazy-loading with `ssr: false` skips the server pass entirely for this
 * subtree, so the first render happens on the client and IDs are stable.
 */

import dynamic from "next/dynamic";
import type { PipelineStage } from "@/generated/prisma/client";

const PipelineStagesManager = dynamic(
  () =>
    import("./pipeline-stages-manager").then(
      (mod) => mod.PipelineStagesManager
    ),
  { ssr: false }
);

export function PipelineStagesManagerLazy(props: {
  stages: (PipelineStage & { _count: { leads: number } })[];
}) {
  return <PipelineStagesManager {...props} />;
}

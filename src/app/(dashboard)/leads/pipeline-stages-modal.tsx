"use client";

/**
 * PipelineStagesModal — FormPanel wrapper around PipelineStagesManager.
 *
 * We moved the manager out of /settings because editing stages is a
 * "things I do while looking at the board" task, not a one-time account
 * setup. The Pipeline page's settings button opens this.
 *
 * Lazy-loaded with ssr:false so the dnd-kit DndDescribedBy id doesn't
 * mismatch on hydration (same reason the old /settings page wrapped it).
 */

import dynamic from "next/dynamic";
import {
  FormPanel,
  FormPanelBody,
  FormPanelContent,
  FormPanelHeader,
} from "@/components/ui/form-panel";
import type { PipelineStage } from "@/generated/prisma/client";

const PipelineStagesManager = dynamic(
  () =>
    import("@/app/(dashboard)/settings/pipeline-stages-manager").then(
      (m) => m.PipelineStagesManager
    ),
  { ssr: false }
);

export function PipelineStagesModal({
  open,
  onOpenChange,
  stages,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  stages: (PipelineStage & { _count: { leads: number } })[];
}) {
  return (
    <FormPanel open={open} onOpenChange={onOpenChange}>
      <FormPanelContent size="lg">
        <FormPanelHeader
          title="Lead pipeline stages"
          description="Customize the stages leads flow through before they convert. Drag to reorder, edit names + colors, or mark one as the default for new leads."
        />
        <FormPanelBody>
          <PipelineStagesManager stages={stages} variant="bare" />
        </FormPanelBody>
      </FormPanelContent>
    </FormPanel>
  );
}

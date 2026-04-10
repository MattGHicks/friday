import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./settings-client";
import { PipelineStagesManager } from "./pipeline-stages-manager";
import { StripeConnectCard } from "./stripe-connect-card";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [dbUser, stages] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        email: true,
        brandColor: true,
        welcomeMessage: true,
        stripeAccountId: true,
        plan: true,
        createdAt: true,
      },
    }),
    prisma.pipelineStage.findMany({
      where: { userId: user.id },
      orderBy: { position: "asc" },
      include: { _count: { select: { projects: true } } },
    }),
  ]);

  if (!dbUser) return null;

  return (
    <div className="space-y-8 max-w-2xl">
      <SettingsClient user={dbUser} />
      <Suspense>
        <StripeConnectCard stripeAccountId={dbUser.stripeAccountId} />
      </Suspense>
      <PipelineStagesManager stages={stages} />
    </div>
  );
}

import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./settings-client";
import { StripeConnectCard } from "./stripe-connect-card";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
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
  });

  if (!dbUser) return null;

  // Pipeline-stage management lives on the Pipeline page now — it's
  // a "thing I do while looking at the board" task, not a one-time
  // account setup. See src/app/(dashboard)/leads/pipeline-stages-modal.tsx.
  return (
    <div className="space-y-8 max-w-2xl">
      <SettingsClient user={dbUser} />
      <Suspense>
        <StripeConnectCard stripeAccountId={dbUser.stripeAccountId} />
      </Suspense>
    </div>
  );
}

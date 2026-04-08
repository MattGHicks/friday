import Link from "next/link";
import { Users, FolderKanban, FileText } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const clientCount = await prisma.client.count({
    where: { userId: user.id },
  });

  // Time-aware greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {greeting}
          {user.name ? `, ${user.name}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s what&apos;s happening with your clients.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 shadow-sm transition-shadow duration-200 hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-golden/10">
              <Users
                className="h-5 w-5 text-golden"
                strokeWidth={1.5}
              />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {clientCount}
              </p>
              <p className="text-sm text-muted-foreground">Clients</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm transition-shadow duration-200 hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage/10">
              <FolderKanban
                className="h-5 w-5 text-sage"
                strokeWidth={1.5}
              />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">0</p>
              <p className="text-sm text-muted-foreground">Active projects</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm transition-shadow duration-200 hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sunset/10">
              <FileText
                className="h-5 w-5 text-sunset"
                strokeWidth={1.5}
              />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">$0</p>
              <p className="text-sm text-muted-foreground">Outstanding</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick action — show only if no clients */}
      {clientCount === 0 && (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-golden/10">
              <Users className="h-7 w-7 text-golden" strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 font-heading text-lg font-semibold">
              Add your first client
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Get started by adding a client. You&apos;ll be able to create
              projects, share files, and send invoices from here.
            </p>
            <Link
              href="/clients"
              className={buttonVariants({ className: "mt-6" })}
            >
              Get started
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

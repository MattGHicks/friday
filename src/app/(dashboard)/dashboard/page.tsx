import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Welcome back{user?.name ? `, ${user.name}` : ""}
      </h1>
      <p className="text-muted-foreground">
        Your dashboard is taking shape. Clients, projects, and invoices will
        live here.
      </p>
    </div>
  );
}

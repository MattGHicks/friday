import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-full flex-1">
      {/* Desktop sidebar */}
      <Sidebar name={user.name} email={user.email} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        {/* Mobile top bar */}
        <MobileNav name={user.name} email={user.email} />

        {/* Page content */}
        <main className="flex-1 px-6 py-8 md:px-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

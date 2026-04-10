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
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar name={user.name} email={user.email} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <MobileNav name={user.name} email={user.email} />

        {/* Page content — scrolls for normal pages; pipeline opts out via flex-1 + overflow-hidden */}
        <main className="flex flex-col flex-1 overflow-y-auto px-6 py-8 md:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}

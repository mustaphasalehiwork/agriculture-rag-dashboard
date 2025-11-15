import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { MobileSidebar } from "@/components/mobile-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify user is authenticated
  try {
    await requireAuth();
  } catch (ex) {
    console.log('requireAuth => ', ex)
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <MobileSidebar>
        <main className="flex-1 overflow-auto pt-16 lg:pt-0">
          {children}
        </main>
      </MobileSidebar>
    </div>
  );
}
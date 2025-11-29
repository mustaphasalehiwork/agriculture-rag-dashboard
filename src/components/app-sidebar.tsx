"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, BarChart3, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { toast } from "sonner";

const navigation = [
  {
    title: "Documents",
    href: "/dashboard/documents",
    icon: FileText,
    description: "Manage PDF documents and uploads",
  },
  {
    title: "Report RAG",
    href: "/dashboard/rag-reports",
    icon: BarChart3,
    description: "View RAG-based reports",
  },
  {
    title: "Report",
    href: "/dashboard/reports",
    icon: BarChart3,
    description: "View analytics and reports",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
      } else {
        toast.error("Failed to logout");
      }
    } catch {
      toast.error("Failed to logout");
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-semibold">
            A
          </div>
          <div>
            <h1 className="font-semibold">AgriRAG</h1>
            <p className="text-xs text-gray-500">Dashboard</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <SidebarMenuItem key={item.title}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    variant={isActive ? "active" : "default"}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
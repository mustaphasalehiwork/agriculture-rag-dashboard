"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, BarChart3, Users, Shield, Building2, Wheat, Tag, Activity, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

const navigation = [
  {
    title: "Documents",
    href: "/dashboard/documents",
    icon: FileText,
    description: "Manage PDF documents and file uploads",
  },
  {
    title: "Operator Performance",
    href: "/dashboard/operator-performance",
    icon: Users,
    description: "View weekly operator performance metrics",
  },
  {
    title: "RAG Reports",
    href: "/dashboard/rag-reports",
    icon: BarChart3,
    description: "View RAG-based reports",
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    description: "View analytics and reports",
  },
  {
    title: "Farms",
    href: "/dashboard/farms",
    icon: Wheat,
    description: "Manage farms and agricultural land",
  },
  {
    title: "Categories",
    href: "/dashboard/categories",
    icon: Tag,
    description: "Manage equipment categories",
  },
  {
    title: "Activities",
    href: "/dashboard/activities",
    icon: Activity,
    description: "Manage agricultural activities",
  },
  {
    title: "Equipment",
    href: "/dashboard/equipment",
    icon: Settings,
    description: "Manage machinery and equipment",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-semibold">
            A
          </div>
          <div>
            <h1 className="font-semibold">Agriculture Dashboard</h1>
            <p className="text-xs text-gray-500">RAG Analytics System</p>
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

          {/* Admin-only navigation */}
          {user && isAdmin() && (
            <>
              <SidebarMenuItem>
                <div className="px-2 py-1">
                  <div className="border-t border-border my-2" />
                </div>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/dashboard/companies">
                  <SidebarMenuButton
                    variant={pathname === "/dashboard/companies" ? "active" : "default"}
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Companies</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/dashboard/users">
                  <SidebarMenuButton
                    variant={pathname === "/dashboard/users" ? "active" : "default"}
                  >
                    <Shield className="h-4 w-4" />
                    <span>User Management</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Logged in as: {user?.email || "Guest User"}
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
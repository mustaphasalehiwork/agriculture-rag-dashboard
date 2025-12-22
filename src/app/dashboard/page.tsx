"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      {/* Redirect to documents page */}
      {typeof window !== 'undefined' && redirect("/dashboard/documents")}
      <div>Redirecting to documents page...</div>
    </ProtectedRoute>
  );
}
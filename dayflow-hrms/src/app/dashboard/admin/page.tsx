"use client";

import { AdminDashboard } from "@/components/pages/admin-dashboard";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";

export default function Page() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <AdminDashboard />
      </AppLayout>
    </ProtectedRoute>
  );
}

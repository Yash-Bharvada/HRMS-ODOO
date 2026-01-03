"use client";

import { EmployeeDashboard } from "@/components/pages/employee-dashboard";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";

export default function Page() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <EmployeeDashboard />
      </AppLayout>
    </ProtectedRoute>
  );
}

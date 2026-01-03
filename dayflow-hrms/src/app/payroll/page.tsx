"use client";

import { PayrollPage } from "@/components/pages/payroll-page";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";

export default function Page() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <PayrollPage />
      </AppLayout>
    </ProtectedRoute>
  );
}

"use client";

import { AttendancePage } from "@/components/pages/attendance-page";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";

export default function Page() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <AttendancePage />
      </AppLayout>
    </ProtectedRoute>
  );
}

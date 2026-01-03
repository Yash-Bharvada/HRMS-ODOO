"use client";

import { LeavePage } from "@/components/pages/leave-page";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";

export default function Page() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <LeavePage />
      </AppLayout>
    </ProtectedRoute>
  );
}

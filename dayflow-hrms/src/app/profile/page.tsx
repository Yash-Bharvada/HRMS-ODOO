"use client";

import { ProfilePage } from "@/components/pages/profile-page";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";

export default function Page() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <ProfilePage />
      </AppLayout>
    </ProtectedRoute>
  );
}

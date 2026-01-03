"use client";

import React from "react";
import { AuthProvider } from "@/contexts/auth-context";
import { AppProvider } from "@/contexts/app-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppProvider>{children}</AppProvider>
    </AuthProvider>
  );
}

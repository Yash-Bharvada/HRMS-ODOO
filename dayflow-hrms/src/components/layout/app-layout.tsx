"use client";

import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-6 bg-background/60">{children}</main>
      </div>
    </div>
  );
}

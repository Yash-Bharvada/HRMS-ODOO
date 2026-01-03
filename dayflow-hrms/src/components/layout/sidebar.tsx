"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ClipboardList,
  Calendar,
  DollarSign,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const baseNav: NavItem[] = [
    {
      label: user?.role === "admin" ? "Admin Dashboard" : "Employee Dashboard",
      href: user?.role === "admin" ? "/dashboard/admin" : "/dashboard/employee",
      icon: LayoutGrid,
    },
    { label: "Attendance", href: "/attendance", icon: ClipboardList },
    { label: "Leave", href: "/leave", icon: Calendar },
    { label: "Payroll", href: "/payroll", icon: DollarSign },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/60 p-4 lg:block">
      <div className="mb-6 px-3 text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        Navigation
      </div>
      <nav className="space-y-1">
        {baseNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-primary/10 hover:text-primary ${
                active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

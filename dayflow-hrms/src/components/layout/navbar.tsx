"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
          DF
        </div>
        <div>
          <p className="text-sm font-semibold text-card-foreground">
            Dayflow HRMS
          </p>
          <p className="text-xs text-muted-foreground">Mock environment</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="text-right">
            <p className="text-sm font-semibold text-card-foreground">
              {user.fullName}
            </p>
            <p className="text-xs capitalize text-muted-foreground">
              {user.role}
            </p>
          </div>
        )}
        <Link
          href="/profile"
          className="rounded-md border border-border px-3 py-2 text-sm text-foreground transition hover:bg-primary/10"
        >
          Profile
        </Link>
        <Button variant="outline" size="sm" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
}

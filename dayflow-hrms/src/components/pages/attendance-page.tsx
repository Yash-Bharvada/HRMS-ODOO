"use client";

import { useMemo } from "react";
import { useApp } from "@/contexts/app-context";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/data-table";
import { DataTable } from "@/components/ui/data-table";
import { AttendanceRecord, DataTableColumn } from "@/types";
import { Button } from "@/components/ui/button";

export function AttendancePage() {
  const { attendance, refreshData } = useApp();
  const { user } = useAuth();

  const filtered = useMemo(() => {
    if (!user) return [];
    return user.role === "admin"
      ? attendance
      : attendance.filter((record) => record.employeeId === user.employeeId);
  }, [attendance, user]);

  const columns: DataTableColumn<AttendanceRecord>[] = [
    { key: "employeeId", label: "Employee", sortable: true },
    { key: "date", label: "Date", sortable: true },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value) => (
        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs capitalize text-primary">
          {value}
        </span>
      ),
    },
    {
      key: "duration",
      label: "Hours",
      sortable: true,
      render: (value) => (value ? `${value.toFixed(1)}h` : "—"),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Attendance</h1>
          <p className="text-muted-foreground">Recent attendance records</p>
        </div>
        <Button variant="outline" onClick={refreshData}>
          Refresh
        </Button>
      </div>

      <Card>
        <DataTable data={filtered} columns={columns} />
      </Card>
    </div>
  );
}

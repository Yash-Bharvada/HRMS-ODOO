"use client";

import { useMemo } from "react";
import { useApp } from "@/contexts/app-context";
import { useAuth } from "@/contexts/auth-context";
import { DataTable } from "@/components/ui/data-table";
import { Card } from "@/components/ui/data-table";
import { DataTableColumn, PayrollData } from "@/types";
import { Button } from "@/components/ui/button";

export function PayrollPage() {
  const { payroll, refreshData } = useApp();
  const { user } = useAuth();

  const filtered = useMemo(() => {
    if (!user) return [];
    return user.role === "admin"
      ? payroll
      : payroll.filter((item) => item.employeeId === user.employeeId);
  }, [payroll, user]);

  const columns: DataTableColumn<PayrollData>[] = [
    { key: "employeeId", label: "Employee", sortable: true },
    { key: "month", label: "Month", sortable: true },
    { key: "year", label: "Year", sortable: true },
    {
      key: "salary",
      label: "Salary",
      sortable: true,
      render: (value) => `$${Number(value).toLocaleString()}`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Payroll</h1>
          <p className="text-muted-foreground">Latest payroll records</p>
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

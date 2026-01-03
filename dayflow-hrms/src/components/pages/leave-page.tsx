"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/contexts/app-context";
import { useAuth } from "@/contexts/auth-context";
import { leaveService } from "@/services/data.service";
import { LeaveRequest, DataTableColumn } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/data-table";

type LeaveForm = {
  type: LeaveRequest["type"];
  fromDate: string;
  toDate: string;
  reason: string;
};

const initialForm: LeaveForm = {
  type: "paid",
  fromDate: "",
  toDate: "",
  reason: "",
};

export function LeavePage() {
  const { leaveRequests, refreshData } = useApp();
  const { user } = useAuth();
  const [form, setForm] = useState<LeaveForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!user) return [];
    return user.role === "admin"
      ? leaveRequests
      : leaveRequests.filter((leave) => leave.employeeId === user.employeeId);
  }, [leaveRequests, user]);

  const columns: DataTableColumn<LeaveRequest>[] = [
    { key: "employeeId", label: "Employee", sortable: true },
    { key: "type", label: "Type", sortable: true },
    {
      key: "fromDate",
      label: "From",
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "toDate",
      label: "To",
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    { key: "reason", label: "Reason" },
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
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmitting(true);
      setError(null);

      await leaveService.create({
        employeeId: user.employeeId,
        type: form.type,
        fromDate: new Date(form.fromDate),
        toDate: new Date(form.toDate),
        reason: form.reason,
        status: "pending",
      });

      setForm(initialForm);
      await refreshData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit leave request"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Leave Requests
          </h1>
          <p className="text-muted-foreground">
            Track and create leave requests
          </p>
        </div>
      </div>

      <Card className="p-4 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          New leave request
        </h2>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <form className="grid gap-4 md:grid-cols-4" onSubmit={handleSubmit}>
          <div className="md:col-span-1">
            <label className="text-sm font-medium text-foreground">Type</label>
            <select
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={form.type}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  type: e.target.value as LeaveForm["type"],
                }))
              }
              disabled={submitting}
            >
              <option value="paid">Paid</option>
              <option value="sick">Sick</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          <Input
            label="From"
            type="date"
            value={form.fromDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, fromDate: e.target.value }))
            }
            required
            disabled={submitting}
          />

          <Input
            label="To"
            type="date"
            value={form.toDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, toDate: e.target.value }))
            }
            required
            disabled={submitting}
          />

          <Input
            label="Reason"
            value={form.reason}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, reason: e.target.value }))
            }
            required
            disabled={submitting}
          />

          <div className="md:col-span-4 flex justify-end">
            <Button type="submit" loading={submitting} disabled={submitting}>
              Submit request
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <DataTable data={filtered} columns={columns} />
      </Card>
    </div>
  );
}

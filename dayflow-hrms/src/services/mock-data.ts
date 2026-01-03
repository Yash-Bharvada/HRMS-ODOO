// Mock data for development and testing
// This will be populated in task 2

import { User, AttendanceRecord, LeaveRequest, PayrollData } from "@/types";

// Seed users (admin + employees)
export const mockUsers: User[] = [
  {
    id: "u-admin",
    employeeId: "EMP001",
    fullName: "Jane Smith",
    email: "jane.smith@dayflow.test",
    role: "admin",
    phone: "+1-555-0101",
    address: "42 Market Street",
    createdAt: new Date("2025-01-10T08:00:00Z"),
    updatedAt: new Date("2025-01-10T08:00:00Z"),
  },
  {
    id: "u-employee-1",
    employeeId: "EMP002",
    fullName: "John Doe",
    email: "john.doe@dayflow.test",
    role: "employee",
    phone: "+1-555-0102",
    address: "88 Main Avenue",
    createdAt: new Date("2025-01-12T08:00:00Z"),
    updatedAt: new Date("2025-01-12T08:00:00Z"),
  },
  {
    id: "u-employee-2",
    employeeId: "EMP003",
    fullName: "Priya Kapoor",
    email: "priya.kapoor@dayflow.test",
    role: "employee",
    phone: "+91-98765-43210",
    address: "Bandra East, Mumbai",
    createdAt: new Date("2025-01-15T08:00:00Z"),
    updatedAt: new Date("2025-01-15T08:00:00Z"),
  },
];

// Seed attendance (today + recent days)
const todayIso = new Date().toISOString().split("T")[0];
export const mockAttendance: AttendanceRecord[] = [
  {
    id: "att-1",
    employeeId: "EMP002",
    date: todayIso,
    checkIn: new Date(`${todayIso}T09:10:00Z`),
    checkOut: new Date(`${todayIso}T17:20:00Z`),
    status: "present",
    duration: 8.2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "att-2",
    employeeId: "EMP003",
    date: todayIso,
    checkIn: new Date(`${todayIso}T09:45:00Z`),
    status: "half-day",
    duration: 4.0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "att-3",
    employeeId: "EMP002",
    date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    status: "absent",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Seed leave requests
export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: "leave-1",
    employeeId: "EMP002",
    type: "paid",
    fromDate: new Date("2025-02-10"),
    toDate: new Date("2025-02-12"),
    reason: "Family event",
    status: "pending",
    createdAt: new Date("2025-01-28T09:00:00Z"),
    updatedAt: new Date("2025-01-28T09:00:00Z"),
  },
  {
    id: "leave-2",
    employeeId: "EMP003",
    type: "sick",
    fromDate: new Date("2025-01-22"),
    toDate: new Date("2025-01-23"),
    reason: "Flu",
    status: "approved",
    adminComment: "Get well soon",
    createdAt: new Date("2025-01-20T09:00:00Z"),
    updatedAt: new Date("2025-01-21T09:00:00Z"),
  },
];

// Seed payroll snapshots
export const mockPayroll: PayrollData[] = [
  {
    id: "pay-1",
    employeeId: "EMP002",
    salary: 65000,
    month: "January",
    year: 2025,
    createdAt: new Date("2025-01-31T09:00:00Z"),
    updatedAt: new Date("2025-01-31T09:00:00Z"),
  },
  {
    id: "pay-2",
    employeeId: "EMP003",
    salary: 72000,
    month: "January",
    year: 2025,
    createdAt: new Date("2025-01-31T09:00:00Z"),
    updatedAt: new Date("2025-01-31T09:00:00Z"),
  },
];

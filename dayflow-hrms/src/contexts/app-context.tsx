"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  AppContextType,
  AttendanceRecord,
  LeaveRequest,
  PayrollData,
  User,
} from "@/types";
import {
  attendanceService,
  leaveService,
  payrollService,
  userService,
} from "@/services/data.service";

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payroll, setPayroll] = useState<PayrollData[]>([]);

  const refreshData = async () => {
    const [emp, att, leave, pay] = await Promise.all([
      userService.getAll(),
      attendanceService.getAll(),
      leaveService.getAll(),
      payrollService.getAll(),
    ]);

    setEmployees(emp);
    setAttendance(att);
    setLeaveRequests(leave);
    setPayroll(pay);
  };

  useEffect(() => {
    refreshData().catch((error) => {
      console.error("Failed to hydrate app context", error);
    });
  }, []);

  return (
    <AppContext.Provider
      value={{ employees, attendance, leaveRequests, payroll, refreshData }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

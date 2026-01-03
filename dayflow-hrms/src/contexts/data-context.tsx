'use client'

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react'
import { useDataRefresh } from '@/hooks/use-data-refresh'
import { userService, attendanceService, leaveService, payrollService } from '@/services/data.service'
import { User, AttendanceRecord, LeaveRequest, PayrollData } from '@/types'

interface DataContextType {
  // Users
  users: User[] | null
  usersLoading: boolean
  usersError: Error | null
  refreshUsers: () => Promise<void>

  // Attendance
  attendance: AttendanceRecord[] | null
  attendanceLoading: boolean
  attendanceError: Error | null
  refreshAttendance: () => Promise<void>

  // Leave requests
  leaveRequests: LeaveRequest[] | null
  leaveRequestsLoading: boolean
  leaveRequestsError: Error | null
  refreshLeaveRequests: () => Promise<void>

  // Payroll
  payroll: PayrollData[] | null
  payrollLoading: boolean
  payrollError: Error | null
  refreshPayroll: () => Promise<void>

  // Global refresh
  refreshAll: () => Promise<void>
  lastUpdated: Date | null
}

const DataContext = createContext<DataContextType | undefined>(undefined)

interface DataProviderProps {
  children: React.ReactNode
  autoRefreshInterval?: number
}

export function DataProvider({ children, autoRefreshInterval = 300000 }: DataProviderProps) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Users data
  const {
    data: users,
    loading: usersLoading,
    error: usersError,
    refresh: refreshUsers
  } = useDataRefresh(() => userService.getAll(), {
    interval: autoRefreshInterval,
    onError: (error) => console.error('Users fetch error:', error)
  })

  // Attendance data
  const {
    data: attendance,
    loading: attendanceLoading,
    error: attendanceError,
    refresh: refreshAttendance
  } = useDataRefresh(() => attendanceService.getAll(), {
    interval: autoRefreshInterval,
    onError: (error) => console.error('Attendance fetch error:', error)
  })

  // Leave requests data
  const {
    data: leaveRequests,
    loading: leaveRequestsLoading,
    error: leaveRequestsError,
    refresh: refreshLeaveRequests
  } = useDataRefresh(() => leaveService.getAll(), {
    interval: autoRefreshInterval,
    onError: (error) => console.error('Leave requests fetch error:', error)
  })

  // Payroll data
  const {
    data: payroll,
    loading: payrollLoading,
    error: payrollError,
    refresh: refreshPayroll
  } = useDataRefresh(() => payrollService.getAll(), {
    interval: autoRefreshInterval,
    onError: (error) => console.error('Payroll fetch error:', error)
  })

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshUsers(),
      refreshAttendance(),
      refreshLeaveRequests(),
      refreshPayroll()
    ])
    setLastUpdated(new Date())
  }, [refreshUsers, refreshAttendance, refreshLeaveRequests, refreshPayroll])

  // Update lastUpdated when any data changes
  useEffect(() => {
    if (users || attendance || leaveRequests || payroll) {
      setLastUpdated(new Date())
    }
  }, [users, attendance, leaveRequests, payroll])

  const value: DataContextType = {
    users,
    usersLoading,
    usersError,
    refreshUsers,
    attendance,
    attendanceLoading,
    attendanceError,
    refreshAttendance,
    leaveRequests,
    leaveRequestsLoading,
    leaveRequestsError,
    refreshLeaveRequests,
    payroll,
    payrollLoading,
    payrollError,
    refreshPayroll,
    refreshAll,
    lastUpdated
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

// Specific hooks for individual data types
export function useUsers() {
  const { users, usersLoading, usersError, refreshUsers } = useData()
  return { users, loading: usersLoading, error: usersError, refresh: refreshUsers }
}

export function useAttendance() {
  const { attendance, attendanceLoading, attendanceError, refreshAttendance } = useData()
  return { attendance, loading: attendanceLoading, error: attendanceError, refresh: refreshAttendance }
}

export function useLeaveRequests() {
  const { leaveRequests, leaveRequestsLoading, leaveRequestsError, refreshLeaveRequests } = useData()
  return { leaveRequests, loading: leaveRequestsLoading, error: leaveRequestsError, refresh: refreshLeaveRequests }
}

export function usePayroll() {
  const { payroll, payrollLoading, payrollError, refreshPayroll } = useData()
  return { payroll, loading: payrollLoading, error: payrollError, refresh: refreshPayroll }
}
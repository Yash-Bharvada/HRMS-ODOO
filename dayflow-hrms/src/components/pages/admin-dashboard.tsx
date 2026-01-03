'use client'

import React, { useState, useEffect } from 'react'
import { Users, Clock, FileText, CheckCircle, XCircle } from 'lucide-react'
import { DashboardCard } from '../ui/dashboard-card'
import { DataTable } from '../ui/data-table'
import { Button } from '../ui/button'
import { LoadingSpinner } from '../ui/loading-spinner'
import { User, LeaveRequest, AttendanceRecord, DataTableColumn } from '../../types'
import { mockUsers, mockLeaveRequests, mockAttendance } from '../../services/mock-data'

export function AdminDashboard() {
  const [employees, setEmployees] = useState<User[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setEmployees(mockUsers)
        setLeaveRequests(mockLeaveRequests)
        setAttendance(mockAttendance)
      } catch (error) {
        console.error('Error loading admin dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Handle leave request approval/rejection
  const handleLeaveAction = async (leaveId: string, action: 'approved' | 'rejected', comment?: string) => {
    try {
      setLeaveRequests(prev => 
        prev.map(request => 
          request.id === leaveId 
            ? { 
                ...request, 
                status: action, 
                adminComment: comment || `Request ${action}`,
                updatedAt: new Date()
              }
            : request
        )
      )
    } catch (error) {
      console.error('Error updating leave request:', error)
    }
  }

  // Calculate summary statistics
  const totalEmployees = employees.length
  const todayAttendance = attendance.filter(record => 
    record.date === new Date().toISOString().split('T')[0]
  ).length
  const pendingLeaveRequests = leaveRequests.filter(request => request.status === 'pending').length

  // Define columns for leave requests table
  const leaveRequestColumns: DataTableColumn<LeaveRequest & { employeeName: string }>[] = [
    {
      key: 'employeeName',
      label: 'Employee',
      sortable: true
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <span className="capitalize px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
          {value}
        </span>
      )
    },
    {
      key: 'fromDate',
      label: 'From Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'toDate',
      label: 'To Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'reason',
      label: 'Reason',
      sortable: false
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const statusColors = {
          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }
        return (
          <span className={`capitalize px-2 py-1 rounded-full text-xs ${statusColors[value as keyof typeof statusColors]}`}>
            {value}
          </span>
        )
      }
    },
    {
      key: 'id',
      label: 'Actions',
      sortable: false,
      render: (_, item) => (
        item.status === 'pending' ? (
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleLeaveAction(item.id, 'approved')}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleLeaveAction(item.id, 'rejected')}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">
            {item.adminComment || `Request ${item.status}`}
          </span>
        )
      )
    }
  ]

  // Define columns for employee list table
  const employeeColumns: DataTableColumn<User>[] = [
    {
      key: 'employeeId',
      label: 'Employee ID',
      sortable: true
    },
    {
      key: 'fullName',
      label: 'Full Name',
      sortable: true
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value) => (
        <span className="capitalize px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
          {value}
        </span>
      )
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: false
    },
    {
      key: 'createdAt',
      label: 'Joined Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    }
  ]

  // Prepare leave requests data with employee names
  const leaveRequestsWithNames = leaveRequests.map(request => ({
    ...request,
    employeeName: employees.find(emp => emp.id === request.employeeId)?.fullName || 'Unknown Employee'
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner text="Loading admin dashboard..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage employees, attendance, and leave requests
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          title="Total Employees"
          value={totalEmployees}
          icon={Users}
        />
        <DashboardCard
          title="Today's Attendance"
          value={todayAttendance}
          icon={Clock}
        />
        <DashboardCard
          title="Pending Leave Requests"
          value={pendingLeaveRequests}
          icon={FileText}
        />
      </div>

      {/* Leave Requests Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Leave Requests</h2>
          <p className="text-muted-foreground">
            Review and manage employee leave requests
          </p>
        </div>
        <DataTable
          data={leaveRequestsWithNames}
          columns={leaveRequestColumns}
          className="bg-card"
        />
      </div>

      {/* Employee List Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Employee List</h2>
          <p className="text-muted-foreground">
            View and manage all employees
          </p>
        </div>
        <DataTable
          data={employees}
          columns={employeeColumns}
          className="bg-card"
        />
      </div>
    </div>
  )
}
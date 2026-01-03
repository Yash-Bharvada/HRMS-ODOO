'use client'

import React, { useState, useEffect } from 'react'
import { 
  Clock, 
  Calendar, 
  DollarSign, 
  User,
  CheckCircle,
  AlertCircle,
  Clock3
} from 'lucide-react'
import { DashboardCard } from '@/components/ui/dashboard-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuth } from '@/contexts/auth-context'
import { AttendanceRecord, LeaveRequest } from '@/types'

interface DashboardData {
  todayAttendance: AttendanceRecord | null
  pendingLeaveRequests: number
  totalWorkingHours: number
  recentActivity: {
    checkInTime: string | null
    leaveStatus: string
  }
}

export function EmployeeDashboard() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))

        // Import mock data dynamically to get the latest values
        const { mockAttendance, mockLeaveRequests } = await import('@/services/mock-data')

        // Get today's attendance for the current user
        const today = new Date().toISOString().split('T')[0]
        const todayAttendance = mockAttendance.find(
          record => record.employeeId === user.id && record.date === today
        ) || null

        // Get pending leave requests for the current user
        const pendingLeaves = mockLeaveRequests.filter(
          request => request.employeeId === user.id && request.status === 'pending'
        ).length

        // Calculate total working hours for current month
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        const monthlyAttendance = mockAttendance.filter(record => {
          const recordDate = new Date(record.date)
          return record.employeeId === user.id && 
                 recordDate.getMonth() === currentMonth &&
                 recordDate.getFullYear() === currentYear &&
                 record.duration
        })
        const totalHours = monthlyAttendance.reduce((sum, record) => sum + (record.duration || 0), 0)

        // Get recent activity data
        const checkInTime = todayAttendance?.checkIn 
          ? todayAttendance.checkIn.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          : null

        const latestLeave = mockLeaveRequests
          .filter(request => request.employeeId === user.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        
        const leaveStatus = latestLeave 
          ? `${latestLeave.status.charAt(0).toUpperCase() + latestLeave.status.slice(1)} leave request`
          : 'No recent leave requests'

        setDashboardData({
          todayAttendance,
          pendingLeaveRequests: pendingLeaves,
          totalWorkingHours: Math.round(totalHours * 10) / 10,
          recentActivity: {
            checkInTime,
            leaveStatus
          }
        })
      } catch (err) {
        setError('Failed to load dashboard data. Please try again.')
        console.error('Dashboard data loading error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Error Loading Dashboard</h3>
          <p className="text-muted-foreground">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!user || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No user data available</p>
      </div>
    )
  }

  const getAttendanceStatusIcon = () => {
    if (!dashboardData.todayAttendance) {
      return <Clock3 className="h-8 w-8 text-muted-foreground" />
    }
    
    switch (dashboardData.todayAttendance.status) {
      case 'present':
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case 'half-day':
        return <Clock className="h-8 w-8 text-yellow-500" />
      case 'absent':
        return <AlertCircle className="h-8 w-8 text-red-500" />
      case 'leave':
        return <Calendar className="h-8 w-8 text-blue-500" />
      default:
        return <Clock3 className="h-8 w-8 text-muted-foreground" />
    }
  }

  const getAttendanceStatusText = () => {
    if (!dashboardData.todayAttendance) {
      return 'Not checked in'
    }
    
    switch (dashboardData.todayAttendance.status) {
      case 'present':
        return 'Present'
      case 'half-day':
        return 'Half Day'
      case 'absent':
        return 'Absent'
      case 'leave':
        return 'On Leave'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">
              Welcome back, {user.fullName}!
            </h1>
            <p className="text-muted-foreground">
              Employee ID: {user.employeeId} • {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Today's Status"
          value={getAttendanceStatusText()}
          icon={() => getAttendanceStatusIcon()}
        />
        
        <DashboardCard
          title="Pending Leaves"
          value={dashboardData.pendingLeaveRequests}
          icon={Calendar}
        />
        
        <DashboardCard
          title="Monthly Hours"
          value={`${dashboardData.totalWorkingHours}h`}
          icon={Clock}
        />
        
        <DashboardCard
          title="Salary"
          value={user.salary ? `$${user.salary.toLocaleString()}` : 'N/A'}
          icon={DollarSign}
        />
      </div>

      {/* Recent Activity Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-card-foreground">Check-in Time</p>
                <p className="text-sm text-muted-foreground">Today's attendance</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-card-foreground">
                {dashboardData.recentActivity.checkInTime || 'Not checked in'}
              </p>
              <p className="text-sm text-muted-foreground">
                {dashboardData.todayAttendance?.date || 'Today'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-card-foreground">Leave Status</p>
                <p className="text-sm text-muted-foreground">Latest request</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-card-foreground">
                {dashboardData.recentActivity.leaveStatus}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
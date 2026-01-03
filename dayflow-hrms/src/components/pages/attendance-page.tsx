'use client'

import React, { useState, useEffect } from 'react'
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Clock3,
  Filter,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/contexts/auth-context'
import { AttendanceRecord, User } from '@/types'
import { attendanceService, userService } from '@/services/data.service'

export function AttendancePage() {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [employees, setEmployees] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null)
  const [filterDate, setFilterDate] = useState('')

  // Calculate attendance status based on check-in/out times
  const calculateAttendanceStatus = (record: AttendanceRecord): 'PRESENT' | 'HALF_DAY' | 'ABSENT' | 'LEAVE' => {
    if (record.status === 'LEAVE') return 'LEAVE'
    if (!record.checkIn) return 'ABSENT'
    if (!record.checkOut) return 'HALF_DAY'
    
    const checkInTime = new Date(record.checkIn).getTime()
    const checkOutTime = new Date(record.checkOut).getTime()
    const durationHours = (checkOutTime - checkInTime) / (1000 * 60 * 60)
    
    return durationHours < 4 ? 'HALF_DAY' : 'PRESENT'
  }

  useEffect(() => {
    const loadAttendanceData = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        setError(null)

        if (user.role === 'ADMIN') {
          const [records, employeeList] = await Promise.all([
            attendanceService.getAll(),
            userService.getAll()
          ])
          setAttendanceRecords(records)
          setEmployees(employeeList)
        } else {
          const records = await (attendanceService as any).getByEmployeeId(user.id)
          setAttendanceRecords(records)
        }

        // Find today's record
        const today = new Date().toISOString().split('T')[0]
        const todaysRecord = attendanceRecords.find(
          record => record.employeeId === user.id && record.date === today
        )
        setTodayRecord(todaysRecord || null)

      } catch (err) {
        setError('Failed to load attendance data. Please try again.')
        console.error('Attendance data loading error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadAttendanceData()
  }, [user])

  const handleCheckIn = async () => {
    if (!user) return

    setIsCheckingIn(true)
    try {
      const newRecord = await (attendanceService as any).checkIn(user.id)
      setTodayRecord(newRecord)
      
      // Reload attendance data
      const records = user.role === 'ADMIN' 
        ? await attendanceService.getAll()
        : await (attendanceService as any).getByEmployeeId(user.id)
      setAttendanceRecords(records)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check in. Please try again.')
    } finally {
      setIsCheckingIn(false)
    }
  }

  const handleCheckOut = async () => {
    if (!user || !todayRecord) return

    setIsCheckingOut(true)
    try {
      const updatedRecord = await (attendanceService as any).checkOut(user.id)
      setTodayRecord(updatedRecord)
      
      // Reload attendance data
      const records = user.role === 'ADMIN' 
        ? await attendanceService.getAll()
        : await (attendanceService as any).getByEmployeeId(user.id)
      setAttendanceRecords(records)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check out. Please try again.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'half-day':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'absent':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'leave':
        return <Calendar className="h-4 w-4 text-blue-500" />
      default:
        return <Clock3 className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'text-green-500'
      case 'half-day':
        return 'text-yellow-500'
      case 'absent':
        return 'text-red-500'
      case 'leave':
        return 'text-blue-500'
      default:
        return 'text-muted-foreground'
    }
  }

  // Export attendance data to CSV
  const handleExport = () => {
    try {
      if (filteredRecords.length === 0) {
        showError('No Data', 'No attendance records to export')
        return
      }

      const dataToExport = filteredRecords.map(record => ({
        Date: new Date(record.date).toLocaleDateString(),
        ...(user?.role === 'ADMIN' && { Employee: getEmployeeName(record.employeeId) }),
        'Check In': record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : '-',
        'Check Out': record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : '-',
        Hours: record.duration ? `${record.duration}h` : '-',
        Status: record.status.charAt(0).toUpperCase() + record.status.slice(1)
      }))

      // Convert to CSV
      const headers = Object.keys(dataToExport[0] || {})
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value
          }).join(',')
        )
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      
      const filename = `attendance_${filterDate || 'all'}_${new Date().toISOString().split('T')[0]}.csv`
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      success('Export Successful', `Attendance data exported as ${filename}`)
    } catch (err) {
      showError('Export Failed', 'Failed to export attendance data')
    }
  }

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee ? `${employee.firstName} ${employee.lastName}` : `Employee ${employeeId}`
  }

  // Filter records by date if filter is applied
  const filteredRecords = filterDate 
    ? attendanceRecords.filter(record => record.date === filterDate)
    : attendanceRecords

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Error Loading Attendance</h3>
          <p className="text-muted-foreground">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Employee Check-in/out Section */}
      {user?.role === 'EMPLOYEE' && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">Today's Attendance</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center">
                {getStatusIcon(todayRecord?.status || 'ABSENT')}
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <p className="text-lg font-bold text-gray-900">
                    {todayRecord ? todayRecord.status.charAt(0).toUpperCase() + todayRecord.status.slice(1) : 'Not checked in'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center">
                <Clock className="h-6 w-6 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Check In</p>
                  <p className="text-lg font-bold text-gray-900">
                    {todayRecord?.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : 'Not checked in'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center">
                <Clock3 className="h-6 w-6 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Hours Today</p>
                  <p className="text-lg font-bold text-gray-900">
                    {todayRecord?.duration ? `${todayRecord.duration}h` : '0h'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleCheckIn}
              disabled={isCheckingIn || !!todayRecord?.checkIn}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingIn ? 'Checking In...' : (todayRecord?.checkIn ? 'Already Checked In' : 'Check In')}
            </button>
            
            <button
              onClick={handleCheckOut}
              disabled={isCheckingOut || !todayRecord?.checkIn || !!todayRecord?.checkOut}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingOut ? 'Checking Out...' : (todayRecord?.checkOut ? 'Already Checked Out' : 'Check Out')}
            </button>
          </div>
        </div>
      )}

      {/* Attendance History */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            {user?.role === 'ADMIN' ? 'All Employee Attendance' : 'Attendance History'}
          </h2>
          
          <div className="flex items-center space-x-2">
            {user?.role === 'ADMIN' && (
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-40"
                  placeholder="dd-mm-yyyy"
                />
                {filterDate && (
                  <button
                    onClick={() => setFilterDate('')}
                    className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
            
            <button onClick={handleExport} className="flex items-center px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                {user?.role === 'ADMIN' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  {user?.role === 'ADMIN' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getEmployeeName(record.employeeId)}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.duration ? `${record.duration}h` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="capitalize">{record.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { Users, Clock, FileText, CheckCircle, XCircle, Plus, X } from 'lucide-react'
import { DashboardCard } from '../ui/dashboard-card'
import { DataTable } from '../ui/data-table'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { LoadingSpinner } from '../ui/loading-spinner'
import { useToast } from '../ui/toast'
import { User, LeaveRequest, AttendanceRecord, DataTableColumn } from '../../types'
import { userService, leaveService, attendanceService } from '../../services/data.service'

interface AddEmployeeForm {
  fullName: string
  email: string
  employeeId: string
  role: 'employee' | 'admin'
  phone: string
  address: string
  salary: string
}

interface FormErrors {
  [key: string]: string
}

export function AdminDashboard() {
  const [employees, setEmployees] = useState<User[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [addingEmployee, setAddingEmployee] = useState(false)
  const { success, error } = useToast()

  // Add employee form state
  const [addEmployeeForm, setAddEmployeeForm] = useState<AddEmployeeForm>({
    fullName: '',
    email: '',
    employeeId: '',
    role: 'employee',
    phone: '',
    address: '',
    salary: ''
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [employeeData, leaveData, attendanceData] = await Promise.all([
          userService.getAll(),
          leaveService.getAll(),
          attendanceService.getAll()
        ])
        
        setEmployees(employeeData)
        setLeaveRequests(leaveData)
        setAttendance(attendanceData)
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
      if (action === 'approved') {
        await (leaveService as any).approveRequest(leaveId, comment || 'Request approved')
      } else {
        await (leaveService as any).rejectRequest(leaveId, comment || 'Request rejected')
      }
      
      // Reload leave requests
      const updatedLeaveRequests = await leaveService.getAll()
      setLeaveRequests(updatedLeaveRequests)
    } catch (error) {
      console.error('Error updating leave request:', error)
    }
  }

  // Validate add employee form
  const validateAddEmployeeForm = (): boolean => {
    const errors: FormErrors = {}

    if (!addEmployeeForm.fullName.trim()) {
      errors.fullName = 'Full name is required'
    }

    if (!addEmployeeForm.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addEmployeeForm.email)) {
      errors.email = 'Please enter a valid email address'
    } else if (employees.some(emp => emp.email === addEmployeeForm.email)) {
      errors.email = 'Email already exists'
    }

    if (!addEmployeeForm.employeeId.trim()) {
      errors.employeeId = 'Employee ID is required'
    } else if (employees.some(emp => emp.employeeId === addEmployeeForm.employeeId)) {
      errors.employeeId = 'Employee ID already exists'
    }

    if (addEmployeeForm.salary && (isNaN(Number(addEmployeeForm.salary)) || Number(addEmployeeForm.salary) < 0)) {
      errors.salary = 'Salary must be a positive number'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle add employee form submission
  const handleAddEmployee = async () => {
    if (!validateAddEmployeeForm()) return

    setAddingEmployee(true)
    try {
      const newEmployee: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
        fullName: addEmployeeForm.fullName.trim(),
        email: addEmployeeForm.email.trim(),
        employeeId: addEmployeeForm.employeeId.trim(),
        role: addEmployeeForm.role,
        phone: addEmployeeForm.phone.trim() || undefined,
        address: addEmployeeForm.address.trim() || undefined,
        salary: addEmployeeForm.salary ? Number(addEmployeeForm.salary) : undefined
      }

      const createdEmployee = await userService.create(newEmployee)
      setEmployees(prev => [...prev, createdEmployee])
      
      // Reset form and close modal
      setAddEmployeeForm({
        fullName: '',
        email: '',
        employeeId: '',
        role: 'employee',
        phone: '',
        address: '',
        salary: ''
      })
      setFormErrors({})
      setShowAddEmployee(false)
      
      success('Employee Added', `${createdEmployee.fullName} has been added successfully`)
    } catch (err) {
      error('Failed to Add Employee', err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setAddingEmployee(false)
    }
  }

  // Handle form input changes
  const handleFormChange = (field: keyof AddEmployeeForm, value: string) => {
    setAddEmployeeForm(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
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
      key: 'salary',
      label: 'Salary',
      sortable: true,
      render: (value) => (
        value ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0
        }).format(value) : 'Not set'
      )
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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Employee List</h2>
            <p className="text-muted-foreground">
              View and manage all employees
            </p>
          </div>
          <Button onClick={() => setShowAddEmployee(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Employee</span>
          </Button>
        </div>
        <DataTable
          data={employees}
          columns={employeeColumns}
          className="bg-card"
        />
      </div>

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddEmployee(false)
            }
          }}
        >
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-card-foreground">Add New Employee</h3>
              <button
                onClick={() => setShowAddEmployee(false)}
                className="text-muted-foreground hover:text-card-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAddEmployee(); }} className="space-y-4">
              <Input
                label="Full Name *"
                value={addEmployeeForm.fullName}
                onChange={(e) => handleFormChange('fullName', e.target.value)}
                error={formErrors.fullName}
                placeholder="Enter full name"
              />

              <Input
                label="Email *"
                type="email"
                value={addEmployeeForm.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                error={formErrors.email}
                placeholder="Enter email address"
              />

              <Input
                label="Employee ID *"
                value={addEmployeeForm.employeeId}
                onChange={(e) => handleFormChange('employeeId', e.target.value)}
                error={formErrors.employeeId}
                placeholder="Enter employee ID (e.g., EMP006)"
              />

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-foreground">
                  Role *
                </label>
                <select
                  value={addEmployeeForm.role}
                  onChange={(e) => handleFormChange('role', e.target.value as 'employee' | 'admin')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <Input
                label="Phone"
                value={addEmployeeForm.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
                error={formErrors.phone}
                placeholder="Enter phone number"
              />

              <Input
                label="Address"
                value={addEmployeeForm.address}
                onChange={(e) => handleFormChange('address', e.target.value)}
                error={formErrors.address}
                placeholder="Enter address"
              />

              <Input
                label="Salary"
                type="number"
                value={addEmployeeForm.salary}
                onChange={(e) => handleFormChange('salary', e.target.value)}
                error={formErrors.salary}
                placeholder="Enter salary amount"
                min="0"
                step="1000"
              />

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddEmployee(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={addingEmployee}
                  disabled={addingEmployee}
                  className="flex-1"
                >
                  {addingEmployee ? 'Adding...' : 'Add Employee'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
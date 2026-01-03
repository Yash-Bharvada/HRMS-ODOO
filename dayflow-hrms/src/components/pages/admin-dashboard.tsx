'use client'

import React, { useState, useEffect } from 'react'
import { Users, Clock, FileText, CheckCircle, XCircle, Plus, X } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { LoadingSpinner } from '../ui/loading-spinner'
import { useToast } from '../ui/toast'
import { User, LeaveRequest, AttendanceRecord } from '../../types'
import { userService, leaveService, attendanceService } from '../../services/data.service'

interface AddEmployeeForm {
  firstName: string
  lastName: string
  email: string
  role: 'EMPLOYEE' | 'ADMIN'
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
    firstName: '',
    lastName: '',
    email: '',
    role: 'EMPLOYEE',
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

    if (!addEmployeeForm.firstName.trim()) {
      errors.firstName = 'First name is required'
    }

    if (!addEmployeeForm.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }

    if (!addEmployeeForm.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addEmployeeForm.email)) {
      errors.email = 'Please enter a valid email address'
    } else if (employees.some(emp => emp.email === addEmployeeForm.email)) {
      errors.email = 'Email already exists'
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
        firstName: addEmployeeForm.firstName.trim(),
        lastName: addEmployeeForm.lastName.trim(),
        email: addEmployeeForm.email.trim(),
        role: addEmployeeForm.role,
        phone: addEmployeeForm.phone.trim() || undefined,
        address: addEmployeeForm.address.trim() || undefined,
        salary: addEmployeeForm.salary ? Number(addEmployeeForm.salary) : undefined
      }

      const createdEmployee = await userService.create(newEmployee)
      setEmployees(prev => [...prev, createdEmployee])
      
      // Reset form and close modal
      setAddEmployeeForm({
        firstName: '',
        lastName: '',
        email: '',
        role: 'EMPLOYEE',
        phone: '',
        address: '',
        salary: ''
      })
      setFormErrors({})
      setShowAddEmployee(false)
      
      success('Employee Added', `${createdEmployee.firstName} ${createdEmployee.lastName} has been added successfully`)
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
  const pendingLeaveRequests = leaveRequests.filter(request => request.status === 'PENDING').length

  // Prepare leave requests data with employee names
  const leaveRequestsWithNames = leaveRequests.map(request => {
    const employee = employees.find(emp => emp.id === request.employeeId);
    return {
      ...request,
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee'
    };
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
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
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{todayAttendance}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Leave Requests</p>
              <p className="text-2xl font-bold text-gray-900">{pendingLeaveRequests}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Requests Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Leave Requests</h2>
          <p className="text-muted-foreground">
            Review and manage employee leave requests
          </p>
        </div>
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaveRequestsWithNames.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {request.employeeName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.leaveType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {request.status === 'PENDING' ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleLeaveAction(request.id, 'approved')}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 px-2 py-1 rounded border"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleLeaveAction(request.id, 'rejected')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded border"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">
                        {request.comments || `Request ${request.status}`}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
          <button onClick={() => setShowAddEmployee(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            <span>Add Employee</span>
          </button>
        </div>
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {employee.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.firstName} {employee.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="capitalize px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {employee.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                label="First Name *"
                value={addEmployeeForm.firstName}
                onChange={(e) => handleFormChange('firstName', e.target.value)}
                error={formErrors.firstName}
                placeholder="Enter first name"
              />

              <Input
                label="Last Name *"
                value={addEmployeeForm.lastName}
                onChange={(e) => handleFormChange('lastName', e.target.value)}
                error={formErrors.lastName}
                placeholder="Enter last name"
              />

              <Input
                label="Email *"
                type="email"
                value={addEmployeeForm.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                error={formErrors.email}
                placeholder="Enter email address"
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
                <button
                  type="button"
                  onClick={() => setShowAddEmployee(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingEmployee}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {addingEmployee ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
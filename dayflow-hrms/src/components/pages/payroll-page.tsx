'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Calendar, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { User, PayrollData, DataTableColumn } from '@/types'
import { userService, payrollService } from '@/services/data.service'

interface PayrollFormData {
  [employeeId: string]: number
}

interface PayrollFormErrors {
  [employeeId: string]: string
}

export function PayrollPage() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [formData, setFormData] = useState<PayrollFormData>({})
  const [formErrors, setFormErrors] = useState<PayrollFormErrors>({})
  const [saveMessage, setSaveMessage] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [user, selectedMonth])

  const loadData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      if (user.role === 'admin') {
        const employeeList = await userService.getAll()
        setEmployees(employeeList)
        
        // Initialize form data with current salaries
        const initialFormData: PayrollFormData = {}
        employeeList.forEach(emp => {
          initialFormData[emp.id] = emp.salary || 0
        })
        setFormData(initialFormData)
      } else {
        // Employee view - just load their own payroll data
        const payroll = await payrollService.getAll()
        // For employee view, we don't need to set payroll data since we use user.salary directly
      }
    } catch (error) {
      console.error('Failed to load payroll data:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateSalary = (salary: number): string | null => {
    if (isNaN(salary) || salary < 0) {
      return 'Salary must be a positive number'
    }
    if (salary > 10000000) {
      return 'Salary cannot exceed 10,000,000'
    }
    return null
  }

  const handleSalaryChange = (employeeId: string, value: string) => {
    const numericValue = parseFloat(value) || 0
    setFormData(prev => ({
      ...prev,
      [employeeId]: numericValue
    }))
    
    // Clear error when user starts typing
    if (formErrors[employeeId]) {
      setFormErrors(prev => ({
        ...prev,
        [employeeId]: ''
      }))
    }
    
    // Clear save message
    if (saveMessage) {
      setSaveMessage('')
    }
  }

  const handleSaveSalary = async (employeeId: string) => {
    const salary = formData[employeeId]
    const error = validateSalary(salary)
    
    if (error) {
      setFormErrors(prev => ({
        ...prev,
        [employeeId]: error
      }))
      return
    }

    setSaving(true)
    try {
      await userService.update(employeeId, { salary })
      setSaveMessage('Salary updated successfully')
      setTimeout(() => setSaveMessage(''), 3000)
      
      // Update local employee data
      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId ? { ...emp, salary } : emp
      ))
    } catch (error) {
      setFormErrors(prev => ({
        ...prev,
        [employeeId]: 'Failed to update salary'
      }))
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getMonthName = (monthString: string) => {
    const [year, month] = monthString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  }

  // Employee view - read-only salary display
  if (user?.role === 'employee') {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner text="Loading payroll information..." />
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payroll Information</h1>
            <p className="text-muted-foreground">View your salary and compensation details</p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-4 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">Select Month</h2>
          </div>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="max-w-xs"
            label="Month"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Viewing payroll for {getMonthName(selectedMonth)}
          </p>
        </div>

        {/* Salary Display */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-4 mb-6">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">Monthly Salary</h2>
              <p className="text-muted-foreground">Your current compensation</p>
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-foreground mb-2">
              {user.salary ? formatCurrency(user.salary) : 'Not Available'}
            </div>
            <p className="text-muted-foreground">
              {user.salary ? 'Monthly Gross Salary' : 'Salary information not configured'}
            </p>
          </div>

          {!user.salary && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Your salary information is not available. Please contact HR for assistance.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Admin view - editable salary management
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner text="Loading payroll data..." />
      </div>
    )
  }

  const adminColumns: DataTableColumn<User>[] = [
    {
      key: 'employeeId',
      label: 'Employee ID',
      sortable: true
    },
    {
      key: 'fullName',
      label: 'Employee Name',
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
        <span className="capitalize">{value}</span>
      )
    },
    {
      key: 'salary',
      label: 'Current Salary',
      sortable: true,
      render: (value) => (
        <span className="font-medium">
          {value ? formatCurrency(value) : 'Not Set'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'New Salary',
      sortable: false,
      render: (_, employee) => (
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            value={formData[employee.id] || ''}
            onChange={(e) => handleSalaryChange(employee.id, e.target.value)}
            placeholder="Enter salary"
            className="w-32"
            min="0"
            step="1000"
          />
          <Button
            size="sm"
            onClick={() => handleSaveSalary(employee.id)}
            disabled={saving || !formData[employee.id]}
            loading={saving}
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>
      )
    },
    {
      key: 'updatedAt',
      label: 'Status',
      sortable: false,
      render: (_, employee) => (
        <div className="min-w-[120px]">
          {formErrors[employee.id] && (
            <p className="text-sm text-destructive">{formErrors[employee.id]}</p>
          )}
          {saveMessage && !formErrors[employee.id] && (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Updated</span>
            </div>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payroll Management</h1>
          <p className="text-muted-foreground">Manage employee salary information</p>
        </div>
      </div>

      {/* Success Message */}
      {saveMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">{saveMessage}</p>
          </div>
        </div>
      )}

      {/* Employee Salary Table */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">Employee Salaries</h2>
        <DataTable
          data={employees}
          columns={adminColumns}
          loading={loading}
        />
      </div>

      {/* Instructions */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="font-medium text-foreground mb-2">Instructions</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Enter the new salary amount in the "New Salary" field</li>
          <li>• Click the save button to update the employee's salary</li>
          <li>• Salary must be a positive number and cannot exceed $10,000,000</li>
          <li>• Changes are saved immediately and will be reflected in the employee's profile</li>
        </ul>
      </div>
    </div>
  )
}
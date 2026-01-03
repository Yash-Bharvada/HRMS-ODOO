'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { LeaveRequest, User, DataTableColumn } from '@/types'
import { leaveService, userService } from '@/services/data.service'

interface LeaveFormData {
  type: 'paid' | 'sick' | 'unpaid'
  fromDate: string
  toDate: string
  reason: string
}

interface LeaveFormErrors {
  type?: string
  fromDate?: string
  toDate?: string
  reason?: string
}

export function LeavePage() {
  const { user } = useAuth()
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [adminComment, setAdminComment] = useState('')
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')

  const [formData, setFormData] = useState<LeaveFormData>({
    type: 'paid',
    fromDate: '',
    toDate: '',
    reason: ''
  })
  const [formErrors, setFormErrors] = useState<LeaveFormErrors>({})

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      if (user.role === 'admin') {
        const [requests, employeeList] = await Promise.all([
          leaveService.getAll(),
          userService.getAll()
        ])
        setLeaveRequests(requests)
        setEmployees(employeeList)
      } else {
        const requests = await (leaveService as any).getByEmployeeId(user.id)
        setLeaveRequests(requests)
      }
    } catch (error) {
      console.error('Failed to load leave data:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: LeaveFormErrors = {}

    if (!formData.type) {
      errors.type = 'Leave type is required'
    }

    if (!formData.fromDate) {
      errors.fromDate = 'From date is required'
    }

    if (!formData.toDate) {
      errors.toDate = 'To date is required'
    }

    if (formData.fromDate && formData.toDate) {
      const fromDate = new Date(formData.fromDate)
      const toDate = new Date(formData.toDate)
      
      if (fromDate > toDate) {
        errors.toDate = 'To date must be after from date'
      }

      if (fromDate < new Date()) {
        errors.fromDate = 'From date cannot be in the past'
      }
    }

    if (!formData.reason.trim()) {
      errors.reason = 'Reason is required'
    } else if (formData.reason.trim().length < 10) {
      errors.reason = 'Reason must be at least 10 characters'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !user) return

    setSubmitting(true)
    try {
      await leaveService.create({
        employeeId: user.id,
        type: formData.type,
        fromDate: new Date(formData.fromDate),
        toDate: new Date(formData.toDate),
        reason: formData.reason.trim()
      })

      // Reset form and reload data
      setFormData({
        type: 'paid',
        fromDate: '',
        toDate: '',
        reason: ''
      })
      setFormErrors({})
      setShowForm(false)
      await loadData()
    } catch (error) {
      console.error('Failed to submit leave request:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdminAction = async () => {
    if (!selectedRequest) return

    setSubmitting(true)
    try {
      if (actionType === 'approve') {
        await (leaveService as any).approveRequest(selectedRequest.id, adminComment.trim() || undefined)
      } else {
        await (leaveService as any).rejectRequest(selectedRequest.id, adminComment.trim() || undefined)
      }

      setShowCommentModal(false)
      setSelectedRequest(null)
      setAdminComment('')
      await loadData()
    } catch (error) {
      console.error('Failed to update leave request:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const openActionModal = (request: LeaveRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request)
    setActionType(action)
    setAdminComment(request.adminComment || '')
    setShowCommentModal(true)
  }

  const getStatusIcon = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee?.fullName || 'Unknown Employee'
  }

  // Define columns based on user role
  const employeeColumns: DataTableColumn<LeaveRequest>[] = [
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <span className="capitalize font-medium">{value}</span>
      )
    },
    {
      key: 'fromDate',
      label: 'From Date',
      sortable: true,
      render: (value) => formatDate(value)
    },
    {
      key: 'toDate',
      label: 'To Date',
      sortable: true,
      render: (value) => formatDate(value)
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (value) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(value)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(value)}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Applied On',
      sortable: true,
      render: (value) => formatDate(value)
    }
  ]

  const adminColumns: DataTableColumn<LeaveRequest>[] = [
    {
      key: 'employeeId',
      label: 'Employee',
      sortable: true,
      render: (value) => getEmployeeName(value)
    },
    ...employeeColumns.slice(0, -1), // All employee columns except 'Applied On'
    {
      key: 'adminComment',
      label: 'Comment',
      render: (value) => value ? (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      ) : '-'
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, request) => (
        request.status === 'pending' ? (
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openActionModal(request, 'approve')}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openActionModal(request, 'reject')}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </span>
        )
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner text="Loading leave requests..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leave Management</h1>
          <p className="text-muted-foreground">
            {user?.role === 'admin' 
              ? 'Manage employee leave requests' 
              : 'Apply for leave and track your requests'
            }
          </p>
        </div>
        {user?.role === 'employee' && (
          <Button onClick={() => setShowForm(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Apply for Leave
          </Button>
        )}
      </div>

      {/* Leave Requests Table */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">
          {user?.role === 'admin' ? 'All Leave Requests' : 'My Leave Requests'}
        </h2>
        <DataTable
          data={leaveRequests}
          columns={user?.role === 'admin' ? adminColumns : employeeColumns}
          loading={loading}
        />
      </div>

      {/* Leave Application Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Apply for Leave"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Leave Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as LeaveFormData['type'] })}
              className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="paid">Paid Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
            {formErrors.type && (
              <p className="text-sm text-destructive mt-1">{formErrors.type}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="From Date"
              type="date"
              value={formData.fromDate}
              onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
              error={formErrors.fromDate}
            />
            <Input
              label="To Date"
              type="date"
              value={formData.toDate}
              onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
              error={formErrors.toDate}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Reason
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Please provide a detailed reason for your leave request..."
              rows={4}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            {formErrors.reason && (
              <p className="text-sm text-destructive mt-1">{formErrors.reason}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Admin Comment Modal */}
      <Modal
        isOpen={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        title={`${actionType === 'approve' ? 'Approve' : 'Reject'} Leave Request`}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium text-foreground mb-2">Request Details</h3>
            {selectedRequest && (
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><strong>Employee:</strong> {getEmployeeName(selectedRequest.employeeId)}</p>
                <p><strong>Type:</strong> {selectedRequest.type}</p>
                <p><strong>Dates:</strong> {formatDate(selectedRequest.fromDate)} - {formatDate(selectedRequest.toDate)}</p>
                <p><strong>Reason:</strong> {selectedRequest.reason}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Comment (Optional)
            </label>
            <textarea
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              placeholder="Add a comment for the employee..."
              rows={3}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCommentModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdminAction}
              loading={submitting}
              variant={actionType === 'approve' ? 'primary' : 'destructive'}
            >
              {actionType === 'approve' ? 'Approve' : 'Reject'} Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AdminDashboard } from '../../components/pages/admin-dashboard'

// Mock the mock data
jest.mock('../../services/mock-data', () => ({
  mockUsers: [
    {
      id: '1',
      employeeId: 'EMP001',
      fullName: 'John Doe',
      email: 'john.doe@test.com',
      role: 'employee',
      phone: '+1-555-0123',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      employeeId: 'EMP002',
      fullName: 'Jane Smith',
      email: 'jane.smith@test.com',
      role: 'admin',
      phone: '+1-555-0124',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10')
    }
  ],
  mockLeaveRequests: [
    {
      id: 'leave001',
      employeeId: '1',
      type: 'paid',
      fromDate: new Date('2024-02-15'),
      toDate: new Date('2024-02-16'),
      reason: 'Family vacation',
      status: 'pending',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01')
    },
    {
      id: 'leave002',
      employeeId: '2',
      type: 'sick',
      fromDate: new Date('2024-01-28'),
      toDate: new Date('2024-01-29'),
      reason: 'Medical appointment',
      status: 'approved',
      adminComment: 'Approved for medical reasons',
      createdAt: new Date('2024-01-25'),
      updatedAt: new Date('2024-01-26')
    }
  ],
  mockAttendance: [
    {
      id: 'att001',
      employeeId: '1',
      date: new Date().toISOString().split('T')[0],
      checkIn: new Date(new Date().setHours(9, 15, 0, 0)),
      checkOut: new Date(new Date().setHours(17, 30, 0, 0)),
      status: 'present',
      duration: 8.25,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
}))

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders admin dashboard with loading state initially', () => {
    render(<AdminDashboard />)
    
    expect(screen.getByText('Loading admin dashboard...')).toBeInTheDocument()
  })

  it('renders summary cards with correct calculations', async () => {
    render(<AdminDashboard />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading admin dashboard...')).not.toBeInTheDocument()
    })

    // Check summary cards by finding the specific card containers
    expect(screen.getByText('Total Employees')).toBeInTheDocument()
    expect(screen.getByText("Today's Attendance")).toBeInTheDocument()
    expect(screen.getByText('Pending Leave Requests')).toBeInTheDocument()

    // Check that the values are displayed (using getAllByText since values might repeat)
    const values = screen.getAllByText('1')
    expect(values.length).toBeGreaterThanOrEqual(2) // At least 2 cards with value "1"
    
    expect(screen.getByText('2')).toBeInTheDocument() // 2 employees
  })

  it('renders leave requests table with employee information', async () => {
    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading admin dashboard...')).not.toBeInTheDocument()
    })

    // Check leave requests table headers
    expect(screen.getByText('Employee')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('From Date')).toBeInTheDocument()
    expect(screen.getByText('To Date')).toBeInTheDocument()
    expect(screen.getByText('Reason')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()

    // Check leave request data (using getAllByText since names appear in both tables)
    expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Jane Smith').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Family vacation')).toBeInTheDocument()
    expect(screen.getByText('Medical appointment')).toBeInTheDocument()
  })

  it('renders employee list table with basic information', async () => {
    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading admin dashboard...')).not.toBeInTheDocument()
    })

    // Check employee table headers
    expect(screen.getByText('Employee ID')).toBeInTheDocument()
    expect(screen.getByText('Full Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.getByText('Phone')).toBeInTheDocument()
    expect(screen.getByText('Joined Date')).toBeInTheDocument()

    // Check employee data
    expect(screen.getByText('EMP001')).toBeInTheDocument()
    expect(screen.getByText('EMP002')).toBeInTheDocument()
    expect(screen.getByText('john.doe@test.com')).toBeInTheDocument()
    expect(screen.getByText('jane.smith@test.com')).toBeInTheDocument()
  })

  it('displays approve and reject buttons for pending leave requests', async () => {
    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading admin dashboard...')).not.toBeInTheDocument()
    })

    // Should show approve/reject buttons for pending requests
    const approveButtons = screen.getAllByText('Approve')
    const rejectButtons = screen.getAllByText('Reject')
    
    expect(approveButtons).toHaveLength(1) // Only 1 pending request
    expect(rejectButtons).toHaveLength(1)
  })

  it('handles leave request approval', async () => {
    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading admin dashboard...')).not.toBeInTheDocument()
    })

    // Click approve button
    const approveButton = screen.getByText('Approve')
    fireEvent.click(approveButton)

    // Wait for the status to update
    await waitFor(() => {
      expect(screen.getByText('Request approved')).toBeInTheDocument()
    })

    // Approve button should be gone
    expect(screen.queryByText('Approve')).not.toBeInTheDocument()
  })

  it('handles leave request rejection', async () => {
    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading admin dashboard...')).not.toBeInTheDocument()
    })

    // Click reject button
    const rejectButton = screen.getByText('Reject')
    fireEvent.click(rejectButton)

    // Wait for the status to update
    await waitFor(() => {
      expect(screen.getByText('Request rejected')).toBeInTheDocument()
    })

    // Reject button should be gone
    expect(screen.queryByText('Reject')).not.toBeInTheDocument()
  })

  it('shows admin comment for processed leave requests', async () => {
    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading admin dashboard...')).not.toBeInTheDocument()
    })

    // Should show admin comment for approved request
    expect(screen.getByText('Approved for medical reasons')).toBeInTheDocument()
  })

  it('displays correct status badges for leave requests', async () => {
    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading admin dashboard...')).not.toBeInTheDocument()
    })

    // Check status badges
    const pendingBadges = screen.getAllByText('pending')
    const approvedBadges = screen.getAllByText('approved')
    
    expect(pendingBadges).toHaveLength(1)
    expect(approvedBadges).toHaveLength(1)
  })

  it('displays role badges for employees', async () => {
    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading admin dashboard...')).not.toBeInTheDocument()
    })

    // Check role badges in employee table
    const employeeBadges = screen.getAllByText('employee')
    const adminBadges = screen.getAllByText('admin')
    
    expect(employeeBadges).toHaveLength(1)
    expect(adminBadges).toHaveLength(1)
  })
})
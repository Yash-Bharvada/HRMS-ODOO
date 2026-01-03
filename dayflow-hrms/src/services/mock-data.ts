// Mock data for development and testing

import { User, AttendanceRecord, LeaveRequest, PayrollData } from '@/types'

export const mockUsers: User[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    fullName: 'John Doe',
    email: 'john.doe@dayflow.com',
    role: 'employee',
    profilePicture: '/api/placeholder/150/150',
    phone: '+1-555-0123',
    address: '123 Main St, New York, NY 10001',
    salary: 75000,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    employeeId: 'EMP002',
    fullName: 'Jane Smith',
    email: 'jane.smith@dayflow.com',
    role: 'admin',
    profilePicture: '/api/placeholder/150/150',
    phone: '+1-555-0124',
    address: '456 Oak Ave, Los Angeles, CA 90210',
    salary: 95000,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: '3',
    employeeId: 'EMP003',
    fullName: 'Mike Johnson',
    email: 'mike.johnson@dayflow.com',
    role: 'employee',
    profilePicture: '/api/placeholder/150/150',
    phone: '+1-555-0125',
    address: '789 Pine Rd, Chicago, IL 60601',
    salary: 68000,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '4',
    employeeId: 'EMP004',
    fullName: 'Sarah Wilson',
    email: 'sarah.wilson@dayflow.com',
    role: 'employee',
    profilePicture: '/api/placeholder/150/150',
    phone: '+1-555-0126',
    address: '321 Elm St, Houston, TX 77001',
    salary: 72000,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25')
  },
  {
    id: '5',
    employeeId: 'EMP005',
    fullName: 'David Brown',
    email: 'david.brown@dayflow.com',
    role: 'employee',
    profilePicture: '/api/placeholder/150/150',
    phone: '+1-555-0127',
    address: '654 Maple Dr, Phoenix, AZ 85001',
    salary: 70000,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  }
]

export const mockAttendance: AttendanceRecord[] = [
  // Today's attendance
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
  },
  {
    id: 'att002',
    employeeId: '2',
    date: new Date().toISOString().split('T')[0],
    checkIn: new Date(new Date().setHours(8, 45, 0, 0)),
    checkOut: new Date(new Date().setHours(18, 0, 0, 0)),
    status: 'present',
    duration: 9.25,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'att003',
    employeeId: '3',
    date: new Date().toISOString().split('T')[0],
    checkIn: new Date(new Date().setHours(9, 0, 0, 0)),
    status: 'half-day',
    duration: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Yesterday's attendance
  {
    id: 'att004',
    employeeId: '1',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    checkIn: new Date(Date.now() - 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
    checkOut: new Date(Date.now() - 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000),
    status: 'present',
    duration: 8,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  {
    id: 'att005',
    employeeId: '4',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'absent',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  {
    id: 'att006',
    employeeId: '5',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'leave',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  }
]

export const mockLeaveRequests: LeaveRequest[] = [
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
    employeeId: '3',
    type: 'sick',
    fromDate: new Date('2024-01-28'),
    toDate: new Date('2024-01-29'),
    reason: 'Medical appointment',
    status: 'approved',
    adminComment: 'Approved for medical reasons',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-26')
  },
  {
    id: 'leave003',
    employeeId: '4',
    type: 'paid',
    fromDate: new Date('2024-02-20'),
    toDate: new Date('2024-02-22'),
    reason: 'Personal matters',
    status: 'rejected',
    adminComment: 'Insufficient notice period',
    createdAt: new Date('2024-02-18'),
    updatedAt: new Date('2024-02-19')
  },
  {
    id: 'leave004',
    employeeId: '5',
    type: 'unpaid',
    fromDate: new Date('2024-03-01'),
    toDate: new Date('2024-03-03'),
    reason: 'Extended personal leave',
    status: 'pending',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20')
  }
]

export const mockPayroll: PayrollData[] = [
  {
    id: 'pay001',
    employeeId: '1',
    salary: 75000,
    month: 'January',
    year: 2024,
    createdAt: new Date('2024-01-31'),
    updatedAt: new Date('2024-01-31')
  },
  {
    id: 'pay002',
    employeeId: '2',
    salary: 95000,
    month: 'January',
    year: 2024,
    createdAt: new Date('2024-01-31'),
    updatedAt: new Date('2024-01-31')
  },
  {
    id: 'pay003',
    employeeId: '3',
    salary: 68000,
    month: 'January',
    year: 2024,
    createdAt: new Date('2024-01-31'),
    updatedAt: new Date('2024-01-31')
  },
  {
    id: 'pay004',
    employeeId: '4',
    salary: 72000,
    month: 'January',
    year: 2024,
    createdAt: new Date('2024-01-31'),
    updatedAt: new Date('2024-01-31')
  },
  {
    id: 'pay005',
    employeeId: '5',
    salary: 70000,
    month: 'January',
    year: 2024,
    createdAt: new Date('2024-01-31'),
    updatedAt: new Date('2024-01-31')
  },
  // February payroll data
  {
    id: 'pay006',
    employeeId: '1',
    salary: 75000,
    month: 'February',
    year: 2024,
    createdAt: new Date('2024-02-29'),
    updatedAt: new Date('2024-02-29')
  },
  {
    id: 'pay007',
    employeeId: '2',
    salary: 95000,
    month: 'February',
    year: 2024,
    createdAt: new Date('2024-02-29'),
    updatedAt: new Date('2024-02-29')
  }
]
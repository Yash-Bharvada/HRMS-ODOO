// Core type definitions for Dayflow HRMS

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'EMPLOYEE'
  phone?: string
  address?: string
  profilePictureUrl?: string
  salary?: number
  createdAt: Date
  updatedAt: Date
}

export interface AttendanceRecord {
  id: string
  employeeId: string
  date: string
  checkIn?: Date
  checkOut?: Date
  status: 'PRESENT' | 'HALF_DAY' | 'ABSENT' | 'LEAVE'
  duration?: number
  createdAt: Date
  updatedAt: Date
}

export interface LeaveRequest {
  id: string
  employeeId: string
  leaveType: 'PAID' | 'SICK' | 'UNPAID'
  startDate: string
  endDate: string
  reason?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  comments?: string
  createdAt: Date
  updatedAt: Date
}

export interface PayrollData {
  id: string
  employeeId: string
  salary: number
  month: string
  year: number
  createdAt: Date
  updatedAt: Date
}

// Authentication types
export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'EMPLOYEE'
  phone?: string
  address?: string
  salary?: number
}

// Context types
export interface AuthContextType {
  user: User | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  signup: (data: SignupData) => Promise<void>
  loading: boolean
}

export interface AppContextType {
  employees: User[]
  attendance: AttendanceRecord[]
  leaveRequests: LeaveRequest[]
  payroll: PayrollData[]
  refreshData: () => Promise<void>
}

// Service interface types
export interface AuthService {
  login(credentials: LoginCredentials): Promise<User>
  logout(): Promise<void>
  getCurrentUser(): User | null
  signup(data: SignupData): Promise<User>
}

export interface DataService<T> {
  getAll(): Promise<T[]>
  getById(id: string): Promise<T>
  create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  update(id: string, item: Partial<T>): Promise<T>
  delete(id: string): Promise<void>
}

// Specific service interfaces for better type safety
export interface LeaveService extends DataService<LeaveRequest> {
  create(item: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<LeaveRequest>
  getByEmployeeId(employeeId: string): Promise<LeaveRequest[]>
  approveRequest(id: string, adminComment?: string): Promise<LeaveRequest>
  rejectRequest(id: string, adminComment?: string): Promise<LeaveRequest>
}

// Component prop types
export interface DashboardCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  onClick?: () => void
  className?: string
}

export interface DataTableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => React.ReactNode
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  loading?: boolean
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void
  className?: string
}
import {
  DataService,
  User,
  AttendanceRecord,
  LeaveRequest,
  PayrollData,
  LeaveService
} from "@/types";
import { apiService } from "./api.service";

// Attendance service implementation using backend API
export class BackendAttendanceService implements DataService<AttendanceRecord> {
  async getAll(): Promise<AttendanceRecord[]> {
    // Admin endpoint to get all attendance records
    return apiService.get<AttendanceRecord[]>('/attendance');
  }

  async getById(id: string): Promise<AttendanceRecord> {
    return apiService.get<AttendanceRecord>(`/attendance/${id}`);
  }

  async create(item: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<AttendanceRecord> {
    // This would typically be handled by check-in/check-out endpoints
    throw new Error('Use checkIn/checkOut methods instead');
  }

  async update(id: string, item: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    // Admin override functionality
    return apiService.post<AttendanceRecord>('/attendance/override', {
      attendanceId: id,
      ...item
    });
  }

  async delete(id: string): Promise<void> {
    throw new Error('Attendance records cannot be deleted');
  }

  // Additional methods for attendance management
  async getByEmployeeId(employeeId: string): Promise<AttendanceRecord[]> {
    return apiService.get<AttendanceRecord[]>(`/attendance/history?employeeId=${employeeId}`);
  }

  async getByDateRange(startDate: string, endDate?: string): Promise<AttendanceRecord[]> {
    const params = new URLSearchParams({ startDate });
    if (endDate) params.append('endDate', endDate);
    return apiService.get<AttendanceRecord[]>(`/attendance/history?${params}`);
  }

  async checkIn(employeeId?: string): Promise<AttendanceRecord> {
    return apiService.post<AttendanceRecord>('/attendance/check-in');
  }

  async checkOut(employeeId?: string): Promise<AttendanceRecord> {
    return apiService.post<AttendanceRecord>('/attendance/check-out');
  }

  async getTodayAttendance(): Promise<AttendanceRecord | null> {
    try {
      return await apiService.get<AttendanceRecord>('/attendance/today');
    } catch (error) {
      // Return null if no attendance record for today
      return null;
    }
  }

  async getAttendanceHistory(startDate?: string, endDate?: string): Promise<AttendanceRecord[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiService.get<AttendanceRecord[]>(`/attendance/history?${params}`);
  }

  async getAttendanceStats(month: string): Promise<any> {
    return apiService.get(`/attendance/stats/${month}`);
  }
}

// Payroll service implementation using backend API
export class BackendPayrollService implements DataService<PayrollData> {
  async getAll(): Promise<PayrollData[]> {
    // Admin endpoint to get all payroll data
    return apiService.get<PayrollData[]>('/payroll');
  }

  async getById(id: string): Promise<PayrollData> {
    return apiService.get<PayrollData>(`/payroll/${id}`);
  }

  async create(item: Omit<PayrollData, 'id' | 'createdAt' | 'updatedAt'>): Promise<PayrollData> {
    return apiService.post<PayrollData>(`/payroll/${item.employeeId}`, item);
  }

  async update(id: string, item: Partial<PayrollData>): Promise<PayrollData> {
    return apiService.put<PayrollData>(`/payroll/${id}`, item);
  }

  async delete(id: string): Promise<void> {
    throw new Error('Payroll records cannot be deleted');
  }

  async getMyPayroll(): Promise<PayrollData[]> {
    return apiService.get<PayrollData[]>('/payroll/me');
  }

  async getMyPayrollByMonth(month: string): Promise<PayrollData> {
    return apiService.get<PayrollData>(`/payroll/me/${month}`);
  }

  async getEmployeePayroll(employeeId: string): Promise<PayrollData[]> {
    return apiService.get<PayrollData[]>(`/payroll/employee/${employeeId}`);
  }

  async getAllEmployeesPayroll(month?: string): Promise<PayrollData[]> {
    const params = month ? `?month=${month}` : '';
    return apiService.get<PayrollData[]>(`/payroll${params}`);
  }
}

// User service implementation using backend API
export class BackendUserService implements DataService<User> {
  async getAll(): Promise<User[]> {
    return apiService.get<User[]>('/users');
  }

  async getById(id: string): Promise<User> {
    return apiService.get<User>(`/users/${id}`);
  }

  async create(item: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return apiService.post<User>('/users', item);
  }

  async update(id: string, item: Partial<User>): Promise<User> {
    return apiService.put<User>(`/users/${id}`, item);
  }

  async delete(id: string): Promise<void> {
    return apiService.delete(`/users/${id}`);
  }
}

// Leave service implementation using backend API
export class BackendLeaveService implements LeaveService {
  async getAll(): Promise<LeaveRequest[]> {
    // Admin endpoint to get all leave requests
    return apiService.get<LeaveRequest[]>('/leave/pending');
  }

  async getById(id: string): Promise<LeaveRequest> {
    return apiService.get<LeaveRequest>(`/leave/${id}`);
  }

  async create(item: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<LeaveRequest> {
    return apiService.post<LeaveRequest>('/leave/apply', {
      leaveType: item.leaveType,
      startDate: item.startDate,
      endDate: item.endDate,
      reason: item.reason,
    });
  }

  async update(id: string, item: Partial<LeaveRequest>): Promise<LeaveRequest> {
    // This would typically be handled by approve/reject endpoints
    throw new Error('Use approveRequest/rejectRequest methods instead');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Leave requests cannot be deleted');
  }

  // Additional methods for leave management
  async getByEmployeeId(employeeId: string): Promise<LeaveRequest[]> {
    return apiService.get<LeaveRequest[]>('/leave/my-requests');
  }

  async getMyLeaveRequests(): Promise<LeaveRequest[]> {
    return apiService.get<LeaveRequest[]>('/leave/my-requests');
  }

  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    return apiService.get<LeaveRequest[]>('/leave/pending');
  }

  async approveRequest(id: string, adminComment?: string): Promise<LeaveRequest> {
    return apiService.put<LeaveRequest>(`/leave/${id}/approve`, {
      comments: adminComment,
    });
  }

  async rejectRequest(id: string, adminComment?: string): Promise<LeaveRequest> {
    return apiService.put<LeaveRequest>(`/leave/${id}/reject`, {
      reason: adminComment,
    });
  }
}

// Service instances - using backend services
export const userService = new BackendUserService()
export const attendanceService = new BackendAttendanceService()
export const leaveService = new BackendLeaveService()
export const payrollService = new BackendPayrollService()

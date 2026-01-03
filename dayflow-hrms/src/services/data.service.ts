import {
  DataService,
  User,
  AttendanceRecord,
  LeaveRequest,
  PayrollData,
} from "@/types";
import {
  mockUsers,
  mockAttendance,
  mockLeaveRequests,
  mockPayroll,
} from "./mock-data";
import { getFromStorage, setToStorage } from "@/utils/storage";

type WithDates = { createdAt: Date; updatedAt: Date; id: string };

const randomId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const withDates = <T extends WithDates>(item: T): T => ({
  ...item,
  createdAt: new Date(item.createdAt),
  updatedAt: new Date(item.updatedAt),
});

class MockDataService<T extends WithDates> implements DataService<T> {
  private data: T[] = [];

  constructor(private storageKey: string, seed: T[]) {
    this.data = this.hydrate(seed);
  }

  private hydrate(seed: T[]): T[] {
    const stored = getFromStorage<T[]>(this.storageKey);
    if (stored && stored.length > 0) {
      return stored.map(withDates);
    }
    return seed.map(withDates);
  }

  private persist() {
    setToStorage(this.storageKey, this.data);
  }

  private delay(ms = 250 + Math.random() * 250) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getAll(): Promise<T[]> {
    await this.delay();
    return this.data.map((item) => ({ ...item }));
  }

  async getById(id: string): Promise<T> {
    await this.delay();
    const found = this.data.find((item) => item.id === id);
    if (!found) {
      throw new Error("Record not found");
    }
    return { ...found };
  }

  async create(item: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    await this.delay(350 + Math.random() * 250);
    const now = new Date();
    const record = {
      ...(item as Record<string, unknown>),
      id: randomId(this.storageKey),
      createdAt: now,
      updatedAt: now,
    } as T;
    this.data.push(record);
    this.persist();
    return { ...record };
  }

  async update(id: string, item: Partial<T>): Promise<T> {
    await this.delay();
    const index = this.data.findIndex((entry) => entry.id === id);
    if (index === -1) {
      throw new Error("Record not found");
    }
    const updated = {
      ...this.data[index],
      ...item,
      updatedAt: new Date(),
    };
    this.data[index] = updated as T;
    this.persist();
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    await this.delay(200 + Math.random() * 150);
    this.data = this.data.filter((item) => item.id !== id);
    this.persist();
  }
}

class MockUserService extends MockDataService<User> {
  constructor() {
    super("dayflow:users", mockUsers);
  }

  async create(
    item: Omit<User, "id" | "createdAt" | "updatedAt">
  ): Promise<User> {
    // Prevent duplicate emails
    const existing = (await this.getAll()).find(
      (u) => u.email.toLowerCase() === item.email.toLowerCase()
    );

    if (existing) {
      throw new Error("Email already exists");
    }

    return super.create(item);
  }
}

export const userService = new MockUserService();
export const attendanceService = new MockDataService<AttendanceRecord>(
  "dayflow:attendance",
  mockAttendance
);
export const leaveService = new MockDataService<LeaveRequest>(
  "dayflow:leave",
  mockLeaveRequests
);
export const payrollService = new MockDataService<PayrollData>(
  "dayflow:payroll",
  mockPayroll
);

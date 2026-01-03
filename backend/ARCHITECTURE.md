# 🏗️ Dayflow HRMS Backend - Architecture Documentation

## Design Principles

This backend follows **enterprise software engineering best practices** with a focus on:

1. **Clarity over Cleverness** - Code should be easily understood
2. **Explicit over Implicit** - No hidden behavior or "magic"
3. **Type Safety** - Strict TypeScript with no `any` types
4. **Separation of Concerns** - Controllers, Services, Repository layers
5. **Auditability** - All critical operations are traceable
6. **Scalability** - Modular structure allows easy feature addition

---

## Architecture Pattern: Modular Monolith

```
┌─────────────────────────────────────────────────────────────┐
│                     NestJS Application                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth       │  │   Employees  │  │  Attendance  │      │
│  │   Module     │  │   Module     │  │  Module      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Leave      │  │   Payroll    │  │  Dashboard   │      │
│  │   Module     │  │   Module     │  │  Module      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│              Common Infrastructure Layer                      │
│  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │
│  │Enums   │ │Decorators│ │Guards    │ │Exception Filter │  │
│  └────────┘ └──────────┘ └──────────┘ └─────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│              Prisma ORM + PostgreSQL                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Benefits of This Architecture

✅ **Modularity** - Each domain is independently testable  
✅ **Scalability** - Easy to add new modules without affecting others  
✅ **Maintainability** - Clear folder structure mirrors business domains  
✅ **Team Collaboration** - Different teams can work on different modules  
✅ **Not Microservices** - Simpler deployment, single database, transactions  

---

## Layered Architecture Per Module

Each module follows a strict 3-layer pattern:

```
┌─────────────────────────────────┐
│       HTTP Controller Layer      │
│  (Request handling, routing)     │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│       Service Layer             │
│  (Business logic, validation)   │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│       Data Access Layer         │
│  (Prisma ORM queries)          │
└─────────────────────────────────┘
```

### Layer Responsibilities

**Controller**
- Parse HTTP requests
- Extract parameters, body, headers
- Validate structure (via class-validator DTOs)
- Call service methods
- Return HTTP responses
- ❌ NO business logic

**Service**
- Execute business rules
- Validate business constraints
- Interact with data access layer
- Handle transactions
- Throw appropriate exceptions
- ✅ ALL business logic here

**Data Access (Prisma)**
- Execute database queries
- Return typed data
- Only used by services
- ❌ Direct access from controllers not allowed

### Example: Leave Approval

```
POST /leave/:id/approve
    ↓
Controller validates @Roles(ADMIN)
    ↓
Service checks: Is leave PENDING?
    ↓
Service opens transaction:
  - Update leave status
  - Create approval record
  - Update attendance records (one per day)
  - Create audit log
    ↓
Returns updated leave object
    ↓
HTTP 200 response
```

---

## RBAC (Role-Based Access Control)

### Two-Level Protection

**1. Route Level** - Decorator + Guard
```typescript
@Put(':id/approve')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
async approveLeave(...) { }
```

**2. Field Level** - Service Logic
```typescript
if (userRole === Role.EMPLOYEE) {
  const allowedFields = ['phone', 'address', 'profilePictureUrl'];
  // Verify user can only edit allowed fields
}
```

### Role Hierarchy

**ADMIN**
- Create users and employees
- Manage all employee profiles
- Override attendance records
- Approve/reject leave requests
- Manage payroll
- View all records
- Access all reports

**EMPLOYEE**
- Login and manage own account
- Check-in/check-out
- Apply for leave
- View own attendance
- View own payroll (read-only)
- Update own profile (limited fields)

---

## Authentication Flow

```
1. User Login
   POST /authentication/login { email, password }
   ↓
2. Verify Credentials
   - Find user by email
   - Compare password with bcrypt hash
   ↓
3. Generate Tokens
   - Access Token (JWT, 1 hour)
     { userId, role, iat, exp }
   - Refresh Token (JWT, 7 days)
     { userId, iat, exp }
   ↓
4. Store Refresh Token in DB
   RefreshToken model with expiresAt
   ↓
5. Return Both Tokens to Client
   {
     accessToken: "eyJhbGc...",
     refreshToken: "eyJhbGc...",
     user: { id, email, role }
   }

6. Client Uses Access Token
   GET /employees/me
   Authorization: Bearer eyJhbGc...
   ↓
7. JwtGuard Validates Token
   - Extract from "Bearer" header
   - Verify signature with JWT_SECRET
   - Check expiration
   - Extract userId, role
   ↓
8. Request Proceeds with @User() decorator
   user = { userId, role }

9. Token Expires (1 hour)
   Client refreshes with refresh token
   POST /authentication/refresh
   { refreshToken: "eyJhbGc..." }
   ↓
10. Generate New Access Token
    (Keep same refresh token or issue new one)
```

### Security Considerations

- Access tokens are short-lived (1 hour)
- Refresh tokens are long-lived (7 days) and stored in database
- Passwords never transmitted after setup
- All tokens signed with JWT_SECRET
- Failed logins don't reveal if email exists (good security)
- Logout invalidates refresh token

---

## Error Handling Strategy

### Exception Hierarchy

```
Exception
  ├── HttpException
  │   ├── BadRequestException (400)
  │   │   └── Input validation failures
  │   ├── UnauthorizedException (401)
  │   │   └── Login failures, invalid tokens
  │   ├── ForbiddenException (403)
  │   │   └── Insufficient permissions
  │   ├── NotFoundException (404)
  │   │   └── Resource not found
  │   └── ConflictException (409)
  │       └── Business rule violations
  │
  └── Runtime Errors
      └── Logged and filtered by exception filter
```

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Email already in use",
  "error": "Bad Request",
  "timestamp": "2026-01-03T09:30:45.123Z",
  "path": "/users"
}
```

### When Errors Are Thrown

**BadRequestException**
- Invalid input (validation errors)
- Business rule violations (e.g., already checked in)
- Conflict with existing data

**UnauthorizedException**
- No token provided
- Invalid/expired token
- Login failed (wrong password)

**ForbiddenException**
- User lacks required role
- User trying to access another user's private data
- Employee trying to update restricted fields

**NotFoundException**
- Resource doesn't exist
- User has no associated employee record

---

## Transaction Management

Transactions ensure data consistency for multi-step operations:

### Leave Approval (Transactional)

```typescript
return this.prisma.$transaction(async (tx) => {
  // All of these execute atomically - either all succeed or all rollback
  
  // Step 1: Update leave status
  const updatedLeave = await tx.leave.update({ ... });
  
  // Step 2: Create approval record
  await tx.leaveApproval.create({ ... });
  
  // Step 3: Update attendance for each day
  for each day in leave period:
    await tx.attendance.upsert({ ... });
  
  // Step 4: Log the action
  await tx.auditLog.create({ ... });
  
  // If any step fails, entire transaction rolls back
  return updatedLeave;
});
```

**Why Transactions Matter**

Without transactions:
- If step 2 fails, step 1 is already applied (inconsistent state)
- Database ends up with partial changes

With transactions:
- Either all 4 steps complete, or database remains unchanged
- Guaranteed data consistency

---

## Database Design Decisions

### UUID Primary Keys

```typescript
// Instead of auto-increment integers:
id String @id @default(cuid())

// Benefits:
// ✓ Globally unique (across databases)
// ✓ Can generate client-side if needed
// ✓ Cannot expose database growth patterns
// ✓ Merge-friendly for distributed systems
```

### Strategic Indexes

```typescript
model Attendance {
  // Most common queries:
  // - Find attendance for employee on date
  // - Find attendance history for employee
  // - Find attendance by date range
  
  @@unique([employeeId, date])    // One per day per employee
  @@index([employeeId])            // Quick employee lookups
  @@index([date])                  // Quick date lookups
}

model Payroll {
  // Monthly salary queries
  @@unique([employeeId, month])
  @@index([employeeId])
  @@index([month])
}

model AuditLog {
  // Searching by user or entity type
  @@index([userId])
  @@index([entityType])
  @@index([createdAt])             // Time-based queries
}
```

### JSON Storage for Audit Changes

```typescript
model AuditLog {
  changes String?  // JSON stringified
  
  // Example value:
  // { "previousStatus": "PENDING", "newStatus": "APPROVED" }
  // { "baseSalary": 50000, "allowances": 5000, "deductions": 2000 }
}

// Benefits:
// ✓ Flexible schema (doesn't need new columns)
// ✓ Complete history of changes
// ✓ Can reconstruct previous states
// ✓ Easy to query with Prisma filters
```

---

## Validation Strategy

### Three Levels of Validation

**1. Structural Validation (Controller)**
```typescript
class CreateUserDto {
  @IsEmail()
  email: string;
  
  @IsString()
  @MinLength(8)
  password: string;
}

// Class-validator ensures this before service is called
```

**2. Business Logic Validation (Service)**
```typescript
// Check email doesn't already exist
const existing = await this.prisma.user.findUnique({
  where: { email },
});
if (existing) {
  throw new BadRequestException('Email already in use');
}

// Check one attendance per day
const existingAttendance = await this.prisma.attendance.findUnique({
  where: { employeeId_date: { employeeId, date: today } },
});
if (existingAttendance?.checkInTime) {
  throw new ConflictException('Already checked in today');
}
```

**3. Database Constraints**
```
Unique constraints prevent duplicate entries
Foreign keys ensure referential integrity
Check constraints enforce column values
```

---

## Logging & Audit Trail

### What Gets Logged

**Authentication Events**
```
- Login attempt (success/failure)
- Token refresh
- Logout
```

**Data Modifications**
```
- Attendance override (with reason)
- Leave approval (with comments)
- Payroll changes (before/after values)
```

**Authorization Events**
```
- Permission denied (which user tried to access what)
- Role changes
```

### Audit Log Schema

```typescript
AuditLog {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'OVERRIDE' | 'APPROVE'
  userId: string          // Who did it?
  entityType: string      // What resource?
  entityId: string        // Which specific resource?
  changes: JSON          // What changed?
  reason: string         // Why? (optional)
  createdAt: timestamp   // When?
}
```

### Example Audit Trail

```json
[
  {
    "action": "CREATE",
    "userId": "user-123",
    "entityType": "Attendance",
    "entityId": "att-456",
    "changes": { "status": "PRESENT" },
    "createdAt": "2026-01-03T08:00:00Z"
  },
  {
    "action": "APPROVE",
    "userId": "admin-1",
    "entityType": "Leave",
    "entityId": "leave-789",
    "changes": { "status": "APPROVED" },
    "reason": "Medical reasons confirmed",
    "createdAt": "2026-01-03T14:30:00Z"
  }
]
```

---

## Scalability Considerations

### Current Design (Suitable for ~1000 employees)

- Single PostgreSQL database
- No database replication
- In-memory JWT validation
- No caching layer

### For ~5000 employees

Add:
- Database read replicas
- Redis caching layer
- Implement pagination for list endpoints
- Add database connection pooling

### For ~10,000+ employees

Add:
- Database sharding (by department or location)
- Message queue for async operations (leave approvals, payroll)
- Separate read/write database cluster
- API gateway with rate limiting
- Monitoring and observability (Prometheus, Grafana)

---

## Testing Strategy (Future Implementation)

### Unit Tests (Service layer)
```typescript
describe('LeaveService', () => {
  it('should prevent overlapping leave requests', async () => {
    // Test business logic isolation
  });
  
  it('should update attendance on leave approval', async () => {
    // Test data transformations
  });
});
```

### Integration Tests (Module level)
```typescript
describe('Leave Module', () => {
  it('should complete full leave approval workflow', async () => {
    // Test entire module interaction
  });
});
```

### E2E Tests (API level)
```typescript
describe('Leave API', () => {
  it('POST /leave/apply should create leave and return 201', async () => {
    // Test full HTTP flow
  });
});
```

---

## Deployment Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for frontend domain
- [ ] Setup database backups
- [ ] Configure monitoring (CPU, memory, database)
- [ ] Setup error tracking (Sentry)
- [ ] Configure logging (ELK stack or CloudWatch)
- [ ] Setup database connection pooling
- [ ] Implement rate limiting
- [ ] Setup health checks
- [ ] Configure auto-scaling (if cloud-hosted)

---

## Code Quality Standards

### Required

✅ **Type Safety**
- No `any` types
- Strict null checks
- Explicit return types

✅ **Validation**
- Input validation with DTOs
- Business rule checks in services

✅ **Error Handling**
- Throw NestJS HTTP exceptions
- Never expose internal errors to clients

✅ **RBAC**
- Use @Roles() decorator
- Verify roles in services too

✅ **Layering**
- No business logic in controllers
- All Prisma access in services

### Optional but Recommended

✅ **Comments**
- Explain "why" not "what"
- Document complex logic

✅ **Type Guards**
- Check for null before accessing properties
- Use optional chaining (?.)

✅ **Consistent Naming**
- Controllers: users.controller.ts
- Services: users.service.ts
- Modules: users.module.ts
- DTOs: In dto/ folder

---

## Performance Optimization Tips

1. **Use proper indexes** - Especially on frequently filtered columns
2. **Pagination** - Don't return all records for list endpoints
3. **Caching** - Cache frequently accessed data (departments, roles)
4. **Lazy loading** - Don't fetch related data unless needed
5. **Connection pooling** - Limit database connections
6. **Batch operations** - Update multiple records in one query
7. **Compression** - Enable gzip for API responses

---

**Architecture Version**: 1.0  
**Last Updated**: January 3, 2026  
**Status**: Production-Ready ✅

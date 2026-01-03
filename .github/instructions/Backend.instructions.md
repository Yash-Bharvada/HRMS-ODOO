---
applyTo: '**'
---
# 📄 GitHub Copilot Instructions – Dayflow HRMS Backend

## Project Context

You are an expert **TypeScript + NestJS backend engineer** working on **Dayflow**, a **Human Resource Management System (HRMS)**.

The system digitizes and manages:

* Authentication & role-based authorization
* Employee profile management
* Attendance tracking (check-in / check-out)
* Leave & time-off workflows
* Payroll visibility and admin controls
* Approval workflows for Admin / HR roles

The backend must be **clean, scalable, auditable, and production-ready**.

---

## Core Tech Stack

* Language: **TypeScript (strict mode enabled)**
* Framework: **NestJS**
* Database: **PostgreSQL**
* ORM: **Prisma**
* Auth: **JWT (access + refresh tokens)**
* Validation: **class-validator + class-transformer**
* Security: **RBAC using guards & decorators**

---

## Architectural Principles (MANDATORY)

1. **Modular Monolith Architecture**

   * Each domain lives in its own NestJS module
   * No cross-module logic leakage

2. **Layered Structure**

   * Controller → Service → Repository (Prisma)
   * Controllers contain **no business logic**
   * Services contain **all domain rules**

3. **Explicitness over Magic**

   * Avoid implicit behavior
   * Prefer readable, predictable code

4. **Audit-First Design**

   * All approvals, overrides, and salary changes must be traceable

---

## Folder Structure (STRICT)

```
src/
├── main.ts
├── app.module.ts
│
├── config/
│   ├── auth.config.ts
│   ├── database.config.ts
│
├── common/
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   └── user.decorator.ts
│   ├── guards/
│   │   ├── jwt.guard.ts
│   │   └── roles.guard.ts
│   ├── enums/
│   │   ├── role.enum.ts
│   │   ├── attendance-status.enum.ts
│   │   └── leave-status.enum.ts
│   └── utils/
│
├── modules/
│   ├── auth/
│   ├── users/
│   ├── employees/
│   ├── attendance/
│   ├── leave/
│   ├── payroll/
│   ├── dashboard/
│   └── notifications/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
└── test/
```

Copilot **must follow this structure exactly**.

---

## Authentication & Authorization Rules

### Roles

* `ADMIN`
* `EMPLOYEE`

### Rules

* Use `@Roles()` decorator
* Enforce access via `RolesGuard`
* JWT payload must include:

  ```ts
  {
    userId: string;
    role: Role;
  }
  ```

---

## Domain Rules (DO NOT VIOLATE)

### Employee

* Employees can edit **only**:

  * Phone
  * Address
  * Profile picture
* Admin can edit all fields

### Attendance

* One check-in per day
* Check-out only allowed after check-in
* Admin overrides must be logged
* Attendance status:

  * PRESENT
  * ABSENT
  * HALF_DAY
  * LEAVE

### Leave

* Leave types:

  * PAID
  * SICK
  * UNPAID
* Status:

  * PENDING
  * APPROVED
  * REJECTED
* Approval automatically updates attendance records

### Payroll

* Employees have **read-only access**
* Admin controls salary structure
* Salary changes require effective dates

---

## Coding Standards (STRICT)

* Use **DTOs** for all input/output
* Always validate request bodies
* No `any` type allowed
* Use async/await only
* Use dependency injection everywhere
* Throw NestJS HTTP exceptions (`BadRequestException`, `ForbiddenException`, etc.)

---

## Prisma Guidelines

* Use UUIDs as primary keys
* Add indexes for:

  * `employeeId`
  * `date`
* Never access Prisma directly in controllers
* Prefer transactions for:

  * Leave approval
  * Payroll updates

---

## API Design Rules

* REST-only (no GraphQL)
* Plural resource naming
* Predictable HTTP status codes
* Clear error messages

Example:

```ts
POST   /attendance/check-in
POST   /leave/apply
GET    /payroll/me
```

---

## Logging & Error Handling

* Centralized error handling
* Log:

  * Leave approvals
  * Attendance overrides
  * Payroll modifications
* Never expose internal errors to clients

---

## Copilot Behavior Instructions

When generating code, **you must**:

1. Generate **NestJS-idiomatic code**
2. Respect RBAC rules
3. Use proper DTOs and validation
4. Keep services small and focused
5. Avoid over-engineering
6. Prefer clarity over brevity
7. Assume this code will be reviewed by senior engineers

If unsure, **ask for clarification in comments** rather than guessing.

---

## Final Instruction

> Treat this project as a **real enterprise HRMS**, not a demo.
> Code quality, structure, and correctness matter more than speed.

---
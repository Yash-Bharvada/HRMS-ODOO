# 🚀 Dayflow HRMS Backend - Quick Start Guide

## ✅ Setup Complete!

Your Dayflow HRMS backend is **fully configured and running**.

---

## 📦 What's Running

- **PostgreSQL 16** - Database running in Docker on port `5432`
- **NestJS API** - Application server running on `http://localhost:3000`
- **Prisma ORM** - Database client (v6.19.1)

---

## 🔑 Demo Accounts

| Role         | Email                    | Password    |
| ------------ | ------------------------ | ----------- |
| **Admin**    | admin@dayflow.com        | password123 |
| **Employee** | john.doe@dayflow.com     | password123 |
| **Employee** | jane.smith@dayflow.com   | password123 |
| **Employee** | mike.johnson@dayflow.com | password123 |

---

## 🎯 Quick Commands

### Start/Stop Services

```bash
# Start PostgreSQL
docker compose up -d

# Stop PostgreSQL
docker compose down

# Start NestJS (development mode with hot reload)
npm run start:dev

# Start NestJS (production mode)
npm run start:prod

# Build for production
npm run build
```

### Database Commands

```bash
# Seed database with demo data
npm run db:seed

# Open Prisma Studio (visual database editor)
npm run db:studio

# Create new migration
npm run db:migrate

# Push schema changes without migration
npm run db:push
```

### Testing

```bash
# Run API test suite
./test-api.sh

# Manual API test (login)
curl -X POST http://localhost:3000/authentication/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dayflow.com","password":"password123"}'
```

---

## 📚 API Endpoints

### Authentication (`/authentication`)

- `POST /authentication/login` - Login with email & password
- `POST /authentication/refresh` - Refresh access token
- `POST /authentication/logout` - Logout & invalidate refresh token

### Users (`/users`) - Admin Only

- `POST /users` - Create new user
- `GET /users` - Get all users
- `GET /users/:id` - Get specific user

### Employees (`/employees`)

- `GET /employees/me` - Get own profile
- `PUT /employees/me` - Update own profile (limited fields)
- `GET /employees` - Get all employees (Admin)
- `GET /employees/:id` - Get specific employee
- `PUT /employees/:id` - Update employee (Admin)

### Attendance (`/attendance`)

- `POST /attendance/check-in` - Check in for the day
- `POST /attendance/check-out` - Check out
- `GET /attendance/today` - Get today's attendance
- `GET /attendance/history` - Get attendance history
- `GET /attendance/stats/:month` - Get monthly stats
- `POST /attendance/override` - Override attendance (Admin)

### Leave (`/leave`)

- `POST /leave/apply` - Apply for leave
- `GET /leave/my-requests` - Get own leave requests
- `GET /leave/pending` - Get pending requests (Admin)
- `PUT /leave/:id/approve` - Approve leave (Admin)
- `PUT /leave/:id/reject` - Reject leave (Admin)

### Payroll (`/payroll`)

- `GET /payroll/me` - Get own payroll
- `GET /payroll/me/:month` - Get payroll for specific month
- `POST /payroll/:employeeId` - Create payroll (Admin)
- `PUT /payroll/:id` - Update payroll (Admin)
- `GET /payroll` - Get all employee payroll (Admin)

### Dashboard (`/dashboard`)

- `GET /dashboard/summary` - Get dashboard summary
- `GET /dashboard/statistics` - Get attendance statistics

---

## 🔐 Using the API

### 1. Login

```bash
curl -X POST http://localhost:3000/authentication/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dayflow.com",
    "password": "password123"
  }'
```

**Response:**

```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "admin@dayflow.com",
    "role": "ADMIN"
  }
}
```

### 2. Use Access Token

```bash
TOKEN="your_access_token_here"

curl -X GET http://localhost:3000/employees/me \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Refresh Token (when access token expires)

```bash
curl -X POST http://localhost:3000/authentication/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

---

## 📂 Project Structure

```
backend/
├── src/
│   ├── main.ts                   # Application entry point
│   ├── app.module.ts             # Root module
│   ├── config/                   # Configuration files
│   ├── common/                   # Shared code (guards, decorators, etc.)
│   └── modules/                  # Feature modules
│       ├── auth/                 # Authentication
│       ├── users/                # User management
│       ├── employees/            # Employee profiles
│       ├── attendance/           # Attendance tracking
│       ├── leave/                # Leave management
│       ├── payroll/              # Payroll management
│       ├── dashboard/            # Dashboard & stats
│       └── notifications/        # Notifications
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Database migrations
│   └── seed.js                   # Sample data seeder
├── dist/                         # Compiled JavaScript output
├── .env                          # Environment variables
├── docker-compose.yml            # PostgreSQL container config
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── SETUP.md                      # Detailed setup guide
├── PROJECT_INDEX.md              # File structure documentation
└── ARCHITECTURE.md               # Architecture documentation
```

---

## 🔧 Configuration

### Environment Variables (`.env`)

```env
# Database
DATABASE_URL="postgresql://hrms_user:hrms_password@localhost:5432/hrms_db?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION_TIME=3600  # 1 hour

# App
PORT=3000
NODE_ENV=development
```

⚠️ **IMPORTANT:** Change `JWT_SECRET` before deploying to production!

---

## 🐛 Troubleshooting

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Start PostgreSQL if not running
docker compose up -d

# Check database logs
docker logs backend-postgres-1
```

### Application Won't Start

```bash
# Check if port 3000 is already in use
lsof -i :3000

# Kill existing process
kill -9 <PID>

# Rebuild application
npm run build
npm run start:dev
```

### Prisma Client Issues

```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (⚠️ destroys all data)
npx prisma migrate reset

# Reseed database
npm run db:seed
```

---

## 📊 Database Management

### View Database in Prisma Studio

```bash
npm run db:studio
```

Opens visual database editor at `http://localhost:5555`

### Connect via PostgreSQL CLI

```bash
docker exec -it backend-postgres-1 psql -U hrms_user -d hrms_db
```

### Backup Database

```bash
docker exec backend-postgres-1 pg_dump -U hrms_user hrms_db > backup.sql
```

### Restore Database

```bash
docker exec -i backend-postgres-1 psql -U hrms_user -d hrms_db < backup.sql
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for frontend domain
- [ ] Set up database backups
- [ ] Configure monitoring & logging
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Implement rate limiting
- [ ] Set up health checks
- [ ] Configure database connection pooling

### Build for Production

```bash
npm run build
npm run start:prod
```

---

## 📖 Additional Documentation

- [SETUP.md](./SETUP.md) - Comprehensive setup guide with all API endpoints
- [PROJECT_INDEX.md](./PROJECT_INDEX.md) - Complete file structure index
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture decisions & patterns

---

## 🎉 You're All Set!

Your Dayflow HRMS backend is ready to use.

**Next steps:**

1. Explore the API using the test accounts
2. Read [SETUP.md](./SETUP.md) for detailed API documentation
3. Build your frontend application
4. Customize the backend for your specific needs

---

**Need Help?** Check the documentation files or review the source code comments.

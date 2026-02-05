# StaffDeck Backend API

Express + MongoDB backend for StaffDeck HR SaaS application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB connection string

4. Seed the database:
```bash
npm run seed
```

5. Start the server:
```bash
npm run dev
```

## Default Login

- Email: `admin@staffdeck.io`
- Password: `admin123`

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user

### Employees
-  GET `/api/employees` - List employees (with filters, search, pagination)
- GET `/api/employees/:id` - Get employee details
- POST `/api/employees` - Create employee (Admin only)
- PUT `/api/employees/:id` - Update employee
- DELETE `/api/employees/:id` - Soft delete employee (Admin only)

### Dashboard
- GET `/api/dashboard/stats` - Get dashboard statistics
- GET `/api/dashboard/payroll-trend` - Get payroll trend data (Admin only)

### Payroll
- POST `/api/payroll/run` - Execute payroll run (Admin only)
- GET `/api/payroll/runs` - Get payroll history (Admin only)

### Documents
- GET `/api/documents` - List documents
- DELETE `/api/documents/:id` - Delete document

### Schedule
- GET `/api/schedule/on-leave` - Get employees on leave

### Audit
- GET `/api/audit` - Get audit logs (Admin only)

### Settings
- GET `/api/settings` - Get organization settings
- PUT `/api/settings` - Update settings (Admin only)

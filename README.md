# Tripura Jal Board Attendance Management System - Web Admin & Super Admin Portal

A high-performance, enterprise-grade Web Administration & Super Administration Portal for the **Tripura Jal Board Attendance System**. Built with React 18, TypeScript, Tailwind CSS, and Vite, strictly sharing and integrating with the mobile app backend (**Supabase / PostgreSQL**).

---

## 🏛️ Theme & Design System
Strictly adhering to the mobile application's enterprise palette:
- **Primary Navy**: `#0D1B2A` / `#1B263B` / `#091420`
- **Accent / Royal Blue**: `#2563EB` / `#3B82F6`
- **Present / Working**: `#10B981` (Emerald)
- **On Break**: `#F59E0B` (Amber)
- **Office Out Duty**: `#3B82F6` (Royal Blue)
- **Absent / Inactive**: `#EF4444` (Rose)
- **Leave**: `#8B5CF6` (Purple)

---

## 👥 Strict Role-Based Access Control (RBAC)

### 1. Super Admin (Full Unrestricted System Authority)
- **Global Data Access & Overrides**:
  - Full override capability over any employee's attendance record, check-in/out times, and working durations with mandatory audit remarks.
  - Multi-office jurisdiction selector (Global All Offices, Agartala Headquarters, Dharmanagar, Udaipur).
- **Admin Management**:
  - Create, edit, and activate/deactivate administrative users.
  - Delegate office branches or grant global authority.
- **Office & Geofence Calibration**:
  - Calibrate office name, postal address, coordinates (Latitude `23.8315`, Longitude `91.2868`), and Geofence radius (default: `100 m`).
  - Configure shift hours (`10:00 AM - 05:30 PM`), standard break allowance (`60 min`), and backend excess break alert threshold (`75 min`).
- **System Audit Logs**:
  - Immutable audit trail capturing every approval, geofence calibration, and manual override with actor details, timestamps, IP address, and payload.

### 2. Office Admin (Branch-Restricted Oversight)
- Restricted strictly to their assigned branch / office.
- **Employee Management Desk**:
  - Add new employees (`EMP-1001`, Full Name, Designation, Email, Mobile Number, Assigned Office, Residential Address, Date of Birth).
  - Edit employee profiles or deactivate/suspend accounts.
  - *Employees cannot register themselves; provisioning is strictly administrative.*
- **Leave Requests Approval Desk**:
  - Adjudicate applications across exact categories: Casual Leave, Earned Leave, Medical Leave, Emergency Leave.
  - Date range preview, total days count, and single-click Approve or Reject (with mandatory rejection remarks).
- **Office Out Duty Verification Desk**:
  - Review employee fieldwork sessions (start time, end time, duration, destination, GPS evidence coordinates).
  - Verify and approve sessions to convert verified out-duty hours into **Confirmed Working Hours**.
- **Live Attendance Dashboard**:
  - Real-time status cards: Total Staff, Present / Working, Currently on Break, On Out Duty, Checked Out, Absent.
  - Excess break alert banner: Automatically highlights staff exceeding the 75-minute break threshold.
  - Live roster table with GPS proximity evidence and duration reconciliation.
- **Attendance Corrections Desk**:
  - Review and adjust check-in / check-out times upon verified request with audit remarks.
- **Reports & Analytics**:
  - Filter by Date, Week, Month, and Year.
  - Metrics: Total Working Days, Days Present, Total Working Hours, Total Break Time, Approved Out Duty Hours, Overtime, Deficit Hours.
  - Export to **Excel (.xlsx)** and **CSV**.

### 3. Employees (Mobile App Only)
- Employees use the Android application to check in, record breaks, go on office out duty, request leaves, and check out.
- The web portal route guard automatically intercepts employee login attempts with a clear directive to use the Android app.

---

## 🗄️ Database & Backend Alignment
Connects to the Supabase PostgreSQL backend schema:
- `offices`: `id`, `office_name`, `address`, `latitude`, `longitude`, `radius_meters`, `standard_break_allowance_minutes`, `break_grace_period_minutes`.
- `profiles`: `id`, `email`, `full_name`, `role` (`'super_admin' | 'admin' | 'employee'`), `status`.
- `employees`: `id`, `employee_code`, `full_name`, `designation`, `email`, `mobile_number`, `office_id`.
- `attendance_sessions`: `id`, `employee_id`, `office_id`, `attendance_date`, `check_in_time`, `check_out_time`, `office_working_minutes`, `actual_break_minutes`, `approved_official_work_minutes`, `confirmed_working_minutes`.
- `attendance_intervals`: `id`, `session_id`, `interval_type` (`'working' | 'tea_break' | 'official_work'`), `start_time`, `end_time`, `approval_status`.
- `leave_requests`: `id`, `employee_id`, `leave_type`, `start_date`, `end_date`, `total_days`, `reason`, `status`, `reviewed_by`.
- `official_duty_requests`: `id`, `employee_id`, `session_id`, `start_time`, `end_time`, `duration_minutes`, `status`, `reviewed_by`.
- `audit_logs`: `id`, `user_id`, `action`, `entity`, `entity_id`, `payload`, `ip_address`, `created_at`.

---

## 🚀 Running the Web App

### Development Server:
```bash
npm run dev
```

### Production Build:
```bash
npm run build
```

### Preview Production Build:
```bash
npm run preview
```


export type UserRole = 'super_admin' | 'admin' | 'office_admin' | 'employee';

export type UserStatus = 'active' | 'suspended' | 'inactive';

export type SessionStatus =
  | 'not_checked_in'
  | 'working'
  | 'on_break'
  | 'on_official_work'
  | 'checked_out'
  | 'incomplete'
  | 'finalized';

export type IntervalType =
  | 'working'
  | 'tea_break'
  | 'automatic_break'
  | 'official_work'
  | 'location_unverified';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'not_applicable';

export type LeaveType =
  | 'casual_leave'
  | 'earned_leave'
  | 'medical_leave'
  | 'emergency_leave'
  | 'Casual Leave'
  | 'Earned Leave'
  | 'Medical Leave'
  | 'Emergency Leave';

export interface Office {
  id: string;
  office_name: string;
  name?: string;
  office_code?: string; // Short form or acronym e.g. TJB for Tripura Jal Board
  code?: string;
  address?: string;
  locality?: string;
  office_locality?: string;
  city?: string;
  office_city?: string;
  state?: string;
  office_state?: string;
  pin?: string;
  office_pin?: string | number;
  latitude: number;
  office_lat?: number;
  longitude: number;
  office_long?: number;
  radius_meters: number;
  geofence_radius?: number;
  time_zone?: string;
  working_days?: number[]; // 1 to 7 (Mon=1, Sun=7)
  standard_break_allowance_minutes: number;
  break_allowance?: number;
  break_allowence?: number;
  break_grace_period_minutes: number;
  grace_period?: number;
  office_grace_period?: number;
  shift_start_time?: string; // e.g. "10:00 AM"
  office_start_time?: string;
  shift_end_time?: string;   // e.g. "05:30 PM"
  office_end_time?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  office_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  designation: string;
  email: string;
  mobile_number: string;
  office_id: string;
  profile_photo_url?: string;
  date_of_birth?: string;
  residential_address?: string;
  created_by?: string;
  status?: UserStatus;
  role?: UserRole;
  created_at: string;
  updated_at?: string;
}

export interface AttendanceSession {
  id: string;
  employee_id: string;
  office_id: string;
  attendance_date: string; // YYYY-MM-DD
  check_in_time: string;   // ISO timestamp
  check_out_time?: string | null;
  active_status: SessionStatus;
  office_working_minutes: number;
  actual_break_minutes: number;
  approved_official_work_minutes: number;
  pending_official_work_minutes: number;
  confirmed_working_minutes: number;
  check_in_latitude: number;
  check_in_longitude: number;
  check_in_distance_meters: number;
  check_out_latitude?: number | null;
  check_out_longitude?: number | null;
  check_out_distance_meters?: number | null;
  is_finalized: boolean;
  created_at?: string;
  updated_at?: string;
  // Joined or augmented fields
  employee?: Employee;
  intervals?: AttendanceInterval[];
}

export interface AttendanceInterval {
  id: string;
  session_id: string;
  employee_id: string;
  interval_type: IntervalType;
  start_time: string;
  end_time?: string | null;
  duration_minutes?: number | null;
  is_automatic: boolean;
  approval_status: ApprovalStatus;
  notes?: string | null;
  created_at?: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  office_id: string;
  leave_type: LeaveType;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  total_days: number;
  reason: string;
  status: ApprovalStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  admin_remarks?: string | null;
  created_at: string;
  // Joined
  employee?: Employee;
  reviewer_name?: string;
}

export interface OfficialDutyRequest {
  id: string;
  employee_id: string;
  office_id: string;
  session_id?: string;
  attendance_date: string;
  reason: string;
  destination?: string | null;
  expected_return_time?: string | null;
  start_time: string;
  end_time?: string | null;
  duration_minutes?: number | null;
  approval_status: ApprovalStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  admin_remarks?: string | null;
  evidence_latitude?: number | null;
  evidence_longitude?: number | null;
  created_at?: string;
  // Joined
  employee?: Employee;
  reviewer_name?: string;
}

export interface AttendanceCorrection {
  id: string;
  session_id: string;
  employee_id: string;
  original_check_in: string;
  requested_check_in: string;
  original_check_out?: string | null;
  requested_check_out?: string | null;
  reason: string;
  status: ApprovalStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  admin_remarks?: string | null;
  created_at: string;
  // Joined
  employee?: Employee;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  action: string;
  entity: string;
  entity_id?: string | null;
  payload?: any;
  ip_address?: string | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'office_admin';
  status: UserStatus;
  assigned_office_ids: string[]; // empty means all offices (multi-office)
  created_at: string;
  last_login?: string;
}

export type HolidayType = 'gazetted' | 'restricted' | 'state_declared' | 'local_festival';

export interface Holiday {
  id: string;
  holiday_id?: string;
  holiday_name: string;
  holiday_reason?: string | null;
  holiday_date: string; // YYYY-MM-DD
  holiday_month?: string | null;
  holiday_day?: string | null;
  holiday_year?: number | null;
  'no._of_holiday_current_year'?: number | null;
  end_date?: string | null; // For multi-day holidays e.g. Durga Puja
  year: number; // e.g. 2026
  holiday_type: HolidayType;
  office_id?: string | null; // null or 'all' for all offices
  description?: string | null;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export type AnnouncementType = 'text' | 'pdf';

export interface Announcement {
  id: string;
  title: string;
  type: AnnouncementType;
  content?: string | null; // Text body when type === 'text'
  pdf_base64?: string | null; // Compressed Base64 string when type === 'pdf'
  file_name?: string | null;
  is_compressed?: boolean;
  original_size_bytes?: number | null;
  compressed_size_bytes?: number | null;
  office_id?: string | null;
  created_by?: string;
  created_by_role?: UserRole;
  created_at: string;
}



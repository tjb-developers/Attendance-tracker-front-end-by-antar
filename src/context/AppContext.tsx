import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  AdminUser,
  AttendanceCorrection,
  AttendanceSession,
  AuditLog,
  Employee,
  LeaveRequest,
  Office,
  OfficialDutyRequest,
  UserRole,
  Holiday,
} from '../types';
import {
  authApi,
  officesApi,
  adminsApi,
  employeesApi,
  attendanceApi,
  leavesApi,
  officialDutiesApi,
  correctionsApi,
  auditLogsApi,
  holidaysApi,
  setAuthToken,
  clearAuthToken,
  getAuthToken,
} from '../services/apiClient';

interface AppContextType {
  currentUser: AdminUser | null;
  currentRole: UserRole;
  isSuperAdmin: boolean;
  selectedOfficeId: string; // 'all' or specific office UUID
  setSelectedOfficeId: (id: string) => void;
  offices: Office[];
  admins: AdminUser[];
  employees: Employee[];
  sessions: AttendanceSession[];
  leaveRequests: LeaveRequest[];
  officialDutyRequests: OfficialDutyRequest[];
  corrections: AttendanceCorrection[];
  auditLogs: AuditLog[];
  holidays: Holiday[];
  isLoading: boolean;
  lastUpdated: Date;
  refreshData: () => Promise<void>;

  // Auth
  login: (
    email: string,
    password?: string,
    role?: 'admin' | 'super_admin'
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Actions connecting to real backend REST APIs
  addEmployee: (emp: Omit<Employee, 'id' | 'created_at'>) => Promise<boolean>;
  updateEmployee: (id: string, emp: Partial<Employee>) => Promise<boolean>;
  toggleEmployeeStatus: (id: string) => Promise<boolean>;

  addAdmin: (admin: Omit<AdminUser, 'id' | 'created_at'>) => Promise<boolean>;
  updateAdmin: (id: string, admin: Partial<AdminUser>) => Promise<boolean>;
  toggleAdminStatus: (id: string) => Promise<boolean>;

  addOffice: (officeData: Omit<Office, 'id' | 'created_at'>) => Promise<boolean>;
  deleteOffice: (officeId: string) => Promise<boolean>;

  addHoliday: (holidayData: Omit<Holiday, 'id' | 'created_at'>) => Promise<boolean>;
  updateHoliday: (id: string, holidayData: Partial<Holiday>) => Promise<boolean>;
  deleteHoliday: (id: string) => Promise<boolean>;

  updateOfficeCalibration: (
    officeId: string,
    data: {
      office_name?: string;
      office_code?: string;
      address?: string;
      locality?: string;
      office_locality?: string;
      city?: string;
      office_city?: string;
      state?: string;
      office_state?: string;
      pin?: string;
      office_pin?: string;
      latitude?: number;
      longitude?: number;
      radius_meters?: number;
      geofence_radius?: number;
      standard_break_allowance_minutes?: number;
      break_allowance?: number;
      break_grace_period_minutes?: number;
      grace_period?: number;
      shift_start_time?: string;
      office_start_time?: string;
      shift_end_time?: string;
      office_end_time?: string;
    }
  ) => Promise<boolean>;

  approveLeave: (leaveId: string, remarks?: string) => Promise<boolean>;
  rejectLeave: (leaveId: string, rejectionReason: string) => Promise<boolean>;

  approveOfficialDuty: (dutyId: string, remarks?: string) => Promise<boolean>;
  rejectOfficialDuty: (dutyId: string, rejectionReason: string) => Promise<boolean>;

  approveCorrection: (corrId: string, remarks?: string) => Promise<boolean>;
  rejectCorrection: (corrId: string, rejectionReason: string) => Promise<boolean>;

  overrideAttendanceSession: (
    sessionId: string,
    overrides: {
      check_in_time?: string;
      check_out_time?: string | null;
      active_status?: AttendanceSession['active_status'];
      confirmed_working_minutes?: number;
      actual_break_minutes?: number;
      admin_remarks: string;
    }
  ) => Promise<boolean>;

  // Filtered views based on selected office
  filteredEmployees: Employee[];
  filteredSessions: AttendanceSession[];
  filteredLeaveRequests: LeaveRequest[];
  filteredOfficialDutyRequests: OfficialDutyRequest[];
  filteredCorrections: AttendanceCorrection[];
  excessBreakEmployees: { session: AttendanceSession; employee: Employee; excessMinutes: number }[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  // Pure API-backed State (NO local storage persistence)
  const [offices, setOffices] = useState<Office[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [officialDutyRequests, setOfficialDutyRequests] = useState<OfficialDutyRequest[]>([]);
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const currentRole = currentUser?.role || 'admin';

  // Helper to safely extract arrays from both raw arrays and { success, data } envelopes
  const extractArray = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const normalizeUser = (u: any): AdminUser => ({
    id: u.id || u.user_id || u.sub || 'usr-default',
    email: u.email || '',
    full_name: u.full_name || u.name || 'Administrator',
    role: (u.role || u.user_role || 'admin') as any,
    status: (u.status || u.user_status || 'active') as any,
    assigned_office_ids: Array.isArray(u.assigned_office_ids) ? u.assigned_office_ids : [],
    created_at: u.created_at || new Date().toISOString(),
  });

  // Fetch all live data strictly from backend REST APIs
  const refreshData = async () => {
    try {
      // 1. Fetch offices
      const offRes = await officesApi.getAll();
      const newOffices = extractArray<Office>(offRes.data);
      setOffices(newOffices);

      // 2. Fetch admins
      const adminRes = await adminsApi.getAll();
      const newAdmins = extractArray<AdminUser>(adminRes.data);
      setAdmins(newAdmins);

      // Create lookup sets of admin emails & IDs to strictly filter them out from employees
      const adminEmails = new Set(
        newAdmins.map((a) => (a.email || '').toLowerCase().trim()).filter(Boolean)
      );
      const adminIds = new Set(newAdmins.map((a) => a.id).filter(Boolean));

      // 3. Fetch employees for active office
      const empRes = await employeesApi.getAll({ office_id: selectedOfficeId });
      const rawEmps = extractArray<Employee>(empRes.data);

      // STRICT FILTER: Super Admin and Admins must NEVER be counted or listed as employees
      const staffOnly = rawEmps.filter((emp) => {
        const role = ((emp as any).role || '').toLowerCase();
        if (role === 'admin' || role === 'super_admin' || role === 'office_admin') {
          return false;
        }
        const email = (emp.email || '').toLowerCase().trim();
        if (
          email === 'superadmin@gov.in' ||
          email.startsWith('superadmin@') ||
          email.startsWith('admin@') ||
          adminEmails.has(email)
        ) {
          return false;
        }
        if (adminIds.has(emp.id)) {
          return false;
        }
        const name = (emp.full_name || '').toLowerCase().trim();
        if (
          name === 'super admin' ||
          name === 'administrator' ||
          name === 'system administrator' ||
          name.includes('super admin')
        ) {
          return false;
        }
        return true;
      });
      setEmployees(staffOnly);

      // 4. Fetch live attendance sessions
      const sessRes = await attendanceApi.getAllSessions({ office_id: selectedOfficeId });
      const newSessions = extractArray<AttendanceSession>(sessRes.data);
      setSessions(newSessions);

      // 5. Fetch leave requests
      const leaveRes = await leavesApi.getAll({ office_id: selectedOfficeId });
      const newLeaves = extractArray<LeaveRequest>(leaveRes.data);
      setLeaveRequests(newLeaves);

      // 6. Fetch holidays
      const holRes = await holidaysApi.getAll({ office_id: selectedOfficeId });
      const newHolidays = extractArray<Holiday>(holRes.data);
      setHolidays(newHolidays);

      // 7. Fetch official duties
      const dutyRes = await officialDutiesApi.getAll({ office_id: selectedOfficeId });
      if (dutyRes.data) {
        setOfficialDutyRequests(extractArray<OfficialDutyRequest>(dutyRes.data));
      }

      // 8. Fetch corrections
      const corrRes = await correctionsApi.getAll({ office_id: selectedOfficeId });
      if (corrRes.data) {
        setCorrections(extractArray<AttendanceCorrection>(corrRes.data));
      }

      // 9. If Super Admin, fetch system audit logs
      if (isSuperAdmin) {
        const auditRes = await auditLogsApi.getAll();
        if (auditRes.data) {
          setAuditLogs(extractArray<AuditLog>(auditRes.data));
        }
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.warn('[AppContext] API synchronization notice:', err);
    }
  };

  // On mount: wipe legacy localStorage mock data and authenticate via Bearer token with backend /auth/me
  useEffect(() => {
    // Clean up any legacy localStorage mock keys
    [
      'tjb_offices',
      'tjb_admins',
      'tjb_employees',
      'tjb_sessions',
      'tjb_leaves',
      'tjb_duties',
      'tjb_corrections',
      'tjb_audit_logs',
      'tjb_holidays',
      'tjb_auth_user',
    ].forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });

    const token = getAuthToken();
    if (token) {
      authApi
        .getMe()
        .then((res) => {
          const raw = res.data?.user || res.data?.data?.user || res.data?.data;
          if (raw) {
            const user = normalizeUser(raw);
            if (user.role === ('employee' as any)) {
              clearAuthToken();
              setCurrentUser(null);
            } else {
              setCurrentUser(user);
              if (user.role === 'admin' && user.assigned_office_ids?.length > 0) {
                setSelectedOfficeId(user.assigned_office_ids[0]);
              } else {
                setSelectedOfficeId('all');
              }
            }
          } else {
            clearAuthToken();
            setCurrentUser(null);
          }
        })
        .catch(() => {
          clearAuthToken();
          setCurrentUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  // When authenticated user or office filter changes, refresh live data from backend
  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser, selectedOfficeId]);

  // Periodic ticker for live attendance sync
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      refreshData();
    }, 25000);
    return () => clearInterval(interval);
  }, [currentUser, selectedOfficeId]);

  // Real Login directly via backend REST API
  const login = async (
    email: string,
    password?: string,
    requestedRole: 'admin' | 'super_admin' = 'admin'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const trimmed = email.trim();

    try {
      // Authenticate directly against backend REST API
      const res = await authApi.login({ email: trimmed, password });

      if (res.error || !res.data) {
        setIsLoading(false);
        return {
          success: false,
          error: res.error || 'Invalid email or password. Please verify your credentials.',
        };
      }

      if (res.data?.success && res.data?.user) {
        const rawUser = res.data.user;
        const user = normalizeUser({
          ...rawUser,
          role: rawUser.role || requestedRole,
        });

        if (user.role === ('employee' as any)) {
          setIsLoading(false);
          return {
            success: false,
            error: 'Access Denied: The Web Portal is strictly for Admins and Super Admins. Employees must use the Mobile App.',
          };
        }

        const token = res.data.token;
        if (token) {
          setAuthToken(token);
        }
        setCurrentUser(user);

        if (user.role === 'admin' && user.assigned_office_ids?.length > 0) {
          setSelectedOfficeId(user.assigned_office_ids[0]);
        } else {
          setSelectedOfficeId('all');
        }

        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return {
        success: false,
        error: res.error || 'Authentication failed. Please check your credentials.',
      };
    } catch (err: any) {
      setIsLoading(false);
      return {
        success: false,
        error: err?.message || 'Failed to reach authentication server.',
      };
    }
  };

  // Logout
  const logout = () => {
    authApi.logout().catch(() => {});
    clearAuthToken();
    setCurrentUser(null);
    setOffices([]);
    setAdmins([]);
    setEmployees([]);
    setSessions([]);
    setLeaveRequests([]);
    setOfficialDutyRequests([]);
    setCorrections([]);
    setHolidays([]);
    setAuditLogs([]);
  };

  // ===========================================================================
  // REAL API ACTIONS (NO LOCAL STORAGE CACHING)
  // ===========================================================================

  const addEmployee = async (empData: Omit<Employee, 'id' | 'created_at'>): Promise<boolean> => {
    // 1. If password provided, register auth credentials
    if ((empData as any).password) {
      try {
        await authApi.register({
          emp_name: empData.full_name,
          email: empData.email,
          password: (empData as any).password,
          role: 'employee',
          emp_phone: empData.mobile_number,
        });
      } catch {}
    }

    // 2. Insert into Employee table via backend API
    const res = await employeesApi.create({
      full_name: empData.full_name,
      email: empData.email,
      designation: empData.designation,
      mobile_number: empData.mobile_number,
    });

    if (res.error) {
      alert(`Failed to add employee: ${res.error}`);
      return false;
    }

    await refreshData();
    return true;
  };

  const updateEmployee = async (id: string, empData: Partial<Employee>): Promise<boolean> => {
    const res = await employeesApi.update(id, empData);
    if (res.error) {
      alert(`Failed to update employee: ${res.error}`);
      return false;
    }
    await refreshData();
    return true;
  };

  const toggleEmployeeStatus = async (id: string): Promise<boolean> => {
    const emp = employees.find((e) => e.id === id);
    const nextStatus = emp?.status === 'active' ? 'suspended' : 'active';
    const res = await employeesApi.toggleStatus(id, nextStatus);
    if (res.error) {
      alert(`Failed to update employee status: ${res.error}`);
      return false;
    }
    await refreshData();
    return true;
  };

  const addAdmin = async (adminData: Omit<AdminUser, 'id' | 'created_at'>): Promise<boolean> => {
    const res = await authApi.register({
      emp_name: adminData.full_name,
      email: adminData.email,
      password: (adminData as any).password || 'Admin@123',
      role: adminData.role || 'admin',
      emp_phone: '',
    });

    if (res.error) {
      alert(`Failed to create admin: ${res.error}`);
      return false;
    }

    await refreshData();
    return true;
  };

  const updateAdmin = async (id: string, adminData: Partial<AdminUser>): Promise<boolean> => {
    const res = await adminsApi.update(id, adminData);
    if (res.error) {
      alert(`Failed to update admin: ${res.error}`);
      return false;
    }
    await refreshData();
    return true;
  };

  const toggleAdminStatus = async (id: string): Promise<boolean> => {
    const admin = admins.find((a) => a.id === id);
    const nextStatus = admin?.status === 'active' ? 'suspended' : 'active';
    const res = await adminsApi.toggleStatus(id, nextStatus);
    if (res.error) {
      alert(`Failed to update admin status: ${res.error}`);
      return false;
    }
    await refreshData();
    return true;
  };

  const addOffice = async (officeData: Omit<Office, 'id' | 'created_at'>): Promise<boolean> => {
    const res = await officesApi.create(officeData);
    if (res.error) {
      alert(`Failed to create office: ${res.error}`);
      return false;
    }
    await refreshData();
    return true;
  };

  const deleteOffice = async (officeId: string): Promise<boolean> => {
    const res = await officesApi.delete(officeId);
    if (res.error) {
      alert(`Failed to delete office: ${res.error}`);
      return false;
    }
    await refreshData();
    return true;
  };

  const updateOfficeCalibration = async (
    officeId: string,
    data: {
      office_name?: string;
      office_code?: string;
      address?: string;
      locality?: string;
      office_locality?: string;
      city?: string;
      office_city?: string;
      state?: string;
      office_state?: string;
      pin?: string;
      office_pin?: string;
      latitude?: number;
      longitude?: number;
      radius_meters?: number;
      geofence_radius?: number;
      standard_break_allowance_minutes?: number;
      break_allowance?: number;
      break_grace_period_minutes?: number;
      grace_period?: number;
      shift_start_time?: string;
      office_start_time?: string;
      shift_end_time?: string;
      office_end_time?: string;
    }
  ): Promise<boolean> => {
    const res = await officesApi.updateCalibration(officeId, data);
    if (res.error) {
      alert(`Failed to update office calibration: ${res.error}`);
      return false;
    }
    await refreshData();
    return true;
  };

  const addHoliday = async (holidayData: Omit<Holiday, 'id' | 'created_at'>): Promise<boolean> => {
    const res = await holidaysApi.create(holidayData);
    if (res.error) {
      alert(`Failed to add holiday: ${res.error}`);
      return false;
    }
    await refreshData();
    return true;
  };

  const updateHoliday = async (id: string, holidayData: Partial<Holiday>): Promise<boolean> => {
    const res = await holidaysApi.update(id, holidayData);
    if (res.error) {
      alert(`Failed to update holiday: ${res.error}`);
      return false;
    }
    await refreshData();
    return true;
  };

  const deleteHoliday = async (id: string): Promise<boolean> => {
    const res = await holidaysApi.delete(id);
    if (res.error) {
      alert(`Failed to remove holiday: ${res.error}`);
      return false;
    }
    await refreshData();
    return true;
  };

  const approveLeave = async (leaveId: string, remarks?: string): Promise<boolean> => {
    const res = await leavesApi.approve(leaveId, remarks);
    if (res.error) {
      alert(`Failed to approve leave: ${res.error}`);
      return false;
    }
    await refreshData();
    return true;
  };

  const rejectLeave = async (leaveId: string, rejectionReason: string): Promise<boolean> => {
    if (!rejectionReason.trim()) {
      alert('Rejection reason is mandatory.');
      return false;
    }
    const res = await leavesApi.reject(leaveId, rejectionReason);
    if (res.error) {
      alert(`Failed to reject leave: ${res.error}`);
      return false;
    }
    await refreshData();
    return true;
  };

  const approveOfficialDuty = async (dutyId: string, remarks?: string): Promise<boolean> => {
    const res = await officialDutiesApi.approve(dutyId, remarks);
    if (res.error) {
      alert(`Failed to approve official duty: ${res.error}`);
      return false;
    }
    await refreshData();
    return true;
  };

  const rejectOfficialDuty = async (dutyId: string, rejectionReason: string): Promise<boolean> => {
    if (!rejectionReason.trim()) {
      alert('Rejection reason is mandatory.');
      return false;
    }
    const res = await officialDutiesApi.reject(dutyId, rejectionReason);
    if (res.error) {
      alert(`Failed to reject official duty: ${res.error}`);
      return false;
    }
    await refreshData();
    return true;
  };

  const approveCorrection = async (corrId: string, remarks?: string): Promise<boolean> => {
    const res = await correctionsApi.approve(corrId, remarks);
    if (res.error) {
      alert(`Failed to approve correction: ${res.error}`);
      return false;
    }
    await refreshData();
    return true;
  };

  const rejectCorrection = async (corrId: string, rejectionReason: string): Promise<boolean> => {
    if (!rejectionReason.trim()) {
      alert('Rejection reason is mandatory.');
      return false;
    }
    const res = await correctionsApi.reject(corrId, rejectionReason);
    if (res.error) {
      alert(`Failed to reject correction: ${res.error}`);
      return false;
    }
    await refreshData();
    return true;
  };

  const overrideAttendanceSession = async (
    sessionId: string,
    overrides: {
      check_in_time?: string;
      check_out_time?: string | null;
      active_status?: AttendanceSession['active_status'];
      confirmed_working_minutes?: number;
      actual_break_minutes?: number;
      admin_remarks: string;
    }
  ): Promise<boolean> => {
    const res = await attendanceApi.overrideSession(sessionId, overrides);
    if (res.error) {
      alert(`Failed to override session: ${res.error}`);
      return false;
    }
    await refreshData();
    return true;
  };

  // Filtered views based on selected office
  const filteredEmployees = useMemo(() => {
    if (selectedOfficeId === 'all') return employees;
    return employees.filter((e) => e.office_id === selectedOfficeId);
  }, [employees, selectedOfficeId]);

  const filteredSessions = useMemo(() => {
    const staffEmpIds = new Set(employees.map((e) => e.id));
    const base = selectedOfficeId === 'all' ? sessions : sessions.filter((s) => s.office_id === selectedOfficeId);
    return base.filter((s) => staffEmpIds.has(s.employee_id));
  }, [sessions, selectedOfficeId, employees]);

  const filteredLeaveRequests = useMemo(() => {
    const staffEmpIds = new Set(employees.map((e) => e.id));
    const base = selectedOfficeId === 'all' ? leaveRequests : leaveRequests.filter((l) => l.office_id === selectedOfficeId);
    return base.filter((l) => staffEmpIds.has(l.employee_id));
  }, [leaveRequests, selectedOfficeId, employees]);

  const filteredOfficialDutyRequests = useMemo(() => {
    const staffEmpIds = new Set(employees.map((e) => e.id));
    const base = selectedOfficeId === 'all' ? officialDutyRequests : officialDutyRequests.filter((d) => d.office_id === selectedOfficeId);
    return base.filter((d) => staffEmpIds.has(d.employee_id));
  }, [officialDutyRequests, selectedOfficeId, employees]);

  const filteredCorrections = useMemo(() => {
    const staffEmpIds = new Set(filteredEmployees.map((e) => e.id));
    return corrections.filter((c) => staffEmpIds.has(c.employee_id));
  }, [corrections, filteredEmployees]);

  // Excess break detection (> 75 mins) - strictly for staff employees
  const excessBreakEmployees = useMemo(() => {
    const list: { session: AttendanceSession; employee: Employee; excessMinutes: number }[] = [];
    filteredSessions.forEach((sess) => {
      if (sess.actual_break_minutes > 75) {
        const emp = employees.find((e) => e.id === sess.employee_id);
        if (emp) {
          list.push({
            session: sess,
            employee: emp,
            excessMinutes: sess.actual_break_minutes - 75,
          });
        }
      }
    });
    return list;
  }, [filteredSessions, employees]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole,
        isSuperAdmin,
        selectedOfficeId,
        setSelectedOfficeId,
        offices,
        admins,
        employees,
        sessions,
        leaveRequests,
        officialDutyRequests,
        corrections,
        auditLogs,
        holidays,
        isLoading,
        lastUpdated,
        refreshData,
        login,
        logout,
        addEmployee,
        updateEmployee,
        toggleEmployeeStatus,
        addAdmin,
        updateAdmin,
        toggleAdminStatus,
        addOffice,
        deleteOffice,
        addHoliday,
        updateHoliday,
        deleteHoliday,
        updateOfficeCalibration,
        approveLeave,
        rejectLeave,
        approveOfficialDuty,
        rejectOfficialDuty,
        approveCorrection,
        rejectCorrection,
        overrideAttendanceSession,
        filteredEmployees,
        filteredSessions,
        filteredLeaveRequests,
        filteredOfficialDutyRequests,
        filteredCorrections,
        excessBreakEmployees,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

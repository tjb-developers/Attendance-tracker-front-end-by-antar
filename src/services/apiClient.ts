/**
 * REST API Client for Tripura Jal Board Attendance System
 * Connects directly to the backend REST API endpoints defined in .env
 */

const STORAGE_KEY_AUTH_TOKEN = 'tjb_auth_token';

export function getApiBaseUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  return envUrl ? envUrl.replace(/\/+$/, '') : 'http://localhost:8000/api/v1';
}

export function getAuthToken(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY_AUTH_TOKEN) || localStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY_AUTH_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, token);
  } catch {}
}

export function clearAuthToken() {
  try {
    sessionStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
    localStorage.removeItem('tjb_auth_user');
  } catch {}
}

export function getStoredUser(): any | null {
  return null;
}

export function setStoredUser(_user: any) {}

/**
 * Universal JSON Fetch Wrapper with automatic token attachment
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const status = res.status;
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const errMsg = data?.message || data?.error || `HTTP ${res.status}: ${res.statusText}`;
      return { data: null, error: errMsg, status };
    }

    return { data, error: null, status };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'Failed to reach Backend API server. Please ensure the backend server is running.',
      status: 0,
    };
  }
}

// =============================================================================
// TYPED API SERVICE REPOSITORIES
// =============================================================================

export const authApi = {
  login: (payload: { email: string; password?: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload: {
    emp_name: string;
    email: string;
    password?: string;
    role?: 'employee' | 'admin' | 'super_admin' | string;
    emp_phone?: string;
  }) =>
    apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => apiRequest('/auth/me', { method: 'GET' }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
};

export const officesApi = {
  getAll: (params?: { status?: string }) => {
    const query = params?.status ? `?status=${params.status}` : '';
    return apiRequest(`/offices${query}`, { method: 'GET' });
  },
  getById: (id: string) => apiRequest(`/offices/${id}`, { method: 'GET' }),
  create: (payload: any) =>
    apiRequest('/offices', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: any) =>
    apiRequest(`/offices/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete: (id: string) =>
    apiRequest(`/offices/${id}`, { method: 'DELETE' }),
  updateCalibration: (id: string, payload: any) =>
    apiRequest(`/offices/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
};

export const adminsApi = {
  getAll: () => apiRequest('/admins', { method: 'GET' }),
  create: (payload: any) => apiRequest('/admins', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: any) =>
    apiRequest(`/admins/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  toggleStatus: (id: string, status: string) =>
    apiRequest(`/admins/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

export const employeesApi = {
  getAll: (params?: { office_id?: string; search?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.office_id && params.office_id !== 'all') q.set('office_id', params.office_id);
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    return apiRequest(`/employees?${q.toString()}`, { method: 'GET' });
  },
  create: (payload: any) => apiRequest('/employees', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: any) =>
    apiRequest(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  toggleStatus: (id: string, status: string) =>
    apiRequest(`/employees/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

export const attendanceApi = {
  getLive: (params?: { office_id?: string; date?: string }) => {
    const q = new URLSearchParams();
    if (params?.office_id && params.office_id !== 'all') q.set('office_id', params.office_id);
    if (params?.date) q.set('date', params.date);
    return apiRequest(`/attendance/live?${q.toString()}`, { method: 'GET' });
  },
  getAllSessions: (params?: { office_id?: string; date?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.office_id && params.office_id !== 'all') q.set('office_id', params.office_id);
    if (params?.date) q.set('date', params.date);
    if (params?.search) q.set('search', params.search);
    return apiRequest(`/attendance/sessions?${q.toString()}`, { method: 'GET' });
  },
  overrideSession: (sessionId: string, payload: any) =>
    apiRequest(`/attendance/sessions/${sessionId}/override`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};

export const leavesApi = {
  getAll: (params?: { office_id?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.office_id && params.office_id !== 'all') q.set('office_id', params.office_id);
    if (params?.status) q.set('status', params.status);
    return apiRequest(`/leaves?${q.toString()}`, { method: 'GET' });
  },
  approve: (id: string, remarks?: string) =>
    apiRequest(`/leaves/${id}/approve`, { method: 'POST', body: JSON.stringify({ remarks }) }),
  reject: (id: string, rejection_reason: string) =>
    apiRequest(`/leaves/${id}/reject`, { method: 'POST', body: JSON.stringify({ rejection_reason }) }),
};

export const officialDutiesApi = {
  getAll: (params?: { office_id?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.office_id && params.office_id !== 'all') q.set('office_id', params.office_id);
    if (params?.status) q.set('status', params.status);
    return apiRequest(`/official-duties?${q.toString()}`, { method: 'GET' });
  },
  approve: (id: string, remarks?: string) =>
    apiRequest(`/official-duties/${id}/approve`, { method: 'POST', body: JSON.stringify({ remarks }) }),
  reject: (id: string, rejection_reason: string) =>
    apiRequest(`/official-duties/${id}/reject`, { method: 'POST', body: JSON.stringify({ rejection_reason }) }),
};

export const correctionsApi = {
  getAll: (params?: { office_id?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.office_id && params.office_id !== 'all') q.set('office_id', params.office_id);
    if (params?.status) q.set('status', params.status);
    return apiRequest(`/corrections?${q.toString()}`, { method: 'GET' });
  },
  approve: (id: string, remarks?: string) =>
    apiRequest(`/corrections/${id}/approve`, { method: 'POST', body: JSON.stringify({ remarks }) }),
  reject: (id: string, rejection_reason: string) =>
    apiRequest(`/corrections/${id}/reject`, { method: 'POST', body: JSON.stringify({ rejection_reason }) }),
};

export const holidaysApi = {
  getAll: (params?: { year?: number; office_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.year) q.set('year', String(params.year));
    if (params?.office_id && params.office_id !== 'all') q.set('office_id', params.office_id);
    return apiRequest(`/holidays?${q.toString()}`, { method: 'GET' });
  },
  create: (payload: any) =>
    apiRequest('/holidays', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: any) =>
    apiRequest(`/holidays/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete: (id: string) =>
    apiRequest(`/holidays/${id}`, { method: 'DELETE' }),
};

export const reportsApi = {
  getAttendance: (params?: { office_id?: string; timeframe?: string; date?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.office_id && params.office_id !== 'all') q.set('office_id', params.office_id);
    if (params?.timeframe) q.set('timeframe', params.timeframe);
    if (params?.date) q.set('date', params.date);
    if (params?.search) q.set('search', params.search);
    return apiRequest(`/reports/attendance?${q.toString()}`, { method: 'GET' });
  },
};

export const auditLogsApi = {
  getAll: (params?: { action?: string; entity?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.action) q.set('action', params.action);
    if (params?.entity) q.set('entity', params.entity);
    if (params?.limit) q.set('limit', String(params.limit));
    return apiRequest(`/audit-logs?${q.toString()}`, { method: 'GET' });
  },
};

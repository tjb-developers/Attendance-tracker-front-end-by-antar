import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileEdit,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Building2,
  Calendar,
} from 'lucide-react';
import { AttendanceSession, Employee } from '../../types';

export const GlobalOverrides: React.FC = () => {
  const { sessions, employees, offices, overrideAttendanceSession, isSuperAdmin } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingSession, setEditingSession] = useState<{
    session: AttendanceSession;
    employee: Employee;
  } | null>(null);

  const [overrideForm, setOverrideForm] = useState({
    check_in_time: '',
    check_out_time: '',
    active_status: 'working' as AttendanceSession['active_status'],
    confirmed_working_minutes: 0,
    actual_break_minutes: 0,
    admin_remarks: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <Shield className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Restricted Super Admin Area</h3>
        <p className="text-xs text-slate-500 mt-1">
          Only Super Administrators hold global override authority to alter finalized attendance sessions.
        </p>
      </div>
    );
  }

  const sessionList = useMemo(() => {
    return sessions.map((s) => {
      const emp = employees.find((e) => e.id === s.employee_id);
      return {
        session: s,
        employee: emp || {
          id: s.employee_id,
          employee_code: 'UNKNOWN',
          full_name: 'Unknown Staff',
          designation: 'Staff',
          email: '',
          mobile_number: '',
          office_id: s.office_id,
          created_at: '',
        },
      };
    }).filter(({ employee, session }) => {
      const matches =
        employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.attendance_date.includes(searchTerm);
      return matches;
    });
  }, [sessions, employees, searchTerm]);

  const openOverrideModal = (session: AttendanceSession, employee: Employee) => {
    setEditingSession({ session, employee });
    setOverrideForm({
      check_in_time: session.check_in_time ? session.check_in_time.slice(0, 16) : '',
      check_out_time: session.check_out_time ? session.check_out_time.slice(0, 16) : '',
      active_status: session.active_status,
      confirmed_working_minutes: session.confirmed_working_minutes,
      actual_break_minutes: session.actual_break_minutes,
      admin_remarks: '',
    });
    setFormError(null);
  };

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideForm.admin_remarks.trim()) {
      setFormError('Mandatory administrative remark is required for any system override.');
      return;
    }

    if (editingSession) {
      overrideAttendanceSession(editingSession.session.id, {
        check_in_time: overrideForm.check_in_time ? new Date(overrideForm.check_in_time).toISOString() : undefined,
        check_out_time: overrideForm.check_out_time ? new Date(overrideForm.check_out_time).toISOString() : null,
        active_status: overrideForm.active_status,
        confirmed_working_minutes: Number(overrideForm.confirmed_working_minutes),
        actual_break_minutes: Number(overrideForm.actual_break_minutes),
        admin_remarks: overrideForm.admin_remarks.trim(),
      });
      setEditingSession(null);
    }
  };

  const formatMins = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Global Attendance Overrides Desk
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900">
              Super Admin Overrides
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Unrestricted administrative authority to modify check-in times, adjust working hours, and resolve disputed records across all offices.
          </p>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff, code, date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
          />
        </div>
      </div>

      {/* Warning Alert */}
      <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Super Admin Audit Guarantee: </span>
          <span>
            Every manual override is indelibly captured in the System Audit Log with the timestamp, original values, modified values, and mandatory justification remarks.
          </span>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Office</th>
                <th className="py-3 px-4">Attendance Date</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Break Time</th>
                <th className="py-3 px-4 font-bold text-amber-900">Confirmed Working</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sessionList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    No attendance session records found for override.
                  </td>
                </tr>
              ) : (
                sessionList.map(({ employee, session }) => {
                const off = offices.find((o) => o.id === session.office_id);
                return (
                  <tr key={session.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{employee.full_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {employee.employee_code} &bull; {employee.designation}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      {off?.office_name || 'Assigned Office'}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                      {session.attendance_date}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {session.check_in_time ? new Date(session.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {session.check_out_time ? new Date(session.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {formatMins(session.actual_break_minutes)}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {formatMins(session.confirmed_working_minutes)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {session.active_status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openOverrideModal(session, employee)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        <span>Override Record</span>
                      </button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Modal */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-fade-in">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-700 to-amber-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-amber-200" />
                <h3 className="font-bold text-base">Super Admin Override</h3>
              </div>
              <button
                onClick={() => setEditingSession(null)}
                className="text-amber-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOverride} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950">
                <p className="font-bold">
                  Editing Record: {editingSession.employee.full_name} ({editingSession.employee.employee_code})
                </p>
                <p className="text-[11px] text-amber-800">
                  Date: {editingSession.session.attendance_date} &bull; Session ID: {editingSession.session.id}
                </p>
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Check-In Time
                  </label>
                  <input
                    type="datetime-local"
                    value={overrideForm.check_in_time}
                    onChange={(e) => setOverrideForm({ ...overrideForm, check_in_time: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Check-Out Time
                  </label>
                  <input
                    type="datetime-local"
                    value={overrideForm.check_out_time}
                    onChange={(e) => setOverrideForm({ ...overrideForm, check_out_time: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Working (Mins)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={overrideForm.confirmed_working_minutes}
                    onChange={(e) =>
                      setOverrideForm({ ...overrideForm, confirmed_working_minutes: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Break (Mins)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={overrideForm.actual_break_minutes}
                    onChange={(e) =>
                      setOverrideForm({ ...overrideForm, actual_break_minutes: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Session Status
                  </label>
                  <select
                    value={overrideForm.active_status}
                    onChange={(e) =>
                      setOverrideForm({
                        ...overrideForm,
                        active_status: e.target.value as AttendanceSession['active_status'],
                      })
                    }
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="working">Working</option>
                    <option value="on_break">On Break</option>
                    <option value="on_official_work">Out Duty</option>
                    <option value="checked_out">Checked Out</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-800 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Required Audit Justification Remark *
                </label>
                <textarea
                  rows={3}
                  required
                  value={overrideForm.admin_remarks}
                  onChange={(e) => setOverrideForm({ ...overrideForm, admin_remarks: e.target.value })}
                  placeholder="State the official basis for overriding this attendance record (e.g. Executive Engineer verbal confirmation, verified cellular network outage, or field duty adjustment)..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                >
                  Apply Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


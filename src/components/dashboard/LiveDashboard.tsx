import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  CheckCircle2,
  Coffee,
  Briefcase,
  LogOut,
  UserX,
  AlertTriangle,
  Search,
  Filter,
  MapPin,
  Clock,
  Eye,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { AttendanceSession, Employee } from '../../types';

export const LiveDashboard: React.FC = () => {
  const {
    filteredEmployees,
    filteredSessions,
    excessBreakEmployees,
    offices,
    selectedOfficeId,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<{
    session: AttendanceSession;
    employee: Employee;
  } | null>(null);

  // Match sessions with employees
  const staffStatusList = useMemo(() => {
    return filteredEmployees.map((emp) => {
      const session = filteredSessions.find((s) => s.employee_id === emp.id);
      return {
        employee: emp,
        session: session || null,
        status: session ? session.active_status : 'absent',
      };
    });
  }, [filteredEmployees, filteredSessions]);

  // Status Counts
  const totalStaff = filteredEmployees.length;
  const presentCount = staffStatusList.filter((s) => s.status === 'working').length;
  const onBreakCount = staffStatusList.filter((s) => s.status === 'on_break').length;
  const onOutDutyCount = staffStatusList.filter((s) => s.status === 'on_official_work').length;
  const checkedOutCount = staffStatusList.filter((s) => s.status === 'checked_out').length;
  const absentCount = staffStatusList.filter((s) => s.status === 'absent').length;

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return staffStatusList.filter(({ employee, status }) => {
      const matchesSearch =
        employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.designation.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;
      if (statusFilter === 'excess_break') {
        const sess = filteredSessions.find((s) => s.employee_id === employee.id);
        return sess ? sess.actual_break_minutes > 75 : false;
      }
      return status === statusFilter;
    });
  }, [staffStatusList, searchTerm, statusFilter, filteredSessions]);

  const formatMins = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  const formatTimeStr = (isoString?: string | null) => {
    if (!isoString) return '--:--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Subhead */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Live Daily Attendance Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time tracking of staff presence, breaks, and geofence verification for Tripura Jal Board.
          </p>
        </div>
        <div className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm self-start sm:self-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Geofence Radius: 100m</span>
        </div>
      </div>

      {/* Excess Break Alert Banner */}
      {excessBreakEmployees.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-50 to-amber-100/40 border-l-4 border-amber-500 p-4 rounded-xl shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-lg flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <span>Excess Break Alert Triggered</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white">
                    {excessBreakEmployees.length} Staff Exceeding 75m Limit
                  </span>
                </h3>
                <span className="text-xs text-amber-800 font-medium">
                  Standard Allowance: 60m &bull; Alert Threshold: 75m
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-1">
                The following personnel have exceeded the 75-minute break threshold. Excess break time is automatically flagged for administrative review:
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {excessBreakEmployees.map(({ employee, session, excessMinutes }) => (
                  <div
                    key={employee.id}
                    className="p-2.5 bg-white border border-amber-300 rounded-lg shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{employee.full_name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{employee.employee_code} &bull; {employee.designation}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-700 block">
                        {session.actual_break_minutes} mins
                      </span>
                      <span className="text-[10px] text-rose-600 font-semibold">
                        +{excessMinutes}m excess
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Status Cards (Exact mobile palette) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Staff */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Staff</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalStaff}</div>
          <p className="text-[10px] text-slate-400 mt-1">Enrolled personnel</p>
        </div>

        {/* Present / Working */}
        <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#10B981]" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Present</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{presentCount}</div>
          <p className="text-[10px] text-emerald-700 mt-1">Inside geofence working</p>
        </div>

        {/* On Break */}
        <div className="p-4 bg-white rounded-2xl border border-amber-100 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#F59E0B]" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">On Break</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">{onBreakCount}</div>
          <p className="text-[10px] text-amber-700 mt-1">Active tea / auto break</p>
        </div>

        {/* Office Out Duty */}
        <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#3B82F6]" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Out Duty</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-600">{onOutDutyCount}</div>
          <p className="text-[10px] text-blue-700 mt-1">Official fieldwork</p>
        </div>

        {/* Checked Out */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#64748B]" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Checked Out</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <LogOut className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-700">{checkedOutCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Finalized sessions</p>
        </div>

        {/* Absent */}
        <div className="p-4 bg-white rounded-2xl border border-rose-100 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#EF4444]" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Absent</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600">{absentCount}</div>
          <p className="text-[10px] text-rose-700 mt-1">No check-in / Leave</p>
        </div>
      </div>

      {/* Main Roster Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Daily Attendance Roster
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
              {filteredRoster.length} staff
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff, code, role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'working', label: 'Present' },
                { id: 'on_break', label: 'Break' },
                { id: 'excess_break', label: 'Excess Break' },
                { id: 'on_official_work', label: 'Out Duty' },
                { id: 'checked_out', label: 'Checked Out' },
                { id: 'absent', label: 'Absent' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setStatusFilter(pill.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                    statusFilter === pill.id
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Roster Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">GPS Proximity</th>
                <th className="py-3 px-4">Office Working</th>
                <th className="py-3 px-4">Break Time</th>
                <th className="py-3 px-4">Out Duty</th>
                <th className="py-3 px-4 font-extrabold text-blue-900">Confirmed Working</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    No staff attendance records found for this office.
                  </td>
                </tr>
              ) : (
                filteredRoster.map(({ employee, session, status }) => {
                const isExcessBreak = session ? session.actual_break_minutes > 75 : false;

                return (
                  <tr key={employee.id} className="hover:bg-slate-50/80 transition">
                    {/* Employee Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {employee.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{employee.full_name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {employee.employee_code} &bull; {employee.designation}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-4">
                      {status === 'working' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-[#10B981] border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                          Present / Working
                        </span>
                      )}
                      {status === 'on_break' && (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isExcessBreak
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                              : 'bg-amber-50 text-[#F59E0B] border border-amber-200'
                          }`}
                        >
                          <Coffee className="w-3 h-3" />
                          {isExcessBreak ? 'Excess Break' : 'On Break'}
                        </span>
                      )}
                      {status === 'on_official_work' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[#3B82F6] border border-blue-200">
                          <Briefcase className="w-3 h-3" />
                          Office Out Duty
                        </span>
                      )}
                      {status === 'checked_out' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <LogOut className="w-3 h-3" />
                          Checked Out
                        </span>
                      )}
                      {status === 'absent' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-[#EF4444] border border-rose-200">
                          <UserX className="w-3 h-3" />
                          Absent
                        </span>
                      )}
                    </td>

                    {/* Check In Time */}
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {session ? formatTimeStr(session.check_in_time) : '--:--'}
                    </td>

                    {/* GPS Distance Evidence */}
                    <td className="py-3.5 px-4">
                      {session ? (
                        <div className="flex items-center gap-1 text-[11px] text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <span>{session.check_in_distance_meters.toFixed(1)}m from HQ</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>

                    {/* Office Working Time */}
                    <td className="py-3.5 px-4 font-mono">
                      {session ? formatMins(session.office_working_minutes) : '--'}
                    </td>

                    {/* Break Time */}
                    <td className="py-3.5 px-4">
                      {session ? (
                        <span
                          className={`font-mono font-medium ${
                            isExcessBreak ? 'text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200' : 'text-slate-700'
                          }`}
                        >
                          {formatMins(session.actual_break_minutes)}
                          {isExcessBreak && ' (ALERT)'}
                        </span>
                      ) : (
                        '--'
                      )}
                    </td>

                    {/* Out Duty Time */}
                    <td className="py-3.5 px-4">
                      {session ? (
                        <div className="font-mono text-slate-700">
                          {formatMins(session.approved_official_work_minutes)}
                          {session.pending_official_work_minutes > 0 && (
                            <span className="text-[10px] text-blue-600 block">
                              (+{formatMins(session.pending_official_work_minutes)} pending)
                            </span>
                          )}
                        </div>
                      ) : (
                        '--'
                      )}
                    </td>

                    {/* Confirmed Working Time */}
                    <td className="py-3.5 px-4">
                      {session ? (
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {formatMins(session.confirmed_working_minutes)}
                        </span>
                      ) : (
                        '--'
                      )}
                    </td>

                    {/* Details Action */}
                    <td className="py-3.5 px-4 text-right">
                      {session ? (
                        <button
                          onClick={() => setSelectedSession({ session, employee })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No log</span>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Inspector Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-fade-in">
            <div className="p-5 bg-gradient-to-r from-[#0D1B2A] to-[#1B263B] text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base">{selectedSession.employee.full_name}</h4>
                <p className="text-xs text-sky-300 font-mono">
                  {selectedSession.employee.employee_code} &bull; {selectedSession.employee.designation}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Check-In Time</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {formatTimeStr(selectedSession.session.check_in_time)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Check-Out Time</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {formatTimeStr(selectedSession.session.check_out_time)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">GPS Proximity Evidence</span>
                  <span className="font-semibold text-blue-700">
                    {selectedSession.session.check_in_distance_meters.toFixed(1)}m from HQ (Allowed: 100m)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Coordinates</span>
                  <span className="font-mono text-slate-600">
                    {selectedSession.session.check_in_latitude.toFixed(4)}, {selectedSession.session.check_in_longitude.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Working breakdown */}
              <div className="space-y-2">
                <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Daily Duration Reconciliation
                </h5>
                <div className="space-y-1.5 border border-slate-200 rounded-xl p-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Office Working Duration:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatMins(selectedSession.session.office_working_minutes)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Approved Official Out Duty:</span>
                    <span className="font-mono font-bold text-blue-600">
                      +{formatMins(selectedSession.session.approved_official_work_minutes)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1.5 font-bold">
                    <span className="text-slate-900">Total Confirmed Working Time:</span>
                    <span className="font-mono text-emerald-600">
                      {formatMins(selectedSession.session.confirmed_working_minutes)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 pt-1">
                    <span>Break Allowance Utilized:</span>
                    <span
                      className={`font-mono ${
                        selectedSession.session.actual_break_minutes > 75 ? 'text-amber-700 font-bold' : ''
                      }`}
                    >
                      {formatMins(selectedSession.session.actual_break_minutes)} / 60m standard
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


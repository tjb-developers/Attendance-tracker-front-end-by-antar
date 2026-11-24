import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  MapPin,
  Calendar,
  AlertCircle,
  X,
  ExternalLink,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { OfficialDutyRequest } from '../../types';

export const OfficeOutDutyDesk: React.FC = () => {
  const {
    filteredOfficialDutyRequests,
    employees,
    approveOfficialDuty,
    rejectOfficialDuty,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [rejectingDuty, setRejectingDuty] = useState<OfficialDutyRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const displayDuties = useMemo(() => {
    return filteredOfficialDutyRequests.filter((duty) => {
      const emp = employees.find((e) => e.id === duty.employee_id);
      const matchesSearch =
        duty.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (duty.destination && duty.destination.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emp && emp.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emp && emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;
      return duty.approval_status === statusFilter;
    });
  }, [filteredOfficialDutyRequests, employees, searchTerm, statusFilter]);

  const pendingCount = filteredOfficialDutyRequests.filter((d) => d.approval_status === 'pending').length;
  const approvedCount = filteredOfficialDutyRequests.filter((d) => d.approval_status === 'approved').length;
  const rejectedCount = filteredOfficialDutyRequests.filter((d) => d.approval_status === 'rejected').length;

  const handleApprove = (dutyId: string) => {
    approveOfficialDuty(dutyId, 'Verified and approved by Administration');
  };

  const openRejectModal = (duty: OfficialDutyRequest) => {
    setRejectingDuty(duty);
    setRejectionReason('');
    setRejectionError(null);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setRejectionError('Rejection reason is mandatory.');
      return;
    }
    if (rejectingDuty) {
      rejectOfficialDuty(rejectingDuty.id, rejectionReason.trim());
      setRejectingDuty(null);
    }
  };

  const formatMins = (minutes?: number | null) => {
    if (!minutes) return '0m';
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Office Out Duty Verification Desk
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Adjudicate fieldwork intervals. Approving an interval automatically converts verified out-duty hours into <strong>Confirmed Working Hours</strong>.
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
            <span>Pending Duty: </span>
            <span className="font-extrabold">{pendingCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
            <span>Confirmed: </span>
            <span className="font-extrabold">{approvedCount}</span>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Tripura Jal Board Business Rule: </span>
          <span>
            When field inspectors or technicians conduct on-site pump maintenance or pipeline surveys outside office radius, they submit an Office Out Duty session. Upon administrative approval, the duration is officially credited to their working hours.
          </span>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee, destination, work purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-navy-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st} ({st === 'pending' ? pendingCount : st === 'approved' ? approvedCount : st === 'rejected' ? rejectedCount : filteredOfficialDutyRequests.length})
              </button>
            ))}
          </div>
        </div>

        {/* Duty Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Destination & Evidence</th>
                <th className="py-3 px-4">Purpose / Reason</th>
                <th className="py-3 px-4">Interval Duration</th>
                <th className="py-3 px-4">Date & Time Range</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayDuties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No official duty applications found for this view.
                  </td>
                </tr>
              ) : (
                displayDuties.map((duty) => {
                  const emp = employees.find((e) => e.id === duty.employee_id);
                  const isPending = duty.approval_status === 'pending';
                  const isApproved = duty.approval_status === 'approved';
                  const isRejected = duty.approval_status === 'rejected';

                  return (
                    <tr key={duty.id} className="hover:bg-slate-50/80 transition">
                      {/* Employee */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {emp ? emp.full_name.charAt(0) : 'E'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">
                              {emp ? emp.full_name : 'Staff Member'}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {emp?.employee_code} &bull; {emp?.designation}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Destination & GPS Evidence */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 font-semibold text-slate-900 text-xs">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span>{duty.destination || 'Field Out-Duty'}</span>
                          </div>
                          {duty.evidence_latitude && duty.evidence_longitude && (
                            <span className="text-[10px] text-slate-500 font-mono block">
                              GPS: {duty.evidence_latitude.toFixed(4)}, {duty.evidence_longitude.toFixed(4)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Purpose */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-700 line-clamp-2 text-xs italic">
                          "{duty.reason}"
                        </p>
                      </td>

                      {/* Interval Duration */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
                            {formatMins(duty.duration_minutes)}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Converts to working hrs
                          </span>
                        </div>
                      </td>

                      {/* Date & Time Range */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                        <div className="font-semibold text-slate-900">{duty.attendance_date}</div>
                        <div className="text-slate-500">
                          {formatTimeStr(duty.start_time)} &rarr; {formatTimeStr(duty.end_time)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Pending Verification
                          </span>
                        )}
                        {isApproved && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Confirmed Hours
                            </span>
                            {duty.admin_remarks && (
                              <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                                {duty.admin_remarks}
                              </p>
                            )}
                          </div>
                        )}
                        {isRejected && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3" />
                              Rejected
                            </span>
                            {duty.admin_remarks && (
                              <p className="text-[10px] text-rose-700 mt-0.5 line-clamp-1 font-medium">
                                Reason: {duty.admin_remarks}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isPending ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(duty.id)}
                              className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition flex items-center gap-1"
                              title="Verify and Convert to Working Hours"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Verify & Confirm</span>
                            </button>

                            <button
                              onClick={() => openRejectModal(duty)}
                              className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition flex items-center gap-1"
                              title="Reject out-duty session"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Processed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory Rejection Reason Modal */}
      {rejectingDuty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-fade-in">
            <div className="px-6 py-4 bg-gradient-to-r from-rose-900 to-rose-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-sm sm:text-base">Reject Out Duty Session</h3>
              </div>
              <button
                onClick={() => setRejectingDuty(null)}
                className="text-rose-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-950">
                <p className="font-bold mb-1">
                  Out Duty for {employees.find((e) => e.id === rejectingDuty.employee_id)?.full_name}
                </p>
                <p className="text-[11px]">
                  Destination: {rejectingDuty.destination} &bull; Duration: {formatMins(rejectingDuty.duration_minutes)}
                </p>
              </div>

              {rejectionError && (
                <div className="p-2.5 bg-rose-100 text-rose-900 rounded-lg font-medium">
                  {rejectionError}
                </div>
              )}

              <div>
                <label className="block text-slate-800 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Mandatory Rejection Remark *
                </label>
                <textarea
                  rows={4}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="State reason for rejecting out-duty verification (e.g., GPS coordinates outside duty station, unapproved absence, or conflicting shift duty)..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingDuty(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  AlertCircle,
  X,
  FileCheck,
  Calendar,
} from 'lucide-react';
import { AttendanceCorrection } from '../../types';

export const AttendanceCorrectionsDesk: React.FC = () => {
  const {
    filteredCorrections,
    employees,
    approveCorrection,
    rejectCorrection,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [rejectingCorrection, setRejectingCorrection] = useState<AttendanceCorrection | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const displayCorrections = useMemo(() => {
    return filteredCorrections.filter((corr) => {
      const emp = employees.find((e) => e.id === corr.employee_id);
      const matchesSearch =
        corr.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp && emp.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emp && emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;
      return corr.status === statusFilter;
    });
  }, [filteredCorrections, employees, searchTerm, statusFilter]);

  const pendingCount = filteredCorrections.filter((c) => c.status === 'pending').length;
  const approvedCount = filteredCorrections.filter((c) => c.status === 'approved').length;
  const rejectedCount = filteredCorrections.filter((c) => c.status === 'rejected').length;

  const handleApprove = (corrId: string) => {
    approveCorrection(corrId, 'Verified against office entry register and approved');
  };

  const openRejectModal = (corr: AttendanceCorrection) => {
    setRejectingCorrection(corr);
    setRejectionReason('');
    setRejectionError(null);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setRejectionError('Rejection remark is mandatory.');
      return;
    }
    if (rejectingCorrection) {
      rejectCorrection(rejectingCorrection.id, rejectionReason.trim());
      setRejectingCorrection(null);
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Attendance Corrections Desk
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Adjudicate employee check-in and check-out correction requests with mandatory audit remarks.
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
            <span>Pending Corrections: </span>
            <span className="font-extrabold">{pendingCount}</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff, code, reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
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
                {st} ({st === 'pending' ? pendingCount : st === 'approved' ? approvedCount : st === 'rejected' ? rejectedCount : filteredCorrections.length})
              </button>
            ))}
          </div>
        </div>

        {/* Corrections Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Original Timestamps</th>
                <th className="py-3 px-4 text-amber-900">Requested Correction</th>
                <th className="py-3 px-4">Reason / Evidence</th>
                <th className="py-3 px-4">Status & Remarks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayCorrections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No attendance correction requests found.
                  </td>
                </tr>
              ) : (
                displayCorrections.map((corr) => {
                  const emp = employees.find((e) => e.id === corr.employee_id);
                  const isPending = corr.status === 'pending';
                  const isApproved = corr.status === 'approved';
                  const isRejected = corr.status === 'rejected';

                  return (
                    <tr key={corr.id} className="hover:bg-slate-50/80 transition">
                      {/* Employee */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
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

                      {/* Original Timestamps */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        <div>In: {formatTimeStr(corr.original_check_in)}</div>
                        {corr.original_check_out && (
                          <div>Out: {formatTimeStr(corr.original_check_out)}</div>
                        )}
                      </td>

                      {/* Requested Correction */}
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-900">
                        <div className="bg-amber-50 px-2 py-1 rounded border border-amber-200 inline-block space-y-0.5">
                          <div>Req In: {formatTimeStr(corr.requested_check_in)}</div>
                          {corr.requested_check_out && (
                            <div>Req Out: {formatTimeStr(corr.requested_check_out)}</div>
                          )}
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-700 line-clamp-2 text-xs italic">
                          "{corr.reason}"
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        )}
                        {isApproved && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved & Adjusted
                            </span>
                            {corr.admin_remarks && (
                              <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                                {corr.admin_remarks}
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
                            {corr.admin_remarks && (
                              <p className="text-[10px] text-rose-700 mt-0.5 line-clamp-1 font-medium">
                                Reason: {corr.admin_remarks}
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
                              onClick={() => handleApprove(corr.id)}
                              className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition flex items-center gap-1"
                              title="Approve and update session times"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>

                            <button
                              onClick={() => openRejectModal(corr)}
                              className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition flex items-center gap-1"
                              title="Reject with remarks"
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

      {/* Reject Modal */}
      {rejectingCorrection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-fade-in">
            <div className="px-6 py-4 bg-gradient-to-r from-rose-900 to-rose-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-sm sm:text-base">Reject Attendance Correction</h3>
              </div>
              <button
                onClick={() => setRejectingCorrection(null)}
                className="text-rose-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-950">
                <p className="font-bold mb-1">
                  Correction for {employees.find((e) => e.id === rejectingCorrection.employee_id)?.full_name}
                </p>
                <p className="text-[11px]">
                  Requested Check-In: {formatTimeStr(rejectingCorrection.requested_check_in)}
                </p>
              </div>

              {rejectionError && (
                <div className="p-2.5 bg-rose-100 text-rose-900 rounded-lg font-medium">
                  {rejectionError}
                </div>
              )}

              <div>
                <label className="block text-slate-800 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Required Rejection Reason *
                </label>
                <textarea
                  rows={4}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Specify administrative justification for rejection..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingCorrection(null)}
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


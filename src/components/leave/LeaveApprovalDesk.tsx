import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  AlertCircle,
  FileText,
  Calendar,
  X,
  User,
} from 'lucide-react';
import { LeaveRequest } from '../../types';

export const LeaveApprovalDesk: React.FC = () => {
  const { filteredLeaveRequests, employees, approveLeave, rejectLeave, isSuperAdmin } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [rejectingLeave, setRejectingLeave] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const displayLeaves = useMemo(() => {
    return filteredLeaveRequests.filter((leave) => {
      const emp = employees.find((e) => e.id === leave.employee_id);
      const matchesSearch =
        leave.leave_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leave.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp && emp.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emp && emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;
      return leave.status === statusFilter;
    });
  }, [filteredLeaveRequests, employees, searchTerm, statusFilter]);

  const pendingCount = filteredLeaveRequests.filter((l) => l.status === 'pending').length;
  const approvedCount = filteredLeaveRequests.filter((l) => l.status === 'approved').length;
  const rejectedCount = filteredLeaveRequests.filter((l) => l.status === 'rejected').length;

  const handleApprove = (leaveId: string) => {
    approveLeave(leaveId, 'Approved by Administrative Desk');
  };

  const openRejectModal = (leave: LeaveRequest) => {
    setRejectingLeave(leave);
    setRejectionReason('');
    setRejectionError(null);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setRejectionError('Rejection remark is mandatory per administrative protocol.');
      return;
    }
    if (rejectingLeave) {
      rejectLeave(rejectingLeave.id, rejectionReason.trim());
      setRejectingLeave(null);
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('casual')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (t.includes('earned')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (t.includes('medical')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (t.includes('emergency')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-purple-50 text-purple-700 border-purple-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Leave Requests Approval Desk
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Adjudicate employee leave applications: Casual, Earned, Medical, and Emergency leaves.
          </p>
        </div>

        {/* Status Counter Chips */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold">
            <span>Pending: </span>
            <span className="font-extrabold">{pendingCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
            <span>Approved: </span>
            <span className="font-extrabold">{approvedCount}</span>
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
              placeholder="Search employee, leave type, reason..."
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
                {st} ({st === 'pending' ? pendingCount : st === 'approved' ? approvedCount : st === 'rejected' ? rejectedCount : filteredLeaveRequests.length})
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Leave Category</th>
                <th className="py-3 px-4">Date Range & Total Days</th>
                <th className="py-3 px-4">Reason Given</th>
                <th className="py-3 px-4">Applied At</th>
                <th className="py-3 px-4">Status / Remarks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No leave applications matching selected criteria.
                  </td>
                </tr>
              ) : (
                displayLeaves.map((leave) => {
                  const emp = employees.find((e) => e.id === leave.employee_id);
                  const isPending = leave.status === 'pending';
                  const isApproved = leave.status === 'approved';
                  const isRejected = leave.status === 'rejected';

                  return (
                    <tr key={leave.id} className="hover:bg-slate-50/80 transition">
                      {/* Employee */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
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

                      {/* Leave Type */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getLeaveTypeBadge(
                            leave.leave_type
                          )}`}
                        >
                          {leave.leave_type}
                        </span>
                      </td>

                      {/* Date Range & Total Days */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-mono font-medium text-slate-800">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {leave.start_date === leave.end_date
                                ? leave.start_date
                                : `${leave.start_date} to ${leave.end_date}`}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 inline-block">
                            {leave.total_days} {leave.total_days === 1 ? 'day' : 'days'} duration
                          </span>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-700 line-clamp-2 text-xs italic">
                          "{leave.reason}"
                        </p>
                      </td>

                      {/* Applied At */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(leave.created_at).toLocaleDateString()} {new Date(leave.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* Status / Remarks */}
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
                              Approved
                            </span>
                            {leave.admin_remarks && (
                              <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                                {leave.admin_remarks}
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
                            {leave.admin_remarks && (
                              <p className="text-[10px] text-rose-700 mt-1 line-clamp-1 font-medium">
                                Reason: {leave.admin_remarks}
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
                              onClick={() => handleApprove(leave.id)}
                              className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition flex items-center gap-1"
                              title="One-click Approve"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>

                            <button
                              onClick={() => openRejectModal(leave)}
                              className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition flex items-center gap-1"
                              title="Reject with mandatory remark"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Decided</span>
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
      {rejectingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-fade-in">
            <div className="px-6 py-4 bg-gradient-to-r from-rose-900 to-rose-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-sm sm:text-base">Reject Leave Application</h3>
              </div>
              <button
                onClick={() => setRejectingLeave(null)}
                className="text-rose-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-950">
                <p className="font-bold mb-1">
                  Leave Request for {employees.find((e) => e.id === rejectingLeave.employee_id)?.full_name}
                </p>
                <p className="text-[11px]">
                  Category: {rejectingLeave.leave_type} &bull; Duration: {rejectingLeave.total_days} days ({rejectingLeave.start_date} to {rejectingLeave.end_date})
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
                  placeholder="Specify clear administrative reason for rejection (e.g. Critical operational shift requirement, insufficient leave balance, or conflicting division duty)..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingLeave(null)}
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


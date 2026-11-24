import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ScrollText,
  Shield,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  Terminal,
  Download,
} from 'lucide-react';

export const SystemAuditLogs: React.FC = () => {
  const { auditLogs, isSuperAdmin } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <Shield className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Restricted Super Admin Area</h3>
        <p className="text-xs text-slate-500 mt-1">
          System audit logs are strictly reserved for Super Administrator review.
        </p>
      </div>
    );
  }

  const displayLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.user_name && log.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.user_email && log.user_email.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;
      if (actionFilter === 'all') return true;
      return log.action === actionFilter;
    });
  }, [auditLogs, searchTerm, actionFilter]);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(auditLogs.map((l) => l.action)));
  }, [auditLogs]);

  const handleExportLogs = () => {
    const headers = ['Timestamp', 'Administrator', 'Action', 'Entity', 'IP Address', 'Payload'];
    const rows = displayLogs.map((l) => [
      `"${l.created_at}"`,
      `"${l.user_name || l.user_email || 'System'}"`,
      `"${l.action}"`,
      `"${l.entity}"`,
      `"${l.ip_address || ''}"`,
      `"${JSON.stringify(l.payload || {}).replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tripura_Jal_Board_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              System Audit Logs & Traceability
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-100 text-cyan-900">
              Security Immutable
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Immutable administrative trails: who approved leaves, verified out-duty intervals, calibrated geofences, and executed overrides.
          </p>
        </div>

        <button
          onClick={handleExportLogs}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-xs self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, action, entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium">Action Filter:</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Audit List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor / Admin</th>
                <th className="py-3 px-4">Event Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
              {displayLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 font-sans">
                    No system audit logs found.
                  </td>
                </tr>
              ) : (
                displayLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  {/* Timestamp */}
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString([], {
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>

                  {/* Actor */}
                  <td className="py-3.5 px-4 font-sans font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                        {log.user_name ? log.user_name.charAt(0) : 'S'}
                      </div>
                      <div>
                        <span>{log.user_name || 'System'}</span>
                        {log.user_email && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {log.user_email}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                      {log.action}
                    </span>
                  </td>

                  {/* Entity */}
                  <td className="py-3.5 px-4 text-slate-600 font-semibold">
                    {log.entity}
                  </td>

                  {/* IP */}
                  <td className="py-3.5 px-4 text-slate-500">
                    {log.ip_address || '127.0.0.1'}
                  </td>

                  {/* Payload */}
                  <td className="py-3.5 px-4 font-mono text-[10px] text-slate-600 max-w-sm truncate">
                    {log.payload ? JSON.stringify(log.payload) : '{}'}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


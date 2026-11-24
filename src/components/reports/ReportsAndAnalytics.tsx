import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  Search,
  FileSpreadsheet,
  FileText,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Employee, AttendanceSession } from '../../types';

export const ReportsAndAnalytics: React.FC = () => {
  const { filteredEmployees, filteredSessions, offices, selectedOfficeId } = useApp();

  const [timeframe, setTimeframe] = useState<'date' | 'week' | 'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-23');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Daily target hours standard: 7 hours 30 mins = 450 minutes (10:00 AM to 05:30 PM minus 60m break = 390m or 450m shift)
  const STANDARD_DAILY_WORKING_MINS = 390;

  // Aggregate metrics per employee
  const employeeReportData = useMemo(() => {
    return filteredEmployees.map((emp) => {
      // Find sessions belonging to employee
      const empSessions = filteredSessions.filter((s) => s.employee_id === emp.id);

      const daysPresent = empSessions.filter(
        (s) => s.active_status !== 'not_checked_in' && s.active_status !== 'incomplete'
      ).length;
      const totalWorkingMins = empSessions.reduce((acc, s) => acc + s.confirmed_working_minutes, 0);
      const totalBreakMins = empSessions.reduce((acc, s) => acc + s.actual_break_minutes, 0);
      const approvedDutyMins = empSessions.reduce((acc, s) => acc + s.approved_official_work_minutes, 0);

      // Expected working minutes
      const totalWorkingDaysInPeriod = timeframe === 'date' ? 1 : timeframe === 'week' ? 5 : timeframe === 'month' ? 22 : 250;
      const expectedWorkingMins = daysPresent * STANDARD_DAILY_WORKING_MINS;

      let overtimeMins = 0;
      let deficitMins = 0;

      if (totalWorkingMins > expectedWorkingMins) {
        overtimeMins = totalWorkingMins - expectedWorkingMins;
      } else {
        deficitMins = expectedWorkingMins - totalWorkingMins;
      }

      return {
        employee: emp,
        totalWorkingDays: totalWorkingDaysInPeriod,
        daysPresent,
        daysAbsent: Math.max(0, totalWorkingDaysInPeriod - daysPresent),
        totalWorkingMins,
        totalBreakMins,
        approvedDutyMins,
        overtimeMins,
        deficitMins,
      };
    }).filter(({ employee }) => {
      return (
        employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.designation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [filteredEmployees, filteredSessions, timeframe, searchTerm]);

  // Overall summary metrics
  const totalEmployees = employeeReportData.length;
  const aggregateWorkingHours = (employeeReportData.reduce((acc, r) => acc + r.totalWorkingMins, 0) / 60).toFixed(1);
  const aggregateBreakHours = (employeeReportData.reduce((acc, r) => acc + r.totalBreakMins, 0) / 60).toFixed(1);
  const aggregateOutDutyHours = (employeeReportData.reduce((acc, r) => acc + r.approvedDutyMins, 0) / 60).toFixed(1);
  const aggregateOvertimeHours = (employeeReportData.reduce((acc, r) => acc + r.overtimeMins, 0) / 60).toFixed(1);

  const formatHours = (minutes: number) => {
    const hrs = (minutes / 60).toFixed(1);
    return `${hrs} hrs`;
  };

  // Export to Excel (.xlsx) using SheetJS
  const handleExportExcel = () => {
    const dataToExport = employeeReportData.map(({ employee, totalWorkingDays, daysPresent, daysAbsent, totalWorkingMins, totalBreakMins, approvedDutyMins, overtimeMins, deficitMins }) => {
      const off = offices.find((o) => o.id === employee.office_id);
      return {
        'Employee Code': employee.employee_code,
        'Full Name': employee.full_name,
        'Designation': employee.designation,
        'Office': off?.office_name || 'Tripura Jal Board',
        'Reporting Period': timeframe.toUpperCase(),
        'Total Working Days': totalWorkingDays,
        'Days Present': daysPresent,
        'Days Absent': daysAbsent,
        'Total Working Hours': (totalWorkingMins / 60).toFixed(2),
        'Total Break Hours': (totalBreakMins / 60).toFixed(2),
        'Approved Out Duty Hours': (approvedDutyMins / 60).toFixed(2),
        'Overtime Hours': (overtimeMins / 60).toFixed(2),
        'Deficit Hours': (deficitMins / 60).toFixed(2),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');
    XLSX.writeFile(
      workbook,
      `Tripura_Jal_Board_Attendance_${timeframe}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Employee Code',
      'Full Name',
      'Designation',
      'Office',
      'Reporting Period',
      'Total Working Days',
      'Days Present',
      'Days Absent',
      'Total Working Hours',
      'Total Break Hours',
      'Approved Out Duty Hours',
      'Overtime Hours',
      'Deficit Hours',
    ];

    const rows = employeeReportData.map(({ employee, totalWorkingDays, daysPresent, daysAbsent, totalWorkingMins, totalBreakMins, approvedDutyMins, overtimeMins, deficitMins }) => {
      const off = offices.find((o) => o.id === employee.office_id);
      return [
        `"${employee.employee_code}"`,
        `"${employee.full_name}"`,
        `"${employee.designation}"`,
        `"${off?.office_name || 'Tripura Jal Board'}"`,
        `"${timeframe.toUpperCase()}"`,
        totalWorkingDays,
        daysPresent,
        daysAbsent,
        (totalWorkingMins / 60).toFixed(2),
        (totalBreakMins / 60).toFixed(2),
        (approvedDutyMins / 60).toFixed(2),
        (overtimeMins / 60).toFixed(2),
        (deficitMins / 60).toFixed(2),
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tripura_Jal_Board_Attendance_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Attendance Reports & Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Generate and audit working hours, breaks, approved field duty, overtime, and deficit hours with instant Excel/CSV export.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-xs"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition shadow-md shadow-emerald-950/20"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Confirmed Working
          </span>
          <div className="text-2xl font-extrabold text-blue-600">{aggregateWorkingHours} hrs</div>
          <p className="text-[10px] text-slate-400 mt-1">Aggregated across active staff</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Approved Out Duty
          </span>
          <div className="text-2xl font-extrabold text-teal-600">{aggregateOutDutyHours} hrs</div>
          <p className="text-[10px] text-teal-700 mt-1">Verified field inspections</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Total Break Time
          </span>
          <div className="text-2xl font-extrabold text-amber-600">{aggregateBreakHours} hrs</div>
          <p className="text-[10px] text-amber-700 mt-1">Allowed: 60m / day / staff</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Net Overtime Hours
          </span>
          <div className="text-2xl font-extrabold text-indigo-600">+{aggregateOvertimeHours} hrs</div>
          <p className="text-[10px] text-indigo-700 mt-1">Hours above standard shift</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filter controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              {(['date', 'week', 'month', 'year'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-xs font-bold capitalize rounded-lg transition ${
                    timeframe === tf
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tf === 'date' ? 'Single Date' : tf}
                </button>
              ))}
            </div>

            {timeframe === 'date' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            )}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff, code, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Total Days</th>
                <th className="py-3 px-4">Days Present</th>
                <th className="py-3 px-4 font-bold text-blue-900">Total Working Hours</th>
                <th className="py-3 px-4">Total Break</th>
                <th className="py-3 px-4">Approved Out Duty</th>
                <th className="py-3 px-4 text-emerald-800">Overtime</th>
                <th className="py-3 px-4 text-rose-800">Deficit Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {employeeReportData.map((row) => (
                <tr key={row.employee.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{row.employee.full_name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {row.employee.employee_code} &bull; {row.employee.designation}
                      </p>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono">{row.totalWorkingDays} days</td>

                  <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700">
                    {row.daysPresent} present
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                    {formatHours(row.totalWorkingMins)}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {formatHours(row.totalBreakMins)}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-teal-700 font-medium">
                    {formatHours(row.approvedDutyMins)}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                    {row.overtimeMins > 0 ? `+${formatHours(row.overtimeMins)}` : '0.0 hrs'}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-rose-600">
                    {row.deficitMins > 0 ? `-${formatHours(row.deficitMins)}` : '0.0 hrs'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

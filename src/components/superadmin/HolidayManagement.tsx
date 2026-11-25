import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Plus,
  Trash2,
  Edit,
  Download,
  Upload,
  FileSpreadsheet,
  Search,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  X,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Holiday, HolidayType } from '../../types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_MONTH_MAP: Record<string, string> = {
  jan: 'January', january: 'January', '01': 'January', '1': 'January',
  feb: 'February', february: 'February', '02': 'February', '2': 'February',
  mar: 'March', march: 'March', '03': 'March', '3': 'March',
  apr: 'April', april: 'April', '04': 'April', '4': 'April',
  may: 'May', '05': 'May', '5': 'May',
  jun: 'June', june: 'June', '06': 'June', '6': 'June',
  jul: 'July', july: 'July', '07': 'July', '7': 'July',
  aug: 'August', august: 'August', '08': 'August', '8': 'August',
  sep: 'September', sept: 'September', september: 'September', '09': 'September', '9': 'September',
  oct: 'October', october: 'October', '10': 'October',
  nov: 'November', november: 'November', '11': 'November',
  dec: 'December', december: 'December', '12': 'December',
};

interface ParsedCsvHoliday {
  rowNum: number;
  holiday_day: string;
  holiday_month: string;
  holiday_year: number;
  holiday_reason: string;
  holiday_date: string;
  valid: boolean;
  error?: string;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeMonthName(raw: string): string | null {
  const key = raw.trim().toLowerCase();
  return SHORT_MONTH_MAP[key] || null;
}

function toIsoDate(year: number, monthName: string, dayStr: string): string | null {
  const mIdx = MONTH_NAMES.indexOf(monthName);
  const dNum = parseInt(dayStr, 10);
  if (mIdx < 0 || isNaN(dNum) || dNum < 1 || dNum > 31 || year < 2000 || year > 2100) {
    return null;
  }
  const candidate = new Date(year, mIdx, dNum);
  if (candidate.getFullYear() !== year || candidate.getMonth() !== mIdx || candidate.getDate() !== dNum) {
    return null;
  }
  return `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
}

export const HolidayManagement: React.FC = () => {
  const { holidays, addHoliday, updateHoliday, deleteHoliday } = useApp();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear >= 2025 ? currentYear : 2026);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holidayReason, setHolidayReason] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayType, setHolidayType] = useState<HolidayType>('gazetted');
  const [isSaving, setIsSaving] = useState(false);

  // CSV Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvFileName, setCsvFileName] = useState('');
  const [parsedCsvRows, setParsedCsvRows] = useState<ParsedCsvHoliday[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
  };

  const yearHolidays = useMemo(() => {
    return holidays
      .filter((h) => Number(h.holiday_year ?? h.year) === selectedYear)
      .sort((a, b) => new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime());
  }, [holidays, selectedYear]);

  const filteredHolidays = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return yearHolidays.filter((h) => {
      const mName = h.holiday_month || MONTH_NAMES[new Date(`${h.holiday_date}T00:00:00`).getMonth()];
      if (selectedMonthFilter !== 'all' && mName?.toLowerCase() !== selectedMonthFilter.toLowerCase()) {
        return false;
      }
      if (q) {
        const reason = (h.holiday_reason || h.holiday_name || '').toLowerCase();
        const month = (mName || '').toLowerCase();
        if (!reason.includes(q) && !month.includes(q)) return false;
      }
      return true;
    });
  }, [yearHolidays, selectedMonthFilter, searchQuery]);

  const upcomingHoliday = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return yearHolidays.find((h) => h.holiday_date >= todayStr) || null;
  }, [yearHolidays]);

  const derivedParts = useMemo(() => {
    if (!holidayDate) return null;
    const d = new Date(`${holidayDate}T00:00:00`);
    if (isNaN(d.getTime())) return null;
    return {
      holiday_month: MONTH_NAMES[d.getMonth()],
      holiday_day: String(d.getDate()),
      holiday_year: d.getFullYear(),
      weekday: d.toLocaleDateString('en-IN', { weekday: 'long' }),
    };
  }, [holidayDate]);

  const handleOpenAdd = () => {
    setEditingHoliday(null);
    setHolidayReason('');
    setHolidayDate(`${selectedYear}-01-26`);
    setHolidayType('gazetted');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: Holiday) => {
    setEditingHoliday(h);
    setHolidayReason(h.holiday_reason || h.holiday_name || '');
    setHolidayDate(h.holiday_date);
    setHolidayType(h.holiday_type || 'gazetted');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayReason.trim()) {
      showToast('error', 'Holiday reason is required.');
      return;
    }
    if (!holidayDate || !derivedParts) {
      showToast('error', 'Please select a valid holiday date.');
      return;
    }

    setIsSaving(true);
    const countForYear =
      holidays.filter((h) => Number(h.holiday_year ?? h.year) === derivedParts.holiday_year).length +
      (editingHoliday ? 0 : 1);

    const payload = {
      holiday_name: holidayReason.trim(),
      holiday_reason: holidayReason.trim(),
      holiday_date: holidayDate,
      holiday_month: derivedParts.holiday_month,
      holiday_day: derivedParts.holiday_day,
      holiday_year: derivedParts.holiday_year,
      year: derivedParts.holiday_year,
      'no._of_holiday_current_year': countForYear,
      holiday_type: holidayType,
      office_id: null,
      description: null,
    };

    let ok = false;
    if (editingHoliday) {
      ok = await updateHoliday(editingHoliday.id, payload);
      if (ok) showToast('success', `"${holidayReason.trim()}" updated successfully.`);
    } else {
      ok = await addHoliday(payload);
      if (ok) showToast('success', `"${holidayReason.trim()}" added to ${derivedParts.holiday_year} calendar.`);
    }

    setIsSaving(false);
    if (ok) setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete holiday "${name}"?`)) {
      const ok = await deleteHoliday(id);
      if (ok) showToast('success', `"${name}" removed from calendar.`);
    }
  };

  const handleExportCSV = () => {
    if (filteredHolidays.length === 0) {
      showToast('error', 'No holidays available to export.');
      return;
    }
    const headers = ['holiday_day', 'holiday_month', 'holiday_year', 'holiday_reason', 'no._of_holiday_current_year'];
    const rows = filteredHolidays.map((h, i) => [
      h.holiday_day || String(new Date(`${h.holiday_date}T00:00:00`).getDate()),
      h.holiday_month || MONTH_NAMES[new Date(`${h.holiday_date}T00:00:00`).getMonth()],
      h.holiday_year ?? h.year,
      `"${(h.holiday_reason || h.holiday_name || '').replace(/"/g, '""')}"`,
      h['no._of_holiday_current_year'] ?? i + 1,
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Holidays_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSampleCsv = () => {
    const sample = [
      'holiday_day,holiday_month,holiday_year,holiday_reason',
      '26,January,2026,Republic Day',
      '15,August,2026,Independence Day',
      '2,October,2026,Gandhi Jayanti',
      '25,December,2026,Christmas Day',
    ].join('\n');
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Holiday_Import_Sample.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);

    const text = await file.text();
    const lines = text
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setParsedCsvRows([]);
      showToast('error', 'The selected CSV file is empty.');
      return;
    }

    const firstCols = parseCsvLine(lines[0]).map((c) => c.toLowerCase());
    const hasHeader =
      firstCols.some((c) => c.includes('holiday') || c.includes('reason') || c.includes('month') || c.includes('date') || c.includes('year'));

    const dataLines = hasHeader ? lines.slice(1) : lines;
    const colIdx = {
      day: firstCols.findIndex((c) => c === 'holiday_day' || c === 'day'),
      month: firstCols.findIndex((c) => c === 'holiday_month' || c === 'month'),
      year: firstCols.findIndex((c) => c === 'holiday_year' || c === 'year'),
      reason: firstCols.findIndex((c) => c === 'holiday_reason' || c === 'reason' || c === 'holiday_name' || c === 'name' || c === 'title'),
      date: firstCols.findIndex((c) => c === 'holiday_date' || c === 'date'),
    };

    const parsed: ParsedCsvHoliday[] = dataLines.map((line, idx) => {
      const cols = parseCsvLine(line);
      const rowNum = hasHeader ? idx + 2 : idx + 1;

      if (colIdx.date >= 0 || (cols.length === 2 && /\d{4}-\d{2}-\d{2}|\d{2}[/-]\d{2}[/-]\d{4}/.test(cols[0]))) {
        const rawDate = cols[colIdx.date >= 0 ? colIdx.date : 0] || '';
        const reason = cols[colIdx.reason >= 0 ? colIdx.reason : 1] || '';
        let iso = '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          iso = rawDate;
        } else {
          const m = rawDate.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
          if (m) {
            iso = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
          }
        }
        const dObj = iso ? new Date(`${iso}T00:00:00`) : null;
        if (!dObj || isNaN(dObj.getTime()) || !reason.trim()) {
          return {
            rowNum,
            holiday_day: '-',
            holiday_month: '-',
            holiday_year: selectedYear,
            holiday_reason: reason || '(missing)',
            holiday_date: '',
            valid: false,
            error: !reason.trim() ? 'Missing holiday reason' : 'Invalid date format (use YYYY-MM-DD)',
          };
        }
        return {
          rowNum,
          holiday_day: String(dObj.getDate()),
          holiday_month: MONTH_NAMES[dObj.getMonth()],
          holiday_year: dObj.getFullYear(),
          holiday_reason: reason.trim(),
          holiday_date: iso,
          valid: true,
        };
      }

      const rawDay = cols[colIdx.day >= 0 ? colIdx.day : 0] || '';
      const rawMonth = cols[colIdx.month >= 0 ? colIdx.month : 1] || '';
      const rawYear = cols[colIdx.year >= 0 ? colIdx.year : 2] || '';
      const rawReason = cols[colIdx.reason >= 0 ? colIdx.reason : 3] || '';

      const monthNorm = normalizeMonthName(rawMonth);
      const yearNum = parseInt(rawYear, 10);
      const dayClean = String(parseInt(rawDay, 10) || '');
      const iso = monthNorm && !isNaN(yearNum) ? toIsoDate(yearNum, monthNorm, dayClean) : null;

      if (!monthNorm || !iso || !rawReason.trim()) {
        return {
          rowNum,
          holiday_day: rawDay || '-',
          holiday_month: rawMonth || '-',
          holiday_year: isNaN(yearNum) ? selectedYear : yearNum,
          holiday_reason: rawReason || '(missing)',
          holiday_date: '',
          valid: false,
          error: !monthNorm
            ? 'Invalid month'
            : !iso
            ? 'Invalid day/year'
            : 'Missing holiday reason',
        };
      }

      return {
        rowNum,
        holiday_day: dayClean,
        holiday_month: monthNorm,
        holiday_year: yearNum,
        holiday_reason: rawReason.trim(),
        holiday_date: iso,
        valid: true,
      };
    });

    setParsedCsvRows(parsed);
  };

  const handleImportValidRows = async () => {
    const validRows = parsedCsvRows.filter((r) => r.valid);
    if (validRows.length === 0) return;

    setIsImporting(true);
    let importedCount = 0;
    const runningCounts: Record<number, number> = {};

    for (const row of validRows) {
      if (runningCounts[row.holiday_year] === undefined) {
        runningCounts[row.holiday_year] = holidays.filter(
          (h) => Number(h.holiday_year ?? h.year) === row.holiday_year
        ).length;
      }
      runningCounts[row.holiday_year] += 1;

      const ok = await addHoliday({
        holiday_name: row.holiday_reason,
        holiday_reason: row.holiday_reason,
        holiday_date: row.holiday_date,
        holiday_month: row.holiday_month,
        holiday_day: row.holiday_day,
        holiday_year: row.holiday_year,
        year: row.holiday_year,
        'no._of_holiday_current_year': runningCounts[row.holiday_year],
        holiday_type: 'gazetted',
        office_id: null,
        description: null,
      });
      if (ok) importedCount++;
    }

    setIsImporting(false);
    setIsImportModalOpen(false);
    setParsedCsvRows([]);
    setCsvFileName('');
    if (csvInputRef.current) csvInputRef.current.value = '';
    showToast('success', `Successfully imported ${importedCount} of ${validRows.length} holidays from CSV.`);
  };

  const validCsvCount = parsedCsvRows.filter((r) => r.valid).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Holiday Calendar Management
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Declare holidays individually or bulk-import from CSV. Synced directly with the Holiday database table.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setParsedCsvRows([]);
              setCsvFileName('');
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Holiday</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="p-0.5 hover:opacity-70 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Holidays in {selectedYear}
            </p>
            <p className="text-xl font-extrabold text-slate-900">{yearHolidays.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Next Upcoming Holiday
            </p>
            <p className="text-sm font-bold text-slate-900 truncate">
              {upcomingHoliday
                ? `${upcomingHoliday.holiday_reason || upcomingHoliday.holiday_name} (${upcomingHoliday.holiday_day} ${upcomingHoliday.holiday_month})`
                : 'None remaining'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Year Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start">
          {[2025, 2026, 2027, 2028].map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedYear === yr
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>

        {/* Search + Month Filter */}
        <div className="flex flex-wrap items-center gap-2 flex-1 lg:justify-end">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search holiday reason or month..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <select
            value={selectedMonthFilter}
            onChange={(e) => setSelectedMonthFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="all">All Months</option>
            {MONTH_NAMES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Holidays List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Holiday List &bull; {selectedYear} ({filteredHolidays.length} Shown)
            </h3>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            Total for {selectedYear}: {yearHolidays.length}
          </span>
        </div>

        {filteredHolidays.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">No Holidays Found for {selectedYear}</h4>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Add a holiday manually or import your annual holiday calendar from a CSV file.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Holiday</span>
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import CSV</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredHolidays.map((h, index) => {
              const dateObj = new Date(`${h.holiday_date}T00:00:00`);
              const isValidDate = !isNaN(dateObj.getTime());
              const displayMonth = h.holiday_month || (isValidDate ? MONTH_NAMES[dateObj.getMonth()] : '—');
              const displayDay = h.holiday_day || (isValidDate ? String(dateObj.getDate()) : '—');
              const displayYear = h.holiday_year ?? h.year;
              const weekday = isValidDate ? dateObj.toLocaleDateString('en-IN', { weekday: 'long' }) : '';
              const reason = h.holiday_reason || h.holiday_name;

              return (
                <div
                  key={h.id}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 flex flex-col items-center justify-center flex-shrink-0 text-center">
                      <span className="text-[10px] font-extrabold uppercase text-blue-600">
                        {String(displayMonth).slice(0, 3)}
                      </span>
                      <span className="text-lg font-black text-slate-900 leading-none">
                        {displayDay}
                      </span>
                      {weekday && (
                        <span className="text-[9px] font-bold text-slate-500">
                          {weekday.slice(0, 3)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{reason}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>
                          {displayDay} {displayMonth} {displayYear}
                        </span>
                        {weekday && (
                          <>
                            <span>&bull;</span>
                            <span>{weekday}</span>
                          </>
                        )}
                        <span>&bull;</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          #{h['no._of_holiday_current_year'] ?? index + 1} of {displayYear}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleOpenEdit(h)}
                      title="Edit Holiday"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(h.id, reason)}
                      title="Delete Holiday"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD / EDIT HOLIDAY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 !mt-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pick a date — month, day &amp; year fill automatically
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Holiday Reason *
                </label>
                <input
                  type="text"
                  required
                  value={holidayReason}
                  onChange={(e) => setHolidayReason(e.target.value)}
                  placeholder="e.g. Republic Day / Durga Puja / Independence Day"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Holiday Date *
                </label>
                <input
                  type="date"
                  required
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {derivedParts && (
                <div className="grid grid-cols-3 gap-2 p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-center">
                  <div>
                    <span className="block text-[9px] font-bold uppercase text-blue-600">Day</span>
                    <span className="text-xs font-extrabold text-slate-900">{derivedParts.holiday_day}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold uppercase text-blue-600">Month</span>
                    <span className="text-xs font-extrabold text-slate-900">{derivedParts.holiday_month}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold uppercase text-blue-600">Year</span>
                    <span className="text-xs font-extrabold text-slate-900">{derivedParts.holiday_year}</span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingHoliday ? 'Update Holiday' : 'Save Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 !mt-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Import Holidays from CSV
                  </h3>
                  <p className="text-xs text-slate-500">
                    Upload a CSV with <code className="font-mono">holiday_day, holiday_month, holiday_year, holiday_reason</code> or <code className="font-mono">date, holiday_reason</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvFileChange}
                className="hidden"
              />

              <div className="p-5 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 text-center space-y-3">
                <Upload className="w-8 h-8 text-emerald-600 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {csvFileName ? `Selected: ${csvFileName}` : 'Choose a CSV file from your computer'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Supports columns: <span className="font-mono">holiday_day, holiday_month, holiday_year, holiday_reason</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => csvInputRef.current?.click()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
                  >
                    Choose CSV File
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
                  >
                    Download Sample CSV
                  </button>
                </div>
              </div>

              {parsedCsvRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      Preview ({validCsvCount} valid / {parsedCsvRows.length} total rows)
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                        <tr>
                          <th className="py-2 px-3">Row</th>
                          <th className="py-2 px-3">Day</th>
                          <th className="py-2 px-3">Month</th>
                          <th className="py-2 px-3">Year</th>
                          <th className="py-2 px-3">Holiday Reason</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedCsvRows.map((row) => (
                          <tr key={row.rowNum} className={row.valid ? 'bg-white' : 'bg-rose-50/50'}>
                            <td className="py-2 px-3 font-mono text-slate-400">{row.rowNum}</td>
                            <td className="py-2 px-3 font-mono">{row.holiday_day}</td>
                            <td className="py-2 px-3">{row.holiday_month}</td>
                            <td className="py-2 px-3 font-mono">{row.holiday_year}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{row.holiday_reason}</td>
                            <td className="py-2 px-3">
                              {row.valid ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Valid
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                  {row.error}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isImporting || validCsvCount === 0}
                  onClick={handleImportValidRows}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isImporting ? 'Importing...' : `Import ${validCsvCount} Holiday${validCsvCount === 1 ? '' : 's'}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

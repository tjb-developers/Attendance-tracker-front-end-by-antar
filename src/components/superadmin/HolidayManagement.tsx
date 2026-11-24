import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Plus,
  Trash2,
  Edit,
  Download,
  Filter,
  Building2,
  CalendarDays,
  Sparkles,
  Info,
  CheckCircle2,
  X,
  Shield,
  Layers,
} from 'lucide-react';
import { Holiday, HolidayType } from '../../types';

export const HolidayManagement: React.FC = () => {
  const { holidays, addHoliday, updateHoliday, deleteHoliday, offices, isSuperAdmin } = useApp();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [holidayType, setHolidayType] = useState<HolidayType>('gazetted');
  const [officeId, setOfficeId] = useState<string>('all');
  const [description, setDescription] = useState('');

  // Filtered Holidays
  const filteredHolidays = useMemo(() => {
    return holidays
      .filter((h) => {
        if (h.year !== selectedYear) return false;
        if (selectedType !== 'all' && h.holiday_type !== selectedType) return false;
        if (selectedOfficeFilter !== 'all') {
          if (h.office_id && h.office_id !== 'all' && h.office_id !== selectedOfficeFilter) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime());
  }, [holidays, selectedYear, selectedType, selectedOfficeFilter]);

  const handleOpenAdd = () => {
    setEditingHoliday(null);
    setHolidayName('');
    setHolidayDate(`${selectedYear}-01-01`);
    setIsMultiDay(false);
    setEndDate('');
    setHolidayType('gazetted');
    setOfficeId('all');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: Holiday) => {
    setEditingHoliday(h);
    setHolidayName(h.holiday_name);
    setHolidayDate(h.holiday_date);
    setIsMultiDay(!!h.end_date);
    setEndDate(h.end_date || '');
    setHolidayType(h.holiday_type);
    setOfficeId(h.office_id || 'all');
    setDescription(h.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayName.trim()) {
      alert('Holiday name is required.');
      return;
    }
    if (!holidayDate) {
      alert('Holiday date is required.');
      return;
    }

    const yearVal = new Date(holidayDate).getFullYear();

    if (editingHoliday) {
      await updateHoliday(editingHoliday.id, {
        holiday_name: holidayName.trim(),
        holiday_date: holidayDate,
        end_date: isMultiDay && endDate ? endDate : null,
        year: yearVal,
        holiday_type: holidayType,
        office_id: officeId === 'all' ? null : officeId,
        description: description.trim() || null,
      });
      alert('Holiday updated successfully!');
    } else {
      await addHoliday({
        holiday_name: holidayName.trim(),
        holiday_date: holidayDate,
        end_date: isMultiDay && endDate ? endDate : null,
        year: yearVal,
        holiday_type: holidayType,
        office_id: officeId === 'all' ? null : officeId,
        description: description.trim() || null,
      });
      alert('Holiday added to calendar successfully!');
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete holiday "${name}"?`)) {
      await deleteHoliday(id);
    }
  };

  const handleExportCSV = () => {
    if (filteredHolidays.length === 0) {
      alert('No holidays available to export.');
      return;
    }
    const headers = ['Sl No', 'Holiday Name', 'Date', 'End Date', 'Year', 'Type', 'Applicable Office', 'Description'];
    const rows = filteredHolidays.map((h, i) => {
      const officeName = h.office_id ? offices.find((o) => o.id === h.office_id)?.office_name || h.office_id : 'All Offices (Global)';
      return [
        i + 1,
        `"${h.holiday_name}"`,
        h.holiday_date,
        h.end_date || 'N/A',
        h.year,
        h.holiday_type,
        `"${officeName}"`,
        `"${h.description || ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Official_Holidays_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <Shield className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Restricted Super Admin Area</h3>
        <p className="text-xs text-slate-500 mt-1">
          Only Super Administrators can configure the official annual government holiday list.
        </p>
      </div>
    );
  }

  const getTypeBadge = (type: HolidayType) => {
    switch (type) {
      case 'gazetted':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Gazetted Public Holiday</span>;
      case 'state_declared':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">State Declared Holiday</span>;
      case 'restricted':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Restricted Holiday</span>;
      case 'local_festival':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">Local Festival Holiday</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">Holiday</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Government Holiday Calendar Management
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-900">
              Super Admin Authority
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure annual Government Gazetted & Festival Holidays. On declared holidays, staff are not marked absent by mobile system rules.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Holiday</span>
          </button>
        </div>
      </div>

      {/* Filter and Switcher Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Year Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[2025, 2026, 2027, 2028].map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedYear === yr
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Year {yr}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Holiday Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none"
          >
            <option value="all">All Holiday Types</option>
            <option value="gazetted">Gazetted Public Holidays</option>
            <option value="state_declared">State Declared Holidays</option>
            <option value="restricted">Restricted Holidays</option>
            <option value="local_festival">Local Festival Holidays</option>
          </select>

          {/* Office Filter */}
          <select
            value={selectedOfficeFilter}
            onChange={(e) => setSelectedOfficeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none"
          >
            <option value="all">All Offices (Global Scope)</option>
            {offices.map((off) => (
              <option key={off.id} value={off.id}>
                {off.office_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Holidays List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Annual Government Holiday List &bull; {selectedYear} ({filteredHolidays.length} Holidays Declared)
            </h3>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            Enforced across all attendance biometric and mobile checkpoints
          </span>
        </div>

        {filteredHolidays.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">No Holidays Declared for {selectedYear}</h4>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;+ Add Holiday&quot; above to declare government holidays for this calendar year.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredHolidays.map((h, index) => {
              const dateObj = new Date(h.holiday_date);
              const formattedDate = dateObj.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'long' });

              const targetOffice = h.office_id
                ? offices.find((o) => o.id === h.office_id)?.office_name || 'Assigned Office'
                : 'All Offices / Global';

              return (
                <div
                  key={h.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                >
                  {/* Left: Date Badge & Details */}
                  <div className="flex items-start gap-4">
                    {/* Date Block */}
                    <div className="w-16 h-16 rounded-xl bg-blue-50 border border-blue-200 flex flex-col items-center justify-center flex-shrink-0 text-center shadow-2xs">
                      <span className="text-[10px] font-extrabold uppercase text-blue-600">
                        {dateObj.toLocaleDateString('en-IN', { month: 'short' })}
                      </span>
                      <span className="text-xl font-black text-slate-900 leading-none">
                        {dateObj.getDate()}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 truncate w-full px-1">
                        {dayName.slice(0, 3)}
                      </span>
                    </div>

                    {/* Holiday Info */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{h.holiday_name}</h4>
                        {getTypeBadge(h.holiday_type)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>
                          <strong>Date:</strong> {formattedDate}
                          {h.end_date && ` to ${new Date(h.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{targetOffice}</span>
                        </span>
                      </div>

                      {h.description && (
                        <p className="text-xs text-slate-600 italic mt-0.5">
                          {h.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      onClick={() => handleOpenEdit(h)}
                      title="Edit Holiday"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(h.id, h.holiday_name)}
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

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT HOLIDAY                                                 */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {editingHoliday ? 'Edit Government Holiday' : 'Add Government Holiday'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Declare official government holiday for Year {selectedYear}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Holiday Title / Name *
                </label>
                <input
                  type="text"
                  required
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  placeholder="e.g. Garia Puja / Durga Puja / Republic Day"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Holiday Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Holiday Classification *
                  </label>
                  <select
                    value={holidayType}
                    onChange={(e) => setHolidayType(e.target.value as HolidayType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="gazetted">Gazetted Public Holiday</option>
                    <option value="state_declared">State Declared Holiday</option>
                    <option value="restricted">Restricted Holiday</option>
                    <option value="local_festival">Local Festival Holiday</option>
                  </select>
                </div>
              </div>

              {/* Multi-day toggle */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="multiday-toggle"
                    checked={isMultiDay}
                    onChange={(e) => setIsMultiDay(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="multiday-toggle" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Multi-day Holiday (e.g. Durga Puja 4 days)
                  </label>
                </div>

                {isMultiDay && (
                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Holiday End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={holidayDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Applicable Office Jurisdiction
                </label>
                <select
                  value={officeId}
                  onChange={(e) => setOfficeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="all">Global &bull; All Registered Offices</option>
                  {offices.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.office_name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Select &quot;Global&quot; for nationwide/statewide gazetted holidays, or select a specific branch for local festival holidays.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Gazette Remarks / Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Declared as per official Government notification."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  {editingHoliday ? 'Update Holiday' : 'Add to Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


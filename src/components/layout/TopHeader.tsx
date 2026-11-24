import React from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, Lock, RefreshCw, ShieldCheck, User, Menu } from 'lucide-react';

interface TopHeaderProps {
  onToggleMobileSidebar: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onToggleMobileSidebar }) => {
  const {
    currentUser,
    isSuperAdmin,
    offices,
    selectedOfficeId,
    setSelectedOfficeId,
    lastUpdated,
    refreshData,
    isLoading,
  } = useApp();

  const selectedOffice = offices.find((o) => o.id === selectedOfficeId);

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Left side: Mobile menu toggle + Office Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition cursor-pointer"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Office Selection Filter */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600">
            <Building2 className="w-4 h-4" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="hidden md:inline text-[11px] font-bold text-blue-700 tracking-tight">
                Attendance Tracker by TJB
              </span>
              <span className="hidden md:inline text-slate-300">&bull;</span>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isSuperAdmin ? 'Office Jurisdiction' : 'Assigned Branch'}
              </label>
            </div>

            {isSuperAdmin ? (
              <div className="relative">
                <select
                  value={selectedOfficeId}
                  onChange={(e) => setSelectedOfficeId(e.target.value)}
                  className="text-xs sm:text-sm font-semibold text-slate-800 bg-transparent py-0.5 pr-6 cursor-pointer focus:outline-none hover:text-blue-600 transition"
                >
                  <option value="all">Global (All Offices / Sub-divisions)</option>
                  {offices.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.office_name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800">
                <span className="truncate max-w-[200px] sm:max-w-xs">
                  {selectedOffice ? selectedOffice.office_name : 'Assigned Office'}
                </span>
                <span
                  title="Restricted strictly to your assigned branch"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800"
                >
                  <Lock className="w-2.5 h-2.5" />
                  Assigned Branch
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Live Sync, User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Live sync button */}
        <button
          onClick={refreshData}
          disabled={isLoading}
          title={`Last updated: ${lastUpdated.toLocaleTimeString()}. Click to refresh.`}
          className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer disabled:opacity-60"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline">Live Sync</span>
          <RefreshCw className={`w-3 h-3 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        {/* User Profile display */}
        <div className="flex items-center gap-2.5 pl-2 sm:border-l border-slate-200">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm ${isSuperAdmin
                ? 'bg-gradient-to-tr from-indigo-700 to-navy-900 text-sky-300'
                : 'bg-blue-600 text-white'
              }`}
          >
            {currentUser?.full_name ? currentUser.full_name.slice(0, 2).toUpperCase() : 'AD'}
          </div>

          <div className="hidden lg:flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.full_name || 'Administrator'}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${isSuperAdmin ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'
                  }`}
              >
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono truncate max-w-[180px]">
              {currentUser?.email}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

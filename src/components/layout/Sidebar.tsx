import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Briefcase,
  Clock,
  BarChart3,
  ShieldCheck,
  MapPin,
  FileEdit,
  ScrollText,
  Building2,
  Calendar,
  LogOut,
  Megaphone,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'employees'
  | 'leave'
  | 'outduty'
  | 'corrections'
  | 'reports'
  | 'announcements'
  | 'holidays'
  | 'superadmin_admins'
  | 'superadmin_geofence'
  | 'superadmin_override'
  | 'superadmin_audit';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const {
    isSuperAdmin,
    filteredLeaveRequests,
    filteredOfficialDutyRequests,
    filteredCorrections,
    excessBreakEmployees,
    logout,
  } = useApp();

  const pendingLeaves = filteredLeaveRequests.filter((l) => l.status === 'pending').length;
  const pendingDuties = filteredOfficialDutyRequests.filter((d) => d.approval_status === 'pending').length;
  const pendingCorrections = filteredCorrections.filter((c) => c.status === 'pending').length;
  const excessBreakCount = excessBreakEmployees.length;

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-navy-900/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0D1B2A] text-slate-200 border-r border-[#1B263B] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-[#1B263B] bg-[#091420]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 p-0.5 shadow-md shadow-blue-950 flex-shrink-0">
            <div className="w-full h-full bg-[#0D1B2A] rounded-[10px] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-sm text-white tracking-tight truncate leading-tight">
              Attendance Tracker by TJB
            </h1>
            <p className="text-[10px] text-sky-400 font-medium tracking-wide uppercase truncate">
              Attendance Management Portal
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Operational Tools */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Office Operations
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => handleSelectTab('dashboard')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-300 hover:bg-[#1B263B] hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4 text-sky-400" />
                  <span>Live Dashboard</span>
                </div>
                {excessBreakCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-navy-900 animate-pulse">
                    {excessBreakCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleSelectTab('employees')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'employees'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-300 hover:bg-[#1B263B] hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Employees</span>
                </div>
              </button>

              <button
                onClick={() => handleSelectTab('leave')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'leave'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-300 hover:bg-[#1B263B] hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarCheck className="w-4 h-4 text-purple-400" />
                  <span>Leave Requests</span>
                </div>
                {pendingLeaves > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-600 text-white">
                    {pendingLeaves}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleSelectTab('outduty')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'outduty'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-300 hover:bg-[#1B263B] hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-blue-400" />
                  <span>Office Out Duty</span>
                </div>
                {pendingDuties > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500 text-white">
                    {pendingDuties}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleSelectTab('corrections')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'corrections'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-300 hover:bg-[#1B263B] hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Corrections Desk</span>
                </div>
                {pendingCorrections > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-600 text-white">
                    {pendingCorrections}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleSelectTab('reports')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'reports'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-300 hover:bg-[#1B263B] hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4 text-teal-400" />
                  <span>Reports & Export</span>
                </div>
              </button>

              <button
                onClick={() => handleSelectTab('announcements')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'announcements'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-300 hover:bg-[#1B263B] hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Megaphone className="w-4 h-4 text-rose-400" />
                  <span>Announcements</span>
                </div>
              </button>

              <button
                onClick={() => handleSelectTab('holidays')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'holidays'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-300 hover:bg-[#1B263B] hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Holiday Calendar</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Super Admin Control Section */}
          {isSuperAdmin && (
            <div>
              <div className="px-3 mb-2 flex items-center justify-between text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                <span>System Administration</span>
              </div>

              <nav className="space-y-1">
                <button
                  onClick={() => handleSelectTab('superadmin_admins')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'superadmin_admins'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/40'
                      : 'text-slate-300 hover:bg-[#1B263B] hover:text-white'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>Admin Management</span>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectTab('superadmin_geofence')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'superadmin_geofence'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/40'
                      : 'text-slate-300 hover:bg-[#1B263B] hover:text-white'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    <span>Office & Geofence</span>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectTab('superadmin_override')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'superadmin_override'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/40'
                      : 'text-slate-300 hover:bg-[#1B263B] hover:text-white'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <FileEdit className="w-4 h-4 text-amber-400" />
                    <span>Global Overrides</span>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectTab('superadmin_audit')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'superadmin_audit'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/40'
                      : 'text-slate-300 hover:bg-[#1B263B] hover:text-white'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <ScrollText className="w-4 h-4 text-cyan-400" />
                    <span>Audit Logs</span>
                  </div>
                </button>
              </nav>
            </div>
          )}
        </div>

        {/* Footer Actions & Credits */}
        <div className="p-3 border-t border-[#1B263B] bg-[#091420]">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
          <div className="mt-2 text-center text-[10px] text-slate-500 font-medium tracking-wide">
            Designed and Developed by IT Team, TJB
          </div>
        </div>
      </aside>
    </>
  );
};

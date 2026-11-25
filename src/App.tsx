import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { subscribeApiLoading } from './services/apiClient';
import { LoadingOverlay } from './components/common/LoadingOverlay';
import { LoginPage } from './components/auth/LoginPage';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { LiveDashboard } from './components/dashboard/LiveDashboard';
import { EmployeeManagement } from './components/employees/EmployeeManagement';
import { LeaveApprovalDesk } from './components/leave/LeaveApprovalDesk';
import { OfficeOutDutyDesk } from './components/outduty/OfficeOutDutyDesk';
import { AttendanceCorrectionsDesk } from './components/corrections/AttendanceCorrectionsDesk';
import { ReportsAndAnalytics } from './components/reports/ReportsAndAnalytics';
import { Announcements } from './components/announcements/Announcements';
import { AdminManagement } from './components/superadmin/AdminManagement';
import { GeofenceCalibration } from './components/superadmin/GeofenceCalibration';
import { HolidayManagement } from './components/superadmin/HolidayManagement';
import { GlobalOverrides } from './components/superadmin/GlobalOverrides';
import { SystemAuditLogs } from './components/superadmin/SystemAuditLogs';

export const AppContent: React.FC = () => {
  const { currentUser, isSuperAdmin, isLoading } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isApiBusy, setIsApiBusy] = useState(false);

  useEffect(() => {
    return subscribeApiLoading(setIsApiBusy);
  }, []);

  // Show full-screen loading animation while restoring session on refresh (prevents LoginPage flash)
  if (isLoading) {
    return <LoadingOverlay fullScreen message="Restoring session..." />;
  }

  // If user is not authenticated, show real login screen
  if (!currentUser) {
    return (
      <>
        {isApiBusy && <LoadingOverlay message="Logging in..." />}
        <LoginPage />
      </>
    );
  }

  // Ensure office admin cannot access super admin tabs
  const effectiveTab: ActiveTab =
    !isSuperAdmin && activeTab.startsWith('superadmin_') ? 'dashboard' : activeTab;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {isApiBusy && <LoadingOverlay message="Loading..." />}
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={effectiveTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <TopHeader
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Dynamic Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {effectiveTab === 'dashboard' && <LiveDashboard />}
          {effectiveTab === 'employees' && <EmployeeManagement />}
          {effectiveTab === 'leave' && <LeaveApprovalDesk />}
          {effectiveTab === 'outduty' && <OfficeOutDutyDesk />}
          {effectiveTab === 'corrections' && <AttendanceCorrectionsDesk />}
          {effectiveTab === 'reports' && <ReportsAndAnalytics />}
          {effectiveTab === 'announcements' && <Announcements />}
          {effectiveTab === 'holidays' && <HolidayManagement />}
          {effectiveTab === 'superadmin_admins' && <AdminManagement />}
          {effectiveTab === 'superadmin_geofence' && <GeofenceCalibration />}
          {effectiveTab === 'superadmin_override' && <GlobalOverrides />}
          {effectiveTab === 'superadmin_audit' && <SystemAuditLogs />}
        </main>

        {/* Global Bottom Footer on Every Page */}
        <footer className="mt-auto py-4 px-6 text-center text-xs font-medium text-slate-500 border-t border-slate-200 bg-white/70 shadow-xs">
          Designed and Developed by IT Team, TJB
        </footer>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Lock,
  Loader2,
  Shield,
  ShieldCheck,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin');
  const [email, setEmail] = useState('admin@gov.in');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleChange = (newRole: 'admin' | 'super_admin') => {
    setRole(newRole);
    setErrorMessage(null);
    if (newRole === 'super_admin') {
      setEmail('superadmin@gov.in');
      setPassword('12345678');
    } else {
      setEmail('admin@gov.in');
      setPassword('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your administrator email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your administrator password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(trimmedEmail, password, role);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Authentication failed. Please verify your email and password.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1B2A] via-[#1B263B] to-[#0D1B2A] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Brand */}
      <div className="w-full max-w-lg text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 p-0.5 shadow-xl shadow-blue-900/40 mb-3">
          <div className="w-full h-full bg-[#0D1B2A] rounded-[14px] flex items-center justify-center">
            <Building2 className="w-10 h-10 text-sky-400" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Attendance Tracker by TJB
        </h1>
        <p className="text-slate-300 text-sm mt-1 font-medium">
          Admin & Super Admin Management Portal
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-6 sm:p-8">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">Sign in to your account</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select your administrative role and enter your portal credentials.
          </p>
        </div>

        {/* Role Selector Tabs (Default: Admin) */}
        <div className="mb-5">

          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
            {/* Admin Tab */}
            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${role === 'admin'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
            >
              <Shield className={`w-4 h-4 ${role === 'admin' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Admin</span>
              {role === 'admin' && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              )}
            </button>

            {/* Super Admin Tab */}
            <button
              type="button"
              onClick={() => handleRoleChange('super_admin')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${role === 'super_admin'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
            >
              <ShieldCheck className={`w-4 h-4 ${role === 'super_admin' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Super Admin</span>
              {role === 'super_admin' && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
              )}
            </button>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {role === 'super_admin'
                ? 'Super Admin: Full calibration authority & multi-office oversight'
                : 'Admin: Branch management, employee monitoring & leave approvals'}
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              {role === 'super_admin' ? 'Super Admin Email Address' : 'Admin Email Address'}
            </label>
            <input
              type="email"
              required
              disabled={isSubmitting}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'super_admin' ? 'superadmin@gov.in' : 'admin@gov.in'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              disabled={isSubmitting}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2.5 px-4 text-white font-semibold rounded-lg text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-60 cursor-pointer ${role === 'super_admin'
              ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In as {role === 'super_admin' ? 'Super Admin' : 'Admin'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Employee Role Notice */}
        <div className="mt-5 pt-4 border-t border-slate-100 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2.5 leading-relaxed">
          <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-800">Notice for Employees:</strong>
            <p className="mt-0.5 text-slate-500">
              Employees cannot log in to this web admin portal. Please record attendance and submit requests through the official mobile application.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-slate-300 font-medium tracking-wide">
        Designed and Developed by IT Team, TJB
      </div>
    </div>
  );
};

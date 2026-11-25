import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Please wait...',
  fullScreen = false,
}) => {
  return (
    <div
      className={
        fullScreen
          ? 'min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-6'
          : 'fixed inset-0 z-[100] bg-slate-900/35 backdrop-blur-[2px] flex items-center justify-center p-4'
      }
      role="status"
      aria-live="polite"
    >
      <div className="bg-white border border-slate-200 shadow-xl rounded-2xl px-6 py-5 flex flex-col items-center gap-3 min-w-[200px]">
        <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-blue-50 border border-blue-100">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-slate-800 tracking-wide">{message}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Attendance Tracker • TJB</p>
        </div>
      </div>
    </div>
  );
};


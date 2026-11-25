import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export interface ClockTimePickerProps {
  label: string;
  value: string; // "10:00 AM", "05:30 PM", or ISO 8601 string e.g. "2000-01-01T10:00:00Z"
  onChange: (display12h: string, isoTimestamp: string) => void;
  error?: string;
  required?: boolean;
  hint?: string;
}

const pad = (n: number | string) => String(n).padStart(2, '0');

/**
 * Parses any incoming time string (12-hour, 24-hour, or ISO timestamp)
 * into { hour: '01'..'12', minute: '00'..'59', ampm: 'AM' | 'PM' }
 */
export function parseTimeToParts(
  val: string,
  defaultH = 10,
  defaultM = 0,
  defaultAmPm: 'AM' | 'PM' = 'AM'
): { hour: string; minute: string; ampm: 'AM' | 'PM' } {
  if (!val) {
    const normH = defaultH > 12 ? defaultH - 12 : defaultH || 12;
    return {
      hour: pad(normH),
      minute: pad(defaultM),
      ampm: defaultH >= 12 ? 'PM' : defaultAmPm,
    };
  }

  const s = String(val).trim();

  // If ISO 8601 string with 'T' (e.g. 2000-01-01T10:00:00Z)
  if (s.includes('T')) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      let h = d.getUTCHours();
      const m = d.getUTCMinutes();
      const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      return {
        hour: pad(h),
        minute: pad(m),
        ampm,
      };
    }
  }

  // If 12h or 24h format (e.g. "10:00 AM", "05:30 PM", "17:30", "7")
  const match = s.match(/^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2] ? parseInt(match[2], 10) : 0;
    let ampm: 'AM' | 'PM' = defaultAmPm;

    if (match[4]) {
      ampm = match[4].toUpperCase() as 'AM' | 'PM';
    } else {
      if (h >= 12) {
        ampm = 'PM';
        if (h > 12) h -= 12;
      } else {
        ampm = 'AM';
        if (h === 0) h = 12;
      }
    }

    if (h > 12) h = 12;
    if (h < 1) h = 12;
    const clampedM = Math.min(59, Math.max(0, m));

    return {
      hour: pad(h),
      minute: pad(clampedM),
      ampm,
    };
  }

  return {
    hour: pad(defaultH > 12 ? defaultH - 12 : defaultH || 12),
    minute: pad(defaultM),
    ampm: defaultAmPm,
  };
}

/**
 * Builds both a user-friendly 12-hour string (e.g. "10:00 AM")
 * and an unambiguous ISO 8601 UTC timestamp string (e.g. "2000-01-01T10:00:00Z")
 * which PostgreSQL ::timestamptz accepts with zero parsing errors.
 */
export function buildTimeOutputs(hourStr: string, minuteStr: string, ampm: 'AM' | 'PM') {
  let h = parseInt(hourStr, 10) || 12;
  const m = parseInt(minuteStr, 10) || 0;

  const display12h = `${pad(h)}:${pad(m)} ${ampm}`;

  // Convert to 24-hour UTC
  let h24 = h;
  if (ampm === 'PM' && h < 12) h24 += 12;
  if (ampm === 'AM' && h === 12) h24 = 0;

  const isoTimestamp = `2000-01-01T${pad(h24)}:${pad(m)}:00Z`;

  return { display12h, isoTimestamp };
}

export const ClockTimePicker: React.FC<ClockTimePickerProps> = ({
  label,
  value,
  onChange,
  error,
  required = false,
  hint,
}) => {
  const parts = parseTimeToParts(value);
  const [hour, setHour] = useState(parts.hour);
  const [minute, setMinute] = useState(parts.minute);
  const [ampm, setAmPm] = useState<'AM' | 'PM'>(parts.ampm);

  // Sync internal state when external value changes
  useEffect(() => {
    const updated = parseTimeToParts(value);
    setHour(updated.hour);
    setMinute(updated.minute);
    setAmPm(updated.ampm);
  }, [value]);

  const handleUpdate = (newHour: string, newMinute: string, newAmPm: 'AM' | 'PM') => {
    setHour(newHour);
    setMinute(newMinute);
    setAmPm(newAmPm);
    const { display12h, isoTimestamp } = buildTimeOutputs(newHour, newMinute, newAmPm);
    onChange(display12h, isoTimestamp);
  };

  const { display12h } = buildTimeOutputs(hour, minute, ampm);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
        </label>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3 h-3 text-blue-500" />
          {display12h}
        </span>
      </div>

      {/* Clock Controls Container */}
      <div
        className={`p-2 bg-slate-50 border rounded-xl flex items-center gap-2 transition ${
          error ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 focus-within:border-blue-500'
        }`}
      >
        {/* Hours Selector */}
        <div className="flex-1 flex flex-col min-w-0">
          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            Hour
          </span>
          <select
            value={hour}
            onChange={(e) => handleUpdate(e.target.value, minute, ampm)}
            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
          >
            {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        <span className="font-bold text-slate-400 text-sm mt-3 flex-shrink-0">:</span>

        {/* Minutes Selector */}
        <div className="flex-1 flex flex-col min-w-0">
          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            Minutes
          </span>
          <select
            value={minute}
            onChange={(e) => handleUpdate(hour, e.target.value, ampm)}
            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
          >
            {Array.from({ length: 60 }, (_, i) => pad(i)).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* AM / PM Toggle */}
        <div className="flex flex-col flex-shrink-0">
          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            AM / PM
          </span>
          <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleUpdate(hour, minute, 'AM')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                ampm === 'AM'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => handleUpdate(hour, minute, 'PM')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                ampm === 'PM'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              PM
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <span className="text-[10px] text-rose-600 font-semibold block">{error}</span>
      ) : hint ? (
        <span className="text-[10px] text-slate-400 block">{hint}</span>
      ) : null}
    </div>
  );
};


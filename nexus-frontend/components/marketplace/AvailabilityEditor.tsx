'use client';

import React, { useState } from 'react';
import { Clock, Calendar, Globe, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export interface DaySchedule {
  day: string;
  available: boolean;
  start: string;
  end: string;
}

interface AvailabilityEditorProps {
  initialSchedule?: DaySchedule[];
  initialTimezone?: string;
  onSave?: (schedule: DaySchedule[], timezone: string) => void;
  readOnly?: boolean;
}

const DEFAULT_DAYS: DaySchedule[] = [
  { day: 'Monday', available: true, start: '09:00', end: '17:00' },
  { day: 'Tuesday', available: true, start: '09:00', end: '17:00' },
  { day: 'Wednesday', available: true, start: '09:00', end: '17:00' },
  { day: 'Thursday', available: true, start: '09:00', end: '17:00' },
  { day: 'Friday', available: true, start: '09:00', end: '15:00' },
  { day: 'Saturday', available: false, start: '10:00', end: '14:00' },
  { day: 'Sunday', available: false, start: '10:00', end: '14:00' },
];

export const AvailabilityEditor: React.FC<AvailabilityEditorProps> = ({
  initialSchedule,
  initialTimezone = 'Asia/Karachi (PKT)',
  onSave,
  readOnly = false
}) => {
  const [schedule, setSchedule] = useState<DaySchedule[]>(initialSchedule || DEFAULT_DAYS);
  const [timezone, setTimezone] = useState<string>(initialTimezone);
  const [savedStatus, setSavedStatus] = useState<boolean>(false);

  const handleToggleDay = (index: number) => {
    if (readOnly) return;
    setSchedule(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], available: !copy[index].available };
      return copy;
    });
  };

  const handleTimeChange = (index: number, field: 'start' | 'end', value: string) => {
    if (readOnly) return;
    setSchedule(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave(schedule, timezone);
      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 3000);
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-5 shadow-xs text-slate-800">
      {/* Header & Timezone */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#00C49F]" />
            Weekly Availability Schedule
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure hours when clients can book 1:1 consulting sessions.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            disabled={readOnly}
            className="bg-transparent text-slate-800 font-semibold focus:outline-none text-xs"
          >
            <option value="Asia/Karachi (PKT)">Asia/Karachi (PKT)</option>
            <option value="America/New_York (EST)">America/New_York (EST)</option>
            <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</option>
            <option value="Europe/London (GMT)">Europe/London (GMT)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
      </div>

      {/* Schedule Rows */}
      <div className="space-y-2.5">
        {schedule.map((item, idx) => (
          <div
            key={item.day}
            className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
              item.available
                ? 'bg-slate-50/70 border-slate-200'
                : 'bg-slate-100/40 border-slate-200 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3 w-32">
              <button
                type="button"
                onClick={() => handleToggleDay(idx)}
                disabled={readOnly}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  item.available
                    ? 'bg-[#00C49F] border-[#00C49F] text-slate-950'
                    : 'bg-white border-slate-300'
                }`}
              >
                {item.available && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
              </button>
              <span className={`font-semibold ${item.available ? 'text-slate-900' : 'text-slate-400'}`}>
                {item.day}
              </span>
            </div>

            {item.available ? (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={item.start}
                  onChange={(e) => handleTimeChange(idx, 'start', e.target.value)}
                  disabled={readOnly}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-mono text-xs focus:outline-none focus:border-[#00C49F]"
                />
                <span className="text-slate-400 font-mono">–</span>
                <input
                  type="time"
                  value={item.end}
                  onChange={(e) => handleTimeChange(idx, 'end', e.target.value)}
                  disabled={readOnly}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-mono text-xs focus:outline-none focus:border-[#00C49F]"
                />
              </div>
            ) : (
              <span className="text-slate-400 italic text-xs">Unavailable</span>
            )}
          </div>
        ))}
      </div>

      {/* Footer Save CTA */}
      {!readOnly && onSave && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {savedStatus ? (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Schedule saved successfully!
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">
              Changes update your public booking slots immediately.
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-[#00C49F] hover:bg-[#00B08E] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save Schedule
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { onboardingService, DaySchedule, DEFAULT_WEEKLY_SCHEDULE } from '../../services/onboardingService';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

const DAY_NAMES: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

export default function Step3Availability() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [schedules, setSchedules] = useState<DaySchedule[]>(DEFAULT_WEEKLY_SCHEDULE);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        setUserEmail(user.email || '');

        // Fetch existing schedules from doctor_schedules table
        const { data: dbSchedules } = await supabase
          .from('doctor_schedules')
          .select('*')
          .eq('doctor_id', user.id);

        if (dbSchedules && dbSchedules.length > 0) {
          const mapped = DEFAULT_WEEKLY_SCHEDULE.map((day) => {
            const matches = dbSchedules.filter((s: any) => s.day_of_week === day.day_of_week);
            if (matches.length > 0) {
              return {
                day_of_week: day.day_of_week,
                is_enabled: true,
                intervals: matches.map((m: any) => ({
                  start_time: m.start_time.slice(0, 5),
                  end_time: m.end_time.slice(0, 5),
                })),
              };
            }
            return {
              ...day,
              is_enabled: false,
            };
          });
          setSchedules(mapped);
        }
      } catch (err) {
        console.warn('Error loading schedule:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [navigate]);

  const toggleDay = (dayKey: string) => {
    setSchedules((prev) =>
      prev.map((d) => (d.day_of_week === dayKey ? { ...d, is_enabled: !d.is_enabled } : d))
    );
  };

  const addInterval = (dayKey: string) => {
    setSchedules((prev) =>
      prev.map((d) => {
        if (d.day_of_week === dayKey) {
          return {
            ...d,
            intervals: [...d.intervals, { start_time: '14:00', end_time: '18:00' }],
          };
        }
        return d;
      })
    );
  };

  const removeInterval = (dayKey: string, index: number) => {
    setSchedules((prev) =>
      prev.map((d) => {
        if (d.day_of_week === dayKey) {
          const updated = [...d.intervals];
          updated.splice(index, 1);
          return { ...d, intervals: updated };
        }
        return d;
      })
    );
  };

  const updateInterval = (dayKey: string, index: number, field: 'start_time' | 'end_time', value: string) => {
    setSchedules((prev) =>
      prev.map((d) => {
        if (d.day_of_week === dayKey) {
          const updated = [...d.intervals];
          updated[index] = { ...updated[index], [field]: value };
          return { ...d, intervals: updated };
        }
        return d;
      })
    );
  };

  const copyToAllEnabledDays = (sourceDayKey: string) => {
    const source = schedules.find((d) => d.day_of_week === sourceDayKey);
    if (!source) return;

    setSchedules((prev) =>
      prev.map((d) => {
        if (d.is_enabled && d.day_of_week !== sourceDayKey) {
          return {
            ...d,
            intervals: source.intervals.map((i) => ({ ...i })),
          };
        }
        return d;
      })
    );
  };

  const validateSchedules = (): string | null => {
    const enabledDays = schedules.filter((d) => d.is_enabled);
    if (enabledDays.length === 0) {
      return 'Please enable at least one working day for your clinical schedule.';
    }

    for (const day of enabledDays) {
      if (day.intervals.length === 0) {
        return `Please add at least one time interval for ${DAY_NAMES[day.day_of_week]}.`;
      }

      // Check start < end and overlapping intervals
      for (let i = 0; i < day.intervals.length; i++) {
        const intA = day.intervals[i];
        if (!intA.start_time || !intA.end_time) {
          return `Please specify both start and end time for ${DAY_NAMES[day.day_of_week]}.`;
        }
        if (intA.start_time >= intA.end_time) {
          return `In ${DAY_NAMES[day.day_of_week]}, start time (${intA.start_time}) must be earlier than end time (${intA.end_time}).`;
        }

        // Compare with other intervals on same day
        for (let j = i + 1; j < day.intervals.length; j++) {
          const intB = day.intervals[j];
          // Check overlap: max(startA, startB) < min(endA, endB)
          if (intA.start_time < intB.end_time && intB.start_time < intA.end_time) {
            return `Overlapping time intervals detected for ${DAY_NAMES[day.day_of_week]} (${intA.start_time}-${intA.end_time} and ${intB.start_time}-${intB.end_time}). Please adjust hours.`;
          }
        }
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateSchedules();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      // 1. Save schedules to Supabase doctor_schedules
      await onboardingService.saveSchedules(schedules);

      // 2. Save step progress
      const status = await onboardingService.getStatus();
      await onboardingService.saveStep('availability', status.account_type || 'individual_doctor', {
        schedules,
      });

      navigate('/onboarding/consultation-fees');
    } catch (err: any) {
      setError(err.message || 'Failed to save working availability. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF6A00] animate-spin" />
      </div>
    );
  }

  return (
    <OnboardingLayout
      currentStepIndex={3}
      title="Default Availability"
      subtitle="Configure regular working days and daily consultation hours. Time zone defaults to Asia/Kolkata (IST)."
      userEmail={userEmail}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-700 font-semibold shadow-xs">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-100 flex items-center justify-between text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#FF6A00]" />
            <span className="font-semibold">Standard Practice Time Zone:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-orange-200 text-orange-950 font-bold">
              Asia/Kolkata (UTC+05:30)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            You can always modify holiday blocks later.
          </span>
        </div>

        {/* 7-Day Schedule List */}
        <div className="space-y-4">
          {schedules.map((day) => {
            const dayName = DAY_NAMES[day.day_of_week];

            return (
              <div
                key={day.day_of_week}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  day.is_enabled
                    ? 'border-slate-200 bg-white shadow-2xs'
                    : 'border-slate-100 bg-slate-50/60 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Day Toggle */}
                  <div className="flex items-center gap-3 min-w-[150px]">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={day.is_enabled}
                        onChange={() => toggleDay(day.day_of_week)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF6A00]" />
                    </label>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{dayName}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        {day.is_enabled ? `${day.intervals.length} shift(s)` : 'Closed'}
                      </p>
                    </div>
                  </div>

                  {/* Intervals */}
                  {day.is_enabled ? (
                    <div className="flex-1 space-y-2">
                      {day.intervals.map((int, idx) => (
                        <div key={idx} className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                            <span className="text-[10px] uppercase font-bold text-slate-400">From</span>
                            <input
                              type="time"
                              required
                              value={int.start_time}
                              onChange={(e) =>
                                updateInterval(day.day_of_week, idx, 'start_time', e.target.value)
                              }
                              className="bg-transparent font-mono font-bold text-slate-900 focus:outline-none"
                            />
                            <span className="text-slate-300 mx-1">—</span>
                            <span className="text-[10px] uppercase font-bold text-slate-400">To</span>
                            <input
                              type="time"
                              required
                              value={int.end_time}
                              onChange={(e) =>
                                updateInterval(day.day_of_week, idx, 'end_time', e.target.value)
                              }
                              className="bg-transparent font-mono font-bold text-slate-900 focus:outline-none"
                            />
                          </div>

                          {day.intervals.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeInterval(day.day_of_week, idx)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Remove shift interval"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 text-xs text-slate-400 italic">
                      No consultations scheduled on this day.
                    </div>
                  )}

                  {/* Actions for Enabled Day */}
                  {day.is_enabled && (
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => addInterval(day.day_of_week)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-[#FF6A00] text-slate-600 hover:text-[#FF6A00] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer bg-white"
                        title="Add split shift (e.g. evening hours)"
                      >
                        <Plus size={13} />
                        <span>Add Shift</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => copyToAllEnabledDays(day.day_of_week)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer bg-white"
                        title="Copy hours to all other enabled days"
                      >
                        <Copy size={13} />
                        <span className="hidden sm:inline">Apply to All</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/onboarding/organization')}
            className="px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Previous Step</span>
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 rounded-2xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving Schedule...</span>
              </>
            ) : (
              <>
                <span>Save and Continue</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </OnboardingLayout>
  );
}

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { APPT_STATUS, DateRange, resolveRange } from './useDashboardStats'

export interface DoctorKpis {
  totalAppointments: { value: number; change: number | null }
  totalPatients: { value: number; change: number | null }
  waiting: { value: number; change: number | null }
  completed: { value: number; change: number | null }
  missed: { value: number; change: number | null }
  revenue: { value: number; change: number | null }
}

const empty: DoctorKpis = {
  totalAppointments: { value: 0, change: null },
  totalPatients: { value: 0, change: null },
  waiting: { value: 0, change: null },
  completed: { value: 0, change: null },
  missed: { value: 0, change: null },
  revenue: { value: 0, change: null },
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null
  return ((current - previous) / previous) * 100
}

function toISODate(d: Date) {
  return d.toISOString().split('T')[0]
}

function previousPeriod(range: DateRange): DateRange {
  const spanMs = range.end.getTime() - range.start.getTime()
  const prevEnd = new Date(range.start.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - spanMs)
  return { key: range.key, start: prevStart, end: prevEnd }
}

/**
 * Doctor-scoped dashboard KPIs — queried live from Supabase.
 * Scoped by both hospital_id and doctor_id.
 * Subscribes to Supabase Realtime to automatically refetch on changes.
 */
export function useDoctorDashboardStats(
  hospitalId: string | null | undefined,
  doctorId: string | null | undefined,
  range: DateRange
) {
  const [kpis, setKpis] = useState<DoctorKpis>(empty)
  const [isLoading, setIsLoading] = useState(true)

  const run = useCallback(async () => {
    if (!hospitalId || !doctorId) {
      setIsLoading(false)
      return
    }

    const prevRange = previousPeriod(range)
    setIsLoading(true)

    try {
      const [{ data: cur, error: curError }, { data: prev, error: prevError }] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, status, consultation_fee, patient_id')
          .eq('hospital_id', hospitalId)
          .eq('doctor_id', doctorId)
          .gte('appointment_date', toISODate(range.start))
          .lte('appointment_date', toISODate(range.end)),
        supabase
          .from('appointments')
          .select('id, status, consultation_fee, patient_id')
          .eq('hospital_id', hospitalId)
          .eq('doctor_id', doctorId)
          .gte('appointment_date', toISODate(prevRange.start))
          .lte('appointment_date', toISODate(prevRange.end)),
      ])

      if (curError) throw curError
      if (prevError) throw prevError

      const curRows = cur || []
      const prevRows = prev || []

      const countStatus = (rows: typeof curRows, statuses: string[]) =>
        rows.filter((r) => statuses.map((s) => s.toLowerCase()).includes((r.status || '').toLowerCase())).length

      const revenue = (rows: typeof curRows) =>
        rows
          .filter((r) => (r.status || '').toLowerCase() === 'completed')
          .reduce((s, r) => s + (Number(r.consultation_fee) || 0), 0)

      const uniquePatients = (rows: typeof curRows) =>
        new Set(rows.map((r) => r.patient_id).filter(Boolean)).size

      const curWaiting = countStatus(curRows, ['Waiting', 'In Consultation'])
      const prevWaiting = countStatus(prevRows, ['Waiting', 'In Consultation'])

      const curCompleted = countStatus(curRows, ['Completed'])
      const prevCompleted = countStatus(prevRows, ['Completed'])

      const curMissed = countStatus(curRows, ['Cancelled', 'No Show', 'Missed'])
      const prevMissed = countStatus(prevRows, ['Cancelled', 'No Show', 'Missed'])

      setKpis({
        totalAppointments: {
          value: curRows.length,
          change: pctChange(curRows.length, prevRows.length),
        },
        totalPatients: {
          value: uniquePatients(curRows),
          change: pctChange(uniquePatients(curRows), uniquePatients(prevRows)),
        },
        waiting: {
          value: curWaiting,
          change: pctChange(curWaiting, prevWaiting),
        },
        completed: {
          value: curCompleted,
          change: pctChange(curCompleted, prevCompleted),
        },
        missed: {
          value: curMissed,
          change: pctChange(curMissed, prevMissed),
        },
        revenue: {
          value: revenue(curRows),
          change: pctChange(revenue(curRows), revenue(prevRows)),
        },
      })
    } catch (e) {
      console.warn('useDoctorDashboardStats error:', e)
      setKpis(empty)
    } finally {
      setIsLoading(false)
    }
  }, [hospitalId, doctorId, range.key, range.start.getTime(), range.end.getTime()])

  useEffect(() => {
    run()
  }, [run])

  // Realtime subscription for instant dashboard stats synchronization
  useEffect(() => {
    if (!hospitalId || !doctorId) return

    const channel = supabase
      .channel(`doctor-kpis-${hospitalId}-${doctorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${doctorId}`,
        },
        () => {
          run()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [hospitalId, doctorId, run])

  return { kpis, isLoading, refetch: run }
}

export { resolveRange }
export type { DateRangeKey } from './useDashboardStats'

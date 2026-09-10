import { useEffect, useState } from 'react'
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
 * Doctor-scoped dashboard KPIs — every query filters by BOTH hospital_id and
 * doctor_id (never hospital_id alone), so this doctor never sees another
 * doctor's appointment counts or revenue even within the same hospital.
 */
export function useDoctorDashboardStats(hospitalId: string | null | undefined, doctorId: string | null | undefined, range: DateRange) {
  const [kpis, setKpis] = useState<DoctorKpis>(empty)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!hospitalId || !doctorId) {
      setIsLoading(false)
      return
    }

    const prevRange = previousPeriod(range)

    async function run() {
      setIsLoading(true)
      try {
        const [{ data: cur }, { data: prev }] = await Promise.all([
          supabase
            .from('appointments')
            .select('id, status, fee, patient_id')
            .eq('hospital_id', hospitalId)
            .eq('doctor_id', doctorId)
            .gte('appointment_date', toISODate(range.start))
            .lte('appointment_date', toISODate(range.end)),
          supabase
            .from('appointments')
            .select('id, status, fee, patient_id')
            .eq('hospital_id', hospitalId)
            .eq('doctor_id', doctorId)
            .gte('appointment_date', toISODate(prevRange.start))
            .lte('appointment_date', toISODate(prevRange.end)),
        ])

        if (cancelled) return

        const curRows = cur || []
        const prevRows = prev || []

        const count = (rows: typeof curRows, status: string) => rows.filter((r) => r.status === status).length
        const revenue = (rows: typeof curRows) =>
          rows.filter((r) => r.status === APPT_STATUS.COMPLETED).reduce((s, r) => s + (Number(r.fee) || 0), 0)
        const uniquePatients = (rows: typeof curRows) => new Set(rows.map((r) => r.patient_id).filter(Boolean)).size

        const curWaiting = count(curRows, APPT_STATUS.WAITING) + count(curRows, APPT_STATUS.IN_CONSULTATION)
        const prevWaiting = count(prevRows, APPT_STATUS.WAITING) + count(prevRows, APPT_STATUS.IN_CONSULTATION)

        setKpis({
          totalAppointments: { value: curRows.length, change: pctChange(curRows.length, prevRows.length) },
          totalPatients: { value: uniquePatients(curRows), change: pctChange(uniquePatients(curRows), uniquePatients(prevRows)) },
          waiting: { value: curWaiting, change: pctChange(curWaiting, prevWaiting) },
          completed: {
            value: count(curRows, APPT_STATUS.COMPLETED),
            change: pctChange(count(curRows, APPT_STATUS.COMPLETED), count(prevRows, APPT_STATUS.COMPLETED)),
          },
          missed: {
            value: count(curRows, APPT_STATUS.NO_SHOW),
            change: pctChange(count(curRows, APPT_STATUS.NO_SHOW), count(prevRows, APPT_STATUS.NO_SHOW)),
          },
          revenue: { value: revenue(curRows), change: pctChange(revenue(curRows), revenue(prevRows)) },
        })
      } catch (e) {
        console.warn('useDoctorDashboardStats fetch note:', e)
        if (!cancelled) setKpis(empty)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [hospitalId, doctorId, range.key, range.start.getTime(), range.end.getTime()])

  return { kpis, isLoading }
}

export { resolveRange }
export type { DateRangeKey } from './useDashboardStats'

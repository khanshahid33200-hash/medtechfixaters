import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export type DateRangeKey = 'today' | 'week' | 'month' | 'year' | 'custom'

export interface DateRange {
  key: DateRangeKey
  start: Date
  end: Date
}

// Appointment status strings as actually enforced by the DB CHECK constraint
// in supabase/01_master_setup.sql — every previous version of this dashboard
// filtered on lowercase/underscore values ('pending', 'no_show', ...) that
// never match a real row, which is why "Waiting"/"Completed" counts always
// silently showed 0 regardless of real data.
export const APPT_STATUS = {
  WAITING: 'Waiting',
  IN_CONSULTATION: 'In Consultation',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
} as const

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}
function toISODate(d: Date) {
  return d.toISOString().split('T')[0]
}

export function resolveRange(key: DateRangeKey, custom?: { start: Date; end: Date }): DateRange {
  const now = new Date()
  if (key === 'custom' && custom) {
    return { key, start: startOfDay(custom.start), end: endOfDay(custom.end) }
  }
  if (key === 'today') {
    return { key, start: startOfDay(now), end: endOfDay(now) }
  }
  if (key === 'week') {
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1 // Monday-start week
    const start = new Date(now)
    start.setDate(now.getDate() - day)
    return { key, start: startOfDay(start), end: endOfDay(now) }
  }
  if (key === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { key, start: startOfDay(start), end: endOfDay(now) }
  }
  // year
  const start = new Date(now.getFullYear(), 0, 1)
  return { key, start: startOfDay(start), end: endOfDay(now) }
}

/** Same-length window immediately preceding `range`, for the trend % comparison. */
function previousPeriod(range: DateRange): DateRange {
  const spanMs = range.end.getTime() - range.start.getTime()
  const prevEnd = new Date(range.start.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - spanMs)
  return { key: range.key, start: prevStart, end: prevEnd }
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null
  return ((current - previous) / previous) * 100
}

export interface DashboardKpis {
  totalAppointments: { value: number; change: number | null }
  totalPatients: { value: number; change: number | null }
  waiting: { value: number; change: number | null }
  completed: { value: number; change: number | null }
  missed: { value: number; change: number | null }
  revenue: { value: number; change: number | null }
}

export interface DashboardChartPoint {
  label: string
  date: string
  appointments: number
  completed: number
  missed: number
  revenue: number
}

interface FetchedAppt {
  id: string
  appointment_date: string
  status: string
  fee: number | null
  doctor_id: string
  department_id: string | null
}

const emptyKpis: DashboardKpis = {
  totalAppointments: { value: 0, change: null },
  totalPatients: { value: 0, change: null },
  waiting: { value: 0, change: null },
  completed: { value: 0, change: null },
  missed: { value: 0, change: null },
  revenue: { value: 0, change: null },
}

export function useDashboardStats(hospitalId: string | null | undefined, range: DateRange) {
  const [kpis, setKpis] = useState<DashboardKpis>(emptyKpis)
  const [chartData, setChartData] = useState<DashboardChartPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasAnyRecords, setHasAnyRecords] = useState(false)

  const prevRange = useMemo(() => previousPeriod(range), [range.key, range.start.getTime(), range.end.getTime()])

  useEffect(() => {
    let cancelled = false
    if (!hospitalId) {
      setIsLoading(false)
      return
    }

    async function run() {
      setIsLoading(true)
      try {
        const [{ data: currentAppts }, { data: prevAppts }, { count: currentPatients }, { count: prevPatients }, { count: everAppts }] =
          await Promise.all([
            supabase
              .from('appointments')
              .select('id, appointment_date, status, fee, doctor_id, department_id')
              .eq('hospital_id', hospitalId)
              .gte('appointment_date', toISODate(range.start))
              .lte('appointment_date', toISODate(range.end)),
            supabase
              .from('appointments')
              .select('id, appointment_date, status, fee, doctor_id, department_id')
              .eq('hospital_id', hospitalId)
              .gte('appointment_date', toISODate(prevRange.start))
              .lte('appointment_date', toISODate(prevRange.end)),
            supabase
              .from('patients')
              .select('id', { count: 'exact', head: true })
              .eq('hospital_id', hospitalId)
              .gte('created_at', range.start.toISOString())
              .lte('created_at', range.end.toISOString()),
            supabase
              .from('patients')
              .select('id', { count: 'exact', head: true })
              .eq('hospital_id', hospitalId)
              .gte('created_at', prevRange.start.toISOString())
              .lte('created_at', prevRange.end.toISOString()),
            supabase
              .from('appointments')
              .select('id', { count: 'exact', head: true })
              .eq('hospital_id', hospitalId),
          ])

        if (cancelled) return

        const cur = (currentAppts || []) as FetchedAppt[]
        const prev = (prevAppts || []) as FetchedAppt[]

        const sumRevenue = (rows: FetchedAppt[]) =>
          rows.filter((r) => r.status === APPT_STATUS.COMPLETED).reduce((s, r) => s + (Number(r.fee) || 0), 0)
        const count = (rows: FetchedAppt[], status: string) => rows.filter((r) => r.status === status).length

        const curWaiting = count(cur, APPT_STATUS.WAITING) + count(cur, APPT_STATUS.IN_CONSULTATION)
        const prevWaiting = count(prev, APPT_STATUS.WAITING) + count(prev, APPT_STATUS.IN_CONSULTATION)
        const curCompleted = count(cur, APPT_STATUS.COMPLETED)
        const prevCompleted = count(prev, APPT_STATUS.COMPLETED)
        const curMissed = count(cur, APPT_STATUS.NO_SHOW)
        const prevMissed = count(prev, APPT_STATUS.NO_SHOW)
        const curRevenue = sumRevenue(cur)
        const prevRevenue = sumRevenue(prev)

        setKpis({
          totalAppointments: { value: cur.length, change: pctChange(cur.length, prev.length) },
          totalPatients: { value: currentPatients || 0, change: pctChange(currentPatients || 0, prevPatients || 0) },
          waiting: { value: curWaiting, change: pctChange(curWaiting, prevWaiting) },
          completed: { value: curCompleted, change: pctChange(curCompleted, prevCompleted) },
          missed: { value: curMissed, change: pctChange(curMissed, prevMissed) },
          revenue: { value: curRevenue, change: pctChange(curRevenue, prevRevenue) },
        })

        setHasAnyRecords((everAppts || 0) > 0)

        // Build per-day chart series across the selected range (capped so a
        // "This Year" filter doesn't render 365 bars).
        const dayMs = 24 * 60 * 60 * 1000
        const totalDays = Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / dayMs) + 1)
        const bucketByWeek = totalDays > 62
        const buckets = new Map<string, DashboardChartPoint>()

        const bucketKeyFor = (dateStr: string) => {
          const d = new Date(dateStr + 'T00:00:00')
          if (!bucketByWeek) return { key: dateStr, label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }
          const weekStart = new Date(d)
          const dow = weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1
          weekStart.setDate(weekStart.getDate() - dow)
          const key = toISODate(weekStart)
          return { key, label: `Wk of ${weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` }
        }

        for (const a of cur) {
          const { key, label } = bucketKeyFor(a.appointment_date)
          if (!buckets.has(key)) {
            buckets.set(key, { label, date: key, appointments: 0, completed: 0, missed: 0, revenue: 0 })
          }
          const b = buckets.get(key)!
          b.appointments += 1
          if (a.status === APPT_STATUS.COMPLETED) {
            b.completed += 1
            b.revenue += Number(a.fee) || 0
          }
          if (a.status === APPT_STATUS.NO_SHOW) b.missed += 1
        }

        const series = Array.from(buckets.values()).sort((x, y) => x.date.localeCompare(y.date))
        setChartData(series)
      } catch (e) {
        console.warn('useDashboardStats fetch note:', e)
        if (!cancelled) {
          setKpis(emptyKpis)
          setChartData([])
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [hospitalId, range.key, range.start.getTime(), range.end.getTime()])

  return { kpis, chartData, isLoading, hasAnyRecords }
}

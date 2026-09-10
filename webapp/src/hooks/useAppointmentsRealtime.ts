import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchAppointments, AppointmentFilters, AppointmentRow } from '../services/appointmentService'

/**
 * Live, hospital_id-scoped appointment list. Re-fetches on any INSERT/UPDATE
 * to public.appointments for this hospital rather than trying to patch rows
 * in place — the join to doctor/department names makes patching the raw
 * realtime payload unreliable, and a hospital's appointment volume is small
 * enough that a full re-fetch per event is cheap.
 */
export function useAppointmentsRealtime(hospitalId: string | null | undefined, filters: AppointmentFilters) {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!hospitalId) {
      setIsLoading(false)
      return
    }
    const rows = await fetchAppointments(hospitalId, filters)
    setAppointments(rows)
    setIsLoading(false)
  }, [hospitalId, JSON.stringify(filters)])

  useEffect(() => {
    setIsLoading(true)
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!hospitalId) return
    const channel = supabase
      .channel(`appointments:${hospitalId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `hospital_id=eq.${hospitalId}` },
        () => refresh()
      )
      .subscribe()
    return () => {
      channel.unsubscribe()
    }
  }, [hospitalId, refresh])

  return { appointments, isLoading, refresh }
}

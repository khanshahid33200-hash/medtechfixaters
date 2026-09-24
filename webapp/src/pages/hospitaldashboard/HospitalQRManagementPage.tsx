import { useState, useEffect } from 'react'
import {
  Printer,
  Copy,
  RefreshCw,
  Power,
  ExternalLink,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react'
import HospitalDashboardLayout from '../../components/hospitaldashboard/HospitalDashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { logActivity } from '../../services/auditLogService'

export default function HospitalQRManagementPage() {
  const { doctorProfile } = useAuth()
  const hospitalName = localStorage.getItem('hospital_name') || doctorProfile?.hospital_name || 'Hospital Portal'
  const hospitalLogo = localStorage.getItem('clinicos_hospital_logo') || ''
  const currentHospId = doctorProfile?.hospital_id || localStorage.getItem('hospital_id') || ''

  const [qrActive, setQrActive] = useState(true)
  const defaultToken = currentHospId ? `QR-${currentHospId.replace(/-/g, '').slice(0, 8).toUpperCase()}` : 'QR-OPD'
  const [qrToken, setQrToken] = useState(defaultToken)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    async function loadQR() {
      if (!currentHospId) return
      try {
        const { data } = await supabase
          .from('qr_codes')
          .select('token, status, is_active')
          .eq('hospital_id', currentHospId)
          .maybeSingle()
        if (data?.token) {
          setQrToken(data.token)
          setQrActive(data.is_active !== false && data.status !== 'inactive')
        } else {
          // Provision dedicated QR record for this hospital in database
          const uniqueToken = `QR-${currentHospId.replace(/-/g, '').slice(0, 8).toUpperCase()}`
          setQrToken(uniqueToken)
          await supabase.from('qr_codes').upsert([{
            hospital_id: currentHospId,
            token: uniqueToken,
            booking_url: `/book/${uniqueToken}`,
            intake_url: `/book/${uniqueToken}`,
            status: 'active',
            is_active: true
          }])
        }
      } catch (e) {}
    }
    loadQR()
  }, [currentHospId])

  const bookingUrl = `${window.location.origin}/book/${qrToken}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingUrl)
    setNotice('✓ Patient QR Booking Link copied to clipboard!')
    setTimeout(() => setNotice(null), 3500)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleRegenerate = async () => {
    if (!currentHospId) return
    if (!confirm('Regenerate the QR token? Every link and printed code using the current QR will stop working immediately.')) return
    const nextToken = `QR-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`
    try {
      // UPDATE (not upsert) — qr_codes.hospital_id has no unique constraint,
      // so an upsert with no matching primary key would just INSERT a
      // second row per hospital instead of replacing the existing one.
      const { error } = await supabase
        .from('qr_codes')
        .update({ token: nextToken, booking_url: `/book/${nextToken}`, intake_url: `/book/${nextToken}` })
        .eq('hospital_id', currentHospId)
      if (error) throw error
      setQrToken(nextToken)
      await logActivity({ category: 'QR', action: 'QR Accessed', targetLabel: 'QR token regenerated', metadata: { new_token: nextToken } })
      setNotice('✓ Secure QR token refreshed! Previous links invalidated.')
    } catch (e: any) {
      setNotice(`Could not regenerate QR: ${e.message || e}`)
    }
    setTimeout(() => setNotice(null), 4000)
  }

  const handleToggleActive = async () => {
    if (!currentHospId) return
    const nextActive = !qrActive
    try {
      const { error } = await supabase
        .from('qr_codes')
        .update({ is_active: nextActive, status: nextActive ? 'active' : 'inactive' })
        .eq('hospital_id', currentHospId)
      if (error) throw error
      setQrActive(nextActive)
      await logActivity({ category: 'QR', action: nextActive ? 'QR Activated' : 'QR Deactivated' })
      setNotice(nextActive ? '✓ QR Activated. Accepting appointments!' : 'QR Deactivated. Public bookings paused.')
    } catch (e: any) {
      setNotice(`Could not update QR status: ${e.message || e}`)
    }
    setTimeout(() => setNotice(null), 3500)
  }

  return (
    <HospitalDashboardLayout pageTitle="QR Management">
      {notice && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Intro Bar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Hospital Digital Intake & Queue QR Terminal</h3>
            <p className="text-xs text-slate-400">Patients scan this code at OPD entrance to register and enter live doctor queues</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                qrActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {qrActive ? '● QR LIVE & ACCEPTING' : '○ QR PAUSED'}
            </span>
          </div>
        </div>

        {/* Layout: Left Printable QR Card, Right Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Printable Hospital QR Card (Matching reference design) */}
          <div className="md:col-span-6 flex justify-center">
            <div
              id="printable-qr-card"
              className="w-full max-w-sm bg-white p-8 rounded-3xl border-2 border-slate-200 shadow-xl flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Top Hospital Branding */}
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3 overflow-hidden shadow-sm">
                {hospitalLogo ? (
                  <img src={hospitalLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🏥</span>
                )}
              </div>

              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                {hospitalName}
              </h2>
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mt-1">
                Scan to Book Your Appointment
              </p>

              {/* Large Centered QR Code with Medtech Cross in center */}
              <div className="my-6 p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-inner flex items-center justify-center relative group">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(bookingUrl)}`}
                  alt="Booking QR Code"
                  className="w-56 h-56 object-contain"
                />
                {/* Center Badge */}
                <div className="absolute w-10 h-10 rounded-xl bg-blue-600 border-2 border-white shadow-md flex items-center justify-center text-white">
                  <div className="w-4 h-4 relative flex items-center justify-center">
                    <span className="w-4 h-1 bg-white rounded-full absolute" />
                    <span className="h-4 w-1 bg-white rounded-full absolute" />
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <p className="text-xs font-semibold text-slate-600 leading-snug">
                Fast and secure appointment booking
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Scan with your phone camera or WhatsApp scanner
              </p>

              {/* Powered By Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400">
                <span>Powered by</span>
                <span className="text-blue-600 font-extrabold">Medtech Fixaters</span>
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="md:col-span-6 space-y-4 text-xs">
            {/* Quick Actions Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Download & Management</h4>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md shadow-blue-500/20 transition"
                >
                  <Printer size={16} />
                  <span>Print Standee Slip</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 p-3 border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold rounded-2xl transition"
                >
                  <Copy size={16} />
                  <span>Copy Web Link</span>
                </button>
              </div>

              <div className="pt-2">
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-700 transition"
                >
                  <ExternalLink size={14} />
                  <span>Test Live Patient Intake Flow</span>
                </a>
              </div>
            </div>

            {/* Security & Token Lifecycle Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-600" />
                <span>Security Token & State</span>
              </h4>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-[11px] text-slate-600 break-all">
                Token: <strong className="text-slate-900">{qrToken}</strong>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRegenerate}
                  className="flex-1 py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={14} />
                  <span>Regenerate Token</span>
                </button>

                <button
                  onClick={handleToggleActive}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                    qrActive
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  <Power size={14} />
                  <span>{qrActive ? 'Deactivate QR' : 'Reactivate QR'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HospitalDashboardLayout>
  )
}

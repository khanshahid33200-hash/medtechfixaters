import { Link, useNavigate } from 'react-router-dom'
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSEO } from '../hooks/useSEO'

export default function AccountBlockedPage() {
  useSEO({
    title: 'Account Restricted — MedTech Fixaters Clinical OS',
    description: 'Account access is currently restricted by platform or facility administration.',
  })

  const { logout, currentUser, doctorProfile } = useAuth()
  const navigate = useNavigate()

  const userEmail = currentUser?.email || doctorProfile?.email || 'Authenticated User'
  const doctorCode = doctorProfile?.doctor_code || localStorage.getItem('doctor_code')
  const hospitalName = doctorProfile?.hospital_name || localStorage.getItem('hospital_name') || 'Clinical Facility'

  const handleSignOut = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 selection:bg-rose-500 selection:text-white">
      <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-slate-200/60 space-y-6 text-center">
        {/* Security Warning Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600 shadow-inner">
          <ShieldAlert size={36} />
        </div>

        {/* Header */}
        <div className="space-y-1.5">
          <span className="px-3 py-1 bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider rounded-full">
            Access Restricted
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Account Unavailable
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            Your practitioner account or clinical facility access is currently restricted by administration.
          </p>
        </div>

        {/* User Account Context Details */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
            <span className="text-slate-500 font-medium">Account:</span>
            <span className="font-bold text-slate-800 truncate max-w-[200px]">{userEmail}</span>
          </div>
          {doctorCode && (
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
              <span className="text-slate-500 font-medium">Doctor ID:</span>
              <span className="font-mono font-bold text-emerald-800">{doctorCode}</span>
            </div>
          )}
          <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
            <span className="text-slate-500 font-medium">Facility:</span>
            <span className="font-bold text-slate-800">{hospitalName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Status:</span>
            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-black rounded-md uppercase">
              Restricted
            </span>
          </div>
        </div>

        {/* Support Help Notice */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-left text-xs text-amber-900 space-y-1">
          <p className="font-bold">Next Steps:</p>
          <p className="text-[11px] text-amber-800">
            If you believe this restriction is an administrative error, please contact your Hospital Medical Director or Platform Support.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={handleSignOut}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow transition flex items-center justify-center gap-2"
          >
            <LogOut size={14} />
            <span>Sign In with Another Account</span>
          </button>

          <Link
            to="/"
            className="w-full py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} />
            <span>Return to Public Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

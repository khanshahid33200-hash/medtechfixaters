import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Cookie, ShieldCheck, CheckCircle2, X } from 'lucide-react'

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const consent = localStorage.getItem('clinicos_cookie_consent')
    if (!consent) {
      // Delay slightly for smooth appearance
      const timer = setTimeout(() => setIsVisible(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  if (
    location.pathname.startsWith('/onboarding') ||
    location.pathname.startsWith('/auth/') ||
    location.pathname.startsWith('/checkout/')
  ) {
    return null
  }

  const handleAcceptAll = () => {
    localStorage.setItem('clinicos_cookie_consent', 'accepted_all')
    setIsVisible(false)
  }

  const handleEssentialOnly = () => {
    localStorage.setItem('clinicos_cookie_consent', 'essential_only')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 text-white rounded-3xl p-6 shadow-2xl space-y-4 text-left relative">
        <button
          onClick={handleEssentialOnly}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full transition"
          aria-label="Close cookie banner"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-700/50 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Cookie size={20} />
          </div>
          <div className="space-y-1 pr-4">
            <h4 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              <span>Cookie & Privacy Consent</span>
              <ShieldCheck size={14} className="text-emerald-400" />
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              We use essential cookies to maintain secure sessions and optimize OPD queue performance. Read our{' '}
              <Link to="/privacy" className="text-emerald-400 font-bold underline hover:text-emerald-300">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handleEssentialOnly}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition text-center"
          >
            Essential Only
          </button>
          <button
            onClick={handleAcceptAll}
            className="py-2.5 px-3 bg-[#00875A] hover:bg-[#007043] text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={14} /> Accept All
          </button>
        </div>
      </div>
    </div>
  )
}

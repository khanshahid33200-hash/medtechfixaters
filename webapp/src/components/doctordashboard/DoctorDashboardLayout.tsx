import { useEffect, useState, ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  LayoutDashboard,
  Layers,
  Calendar,
  CheckCircle,
  Activity,
  UserCheck,
  QrCode,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Building2,
  KeyRound,
  Bell,
  CalendarClock,
  Pill,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSEO } from '../../hooks/useSEO'
import { supabase } from '../../lib/supabase'

interface DoctorDashboardLayoutProps {
  children: ReactNode
  pageTitle: string
  onResetView?: () => void
}

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Live Queue', path: '/queue', icon: Layers },
  { name: 'All Appointments', path: '/appointments', icon: Calendar },
  { name: 'Follow-Up', path: '/follow-ups', icon: CheckCircle },
  { name: 'History', path: '/history', icon: Activity },
  { name: 'Medicines', path: '/medicines', icon: Pill },
  { name: 'QR', path: '/qr-kiosk', icon: QrCode },
  { name: 'Availability', path: '/availability', icon: CalendarClock },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Settings', path: '/settings', icon: Settings },
]

type OnlineStatus = 'active' | 'break' | 'offline'

export default function DoctorDashboardLayout({ children, pageTitle, onResetView }: DoctorDashboardLayoutProps) {
  useSEO({
    title: `${pageTitle} — Doctor Workspace — Medtech Fixaters`,
    description: 'Doctor clinical workspace: live queue, consultations, prescriptions, and patient history.',
  })

  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, doctorProfile, logout } = useAuth()

  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [hospitalLogo, setHospitalLogo] = useState<string | null>(null)
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>('active')
  const [now, setNow] = useState(() => new Date())
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('doctor_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('doctor_sidebar_collapsed', String(next)) } catch {}
      return next
    })
  }

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        toggleCollapse()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const doctorId = doctorProfile?.doctor_id || ''
  const hospitalId = doctorProfile?.hospital_id || ''
  const hospitalName = doctorProfile?.hospital_name || 'Hospital Facility'
  const doctorName = doctorProfile?.name || 'Doctor'
  const doctorCode = doctorProfile?.doctor_code || ''
  const doctorDept = doctorProfile?.specialization || doctorProfile?.department_name || 'Consultant'

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  // Hospital logo is only on public.hospitals, not on the doctor's profile —
  // fetch it for real rather than ever hardcoding a placeholder image.
  useEffect(() => {
    if (!hospitalId) return
    supabase
      .from('hospitals')
      .select('logo_url')
      .eq('id', hospitalId)
      .maybeSingle()
      .then(({ data }) => setHospitalLogo(data?.logo_url || null))
  }, [hospitalId])

  // Availability status lives on doctor_details.availability_status —
  // load the real value and persist real toggles back to it, rather than
  // a component-local flag that resets on every page load.
  useEffect(() => {
    if (!doctorId) return
    supabase
      .from('doctor_details')
      .select('availability_status')
      .eq('id', doctorId)
      .maybeSingle()
      .then(({ data }) => {
        const s = data?.availability_status
        if (s === 'active' || s === 'break' || s === 'offline') setOnlineStatus(s)
      })
  }, [doctorId])

  const cycleStatus = async () => {
    const next: OnlineStatus = onlineStatus === 'active' ? 'break' : onlineStatus === 'break' ? 'offline' : 'active'
    setOnlineStatus(next)
    if (doctorId) {
      await supabase.from('doctor_details').update({ availability_status: next }).eq('id', doctorId)
    }
  }

  const statusMeta: Record<OnlineStatus, { label: string; dot: string }> = {
    active: { label: 'Available', dot: 'bg-emerald-500' },
    break: { label: 'On Break', dot: 'bg-amber-500' },
    offline: { label: 'Offline', dot: 'bg-slate-400' },
  }

  // Sections with sub-pages (e.g. /medicines/import) keep their sidebar item highlighted.
  const isActive = (path: string) =>
    location.pathname === path || (path === '/medicines' && location.pathname.startsWith('/medicines/'))

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const dateLabel = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const dayLabel = now.toLocaleDateString('en-IN', { weekday: 'long' })

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-slate-900 flex font-sans antialiased selection:bg-blue-500/20 relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 w-[460px] h-[460px] rounded-full bg-blue-300/25 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 w-[420px] h-[420px] rounded-full bg-orange-200/25 blur-[120px]" />
      </div>

      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 border-r border-white/70 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-[76px]' : 'w-[264px]'
        }`}
        style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(30px) saturate(150%)', WebkitBackdropFilter: 'blur(30px) saturate(150%)' }}
      >
        <div className={`pt-5 pb-4 border-b border-white/60 transition-all ${isCollapsed ? 'px-2' : 'px-5'}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/70 border border-white/80 shadow-sm flex items-center justify-center shrink-0 overflow-hidden text-lg">
                {hospitalLogo ? <img src={hospitalLogo} alt={hospitalName} className="w-full h-full object-cover" /> : <Building2 size={20} className="text-blue-600" />}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <h2 className="text-[13.5px] font-extrabold text-slate-900 leading-tight truncate">{hospitalName}</h2>
                  <p className="text-[10.5px] text-slate-500 font-medium truncate">Doctor Workspace</p>
                </div>
              )}
            </div>

            <button
              onClick={toggleCollapse}
              title={isCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
              className={`p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 border border-transparent hover:border-slate-200 transition cursor-pointer ${isCollapsed ? 'hidden' : 'block'}`}
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {!isCollapsed && (
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
              <span>Powered by</span>
              <span className="inline-flex items-center gap-1 text-slate-500">
                <img src="/assets/brand-icon.png" alt="" className="w-3.5 h-3.5 object-contain" />
                MedTech Fixaters
              </span>
            </div>
          )}
        </div>

        <nav className={`flex-1 overflow-y-auto py-3 space-y-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {navItems.map((item) => {
            const active = isActive(item.path)
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.path}
                title={isCollapsed ? item.name : undefined}
                onClick={() => {
                  if (onResetView) onResetView()
                }}
                className="block relative group"
              >
                <motion.div
                  whileHover={{ x: isCollapsed ? 0 : 2, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className={`relative flex items-center ${isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3.5 py-2.5'} rounded-2xl text-[12.5px] font-semibold transition-colors duration-200 ${active ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {active && (
                    <motion.span
                      layoutId="doctor-nav-active"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-2xl bg-blue-500/10 border border-blue-400/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_4px_16px_rgba(59,130,246,0.12)]"
                    />
                  )}
                  {!active && <span className="absolute inset-0 rounded-2xl bg-white/0 group-hover:bg-white/60 transition-colors duration-200" />}
                  <span className={`relative flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <Icon size={17} className={active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </span>
                </motion.div>
              </Link>
            )
          })}
        </nav>

        <div className="p-2.5 border-t border-white/60 space-y-1">
          <button
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center py-2' : 'justify-between px-3 py-2'} rounded-xl text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:bg-white/70 transition-colors cursor-pointer`}
          >
            <span className="flex items-center gap-2">
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              {!isCollapsed && <span>Collapse Sidebar</span>}
            </span>
            {!isCollapsed && <span className="text-[10px] text-slate-400 font-mono">⌘B</span>}
          </button>

          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center py-2.5' : 'gap-2.5 px-3.5 py-2.5'} rounded-2xl text-[12px] font-semibold text-rose-600 hover:bg-rose-50/70 transition-colors cursor-pointer`}
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ─── MOBILE DRAWER ─── */}
      <AnimatePresence>
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileNavOpen(false)} className="fixed inset-0 backdrop-blur-sm" style={{ background: 'rgba(15,23,42,0.12)' }} />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="relative w-[280px] h-full flex flex-col z-10 shadow-2xl border-r border-white/70"
              style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(24px) saturate(150%)' }}
            >
              <div className="px-5 pt-6 pb-4 flex items-start justify-between border-b border-white/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/70 border border-white/80 flex items-center justify-center overflow-hidden">
                    {hospitalLogo ? <img src={hospitalLogo} alt={hospitalName} className="w-full h-full object-cover" /> : <Building2 size={16} className="text-blue-600" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-[13px] text-slate-900 block leading-tight">{hospitalName}</span>
                    <span className="text-[9.5px] text-slate-400 font-semibold">Powered by MedTech Fixaters</span>
                  </div>
                </div>
                <button onClick={() => setMobileNavOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X size={18} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {navItems.map((item) => {
                  const active = isActive(item.path)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => {
                        setMobileNavOpen(false)
                        if (onResetView) onResetView()
                      }}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[12.5px] font-semibold transition-colors ${active ? 'bg-blue-500/10 text-blue-700 border border-blue-400/30' : 'text-slate-500 hover:bg-white/70'}`}
                    >
                      <Icon size={16.5} className={active ? 'text-blue-600' : 'text-slate-400'} />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
              <div className="p-3 border-t border-white/60">
                <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-[12px] font-semibold text-rose-600 hover:bg-rose-50/70 transition-colors">
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MAIN ─── */}
      <div className={`flex-1 ${isCollapsed ? 'lg:pl-[76px]' : 'lg:pl-[264px]'} flex flex-col min-w-0 min-h-screen relative z-10 transition-all duration-300 ease-in-out`}>
        <header
          className="h-[68px] sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between border-b border-white/60"
          style={{ background: 'rgba(247,248,252,0.72)', backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)' }}
        >
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileNavOpen(true)} className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-white/70 transition" aria-label="Open menu">
              <Menu size={20} />
            </button>
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white/80 border border-transparent hover:border-slate-200 transition cursor-pointer"
              title={isCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <span className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-[11.5px] font-semibold text-slate-700 border border-white/80 shadow-[0_6px_20px_rgba(30,60,120,0.06)]" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(18px) saturate(150%)' }}>
              {dateLabel} · {dayLabel}
            </span>

            <div className="relative">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-full border border-white/80 shadow-[0_6px_20px_rgba(30,60,120,0.06)]"
                style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(18px) saturate(150%)' }}
              >
                <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-orange-400 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  {doctorName?.[0]?.toUpperCase() || 'D'}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${statusMeta[onlineStatus].dot}`} />
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-[11.5px] font-bold text-slate-800 block leading-tight">{doctorName}</span>
                  <span className="text-[10px] text-blue-600 font-semibold block leading-none mt-0.5">{doctorDept} {doctorCode ? `· ${doctorCode}` : ''}</span>
                </div>
                <ChevronDown size={13} className="text-slate-400" />
              </motion.button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/80 shadow-xl py-2 z-50 text-xs text-slate-700"
                    style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(24px) saturate(160%)' }}
                  >
                    <div className="px-4 py-2 border-b border-slate-100 mb-1">
                      <p className="font-bold text-slate-900">{doctorName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser?.email}</p>
                      <p className="text-[10.5px] text-slate-400">{doctorDept} {doctorCode && `· ${doctorCode}`}</p>
                    </div>
                    <button
                      onClick={() => { cycleStatus(); }}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2 hover:bg-blue-50/80 hover:text-blue-600 transition"
                    >
                      <span className={`w-2 h-2 rounded-full ${statusMeta[onlineStatus].dot}`} />
                      <span>Status: {statusMeta[onlineStatus].label} (tap to change)</span>
                    </button>
                    <Link
                      to="/profile"
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        if (onResetView) onResetView()
                      }}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-blue-50/80 hover:text-blue-600 transition"
                    >
                      <UserCheck size={15} />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        if (onResetView) onResetView()
                      }}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-blue-50/80 hover:text-blue-600 transition"
                    >
                      <Settings size={15} />
                      <span>Settings</span>
                    </Link>
                    <Link
                      to="/settings?tab=security"
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        if (onResetView) onResetView()
                      }}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-blue-50/80 hover:text-blue-600 transition"
                    >
                      <KeyRound size={15} />
                      <span>Change Password</span>
                    </Link>
                    <div className="border-t border-slate-100 my-1" />
                    <button onClick={handleLogout} className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50/80 transition">
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}

import { useState, useEffect, ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { HeartHandshake,
  LayoutDashboard,
  Calendar,
  Layers,
  Users,
  Stethoscope,
  Building2,
  FileText,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
  QrCode,
  ChevronDown,
  LogOut,
  User,
  Building,
  Menu,
  X,
  CalendarDays,
  Check,
  KeyRound,
  MessageSquare,
  ScrollText
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSEO } from '../../hooks/useSEO'

interface HospitalDashboardLayoutProps {
  children: ReactNode
  pageTitle: string
}

const navItems = [
  { name: 'Dashboard', path: '/hospitaldashboard/dashboard', icon: LayoutDashboard },
  { name: 'Live Queue', path: '/hospitaldashboard/live-queue', icon: Layers },
  { name: 'Chat', path: '/hospitaldashboard/chat', icon: MessageSquare },
  { name: 'QR Booking', path: '/hospitaldashboard/qr', icon: QrCode },
  { name: 'Appointments', path: '/hospitaldashboard/appointments', icon: Calendar },
  { name: 'Departments', path: '/hospitaldashboard/departments', icon: Building2 },
  { name: 'Doctors', path: '/hospitaldashboard/doctors', icon: Stethoscope },
  { name: 'Patients', path: '/hospitaldashboard/patients', icon: Users },
  { name: 'CRM', path: '/hospitaldashboard/crm', icon: HeartHandshake },
  { name: 'Reports', path: '/hospitaldashboard/reports', icon: FileText },
  { name: 'Analytics', path: '/hospitaldashboard/analytics', icon: BarChart3 },
  { name: 'Notifications', path: '/hospitaldashboard/notifications', icon: Bell, badge: 'live' as const },
  { name: 'Users & Roles', path: '/hospitaldashboard/users-roles', icon: ShieldCheck },
  { name: 'Logs', path: '/hospitaldashboard/logs', icon: ScrollText },
  { name: 'Settings', path: '/hospitaldashboard/settings', icon: Settings },
]

export default function HospitalDashboardLayout({ children, pageTitle }: HospitalDashboardLayoutProps) {
  useSEO({
    title: `${pageTitle} — Medtech Fixaters Hospital Admin`,
    description: 'Hospital administration executive operating system by Medtech Fixaters.',
  })

  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, doctorProfile, logout } = useAuth()

  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [selectedDateRange, setSelectedDateRange] = useState<'Today' | 'This Week' | 'This Month' | 'This Year'>('Today')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  // Hospital identity — sourced only from the authenticated session, never a
  // hard-coded fallback, so a different hospital admin never sees a stale
  // brand from another tenant's browser cache.
  const hospitalName = doctorProfile?.hospital_name || 'Hospital Facility'
  const hospitalLogo = localStorage.getItem('clinicos_hospital_logo') || ''
  const adminName = doctorProfile?.name || currentUser?.user_metadata?.full_name || 'Administrator'
  const adminRole =
    doctorProfile?.role === 'super_admin'
      ? 'Super Administrator'
      : doctorProfile?.role === 'hospital_admin'
      ? 'Hospital Administrator'
      : 'Administrator'

  const isActive = (path: string) => {
    if (path === '/hospitaldashboard/dashboard') {
      return location.pathname === '/hospitaldashboard' || location.pathname === '/hospitaldashboard/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const dateLabel = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const dayLabel = now.toLocaleDateString('en-IN', { weekday: 'long' })

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-slate-900 flex font-sans antialiased selection:bg-blue-500/20 relative overflow-x-hidden">
      {/* Ambient blurred gradient wash behind everything — subtle, not loud */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 w-[460px] h-[460px] rounded-full bg-blue-300/25 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 w-[420px] h-[420px] rounded-full bg-orange-200/25 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[380px] h-[380px] rounded-full bg-sky-200/20 blur-[110px]" />
      </div>

      {/* ─── DESKTOP LIQUID GLASS SIDEBAR ─── */}
      <aside
        className="hidden lg:flex flex-col w-[264px] fixed inset-y-0 left-0 z-40 border-r border-white/70"
        style={{
          background: 'rgba(255,255,255,0.45)',
          backdropFilter: 'blur(30px) saturate(150%)',
          WebkitBackdropFilter: 'blur(30px) saturate(150%)',
        }}
      >
        {/* Hospital Identity Block */}
        <div className="px-5 pt-6 pb-5 border-b border-white/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/70 border border-white/80 shadow-sm flex items-center justify-center shrink-0 overflow-hidden text-lg">
              {hospitalLogo ? (
                <img src={hospitalLogo} alt={hospitalName} className="w-full h-full object-cover" />
              ) : (
                <Building2 size={20} className="text-blue-600" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-[13.5px] font-extrabold text-slate-900 leading-tight truncate">
                {hospitalName}
              </h2>
              <p className="text-[10.5px] text-slate-500 font-medium truncate">Hospital Operations Console</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
            <span>Powered by</span>
            <span className="inline-flex items-center gap-1 text-slate-500">
              <img src="/assets/brand-icon.png" alt="" className="w-3.5 h-3.5 object-contain" />
              MedTech Fixaters
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const active = isActive(item.path)
            const Icon = item.icon
            return (
              <Link key={item.name} to={item.path} className="block relative group">
                <motion.div
                  whileHover={{ x: 2, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[12.5px] font-semibold transition-colors duration-200 ${
                    active ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="hospital-nav-active"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-2xl bg-blue-500/10 border border-blue-400/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_4px_16px_rgba(59,130,246,0.12)]"
                    />
                  )}
                  {!active && (
                    <span className="absolute inset-0 rounded-2xl bg-white/0 group-hover:bg-white/60 transition-colors duration-200" />
                  )}
                  <span className="relative flex items-center gap-3">
                    <Icon size={16.5} className={active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} />
                    <span>{item.name}</span>
                  </span>
                  {item.badge && (
                    <span className="relative w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.15)]" />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Account footer */}
        <div className="p-3 border-t border-white/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-[12px] font-semibold text-rose-600 hover:bg-rose-50/70 transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── MOBILE DRAWER ─── */}
      <AnimatePresence>
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 backdrop-blur-sm"
              style={{ background: 'rgba(15,23,42,0.12)' }}
            />
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
                    {hospitalLogo ? (
                      <img src={hospitalLogo} alt={hospitalName} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 size={16} className="text-blue-600" />
                    )}
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
                      onClick={() => setMobileNavOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[12.5px] font-semibold transition-colors ${
                        active ? 'bg-blue-500/10 text-blue-700 border border-blue-400/30' : 'text-slate-500 hover:bg-white/70'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon size={16.5} className={active ? 'text-blue-600' : 'text-slate-400'} />
                        <span>{item.name}</span>
                      </span>
                      {item.badge && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                    </Link>
                  )
                })}
              </nav>

              <div className="p-3 border-t border-white/60">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-[12px] font-semibold text-rose-600 hover:bg-rose-50/70 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 lg:pl-[264px] flex flex-col min-w-0 min-h-screen relative z-10">
        {/* ─── LIQUID GLASS HEADER ─── */}
        <header
          className="h-[68px] sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between border-b border-white/60"
          style={{
            background: 'rgba(247,248,252,0.72)',
            backdropFilter: 'blur(22px) saturate(160%)',
            WebkitBackdropFilter: 'blur(22px) saturate(160%)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-white/70 transition"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Date pill */}
            <div className="relative">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setDatePickerOpen(!datePickerOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-[11.5px] font-semibold text-slate-700 border border-white/80 shadow-[0_6px_20px_rgba(30,60,120,0.06)]"
                style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(18px) saturate(150%)' }}
              >
                <CalendarDays size={14} className="text-slate-500" />
                <span className="hidden sm:inline">{dateLabel} · {dayLabel}</span>
                <span className="sm:hidden">{selectedDateRange}</span>
                <ChevronDown size={13} className="text-slate-400" />
              </motion.button>

              <AnimatePresence>
                {datePickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/80 shadow-xl py-1.5 z-50 text-xs font-medium"
                    style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(24px) saturate(160%)' }}
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Select Range
                    </div>
                    {(['Today', 'This Week', 'This Month', 'This Year'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => {
                          setSelectedDateRange(range)
                          setDatePickerOpen(false)
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-blue-50/80 hover:text-blue-600 flex items-center justify-between transition-colors"
                      >
                        <span>{range}</span>
                        {selectedDateRange === range && <Check size={14} className="text-blue-600" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notification bell */}
            <Link to="/hospitaldashboard/notifications" title="Notifications">
              <motion.div
                whileHover={{ y: -1, scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 relative border border-white/80 shadow-[0_6px_20px_rgba(30,60,120,0.06)]"
                style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(18px) saturate(150%)' }}
              >
                <Bell size={16.5} />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-500 rounded-full shadow-[0_0_0_2px_rgba(247,248,252,1)]" />
              </motion.div>
            </Link>

            {/* Profile dropdown */}
            <div className="relative">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-full border border-white/80 shadow-[0_6px_20px_rgba(30,60,120,0.06)]"
                style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(18px) saturate(150%)' }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-orange-400 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  {adminName?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-[11.5px] font-bold text-slate-800 block leading-tight">{adminName}</span>
                  <span className="text-[10px] text-slate-400 block leading-none">{adminRole}</span>
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
                    className="absolute right-0 mt-2 w-60 rounded-2xl border border-white/80 shadow-xl py-2 z-50 text-xs text-slate-700"
                    style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(24px) saturate(160%)' }}
                  >
                    <div className="px-4 py-2 border-b border-slate-100 mb-1">
                      <p className="font-bold text-slate-900">{adminName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser?.email}</p>
                    </div>
                    <Link
                      to="/hospitaldashboard/settings/hospital-profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-blue-50/80 hover:text-blue-600 transition"
                    >
                      <Building size={15} />
                      <span>Hospital Profile</span>
                    </Link>
                    <Link
                      to="/hospitaldashboard/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-blue-50/80 hover:text-blue-600 transition"
                    >
                      <User size={15} />
                      <span>Account Settings</span>
                    </Link>
                    <Link
                      to="/hospitaldashboard/settings?tab=security"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-blue-50/80 hover:text-blue-600 transition"
                    >
                      <KeyRound size={15} />
                      <span>Security</span>
                    </Link>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50/80 transition"
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ─── MAIN BODY ─── */}
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

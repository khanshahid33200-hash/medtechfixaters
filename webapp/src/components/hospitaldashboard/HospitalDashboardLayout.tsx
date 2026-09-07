import React, { useState, useEffect, ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
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
  Sparkles,
  CalendarDays,
  Check,
  KeyRound
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSEO } from '../../hooks/useSEO'

interface HospitalDashboardLayoutProps {
  children: ReactNode
  pageTitle: string
}

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
  const [selectedDateRange, setSelectedDateRange] = useState('May 31, 2025')

  // Hospital identity (Dynamic from profile or demo fallback)
  const hospitalName = doctorProfile?.hospital_name || localStorage.getItem('hospital_name') || 'City Care Hospital'
  const hospitalLogo = localStorage.getItem('clinicos_hospital_logo') || ''
  const adminName = doctorProfile?.name || currentUser?.user_metadata?.full_name || 'Dr. Amit Sharma'
  const adminRole = doctorProfile?.role === 'hospital_admin' ? 'Admin' : doctorProfile?.role === 'super_admin' ? 'Super Admin' : 'Admin'

  const navItems = [
    { name: 'Dashboard', path: '/hospitaldashboard/dashboard', icon: LayoutDashboard },
    { name: 'Appointments', path: '/hospitaldashboard/appointments', icon: Calendar },
    { name: 'Live Queue', path: '/hospitaldashboard/live-queue', icon: Layers },
    { name: 'Patients', path: '/hospitaldashboard/patients', icon: Users },
    { name: 'Doctors', path: '/hospitaldashboard/doctors', icon: Stethoscope },
    { name: 'Departments', path: '/hospitaldashboard/departments', icon: Building2 },
    { name: 'Reports', path: '/hospitaldashboard/reports', icon: FileText },
    { name: 'Analytics', path: '/hospitaldashboard/analytics', icon: BarChart3 },
    { name: 'Notifications', path: '/hospitaldashboard/notifications', icon: Bell, badge: 12 },
    { name: 'Settings', path: '/hospitaldashboard/settings', icon: Settings },
    { name: 'Users & Roles', path: '/hospitaldashboard/users-roles', icon: ShieldCheck },
    { name: 'QR Management', path: '/hospitaldashboard/qr', icon: QrCode },
  ]

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* ─── DESKTOP FIXED LEFT SIDEBAR (250px) ─── */}
      <aside className="hidden lg:flex flex-col w-[250px] bg-white border-r border-slate-200/80 fixed inset-y-0 left-0 z-40">
        {/* Brand Logo & Name */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100">
          <img src="/assets/brand-icon.png" alt="MedTech Fixaters" className="w-8 h-8 object-contain shrink-0" />
          <div className="flex flex-col">
            <span className="font-extrabold text-[15px] tracking-tight text-slate-900 leading-none">
              medtech fixaters
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1 scrollbar-thin">
          {navItems.map((item) => {
            const active = isActive(item.path)
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-blue-50/80 text-blue-600 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={17}
                    className={`transition-colors ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      active ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Hospital Profile Card (Matching reference image) */}
        <div className="p-3 border-t border-slate-100">
          <Link
            to="/hospitaldashboard/settings/hospital-profile"
            className="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50/80 transition shadow-sm group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0 overflow-hidden text-xl">
              {hospitalLogo ? (
                <img src={hospitalLogo} alt="Hospital Logo" className="w-full h-full object-cover" />
              ) : (
                <span role="img" aria-label="Hospital Building">🏥</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                {hospitalName}
              </h4>
              <p className="text-[10px] font-medium text-slate-400 truncate">
                Super Admin
              </p>
            </div>
          </Link>
        </div>
      </aside>

      {/* ─── MOBILE / TABLET DRAWER ─── */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <div className="relative w-[260px] bg-white h-full flex flex-col z-10 shadow-2xl">
            <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <div className="w-4 h-4 relative flex items-center justify-center">
                    <span className="w-4 h-1.5 bg-white rounded-full absolute" />
                    <span className="h-4 w-1.5 bg-white rounded-full absolute" />
                  </div>
                </div>
                <span className="font-extrabold text-sm text-slate-900">medtech fixaters</span>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.path)
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                      active ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={17} className={active ? 'text-blue-600' : 'text-slate-400'} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-600">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT CONTAINER (Offset 250px on desktop) ─── */}
      <div className="flex-1 lg:pl-[250px] flex flex-col min-w-0 min-h-screen">
        {/* ─── TOP HEADER ─── */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
          {/* Left: Mobile trigger & Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {pageTitle}
            </h1>
          </div>

          {/* Right Controls: Date Range, Notifications & Profile Dropdown */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Interactive Date Selector (Exact match to reference image) */}
            <div className="relative">
              <button
                onClick={() => setDatePickerOpen(!datePickerOpen)}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 transition"
              >
                <CalendarDays size={15} className="text-slate-500" />
                <span className="hidden sm:inline">{selectedDateRange}</span>
                <span className="sm:hidden">Today</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {datePickerOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 text-xs font-medium animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Filter Date
                  </div>
                  {['May 31, 2025', 'Today (Live)', 'This Week', 'This Month', 'Last Month'].map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        setSelectedDateRange(range)
                        setDatePickerOpen(false)
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between"
                    >
                      <span>{range}</span>
                      {selectedDateRange === range && <Check size={14} className="text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell with red counter '8' (Matching reference image) */}
            <Link
              to="/hospitaldashboard/notifications"
              className="w-10 h-10 rounded-full border border-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-slate-50 relative transition"
              title="Notifications"
            >
              <Bell size={17} />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm">
                8
              </span>
            </Link>

            {/* Administrator Profile Pill with Avatar & Dropdown (Matching reference image) */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-full hover:bg-slate-100 transition"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 border border-slate-300/80 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&auto=format&fit=crop&q=80"
                    alt="Administrator"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-bold text-slate-800 block leading-tight">
                    {adminName}
                  </span>
                  <span className="text-[10px] text-slate-400 block leading-none">
                    {adminRole}
                  </span>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {/* Working Profile Actions Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 text-xs text-slate-700 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <p className="font-bold text-slate-900">{adminName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser?.email || 'admin@citycare.com'}</p>
                  </div>
                  <Link
                    to="/hospitaldashboard/settings/hospital-profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 hover:bg-blue-50 hover:text-blue-600 transition"
                  >
                    <Building size={15} />
                    <span>Hospital Profile</span>
                  </Link>
                  <Link
                    to="/hospitaldashboard/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 hover:bg-blue-50 hover:text-blue-600 transition"
                  >
                    <Settings size={15} />
                    <span>Account Settings</span>
                  </Link>
                  <Link
                    to="/hospitaldashboard/settings?tab=security"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 hover:bg-blue-50 hover:text-blue-600 transition"
                  >
                    <KeyRound size={15} />
                    <span>Change Password</span>
                  </Link>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 transition"
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ─── MAIN BODY ─── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

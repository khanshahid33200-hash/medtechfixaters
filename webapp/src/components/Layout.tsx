import { ReactNode, useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Layers,
  Calendar,
  Clock,
  Users,
  Stethoscope,
  FileText,
  CheckCircle,
  Activity,
  UserCheck,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Building2,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface LayoutProps {
  children: ReactNode
  userRole?: string
  onResetView?: () => void
}

export default function Layout({ children, onResetView }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { doctorProfile, logout } = useAuth()

  const doctorCode = doctorProfile?.doctor_code || localStorage.getItem('doctor_code') || 'H1-D-0001'
  const doctorName = doctorProfile?.name || 'Dr. Authorized Doctor'
  const doctorSpecialty = doctorProfile?.specialization || doctorProfile?.department_name || 'Consultant Specialist'
  const hospitalName = doctorProfile?.hospital_name || localStorage.getItem('hospital_name') || 'Hospital Facility'
  
  const [doctorStatus, setDoctorStatus] = useState<'Available' | 'In Session' | 'On Break'>('Available')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <Layers size={16} /> },
    { path: '/queue', label: "Today's Queue", icon: <Calendar size={16} /> },
    { path: '/appointments', label: 'Appointments', icon: <Clock size={16} /> },
    { path: '/templates', label: 'Templates', icon: <FileText size={16} /> },
    { path: '/follow-ups', label: 'Follow Ups', icon: <CheckCircle size={16} /> },
    { path: '/reports', label: 'Reports', icon: <Activity size={16} /> },
    { path: '/profile', label: 'Profile', icon: <UserCheck size={16} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={16} /> },
  ]

  const isActive = (path: string) => {
    if (path === '/dashboard' && (location.pathname === '/dashboard' || location.pathname === '/')) return true
    return location.pathname.startsWith(path)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-900 font-sans flex antialiased selection:bg-indigo-500 selection:text-white">
      {/* ─── NEW CLEAN WHITE SIDEBAR ─────────────────────────────────── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 shadow-sm transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } overflow-y-auto`}
      >
        <div className="p-5 space-y-5">
          {/* Brand Logo */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-black text-xl text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                M
              </div>
              <div>
                <h2 className="font-black text-base text-slate-900 tracking-tight leading-none">MedTech Fixaters</h2>
                <span className="text-[11px] font-semibold text-slate-400">Doctor Dashboard</span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 hover:bg-slate-100 rounded-xl text-slate-500"
            >
              <X size={18} />
            </button>
          </div>

          {/* Doctor Profile Mini Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=120&q=80"
              alt={doctorName}
              className="w-11 h-11 rounded-xl object-cover ring-2 ring-indigo-500/20"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-xs text-slate-900 truncate leading-tight">{doctorName}</h4>
              <span className="inline-block px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 font-mono text-[9px] font-black rounded my-0.5">
                {doctorCode}
              </span>
              <p className="text-[10px] font-bold text-slate-500 truncate">{doctorSpecialty}</p>
              <div className="mt-1">
                <button
                  onClick={() => setDoctorStatus(doctorStatus === 'Available' ? 'In Session' : doctorStatus === 'In Session' ? 'On Break' : 'Available')}
                  className="px-2 py-0.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-full text-[9px] font-black uppercase tracking-wider transition"
                >
                  {doctorStatus}
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs">
            {navItems.map((item) => {
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    setSidebarOpen(false)
                    if (onResetView) onResetView()
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Support & Logout */}
        <div className="p-4 space-y-3">
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-indigo-700">
              <AlertCircle size={14} className="shrink-0" />
              <span className="text-xs font-black">Need Help?</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">Contact hospital admin or support team.</p>
            <a
              href="mailto:support@medtechfixaters.in"
              className="w-full py-1.5 bg-white hover:bg-indigo-600 hover:text-white text-indigo-600 border border-indigo-200 rounded-xl text-[11px] font-bold shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <span>🎧 Get Support</span>
            </a>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT WRAPPER ─────────────────────────────────── */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-600"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2.5 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                🏥
              </div>
              <div className="text-left">
                <span className="font-extrabold text-xs text-slate-900 block leading-tight">{hospitalName}</span>
                <span className="text-[10px] text-slate-400 font-semibold">{doctorSpecialty} OPD</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-xl">
              <Clock size={13} className="text-indigo-600" />
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <Link
              to="/profile"
              className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-2xl transition"
            >
              <img
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=120&q=80"
                alt={doctorName}
                className="w-8 h-8 rounded-xl object-cover ring-2 ring-indigo-500/20"
              />
              <span className="text-xs font-black text-slate-800 hidden sm:inline">{doctorName}</span>
            </Link>
          </div>
        </header>

        {/* Dynamic Children Content */}
        <main className="flex-1 p-6 sm:p-8 space-y-6">
          {children}
        </main>
      </div>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

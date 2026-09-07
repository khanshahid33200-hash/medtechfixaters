import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ArrowRight, Sparkles, ChevronDown, Layers, Zap, Stethoscope, Building2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ContactModal from './ContactModal'

interface NavItem {
  to: string
  label: string
  sublinks?: {
    to: string
    label: string
    desc: string
    badge?: string
    icon: typeof Sparkles
  }[]
}

const NAV_LINKS: NavItem[] = [
  { to: '/', label: 'Home' },
  {
    to: '/features',
    label: 'Features',
    sublinks: [
      {
        to: '/features',
        label: 'Product Features',
        desc: 'Explore live OPD, doctor & queue modules',
        icon: Layers,
      },
      {
        to: '/features/upcoming',
        label: 'Upcoming Features',
        desc: 'Voice AI scribe, IoT telemetry & WhatsApp sync',
        badge: 'Roadmap',
        icon: Zap,
      },
    ],
  },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact Us' },
]

export default function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false)
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false)
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false)
  const [demoModalOpen, setDemoModalOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const loginTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const isFeaturesActive =
    location.pathname.startsWith('/features') ||
    location.pathname.startsWith('/upcoming-features')

  const handleMouseEnter = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current)
    setFeaturesDropdownOpen(true)
  }

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setFeaturesDropdownOpen(false)
    }, 150)
  }

  const handleLoginMouseEnter = () => {
    if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current)
    setLoginDropdownOpen(true)
  }

  const handleLoginMouseLeave = () => {
    loginTimeoutRef.current = setTimeout(() => {
      setLoginDropdownOpen(false)
    }, 150)
  }

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown on route change
  useEffect(() => {
    setFeaturesDropdownOpen(false)
    setLoginDropdownOpen(false)
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <>
      {/* ─── FLOATING GLASSY NAVBAR WITH SLIGHT ORANGE TOUCH ─── */}
      <header
        className="fixed top-3 sm:top-4 inset-x-0 z-50 max-w-6xl mx-auto px-3.5 sm:px-6 transition-all duration-300"
      >
        <div
          className={`h-15 sm:h-16 rounded-full px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-6 transition-all duration-300 relative overflow-hidden ${
            scrolled
              ? 'backdrop-blur-2xl bg-gradient-to-r from-white/92 via-white/88 to-orange-50/50 border border-white/95 shadow-[0_15px_40px_rgba(255,107,44,0.08),0_4px_20px_rgba(15,23,42,0.05)]'
              : 'backdrop-blur-xl bg-gradient-to-r from-white/85 via-white/80 to-orange-50/40 border border-white/85 shadow-[0_10px_30px_rgba(255,107,44,0.05),0_2px_12px_rgba(15,23,42,0.03)]'
          }`}
        >
          {/* Subtle top warm highlight line */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-orange-400/40 to-blue-400/30" />

          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative">
              <img
                src="/assets/brand-icon.png"
                alt="MedTech Fixaters Logo"
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_2px_8px_rgba(255,107,44,0.25)]"
              />
              <div className="absolute -inset-1 rounded-full bg-orange-400/20 blur-xs -z-10 group-hover:bg-orange-400/35 transition-colors" />
            </div>
            <span className="font-bold text-xs sm:text-base tracking-tight text-[#17191F]">
              MedTech Fixaters
            </span>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            {NAV_LINKS.map(link => {
              if (link.sublinks) {
                return (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      onClick={() => setFeaturesDropdownOpen(!featuresDropdownOpen)}
                      className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                        isFeaturesActive
                          ? 'text-blue-600 bg-blue-50/90 font-bold shadow-2xs border border-blue-100/70'
                          : 'hover:text-orange-600 hover:bg-orange-50/60'
                      }`}
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        size={13}
                        className={`transition-transform duration-200 ${
                          featuresDropdownOpen ? 'rotate-180 text-orange-600' : ''
                        }`}
                      />
                    </button>

                    {/* Features Dropdown Menu */}
                    <AnimatePresence>
                      {featuresDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.96 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                          className="absolute top-full left-0 mt-2 w-72 p-2 rounded-2xl bg-gradient-to-b from-white/95 to-orange-50/40 backdrop-blur-2xl border border-white/90 shadow-[0_20px_50px_rgba(255,107,44,0.1),0_10px_30px_rgba(15,23,42,0.08)] z-50 space-y-1 text-left"
                        >
                          {link.sublinks.map(sub => {
                            const IconComponent = sub.icon
                            const isSubActive = location.pathname === sub.to
                            return (
                              <Link
                                key={sub.to}
                                to={sub.to}
                                className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                                  isSubActive
                                    ? 'bg-blue-50/90 text-blue-700'
                                    : 'hover:bg-orange-50/70 text-slate-700 hover:text-slate-900'
                                }`}
                              >
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                    sub.badge
                                      ? 'bg-orange-50 text-[#FF6B2C]'
                                      : 'bg-blue-50 text-blue-600'
                                  }`}
                                >
                                  <IconComponent size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs">{sub.label}</span>
                                    {sub.badge && (
                                      <span className="px-1.5 py-0.2 rounded-md bg-orange-100/90 text-[#FF6B2C] text-[9px] font-extrabold uppercase tracking-wider">
                                        {sub.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5 truncate">
                                    {sub.desc}
                                  </p>
                                </div>
                              </Link>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              }

              const active = isActive(link.to)
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    active
                      ? 'text-blue-600 bg-blue-50/90 font-bold shadow-2xs border border-blue-100/70'
                      : 'hover:text-orange-600 hover:bg-orange-50/60'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <div
              className="relative"
              onMouseEnter={handleLoginMouseEnter}
              onMouseLeave={handleLoginMouseLeave}
            >
              <Link
                to="/login"
                onClick={() => setLoginDropdownOpen(false)}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:text-orange-600 hover:bg-orange-50/50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Login</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${
                    loginDropdownOpen ? 'rotate-180 text-orange-600' : ''
                  }`}
                />
              </Link>

              {/* Login Options Dropdown */}
              <AnimatePresence>
                {loginDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute top-full right-0 mt-2 w-64 p-2 rounded-2xl bg-gradient-to-b from-white/95 to-orange-50/40 backdrop-blur-2xl border border-white/90 shadow-[0_20px_50px_rgba(255,107,44,0.1),0_10px_30px_rgba(15,23,42,0.08)] z-50 space-y-1 text-left"
                  >
                    <Link
                      to="/login/doctordashboard"
                      onClick={() => setLoginDropdownOpen(false)}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-emerald-50/80 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Stethoscope size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700">Doctor Login</div>
                        <p className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">
                          OPD consult queue & Rx console
                        </p>
                      </div>
                    </Link>

                    <Link
                      to="/login/hospitaladministration"
                      onClick={() => setLoginDropdownOpen(false)}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-blue-50/80 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700">Hospital Admin</div>
                        <p className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">
                          Doctor seats, live lobby & settings
                        </p>
                      </div>
                    </Link>

                    <div className="pt-1 border-t border-slate-100 mt-1">
                      <Link
                        to="/login"
                        onClick={() => setLoginDropdownOpen(false)}
                        className="block px-2.5 py-1.5 rounded-lg text-center text-[11px] font-bold text-slate-600 hover:text-orange-600 hover:bg-orange-50/60 transition"
                      >
                        Unified Sign In Screen →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/book-demo">
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="px-4.5 py-2 rounded-full bg-gradient-to-r from-[#FF6B2C] via-[#FF7D3B] to-[#FF5500] hover:from-[#E65100] hover:to-[#FF6B2C] text-white text-xs font-bold shadow-md shadow-orange-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Book a Demo</span>
                <ArrowRight size={13} />
              </motion.button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-xl text-slate-700 hover:text-black hover:bg-orange-50 transition cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="md:hidden mt-2 p-5 rounded-3xl bg-gradient-to-b from-white/95 to-orange-50/50 backdrop-blur-2xl border border-white/90 shadow-[0_20px_50px_rgba(255,107,44,0.12),0_10px_30px_rgba(15,23,42,0.08)] space-y-4 text-left"
            >
              <nav className="space-y-1 text-xs font-semibold text-slate-700">
                {NAV_LINKS.map(link => {
                  if (link.sublinks) {
                    return (
                      <div key={link.label} className="space-y-1">
                        <button
                          onClick={() => setMobileFeaturesOpen(!mobileFeaturesOpen)}
                          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl transition ${
                            isFeaturesActive
                              ? 'bg-blue-50 text-blue-600 font-bold'
                              : 'hover:bg-orange-50/70 hover:text-orange-600'
                          }`}
                        >
                          <span>{link.label}</span>
                          <ChevronDown
                            size={14}
                            className={`transition-transform ${
                              mobileFeaturesOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {mobileFeaturesOpen && (
                          <div className="pl-4 space-y-1 border-l-2 border-orange-200 ml-3 py-1">
                            {link.sublinks.map(sub => (
                              <Link
                                key={sub.to}
                                to={sub.to}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>{sub.label}</span>
                                  {sub.badge && (
                                    <span className="px-1.5 py-0.2 rounded bg-orange-100 text-[#FF6B2C] text-[8px] font-bold">
                                      {sub.badge}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3.5 py-2 rounded-xl hover:bg-orange-50/70 hover:text-orange-600 transition"
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </nav>
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login/doctordashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 text-center rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition flex items-center justify-center gap-1.5 border border-emerald-200/60"
                  >
                    <Stethoscope size={14} />
                    <span>Doctor Login</span>
                  </Link>
                  <Link
                    to="/login/hospitaladministration"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 text-center rounded-xl bg-blue-50 text-blue-800 font-bold text-xs hover:bg-blue-100 transition flex items-center justify-center gap-1.5 border border-blue-200/60"
                  >
                    <Building2 size={14} />
                    <span>Hospital Login</span>
                  </Link>
                </div>
                <Link
                  to="/book-demo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center rounded-xl bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] text-white font-bold text-xs shadow-md shadow-orange-500/25 block"
                >
                  Book a Demo
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <ContactModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </>
  )
}

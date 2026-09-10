import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react'
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Stethoscope,
  Building2,
  AlertCircle,
  PhoneCall,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSEO } from '../hooks/useSEO'

interface LoginProps {
  // When set, this is a dedicated single-role portal (e.g.
  // /login/doctordashboard, /login/hospitaladministration) — the role
  // toggle is hidden and every login attempt is checked against exactly
  // this role, rejecting a correctly-authenticated-but-wrong-role account
  // instead of silently landing it on its own real dashboard.
  lockedRole?: 'doctor' | 'hospital_admin'
}

export default function Login({ lockedRole }: LoginProps) {
  useSEO({
    title: 'Sign In — MedTech Fixaters Clinical OS',
    description: 'Secure Doctor and Hospital Administrator sign-in portal for MedTech Fixaters Clinical OS.',
  })

  const navigate = useNavigate()
  const location = useLocation()
  const { loginWithSupabase, sendSupabaseOtp, verifySupabaseOtp } = useAuth()

  const [selectedRole, setSelectedRole] = useState<'doctor' | 'hospital_admin'>(lockedRole || 'doctor')
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  // OTP State
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [resolvedOtpEmail, setResolvedOtpEmail] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [otpTimer, setOtpTimer] = useState(0)

  React.useEffect(() => {
    let interval: any = null
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [otpTimer])

  const deniedState = (location.state as { message?: string } | null)?.message
  const [error, setError] = useState(deniedState || '')
  const [loading, setLoading] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  // Mouse reactive glow coordinates
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 })

  const glowX = useTransform(springX, [-500, 500], [-80, 80])
  const glowY = useTransform(springY, [-500, 500], [-50, 50])

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    mouseX.set(event.clientX - rect.left - rect.width / 2)
    mouseY.set(event.clientY - rect.top - rect.height / 2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice(null)
    setLoading(true)

    const cleanEmail = email.trim().toLowerCase()
    const cleanPass = password.trim()

    if (!cleanEmail || !cleanPass) {
      setLoading(false)
      setError('Please enter your registered Doctor ID / Email and password.')
      return
    }

    try {
      const res = await loginWithSupabase(cleanEmail, cleanPass, selectedRole)
      const actualRole = res?.role || selectedRole
      if (actualRole === 'hospital_admin') {
        navigate('/hospitaldashboard/dashboard')
      } else if (actualRole === 'super_admin') {
        navigate('/mrshahidbabu')
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your email/Doctor ID and password.')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError('')
    setNotice(null)
    setLoading(true)

    const cleanId = email.trim()
    if (!cleanId) {
      setLoading(false)
      setError('Please enter your registered Doctor ID or Email first.')
      return
    }

    try {
      const res = await sendSupabaseOtp(cleanId)
      setResolvedOtpEmail(res.email)
      setOtpSent(true)
      setOtpTimer(60)
      setNotice(`✓ Mail OTP code sent to your registered email (${res.email})!`)
    } catch (err: any) {
      setError(err.message || 'Could not send Mail OTP. Please verify your Doctor ID or Email.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice(null)
    setLoading(true)

    if (!otpCode.trim() || otpCode.trim().length < 6 || otpCode.trim().length > 8) {
      setLoading(false)
      setError('Please enter the valid OTP code (6 to 8 digits) sent to your email.')
      return
    }

    try {
      const res = await verifySupabaseOtp(resolvedOtpEmail, otpCode, selectedRole)
      const actualRole = res?.role || selectedRole
      if (actualRole === 'hospital_admin') {
        navigate('/hospitaldashboard/dashboard')
      } else if (actualRole === 'super_admin') {
        navigate('/mrshahidbabu')
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed. Please check the OTP code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      onMouseMove={handleMouseMove}
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#F7F8FC] px-4 py-6 font-sans text-slate-900 selection:bg-[#007AFF]/20 select-none"
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(0,122,255,0.12) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Animated blue liquid */}
      <motion.div
        style={{ x: glowX, y: glowY }}
        className="absolute -left-40 -top-32 h-[520px] w-[520px] rounded-full bg-blue-300/30 blur-[120px] pointer-events-none"
      />

      <motion.div
        className="absolute -left-20 top-10 h-[380px] w-[380px] rounded-full bg-[#5AC8FA]/20 blur-[100px] pointer-events-none"
        animate={{
          x: [0, 100, 30, 0],
          y: [0, 80, 120, 0],
          scale: [1, 1.12, 0.95, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Animated orange liquid */}
      <motion.div
        className="absolute -bottom-48 -right-40 h-[620px] w-[620px] rounded-full bg-orange-300/30 blur-[140px] pointer-events-none"
        animate={{
          x: [0, -100, 30, 0],
          y: [0, -70, 40, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Floating glass particles */}
      {[...Array(12)].map((_, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full border border-white/70 bg-white/30 backdrop-blur-md pointer-events-none"
          style={{
            width: `${6 + (index % 4) * 5}px`,
            height: `${6 + (index % 4) * 5}px`,
            left: `${(index * 17) % 100}%`,
            top: `${(index * 23) % 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.7, 0.2],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 5 + index,
            delay: index * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Main glass container */}
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.9,
          y: 60,
          filter: 'blur(24px)',
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          filter: 'blur(0px)',
        }}
        transition={{
          type: 'spring',
          stiffness: 130,
          damping: 20,
          mass: 0.8,
        }}
        className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-[42px] border border-white/80 bg-white/45 shadow-[0_40px_120px_rgba(31,38,135,0.16)] backdrop-blur-[45px] lg:grid-cols-[1fr_1fr]"
      >
        {/* Moving glass reflection */}
        <motion.div
          animate={{
            x: ['-120%', '180%'],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            repeatDelay: 4,
            ease: 'easeInOut',
          }}
          className="pointer-events-none absolute inset-y-0 z-20 w-[30%] -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent blur-2xl"
        />

        {/* LEFT SIDE */}
        <section className="relative hidden min-h-[680px] overflow-hidden border-r border-white/60 p-10 lg:flex lg:flex-col lg:justify-between text-left">
          {/* Top brand */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.3,
              type: 'spring',
              stiffness: 180,
              damping: 20,
            }}
            className="relative z-10 flex items-center gap-4"
          >
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                animate={{
                  rotate: [0, 4, -4, 0],
                  y: [0, -4, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/80 bg-white/60 shadow-[0_15px_40px_rgba(0,122,255,0.12)] backdrop-blur-xl group-hover:scale-105 transition-transform"
              >
                <img src="/assets/brand-icon.png" alt="MedTech Fixaters Logo" className="h-9 w-9 object-contain" />
              </motion.div>

              <div>
                <p className="text-lg font-bold tracking-tight text-[#1D1D1F]">
                  MedTech Fixaters
                </p>
                <p className="text-xs text-[#6E6E73] font-medium">
                  Clinical Operating System
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Center content */}
          <div className="relative z-10">
            <motion.div
              initial={{
                opacity: 0,
                y: 30,
                filter: 'blur(12px)',
              }}
              animate={{
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
              }}
              transition={{
                delay: 0.45,
                duration: 0.8,
              }}
            >
              <motion.div
                animate={{
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/60 px-4 py-2 text-xs font-semibold tracking-[0.15em] text-[#007AFF] backdrop-blur-xl"
              >
                <span className="h-2 w-2 rounded-full bg-[#007AFF]" />
                CLINICAL WORKSPACE
              </motion.div>

              <h1 className="max-w-md text-5xl font-semibold leading-[1.06] tracking-[-0.04em] text-[#1D1D1F]">
                Healthcare
                <br />
                <span className="relative">
                  connected.
                  <motion.span
                    className="absolute -bottom-2 left-0 h-[5px] rounded-full bg-gradient-to-r from-[#007AFF] to-[#5AC8FA]"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{
                      delay: 1.1,
                      duration: 1,
                      ease: 'easeOut',
                    }}
                  />
                </span>
              </h1>

              <p className="mt-8 max-w-sm text-base leading-7 text-[#6E6E73]">
                Access your assigned workspace to manage consultations, live tokens, digital prescriptions, and clinical operations.
              </p>
            </motion.div>
          </div>

          {/* Floating security card */}
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: [0, -8, 0],
            }}
            transition={{
              opacity: {
                delay: 0.8,
                duration: 0.6,
              },
              y: {
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
            className="relative z-10 rounded-[28px] border border-white/80 bg-white/50 p-5 shadow-[0_20px_60px_rgba(0,122,255,0.08)] backdrop-blur-[30px]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-white shadow-sm shrink-0">
                <ShieldCheck className="h-6 w-6 text-[#007AFF]" />
              </div>

              <div>
                <p className="font-semibold text-[#1D1D1F]">
                  Secure workspace access
                </p>

                <p className="mt-1 text-xs text-[#6E6E73]">
                  Protected by PostgreSQL Row-Level Security & HIPAA standards.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* RIGHT SIDE */}
        <section className="relative flex min-h-[680px] items-center justify-center p-6 sm:p-10 text-left">
          {/* Small mobile brand */}
          <div className="absolute left-6 top-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/60 backdrop-blur-xl">
              <img src="/assets/brand-icon.png" alt="MedTech Fixaters Logo" className="h-7 w-7 object-contain" />
            </div>

            <div>
              <p className="font-semibold text-sm text-[#1D1D1F]">MedTech Fixaters</p>
              <p className="text-xs text-[#6E6E73]">Clinical OS</p>
            </div>
          </div>

          <div className="w-full max-w-md">
            {/* Heading & Role Switcher */}
            <motion.div
              initial={{
                opacity: 0,
                x: 30,
                filter: 'blur(10px)',
              }}
              animate={{
                opacity: 1,
                x: 0,
                filter: 'blur(0px)',
              }}
              transition={{
                delay: 0.35,
                type: 'spring',
                stiffness: 180,
                damping: 20,
              }}
            >
              <div className="flex items-center justify-between mb-8">
                <Link
                  to="/"
                  className="group flex items-center gap-2 text-sm text-[#6E6E73] transition-colors hover:text-[#007AFF]"
                >
                  <motion.span
                    whileHover={{ x: -4 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </motion.span>
                  <span>Back to Home</span>
                </Link>

                {/* Role indicator or switcher */}
                {lockedRole ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#007AFF] rounded-xl border border-blue-200/80 text-xs font-bold">
                    {lockedRole === 'doctor' ? <Stethoscope size={14} /> : <Building2 size={14} />}
                    <span>{lockedRole === 'doctor' ? 'Doctor Portal' : 'Hospital Admin'}</span>
                  </div>
                ) : (
                  <div className="p-1 bg-white/60 backdrop-blur-md rounded-2xl border border-white/80 inline-flex items-center text-xs font-bold shadow-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('doctor')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                        selectedRole === 'doctor'
                          ? 'bg-white text-[#007AFF] shadow-sm font-extrabold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Stethoscope size={13} />
                      <span>Doctor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('hospital_admin')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                        selectedRole === 'hospital_admin'
                          ? 'bg-white text-[#007AFF] shadow-sm font-extrabold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Building2 size={13} />
                      <span>Hospital Admin</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-4 inline-flex rounded-full border border-orange-200/70 bg-orange-50/60 px-4 py-1.5 text-xs font-semibold tracking-[0.12em] text-[#FF9500] backdrop-blur-xl">
                WELCOME BACK
              </div>

              <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.04em] text-[#1D1D1F]">
                {selectedRole === 'doctor' ? 'Doctor Sign In.' : 'Hospital Admin Sign In.'}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6E6E73]">
                {selectedRole === 'doctor'
                  ? 'Enter your Doctor ID or practitioner email to open today’s OPD console.'
                  : 'Enter your hospital admin credentials to access workspace settings.'}
              </p>
            </motion.div>

            {/* Auth Method Switcher (Password vs Mail OTP) */}
            <div className="mt-6 p-1 bg-white/60 backdrop-blur-md rounded-2xl border border-white/80 flex items-center text-xs font-bold shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('password')
                  setError('')
                  setNotice(null)
                }}
                className={`flex-1 py-2.5 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMethod === 'password'
                    ? 'bg-white text-[#007AFF] shadow-sm font-extrabold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LockKeyhole size={14} />
                <span>Password Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('otp')
                  setError('')
                  setNotice(null)
                }}
                className={`flex-1 py-2.5 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMethod === 'otp'
                    ? 'bg-white text-[#007AFF] shadow-sm font-extrabold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Sparkles size={14} className="text-amber-500" />
                <span>Email Mail OTP</span>
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-3 shadow-xs"
              >
                <AlertCircle size={18} className="shrink-0 text-rose-500" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Notice Banner */}
            {notice && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3 shadow-xs"
              >
                <Sparkles size={18} className="shrink-0 text-emerald-600" />
                <span>{notice}</span>
              </motion.div>
            )}

            {/* Form */}
            {authMethod === 'otp' ? (
              <form onSubmit={otpSent ? handleVerifyOtpSubmit : handleRequestOtp} className="mt-6 space-y-5">
                {/* Email / Doctor ID Input */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[#1D1D1F]">
                      {selectedRole === 'doctor' ? 'Doctor ID or Email' : 'Hospital Admin Email'}
                    </label>
                    <span className="text-[11px] text-[#8E8E93]">
                      Registered Mail
                    </span>
                  </div>

                  <div className="group flex items-center rounded-[20px] border border-white/90 bg-white/60 px-5 shadow-[0_10px_35px_rgba(31,38,135,0.06)] backdrop-blur-[25px] transition-all duration-300 focus-within:-translate-y-1 focus-within:border-blue-300 focus-within:bg-white/80">
                    <Mail className="h-5 w-5 text-[#8E8E93] transition-colors group-focus-within:text-[#007AFF]" />
                    <input
                      type="text"
                      required
                      disabled={otpSent}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={selectedRole === 'doctor' ? 'Doctor ID (e.g. H1-D-0001) or Email' : 'admin@hospital.com'}
                      className="h-16 w-full bg-transparent px-4 text-[#1D1D1F] outline-none placeholder:text-[#AEAEB2] text-sm disabled:opacity-60"
                    />
                    {otpSent && (
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false)
                          setOtpCode('')
                          setNotice(null)
                        }}
                        className="text-xs font-bold text-[#007AFF] hover:underline shrink-0"
                      >
                        Change
                      </button>
                    )}
                  </div>
                </motion.div>

                {/* OTP Field (shown after OTP sent - supports 6 to 8 digits) */}
                {otpSent && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-[#1D1D1F]">
                        Enter Mail OTP Code (6-8 Digits)
                      </label>
                      <span className="text-[11px] text-[#8E8E93]">Check email inbox</span>
                    </div>

                    <div className="group flex items-center rounded-[20px] border border-blue-300/80 bg-white/80 px-5 shadow-[0_15px_40px_rgba(0,122,255,0.1)] backdrop-blur-[25px]">
                      <Sparkles className="h-5 w-5 text-[#007AFF]" />
                      <input
                        type="text"
                        required
                        maxLength={8}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="12345678"
                        className="h-16 w-full bg-transparent px-4 text-[#1D1D1F] outline-none placeholder:text-[#AEAEB2] text-lg font-mono tracking-[0.25em] font-extrabold"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[#8E8E93]">Didn't receive code?</span>
                      {otpTimer > 0 ? (
                        <span className="font-mono text-[#8E8E93]">Resend in {otpTimer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRequestOtp()}
                          className="font-bold text-[#007AFF] hover:underline cursor-pointer"
                        >
                          Resend Mail OTP
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* OTP Submit button */}
                <motion.button
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  className="relative mt-4 flex h-16 w-full items-center justify-center overflow-hidden rounded-[20px] bg-gradient-to-r from-[#007AFF] via-[#2588FF] to-[#5AC8FA] font-semibold text-white shadow-[0_20px_45px_rgba(0,122,255,0.28)] cursor-pointer disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center gap-2 font-bold text-sm">
                    {loading ? (
                      <span>{otpSent ? 'Verifying OTP…' : 'Sending Mail OTP…'}</span>
                    ) : otpSent ? (
                      <>
                        <span>Verify & Unlock Console</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    ) : (
                      <>
                        <span>Send Mail OTP</span>
                        <Sparkles className="h-5 w-5" />
                      </>
                    )}
                  </span>
                </motion.button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                {/* Identifier */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[#1D1D1F]">
                      {selectedRole === 'doctor' ? 'Doctor ID or Email' : 'Hospital Admin Email'}
                    </label>
                    <span className="text-[11px] text-[#8E8E93]">
                      {selectedRole === 'doctor' ? 'e.g. H1-D-0001' : 'Supabase Auth'}
                    </span>
                  </div>

                  <div className="group flex items-center rounded-[20px] border border-white/90 bg-white/60 px-5 shadow-[0_10px_35px_rgba(31,38,135,0.06)] backdrop-blur-[25px] transition-all duration-300 focus-within:-translate-y-1 focus-within:border-blue-300 focus-within:bg-white/80">
                    <Mail className="h-5 w-5 text-[#8E8E93] transition-colors group-focus-within:text-[#007AFF]" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={selectedRole === 'doctor' ? 'Doctor ID (e.g. H1-D-0001) or Email' : 'admin@hospital.com'}
                      className="h-16 w-full bg-transparent px-4 text-[#1D1D1F] outline-none placeholder:text-[#AEAEB2] text-sm"
                    />
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-[#1D1D1F]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-sm font-medium text-[#007AFF] transition-opacity hover:opacity-70"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="group flex items-center rounded-[20px] border border-white/90 bg-white/60 px-5 shadow-[0_10px_35px_rgba(31,38,135,0.06)] backdrop-blur-[25px] transition-all duration-300 focus-within:-translate-y-1 focus-within:border-blue-300 focus-within:bg-white/80">
                    <LockKeyhole className="h-5 w-5 text-[#8E8E93] transition-colors group-focus-within:text-[#007AFF]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-16 w-full bg-transparent px-4 text-[#1D1D1F] outline-none placeholder:text-[#AEAEB2] text-sm font-mono"
                    />
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setShowPassword(!showPassword)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-[#8E8E93] transition-colors hover:bg-black/5 hover:text-[#007AFF]"
                    >
                      <AnimatePresence mode="wait">
                        {showPassword ? (
                          <motion.div
                            key="hidden"
                            initial={{ opacity: 0, scale: 0.7, rotate: -30 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.7, rotate: 30 }}
                          >
                            <EyeOff className="h-5 w-5" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="visible"
                            initial={{ opacity: 0, scale: 0.7, rotate: 30 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.7, rotate: -30 }}
                          >
                            <Eye className="h-5 w-5" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </motion.div>

                {/* Remember */}
                <motion.label
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex cursor-pointer items-center gap-3 pt-1 select-none"
                >
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 accent-[#007AFF]"
                  />
                  <span className="text-sm text-[#6E6E73]">
                    Keep me signed in on this workstation
                  </span>
                </motion.label>

                {/* Login button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative mt-3 flex h-16 w-full items-center justify-center overflow-hidden rounded-[20px] bg-gradient-to-r from-[#007AFF] via-[#2588FF] to-[#5AC8FA] font-semibold text-white shadow-[0_20px_45px_rgba(0,122,255,0.28)] cursor-pointer disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center gap-2 font-bold text-sm">
                    {loading ? (
                      <span>Signing in to workspace…</span>
                    ) : (
                      <>
                        <span>Sign In to Workspace</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </span>
                </motion.button>
              </form>
            )}

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
              className="mt-9 flex items-center justify-center gap-2 text-center"
            >
              <ShieldCheck className="h-4 w-4 text-[#007AFF]" />
              <p className="text-xs text-[#8E8E93]">
                Your workspace access depends on your assigned account role.
              </p>
            </motion.div>
          </div>
        </section>
      </motion.div>

      {/* ─── MODAL: FORGOT PASSWORD RECOVERY ─── */}
      <AnimatePresence>
        {showForgotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white/90 backdrop-blur-2xl border border-white/90 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#007AFF] flex items-center justify-center">
                    <PhoneCall size={18} />
                  </div>
                  <h3 className="font-bold text-base text-[#1D1D1F]">Credential Recovery</h3>
                </div>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p>
                  Clinical practitioner accounts and hospital admin credentials are cryptographically secured by Supabase Auth and provisioned by your facility or platform super administrator.
                </p>
                <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1 text-[11px] text-blue-900 font-medium">
                  <strong className="text-[#007AFF] block font-bold">How to reset your password:</strong>
                  <p>1. Contact your Hospital Administrator to trigger a password reset.</p>
                  <p>2. For Master Hospital Admin access, request a key renewal from Super Admin at <code>/mrshahidbabu</code>.</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="px-5 py-2.5 bg-[#007AFF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  Understood, Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

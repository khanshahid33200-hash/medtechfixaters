import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Stethoscope, Mail, Lock, User, Phone, ArrowRight,
  Sparkles, CheckCircle2, ShieldCheck, AlertCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSEO } from '../hooks/useSEO'

export default function DoctorSignupPage() {
  useSEO({
    title: 'Doctor Self-Signup — MedTechFixaters',
    description: 'Create your individual doctor clinic account on MedTechFixaters with Google Auth or Email.',
  })

  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 1. Google OAuth Signup / Login
  const handleGoogleSignup = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      const redirectUrl = `${window.location.origin}/doctor/onboarding`
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (oauthErr) throw oauthErr
    } catch (err: any) {
      console.error('Google signup error:', err)
      setError(err.message || 'Failed to initialize Google authentication.')
      setGoogleLoading(false)
    }
  }

  // 2. Email & Password Signup
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const cleanEmail = email.trim().toLowerCase()
      const cleanName = fullName.trim()

      // Sign up user with Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password.trim(),
        options: {
          data: {
            full_name: cleanName,
            role: 'doctor',
            client_type: 'individual_doctor',
            phone: phone.trim() || undefined,
          },
        },
      })

      if (authErr) throw authErr

      const userId = authData.user?.id
      if (userId) {
        // Initialize doctor profile & clinic shell
        try {
          await supabase.rpc('doctor_self_signup', {
            p_email: cleanEmail,
            p_full_name: cleanName,
            p_auth_user_id: userId,
          })
        } catch (rpcErr) {
          console.warn('RPC doctor_self_signup note:', rpcErr)
        }
      }

      // Route directly to onboarding wizard
      navigate('/doctor/onboarding')
    } catch (err: any) {
      console.error('Email signup error:', err)
      setError(err.message || 'Failed to create doctor account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-cyan-600/20 via-indigo-600/20 to-blue-500/10 blur-[130px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="flex justify-center mb-4">
          <Link to="/" className="w-14 h-14 rounded-2xl bg-white border border-slate-700/80 p-2 shadow-xl shadow-cyan-500/10 flex items-center justify-center hover:scale-105 transition-transform">
            <img
              src="/assets/brand-icon.png"
              alt="MedTechFixaters Logo"
              className="w-full h-full object-contain"
            />
          </Link>
        </div>

        <h2 className="text-center text-3xl font-black tracking-tight text-white">
          Individual Doctor Registration
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Smart OPD Queue, AI Booking & Patient Automation for your single-doctor clinic.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-800"
        >
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* GOOGLE OAUTH BUTTON */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-bold text-sm bg-white text-slate-900 hover:bg-slate-100 transition-all shadow-md active:scale-[0.98] disabled:opacity-60"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-3 text-slate-400 font-semibold">Or sign up with email</span>
            </div>
          </div>

          {/* EMAIL SIGNUP FORM */}
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Full Name (Dr. ...)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Dr. Rajesh Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Professional Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="dr.sharma@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Phone size={16} />
                </div>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Doctor Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/doctor/login" className="font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4">
              Login to Doctor Dashboard
            </Link>
          </div>
        </motion.div>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center text-[11px] text-slate-400 font-medium">
          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col items-center gap-1">
            <Sparkles size={16} className="text-cyan-400" />
            <span>AI Patient Booking</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col items-center gap-1">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Dedicated Doctor QR</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col items-center gap-1">
            <ShieldCheck size={16} className="text-indigo-400" />
            <span>Zero Hospital Admin</span>
          </div>
        </div>
      </div>
    </div>
  )
}

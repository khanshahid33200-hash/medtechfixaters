import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MessageCircle,
  ShieldCheck,
  Stethoscope,
  Users,
  XCircle,
  Sparkles,
  ChevronLeft,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useSEO } from "../hooks/useSEO";

type LoginType = "doctor" | "hospital";
type AuthTab = "login" | "signup";

interface LoginProps {
  lockedRole?: "doctor" | "hospital_admin";
}

export default function Login({ lockedRole }: LoginProps) {
  useSEO({
    title: "Sign In — MedTechFixaters",
    description:
      "Secure Doctor and Hospital Administrator authentication portal for MedTechFixaters.",
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithSupabase } = useAuth();

  const [tab, setTab] = useState<AuthTab>("login");
  const [loginType, setLoginType] = useState<LoginType>(
    lockedRole === "hospital_admin" ? "hospital" : "doctor"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const deniedState = (location.state as { message?: string } | null)?.message;
  const [message, setMessage] = useState("");
  const [error, setError] = useState(deniedState || "");

  const [forgotMode, setForgotMode] = useState(false);

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  const handleEmailLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    clearMessages();

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setError("Please enter your registered Email and Password.");
      return;
    }

    setLoading(true);

    try {
      const expectedRole = loginType === "hospital" ? "hospital_admin" : "doctor";
      const res = await loginWithSupabase(cleanEmail, cleanPass, expectedRole);

      const actualRole = res?.role || expectedRole;
      const clientType = res?.client_type || localStorage.getItem("client_type");
      const onboardingStatus =
        res?.onboarding_status || localStorage.getItem("onboarding_status");

      if (actualRole === "hospital_admin") {
        navigate("/hospitaldashboard/dashboard");
      } else if (actualRole === "super_admin") {
        navigate("/mrshahidbabu");
      } else if (
        actualRole === "doctor" &&
        clientType === "individual_doctor" &&
        (onboardingStatus === "PROFILE_INCOMPLETE" ||
          onboardingStatus === "PAYMENT_PENDING")
      ) {
        navigate("/doctor/onboarding");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      console.error("Login authentication error:", err);
      setError(err.message || "Unable to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    clearMessages();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/doctor/onboarding`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (oauthError) throw oauthError;
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      setError(err.message || "Unable to continue with Google. Please try again.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    clearMessages();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your email address first.");
      return;
    }

    setLoading(true);

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: `${window.location.origin}/doctor/onboarding`,
        }
      );

      if (resetErr) throw resetErr;

      setMessage("Password reset link sent. Please check your email inbox.");
    } catch (err: any) {
      setError(err.message || "Unable to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectTab = (nextTab: AuthTab) => {
    clearMessages();
    setTab(nextTab);
    setForgotMode(false);
  };

  return (
    <main className="min-h-screen bg-[#F6F8FB] text-[#111827] flex flex-col justify-between">
      <div className="min-h-screen grid lg:grid-cols-[45%_55%]">
        {/* ================= HERO (LEFT) ================= */}
        <section className="relative hidden lg:flex flex-col justify-between p-12 xl:p-16 overflow-hidden border-r border-black/[0.06] bg-gradient-to-br from-[#EEF5FF] via-white to-[#F0F7FF]">
          {/* Ambient Glows */}
          <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-blue-300/25 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-orange-200/25 blur-3xl pointer-events-none" />

          {/* Logo & Brand Header */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1677FF] to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-xl">
                <Stethoscope size={22} className="text-white" />
              </div>

              <div>
                <div className="font-bold text-xl tracking-tight text-gray-900 group-hover:text-[#1677FF] transition-colors">
                  MedTechFixaters
                </div>

                <div className="text-xs text-gray-500">
                  Better Tools. Healthier Practices. Happier People.
                </div>
              </div>
            </Link>
          </div>

          {/* Main Hero Copy & Highlights */}
          <div className="relative z-10 max-w-xl my-auto py-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-xl border border-white shadow-sm text-xs font-semibold text-gray-700 mb-7">
              <ShieldCheck size={16} className="text-[#1677FF]" />
              <span>Connected Healthcare Operating System</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-bold tracking-[-0.04em] leading-[1.08] text-gray-900">
              Smarter Healthcare
              <br />
              Starts <span className="text-[#1677FF]">Here.</span>
            </h1>

            <p className="mt-6 text-base xl:text-lg leading-relaxed text-gray-600 max-w-lg">
              A connected platform for hospitals and individual doctors to manage
              appointments, live queues, patients and healthcare workflows —
              effortlessly.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-3.5">
              <Feature icon={<CalendarDays size={18} />} title="Online Appointments" />
              <Feature icon={<Users size={18} />} title="Live Queue Management" />
              <Feature icon={<Stethoscope size={18} />} title="Doctor Dashboard" />
              <Feature icon={<ShieldCheck size={18} />} title="Secure Healthcare SaaS" />
            </div>
          </div>

          {/* Footer Tagline */}
          <div className="relative z-10 text-xs font-medium text-gray-500 flex items-center justify-between">
            <span>Care. Simplified. For a Healthier Tomorrow.</span>
            <span className="text-gray-400">v2.5 Production</span>
          </div>
        </section>

        {/* ================= AUTH CARD (RIGHT) ================= */}
        <section className="flex flex-col justify-between p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-[580px] mx-auto my-auto">
            {/* Mobile Header Logo */}
            <div className="flex lg:hidden items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#1677FF] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Stethoscope size={20} />
              </div>

              <div>
                <div className="font-bold text-lg text-gray-900">
                  MedTechFixaters
                </div>

                <div className="text-xs text-gray-500">
                  Healthcare Technology
                </div>
              </div>
            </div>

            {/* Auth Glass Card */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              className="bg-white rounded-[32px] border border-black/[0.06] shadow-[0_20px_70px_rgba(0,0,0,0.06)] p-7 sm:p-10"
            >
              {/* Card Header */}
              <div className="mb-7 text-left">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                  Welcome to MedTechFixaters
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  {tab === "login"
                    ? "Login to access your dashboard"
                    : "Create your doctor or clinic account"}
                </p>
              </div>

              {/* Tabs Switcher */}
              <div className="flex p-1.5 bg-gray-100 rounded-2xl mb-7">
                <button
                  type="button"
                  onClick={() => selectTab("login")}
                  className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    tab === "login"
                      ? "bg-white shadow-sm text-[#1677FF]"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => selectTab("signup")}
                  className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    tab === "signup"
                      ? "bg-white shadow-sm text-[#1677FF]"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <AnimatePresence mode="wait">
                {tab === "login" ? (
                  <motion.div
                    key="login-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    {!forgotMode ? (
                      <>
                        {!lockedRole && (
                          <>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 text-left">
                              Login As
                            </p>

                            {/* Role Select Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                              <AccountType
                                selected={loginType === "doctor"}
                                icon={<Stethoscope size={20} />}
                                title="Doctor / Clinic"
                                subtitle="For individual doctors and clinics"
                                onClick={() => {
                                  clearMessages();
                                  setLoginType("doctor");
                                }}
                              />

                              <AccountType
                                selected={loginType === "hospital"}
                                icon={<Building2 size={20} />}
                                title="Hospital"
                                subtitle="For multi-specialty hospitals"
                                onClick={() => {
                                  clearMessages();
                                  setLoginType("hospital");
                                }}
                              />
                            </div>
                          </>
                        )}

                        {loginType === "doctor" ? (
                          <DoctorLoginForm
                            email={email}
                            setEmail={setEmail}
                            password={password}
                            setPassword={setPassword}
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                            loading={loading}
                            onLogin={handleEmailLogin}
                            onGoogle={handleGoogleLogin}
                            onForgot={() => {
                              clearMessages();
                              setForgotMode(true);
                            }}
                          />
                        ) : (
                          <HospitalLoginForm
                            email={email}
                            setEmail={setEmail}
                            password={password}
                            setPassword={setPassword}
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                            loading={loading}
                            onLogin={handleEmailLogin}
                          />
                        )}
                      </>
                    ) : (
                      <ForgotPassword
                        email={email}
                        setEmail={setEmail}
                        loading={loading}
                        message={message}
                        error={error}
                        onSubmit={handleForgotPassword}
                        onBack={() => {
                          clearMessages();
                          setForgotMode(false);
                        }}
                      />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="signup-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <SignupPanel
                      loading={loading}
                      onGoogle={handleGoogleLogin}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status / Error Alerts */}
              {error && (
                <div className="mt-5 flex gap-2.5 items-start rounded-2xl bg-red-50 border border-red-200/80 p-3.5 text-xs font-medium text-red-600 text-left">
                  <XCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {message && !forgotMode && (
                <div className="mt-5 flex gap-2.5 items-start rounded-2xl bg-emerald-50 border border-emerald-200/80 p-3.5 text-xs font-medium text-emerald-700 text-left">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {/* Bottom Quick Card */}
              {tab === "login" && !forgotMode && (
                <div className="mt-7 rounded-2xl bg-blue-50/70 border border-blue-100 p-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#1677FF] shrink-0 shadow-xs">
                      <MessageCircle size={18} />
                    </div>

                    <div className="text-xs">
                      <div className="font-semibold text-gray-900">
                        New to MedTechFixaters?
                      </div>

                      <div className="text-gray-500 mt-1 leading-relaxed">
                        Individual doctors and clinics can create an account
                        instantly using Google. Hospital accounts are created by
                        administration.
                      </div>

                      <button
                        type="button"
                        onClick={() => selectTab("signup")}
                        className="mt-2 text-[#1677FF] font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <span>Create Doctor Account</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Bottom Links */}
            <div className="flex justify-between items-center mt-6 px-2 text-xs text-gray-400">
              <span>© 2026 MedTechFixaters</span>

              <div className="flex gap-4">
                <Link to="/privacy" className="hover:text-gray-600 transition">
                  Privacy
                </Link>
                <Link to="/terms" className="hover:text-gray-600 transition">
                  Terms
                </Link>
                <Link to="/contact" className="hover:text-gray-600 transition">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ============================================================
   SUBCOMPONENTS
============================================================ */

function DoctorLoginForm({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loading,
  onLogin,
  onGoogle,
  onForgot,
}: any) {
  return (
    <form onSubmit={onLogin} className="space-y-4 text-left">
      <Field
        icon={<Mail size={17} />}
        label="Email Address"
        type="email"
        placeholder="doctor@example.com"
        value={email}
        onChange={setEmail}
      />

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-xs font-semibold text-gray-700">
            Password
          </label>

          <button
            type="button"
            onClick={onForgot}
            className="text-xs font-medium text-[#1677FF] hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        <div className="relative">
          <LockKeyhole
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full h-12 rounded-xl border border-gray-200 bg-white pl-11 pr-11 text-sm outline-none transition focus:border-[#1677FF] focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-300"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-xl bg-[#1677FF] hover:bg-blue-600 text-white font-semibold text-sm disabled:opacity-50 transition shadow-lg shadow-blue-500/15"
      >
        {loading ? "Signing in..." : "Login"}
      </button>

      <Divider />

      <button
        type="button"
        disabled={loading}
        onClick={onGoogle}
        className="w-full h-12 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-sm text-gray-700 transition flex items-center justify-center gap-3 disabled:opacity-50 shadow-xs"
      >
        <GoogleIcon />
        <span>Continue with Google</span>
      </button>
    </form>
  );
}

function HospitalLoginForm({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loading,
  onLogin,
}: any) {
  return (
    <form onSubmit={onLogin} className="space-y-4 text-left">
      <Field
        icon={<Mail size={17} />}
        label="Hospital Admin Email"
        type="email"
        placeholder="admin@hospital.com"
        value={email}
        onChange={setEmail}
      />

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Password
        </label>

        <div className="relative">
          <LockKeyhole
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full h-12 rounded-xl border border-gray-200 bg-white pl-11 pr-11 text-sm outline-none transition focus:border-[#1677FF] focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-300"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl p-3">
        <strong className="text-gray-700 font-semibold">Forgot Password?</strong>
        <p className="mt-0.5">Please contact your hospital administration or platform owner to reset your credentials.</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-xl bg-[#1677FF] hover:bg-blue-600 text-white font-semibold text-sm disabled:opacity-50 transition shadow-lg shadow-blue-500/15"
      >
        {loading ? "Signing in..." : "Login"}
      </button>
    </form>
  );
}

function SignupPanel({ loading, onGoogle }: any) {
  return (
    <div className="text-left">
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-indigo-50/30 p-5 mb-6">
        <div className="flex gap-3.5 items-start">
          <div className="w-10 h-10 rounded-xl bg-[#1677FF] text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
            <Stethoscope size={20} />
          </div>

          <div>
            <h3 className="font-semibold text-sm text-gray-900">
              Doctor / Clinic / Individual Doctor
            </h3>

            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Create an account for your clinic or individual medical practice.
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={onGoogle}
        className="w-full h-12 rounded-xl bg-[#1677FF] hover:bg-blue-600 text-white font-semibold text-sm transition flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-blue-500/15"
      >
        <GoogleIcon />
        <span>Continue with Google</span>
        <ArrowRight size={16} />
      </button>

      <p className="text-center text-xs text-gray-400 mt-3.5">
        Google is the only self-signup method.
      </p>

      <div className="my-6 h-px bg-gray-100" />

      <div className="text-center">
        <h4 className="font-semibold text-xs text-gray-900">
          Hospital Account?
        </h4>

        <p className="text-xs text-gray-500 mt-1">
          Hospital accounts are created and provisioned by platform administration.
        </p>

        <Link
          to="/contact"
          className="mt-3 inline-block text-[#1677FF] font-semibold text-xs hover:underline"
        >
          Contact Administration →
        </Link>
      </div>
    </div>
  );
}

function ForgotPassword({
  email,
  setEmail,
  loading,
  message,
  error,
  onSubmit,
  onBack,
}: any) {
  return (
    <form onSubmit={onSubmit} className="text-left">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1677FF] mb-5 hover:underline"
      >
        <ChevronLeft size={15} />
        <span>Back to Login</span>
      </button>

      <h3 className="text-lg font-bold text-gray-900">
        Reset Your Password
      </h3>

      <p className="text-xs text-gray-500 mt-1 mb-5">
        Enter your doctor account email and we will send you a secure password reset link.
      </p>

      <Field
        icon={<Mail size={17} />}
        label="Email Address"
        type="email"
        placeholder="doctor@example.com"
        value={email}
        onChange={setEmail}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 mt-5 rounded-xl bg-[#1677FF] hover:bg-blue-600 text-white font-semibold text-sm disabled:opacity-50 transition shadow-lg shadow-blue-500/15"
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </button>

      {message && (
        <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs flex items-start gap-2">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3.5 rounded-2xl bg-red-50 border border-red-200/80 text-red-600 text-xs flex items-start gap-2">
          <XCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </form>
  );
}

function Field({
  icon,
  label,
  type,
  placeholder,
  value,
  onChange,
}: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
        {label}
      </label>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#1677FF] focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-300"
        />
      </div>
    </div>
  );
}

function AccountType({
  selected,
  icon,
  title,
  subtitle,
  onClick,
}: any) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`text-left p-4 rounded-2xl border transition-all duration-200 ${
        selected
          ? "border-[#1677FF] bg-blue-50/60 shadow-xs ring-1 ring-[#1677FF]/20"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            selected
              ? "bg-[#1677FF] text-white shadow-xs"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
            {title}
          </div>

          <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
            {subtitle}
          </div>
        </div>

        <div
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            selected ? "border-[#1677FF]" : "border-gray-300"
          }`}
        >
          {selected && (
            <div className="w-2 h-2 rounded-full bg-[#1677FF]" />
          )}
        </div>
      </div>
    </motion.button>
  );
}

function Feature({ icon, title }: any) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/70 backdrop-blur-md border border-white shadow-xs">
      <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1677FF] flex items-center justify-center shrink-0">
        {icon}
      </div>

      <span className="text-xs font-semibold text-gray-800">
        {title}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs uppercase font-medium text-gray-400">
        or
      </span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.73-.07-1.43-.2-2.1H12v3.98h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.27Z"
      />
      <path
        fill="#34A853"
        d="M12 21.67c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.67Z"
      />
      <path
        fill="#FBBC05"
        d="M6.54 13.75A5.86 5.86 0 0 1 6.23 12c0-.61.11-1.2.31-1.75V7.72H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.28l3.24-2.53Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.22c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.27 14.63 2.33 12 2.33a9.75 9.75 0 0 0-8.7 5.39l3.24 2.53c.77-2.31 2.92-4.03 5.46-4.03Z"
      />
    </svg>
  );
}

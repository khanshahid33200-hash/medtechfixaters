import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Stethoscope, Building2, Check, X, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react'
import seoContent from '../../content/seoRoutes.json'
import { Reveal } from '../motion'
import { EASE_OUT, SPRING_UI, PRIMARY_BUTTON } from '../../lib/motion'
import { usePricingPlans } from '../../hooks/usePricingPlans'


type Plan = { name: string; tag: string; priceMonthly: number; priceAnnual: number }
const plans = (seoContent.routes.find((r) => r.path === '/pricing')?.pricing || []) as Plan[]
const plan = (name: string) => plans.find((p) => p.name === name)

const AUDIENCES = [
  {
    id: 'clinic',
    label: 'Clinic',
    icon: Stethoscope,
    title: 'Clinics & Individual Practices',
    who: 'For solo doctors, outpatient clinics, and polyclinics',
    challenges: [
      'Front desk overwhelmed balancing walk-in patients with pre-booked appointments',
      'Crowded waiting room and manual paper slips causing patient disputes over turns',
      'Patient records scattered across paper files, slips, and WhatsApp chats',
      'Doctors lose valuable consultation time handwriting notes and Rx slips',
      'High rate of missed follow-up appointments without automated reminders',
      'Cash drawer discrepancies and lack of automated daily revenue reconciliation',
    ],
    helps: [
      'Live OPD queue board automatically syncs QR check-ins, walk-ins, and appointments',
      'Smart mobile token queue updates keep waiting rooms quiet and uncrowded',
      'Instant 1-click prescription builder with favorite drug templates and dosage presets',
      'Searchable cloud EMR gives instant access to patient histories in under 2 seconds',
      'Automated SMS & WhatsApp reminders ensure patients return for scheduled reviews',
      'Real-time collection dashboard tracks cash, UPI, and digital payments with zero leakage',
    ],
    plan: plan('First Month Special Offer'),
  },
  {
    id: 'hospital',
    label: 'Hospital',
    icon: Building2,
    title: 'Hospitals & Healthcare Networks',
    who: 'For multi-specialty hospitals, surgical centers, and multi-branch chains',
    challenges: [
      'Massive daily OPD footfall creating chaotic queues at lobby registration desks',
      'Disconnected software silos where reception, OPD, diagnostics, and billing don’t sync',
      'Complex compliance demands requiring strict HIPAA/NABH data privacy and role isolation',
      'Doctor burnout from slow, cumbersome legacy hospital software requiring excessive clicks',
      'Delayed reporting: management waits days for consolidated collection reports',
      'High administrative staffing overhead required to manage manual paper charts',
    ],
    helps: [
      'Self-service QR kiosks and mobile pre-registration reduce lobby wait times by 70%',
      'Modern unified cloud architecture connects registration, multi-doctor OPD, lab, and billing',
      'Enterprise role-based access control (RBAC) ensuring strict multi-tenant data isolation',
      'Lightning-fast doctor workspace designed with practicing clinicians to minimize screen time',
      'Real-time executive BI dashboards delivering live revenue, footfall, and bed metrics',
      'Multi-department queue boards stream patient tokens directly to lobby TV displays',
    ],
    plan: plan('Hospital Solutions'),
  },
] as const

export default function AudienceTabs() {
  const [active, setActive] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const reduce = useReducedMotion()
  const a = AUDIENCES[active]

  const { getPlan } = usePricingPlans()
  const introPlan = getPlan('doctor_intro_500')
  const monthlyPlan = getPlan('doctor_monthly_5000')
  const hospitalPlan = getPlan('hospital_custom')

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = (active + (e.key === 'ArrowRight' ? 1 : AUDIENCES.length - 1)) % AUDIENCES.length
    setActive(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <section className="py-8 sm:py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center space-y-2.5 sm:space-y-3">
          <h2 className="text-[clamp(1.5rem,5vw,2.75rem)] font-extrabold tracking-tight text-[#171717]">Which one are you?</h2>
          <p className="text-xs sm:text-sm md:text-base text-[#6B6B6B] max-w-[60ch] mx-auto">
            Whether you run an outpatient clinic or an entire hospital network, MedTech Fixaters simplifies everyday operations so you can focus on what matters most: your patients.
          </p>
        </Reveal>

        <div role="tablist" aria-label="Type of healthcare facility" onKeyDown={onKeyDown} className="mt-5 sm:mt-7 mx-auto flex w-full max-w-sm rounded-full bg-white/70 border border-orange-100 p-1 sm:p-1.5 backdrop-blur-xl shadow-xs">
          {AUDIENCES.map((aud, i) => {
            const Icon = aud.icon
            const selected = i === active
            return (
              <button
                key={aud.id}
                ref={(el) => (tabRefs.current[i] = el)}
                role="tab"
                id={`aud-tab-${aud.id}`}
                aria-selected={selected}
                aria-controls={`aud-panel-${aud.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                className={`relative flex-1 min-w-0 rounded-full px-3 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-bold transition ${selected ? 'text-white' : 'text-[#6B6B6B] hover:text-[#171717]'} focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400`}
              >
                {selected && (
                  <motion.span
                    layoutId={reduce ? undefined : 'aud-pill'}
                    className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] shadow-md shadow-orange-500/25"
                    transition={SPRING_UI}
                  />
                )}
                <span className="relative flex items-center justify-center gap-1.5 sm:gap-2">
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{aud.label}</span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-6 sm:mt-8 min-h-[340px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={a.id}
              role="tabpanel"
              id={`aud-panel-${a.id}`}
              aria-labelledby={`aud-tab-${a.id}`}
              initial={reduce ? false : { opacity: 0, y: 14, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={reduce ? undefined : { opacity: 0, y: -10, filter: 'blur(6px)' }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="grid grid-cols-1 lg:grid-cols-7 gap-4 sm:gap-6 rounded-2xl sm:rounded-[28px] border border-orange-100/70 bg-white/80 p-4.5 sm:p-6 md:p-8 shadow-[0_15px_40px_-25px_rgba(255,106,0,0.22)] backdrop-blur-xl"
            >
              <div className="lg:col-span-5 space-y-4 sm:space-y-5">
                <div>
                  <h3 className="text-lg sm:text-2xl font-extrabold tracking-tight text-[#171717]">{a.title}</h3>
                  <p className="mt-1 text-xs sm:text-sm text-[#6B6B6B]">{a.who}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="rounded-xl sm:rounded-2xl bg-[#FAF7F5] border border-black/5 p-3.5 sm:p-4">
                    <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#6B6B6B]">Main challenges</p>
                    <ul className="mt-2.5 space-y-2 sm:space-y-2.5">
                      {a.challenges.map((c) => (
                        <li key={c} className="flex gap-2.5 text-xs sm:text-sm text-[#4A4A4A]">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/5 text-[#6B6B6B]">
                            <X size={11} strokeWidth={3} />
                          </span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl sm:rounded-2xl bg-orange-50/70 border border-orange-100 p-3.5 sm:p-4">
                    <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#C2410C]">How MedTech Fixaters helps</p>
                    <ul className="mt-2.5 space-y-2 sm:space-y-2.5">
                      {a.helps.map((h, j) => (
                        <motion.li
                          key={h}
                          initial={reduce ? false : { opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.15 + j * 0.08 }}
                          className="flex gap-2.5 text-xs sm:text-sm font-medium text-[#171717]"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF6A00] text-white">
                            <Check size={11} strokeWidth={3} />
                          </span>
                          <span>{h}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {a.plan && (
                <div className="lg:col-span-2 flex flex-col justify-between rounded-xl sm:rounded-[24px] bg-[linear-gradient(160deg,#FFF3EA,#FFFFFF)] border border-orange-200/90 shadow-sm p-4 sm:p-6">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] sm:text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">
                        Suggested Plan
                      </span>
                      {a.id === 'clinic' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FF6A00] text-white text-[11px] font-bold shadow-xs">
                          <Sparkles size={11} /> {introPlan?.discountBadge || '90% OFF First Month'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-900 text-white text-[11px] font-bold">
                          <ShieldCheck size={11} /> {hospitalPlan?.badge || 'Enterprise'}
                        </span>
                      )}
                    </div>

                    <h4 className="mt-2 text-base sm:text-lg font-bold text-[#171717]">
                      {a.id === 'clinic' ? (introPlan?.name || 'First Month Special Offer') : (hospitalPlan?.name || 'Hospital Solutions')}
                    </h4>

                    {a.id === 'clinic' ? (
                      <div className="mt-2">
                        <div className="flex items-baseline gap-2">
                          {introPlan?.originalPrice ? (
                            <span className="text-sm sm:text-base font-semibold text-stone-400 line-through">
                              ₹{introPlan.originalPrice.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-sm sm:text-base font-semibold text-stone-400 line-through">₹5,000</span>
                          )}
                          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#171717]">
                            ₹{(introPlan?.price ?? 500).toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-[#6B6B6B]">
                            / {introPlan?.billingFrequency || 'first month'}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-[#6B6B6B]">
                          {introPlan?.secondaryBillingNote ||
                            `Introductory pricing applies to month 1. From month 2: ₹${(monthlyPlan?.price ?? 5000).toLocaleString('en-IN')}/month.`}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171717]">Custom Pricing</span>
                        </div>
                        <p className="mt-1.5 text-xs text-[#6B6B6B]">
                          {hospitalPlan?.termsDisclosure || 'Tailored quote based on department count, beds, and integration scope. No automatic charge.'}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-orange-100 flex flex-col gap-1.5 text-xs text-[#171717]">
                      <div className="flex items-center gap-2">
                        <Check size={13} className="text-[#FF6A00] shrink-0" strokeWidth={3} />
                        <span>{a.id === 'hospital' ? 'Multi-department queue boards & TV streaming' : 'Instant QR check-in & OPD live queue'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={13} className="text-[#FF6A00] shrink-0" strokeWidth={3} />
                        <span>{a.id === 'hospital' ? 'Enterprise RBAC & PostgreSQL data segregation' : 'Dedicated doctor dashboard & prescription builder'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-orange-100/80">
                    <Link
                      to={a.id === 'clinic' ? '/login?tab=signup' : '/pricing'}
                      className={`w-full py-2.5 px-4 rounded-xl text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2 ${
                        a.id === 'clinic' ? PRIMARY_BUTTON : 'bg-white hover:bg-orange-50 text-[#C2410C] border border-orange-300 transition-colors'
                      }`}
                    >
                      <span>
                        {a.id === 'clinic'
                          ? (introPlan?.ctaText || `Get Started for ₹${(introPlan?.price ?? 500).toLocaleString('en-IN')}`)
                          : (hospitalPlan?.ctaText || 'Request Hospital Consultation')}
                      </span>
                      <ArrowRight size={14} />
                    </Link>
                    <div className="mt-2 text-center">
                      <Link to="/pricing" className="text-[11px] sm:text-xs font-medium text-[#6B6B6B] hover:text-[#FF6A00] transition-colors">
                        Compare all plans and features →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

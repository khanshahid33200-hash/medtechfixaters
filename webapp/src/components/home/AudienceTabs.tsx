import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Stethoscope, Store, Building, Building2, Check, X, ArrowRight } from 'lucide-react'
import seoContent from '../../content/seoRoutes.json'
import { Reveal } from '../motion'
import { EASE_OUT, SPRING_UI } from '../../lib/motion'

type Plan = { name: string; tag: string; priceMonthly: number; priceAnnual: number }
const plans = (seoContent.routes.find((r) => r.path === '/pricing')?.pricing || []) as Plan[]
const plan = (name: string) => plans.find((p) => p.name === name)

const AUDIENCES = [
  {
    id: 'doctor',
    label: 'Solo doctor',
    icon: Stethoscope,
    title: 'Single-doctor clinics',
    who: 'For solo practitioners and independent doctors',
    challenges: [
      'Patient history is scattered across paper files, WhatsApp chats, and physical slips',
      'Doctors spend valuable consultation time manually handwriting or typing clinical notes',
      'Reception and administrative workload falls directly on the doctor during OPD hours',
      'Patients arrive at random times, causing unpredictable waiting room congestion',
      'Follow-up visits are frequently missed because there is no automated reminder mechanism',
      'Tracking daily collections, cash vs UPI payments, and daily revenue is tedious',
      'Looking up past prescriptions, allergies, or previous diagnostic reports takes too long',
      'Patients call or message personal phone numbers after clinic hours for appointments',
      'Managing medicine inventory and commonly prescribed dosages requires manual recall',
      'No professional digital presence or online booking platform for new patient acquisition',
    ],
    helps: [
      'Brings comprehensive patient history, past visits, and lab reports into one searchable timeline',
      'Instant 1-click prescription builder with doctor’s favorite drug templates and dosage presets',
      'Automates patient check-in via QR code scan, letting doctors focus purely on diagnosis',
      'Digital token queue manages patient flow and eliminates waiting room overcrowding',
      'Automated SMS & WhatsApp follow-up reminders ensure patients never miss their review visit',
      'Real-time daily collection tracker automatically reconciles cash, UPI, and digital receipts',
      'Instant allergy warnings and complete drug interaction history highlighted at consultation',
      'Dedicated clinic booking link allows patients to self-book only during open consultation hours',
      'Pre-configured medicine database with custom dosage, frequency, and duration shortcuts',
      'Free custom branded clinic website with SEO optimization and verified doctor profile',
    ],
    plan: plan('Clinic Starter'),
  },
  {
    id: 'clinic',
    label: 'Small clinic',
    icon: Store,
    title: 'Small clinics',
    who: 'For clinics with a front desk and growing patient flow',
    challenges: [
      'Front desk receptionist struggles to balance pre-booked appointments with sudden walk-ins',
      'Crowded reception area creates patient frustration and loud waiting room complaints',
      'Staff manually handwriting paper tokens leads to dispute over patient consultation order',
      'Doctor and receptionist frequently miscommunicate about who has arrived or stepped out',
      'Lost or misplaced paper patient files delay consultations and irritate waiting patients',
      'Difficult to track whether follow-ups, test reports, or review visits actually took place',
      'Cash drawer discrepancies and lack of end-of-day billing reconciliation audits',
      'Heavy volume of routine phone calls asking for doctor timings and token status',
      'No central repository of clinic medicines or standard consultation charges',
      'Inability to analyze patient retention rates, new vs returning patient trends',
    ],
    helps: [
      'Unified live queue seamlessly integrates online appointments and on-spot walk-ins in real time',
      'Smart QR kiosk and live mobile queue updates keep waiting rooms calm and uncrowded',
      'Automated token generation with estimated wait times displayed on clinic TVs and phones',
      'Real-time doctor-receptionist synchronized status (waiting, with doctor, completed, billed)',
      'Cloud EMR gives instant access to patient records with role-based security in under 2 seconds',
      'Built-in follow-up CRM tracks upcoming reviews and sends automated recall alerts',
      'Accurate end-of-day billing reports with automated cash/UPI breakdown and zero leakages',
      'Patients check doctor availability and token progress live on their smartphones',
      'Standardized clinic rate card, service charges, and medicine library shared across all staff',
      'Automated clinic performance analytics with daily patient count, retention, and growth metrics',
    ],
    plan: plan('Clinic Starter'),
  },
  {
    id: 'polyclinic',
    label: 'Polyclinic',
    icon: Building,
    title: 'Polyclinics',
    who: 'For multi-doctor clinics with multiple departments',
    challenges: [
      'Managing cross-department queues for 5+ doctors with varying consultation speeds and delays',
      'Receptionists overwhelmed by simultaneously handling multi-specialty bookings and inquiries',
      'Patients sent to in-house lab, diagnostics, or pharmacy get lost between internal handoffs',
      'Inability to track doctor-wise revenue sharing, consultation cuts, and variable fee payouts',
      'Frequent schedule collisions when visiting consultant doctors change their OPD timings',
      'Doctors lack visibility into treatments or medications prescribed by other internal specialists',
      'Patient records trapped in departmental silos without cross-specialty clinical summaries',
      'Manual paper-based billing across consultation, pharmacy, and diagnostic counters causes billing leaks',
      'High patient churn due to prolonged wait times across multiple specialty desks',
      'Clinic owners have no single unified view of department profitability and doctor utilization',
    ],
    helps: [
      'Multi-doctor, multi-department queue board coordinates all OPD rooms from one master view',
      'Departmental routing directs patients to their specific specialist without reception bottlenecks',
      'Seamless internal referral system sends lab and pharmacy orders straight to respective counters',
      'Automated doctor revenue share calculation and consultation fee settlement reports',
      'Dynamic doctor schedule builder adjusts slot capacity and instantly alerts patients of delays',
      'Unified Patient 360 record allows authorized cross-specialty viewing of clinical notes and meds',
      'Centralized digital health record accessible across all clinic wings with strict role permissions',
      'Integrated billing engine connects OPD, diagnostics, and procedures with single receipt payout',
      'Live token announcements on digital TV displays and mobile notifications minimize drop-offs',
      'Executive dashboard tracks department revenue, doctor-wise patient volume, and idle clinic time',
    ],
    plan: plan('Hospital Pro'),
  },
  {
    id: 'hospital',
    label: 'Hospital',
    icon: Building2,
    title: 'Hospitals',
    who: 'For hospitals and chains running many departments',
    challenges: [
      'Massive daily OPD crowd creating chaotic queues at main lobby registration counters',
      'Disconnected legacy software where registration, OPD, lab, and billing do not talk to each other',
      'Complex role hierarchy where enforcing HIPAA/NABH data privacy access rules is nearly impossible',
      'Delayed reporting: management waits days or weeks for consolidated OPD numbers and collections',
      'High administrative staffing overhead required to manage manual paper workflows and physical charts',
      'Doctor burnout from cumbersome, slow hospital management software requiring excessive clicks',
      'Inefficient emergency and priority triage identification in general OPD lines',
      'Lack of audit trails for prescription edits, test cancellations, and fee discounts',
      'Inconsistent patient branding across departments, paper receipts, and printed discharge summaries',
      'Slow onboarding and steep learning curves for newly hired nurses, resident doctors, and staff',
    ],
    helps: [
      'Self-service QR kiosks and mobile pre-registration reduce lobby queue times by up to 70%',
      'Modern unified cloud architecture seamlessly bridges registration, consultation, and billing',
      'Enterprise role-based access control (RBAC) ensuring strict data segregation and compliance',
      'Real-time executive BI dashboards delivering live revenue, footfall, and bed/OPD utilization metrics',
      'Paperless digital workflows eliminate physical chart archiving costs and retrieval bottlenecks',
      'Lightning-fast doctor workspace designed with practicing clinicians to minimize screen time',
      'Priority triage tagging automatically elevates urgent and pediatric cases in the doctor queue',
      'Complete immutable audit logs recording every clinical action, prescription modification, and refund',
      'Standardized enterprise hospital branding across digital prescriptions, SMS, and reports',
      'Intuitive, clean consumer-grade UI enabling new staff and doctors to be operational in under 15 minutes',
    ],
    plan: plan('Enterprise Mesh'),
  },
] as const

export default function AudienceTabs() {
  const [active, setActive] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const reduce = useReducedMotion()
  const a = AUDIENCES[active]

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
            From solo practices to multi-doctor clinics, MedTech Fixaters simplifies everyday operations so you can focus on what matters most: your patients.
          </p>
        </Reveal>

        <div role="tablist" aria-label="Type of practice" onKeyDown={onKeyDown} className="mt-5 sm:mt-7 mx-auto flex w-full max-w-2xl rounded-full bg-white/70 border border-orange-100 p-1 sm:p-1.5 backdrop-blur-xl shadow-xs">
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
                className={`relative flex-1 min-w-0 rounded-full px-1.5 py-2 sm:px-3 sm:py-2.5 text-[11px] sm:text-sm font-bold transition ${selected ? 'text-white' : 'text-[#6B6B6B] hover:text-[#171717]'} focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400`}
              >
                {selected && (
                  <motion.span
                    layoutId={reduce ? undefined : 'aud-pill'}
                    className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] shadow-md shadow-orange-500/25"
                    transition={SPRING_UI}
                  />
                )}
                <span className="relative flex items-center justify-center gap-1 sm:gap-1.5">
                  <Icon size={14} className="shrink-0 hidden sm:block" />
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
                <div className="lg:col-span-2 flex flex-col justify-between rounded-xl sm:rounded-[24px] bg-[linear-gradient(160deg,#FFF3EA,#FFFFFF)] border border-orange-100 p-4 sm:p-6">
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#6B6B6B]">Suggested plan: {a.plan.name}</p>
                    <p className="mt-1.5 sm:mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-[#171717]">
                      ₹{a.plan.priceMonthly.toLocaleString('en-IN')}
                      <span className="text-xs sm:text-base font-semibold text-[#6B6B6B]"> / month</span>
                    </p>
                    <p className="mt-1 text-xs sm:text-sm text-[#6B6B6B]">₹{a.plan.priceAnnual.toLocaleString('en-IN')} a month if paid yearly</p>
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-100/80 border border-orange-200/80 text-orange-900 text-[11px] sm:text-xs font-bold shadow-2xs">
                      <span>🎁 Free Custom Website on Yearly Plan</span>
                    </div>
                  </div>
                  <Link to="/pricing" className="mt-4 sm:mt-6 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#C2410C] hover:text-[#9A3412]">
                    Compare all plans <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

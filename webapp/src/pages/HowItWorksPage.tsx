import { useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion'
import {
  UserPlus, Building2, QrCode, ScanLine, Bot, ClipboardList, Ticket, Tv, FileText,
  LayoutDashboard, Layers, Stethoscope, Pill, CheckCircle, CalendarClock, Users, BarChart3,
  MessageSquare, ScrollText, ShieldCheck, Lock, History, ArrowRight, ArrowDown, Smartphone,
} from 'lucide-react'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'
import AmbientBackground from '../components/motion/AmbientBackground'
import { AnimatedSection, MotionCard, Reveal, StaggerContainer } from '../components/motion'
import FinalCta from '../components/home/FinalCta'
import { useSEO } from '../hooks/useSEO'
import { EASE_OUT, PRIMARY_BUTTON, SPRING_UI } from '../lib/motion'

// Every step here describes a screen that exists in the app today (booking flow, intake,
// track page, TV display board, Rx page, doctor workspace, hospital dashboard).
// Keep it that way: if a feature isn't built, it doesn't go on this page.

type Step = { icon: typeof QrCode; title: string; body: string; tag?: string }

const SETUP: Step[] = [
  { icon: UserPlus, title: 'Sign up and set up your practice', body: 'A guided setup asks for your details, clinic name and address, working days and OPD timings.' },
  { icon: Building2, title: 'Add departments and doctors', body: 'Hospitals add departments, doctors and staff. Each person gets their own login with access that matches their role.' },
  { icon: QrCode, title: 'Print your QR code', body: 'Your clinic gets its own QR code and booking link. Print the poster for reception or share the link on WhatsApp.' },
]

const PATIENT: Step[] = [
  { icon: ScanLine, title: 'Scan the QR code', body: 'Patients scan the code at reception with their phone camera, or open your booking link. No app to install.', tag: 'Any smartphone' },
  { icon: Bot, title: 'Book with the AI assistant or directly', body: 'They can describe their problem to the assistant, which suggests the right department, or pick the department and doctor themselves. The assistant only guides; it never diagnoses.' },
  { icon: ClipboardList, title: 'Fill in their details once', body: 'Name, mobile, age, the reason for the visit, known conditions and current medicines. Returning patients are found by patient ID or mobile number.' },
  { icon: Ticket, title: 'Get a token and track the queue', body: 'They get an OPD token straight away and a tracking page that shows the live queue, so they can wait anywhere instead of at the counter.', tag: 'Live position' },
  { icon: Tv, title: 'Get called in', body: 'The waiting-area TV shows who is being seen now and who is next, and the doctor can announce the token out loud.' },
  { icon: FileText, title: 'Receive the prescription', body: 'After the visit, patients open their prescription on their phone with their mobile number and a one-time code, and can download it as a PDF.' },
]

const DOCTOR: Step[] = [
  { icon: LayoutDashboard, title: 'Open your workspace', body: 'See today’s patients, who is waiting, follow-ups due and the day’s collections the moment you log in.' },
  { icon: Layers, title: 'Run the live queue', body: 'Patients who booked by QR appear in your queue automatically. Add walk-ins, search, and see each patient’s status.' },
  { icon: Stethoscope, title: 'Consult with the history in front of you', body: 'The reason for the visit, vitals, allergies, past visits and earlier prescriptions are on one screen.' },
  { icon: Pill, title: 'Write the prescription in seconds', body: 'Pick medicines from your own library. Suggestions come from rules you saved, and you always decide what goes on the prescription.' },
  { icon: CheckCircle, title: 'Set a follow-up and call the next patient', body: 'Schedule the follow-up with its own token, finish the visit, and the next patient is called in.' },
]

const DOCTOR_EXTRAS = [
  { icon: CalendarClock, title: 'Availability', body: 'Mark leave days and working hours so patients can’t book you when you’re away.' },
  { icon: Pill, title: 'Medicine library', body: 'Import your medicine list from CSV or Excel and keep your own suggestion rules.' },
  { icon: CheckCircle, title: 'Follow-up list', body: 'Due today, upcoming, overdue and completed follow-ups in one place.' },
]

const ADMIN = [
  { icon: LayoutDashboard, title: 'Hospital dashboard', body: 'Appointments, patients, doctors and collections for the whole hospital.' },
  { icon: Layers, title: 'Every live queue', body: 'See each doctor’s queue as it moves, from one screen.' },
  { icon: Users, title: 'Doctors, departments and roles', body: 'Add doctors and departments, and decide what each staff role can see.' },
  { icon: QrCode, title: 'One QR for the hospital', body: 'Manage the hospital’s booking QR code and link.' },
  { icon: BarChart3, title: 'Reports and analytics', body: 'Daily and monthly numbers by doctor and department.' },
  { icon: MessageSquare, title: 'Team chat and notices', body: 'Message staff and send notifications to doctors.' },
  { icon: ScrollText, title: 'Activity log', body: 'A record of important changes made in the system.' },
  { icon: Building2, title: 'Hospital settings', body: 'Your hospital’s details and preferences.' },
]

const PRIVACY = [
  { icon: Lock, title: 'Each hospital is separate', body: 'One hospital can never see another hospital’s patients, doctors or records.' },
  { icon: ShieldCheck, title: 'Access by role', body: 'Doctors see their own patients. Reception and admins see what their role needs.' },
  { icon: History, title: 'Prescriptions are kept as issued', body: 'A finished prescription isn’t silently edited. A correction is saved as a new, dated version.' },
]

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <Reveal className="max-w-2xl space-y-3">
      <p className="text-sm font-bold text-[#C2410C]">{eyebrow}</p>
      <h2 className="text-[clamp(1.875rem,3.5vw,2.75rem)] font-extrabold tracking-tight text-[#171717]">{title}</h2>
      <p className="text-[#6B6B6B] max-w-[60ch]">{sub}</p>
    </Reveal>
  )
}

// Vertical timeline whose orange line fills in as you scroll through the steps.
function Timeline({ steps }: { steps: Step[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 60%'] })
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 })

  return (
    <div ref={ref} className="relative mt-10">
      <span aria-hidden className="absolute left-[23px] top-3 bottom-3 w-0.5 rounded-full bg-orange-100" />
      <motion.span
        aria-hidden
        style={reduce ? undefined : { scaleY: fill }}
        className="absolute left-[23px] top-3 bottom-3 w-0.5 origin-top rounded-full bg-[linear-gradient(180deg,#FF8A3D,#FF6A00)]"
      />
      <ol className="relative space-y-5">
      {steps.map((s, i) => {
        const Icon = s.icon
        return (
          <motion.li
            key={s.title}
            initial={reduce ? false : { opacity: 0, x: -24, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className="relative flex gap-5"
          >
            <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] text-white shadow-[0_10px_25px_-8px_rgba(255,106,0,0.55)]">
              <Icon size={20} />
            </span>
            <div className="flex-1 rounded-[22px] border border-orange-100/70 bg-white/80 p-5 backdrop-blur-xl shadow-[0_15px_35px_-28px_rgba(23,23,23,0.35)]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold text-[#C2410C]">Step {i + 1}</span>
                {s.tag && <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-[#C2410C]">{s.tag}</span>}
              </div>
              <h3 className="mt-1 text-lg font-extrabold text-[#171717]">{s.title}</h3>
              <p className="mt-1 text-sm text-[#6B6B6B] leading-relaxed">{s.body}</p>
            </div>
          </motion.li>
        )
      })}
      </ol>
    </div>
  )
}

function CardGrid({ items, cols = 'sm:grid-cols-2 lg:grid-cols-4' }: { items: { icon: typeof QrCode; title: string; body: string }[]; cols?: string }) {
  return (
    <StaggerContainer as="ul" stagger={0.06} className={`mt-10 grid grid-cols-1 gap-4 ${cols}`}>
      {items.map((c) => {
        const Icon = c.icon
        return (
          <MotionCard as="li" key={c.title} className="rounded-[22px] border border-orange-100/70 bg-white/80 p-5 backdrop-blur-xl shadow-[0_15px_35px_-28px_rgba(23,23,23,0.35)]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#FF6A00]">
              <Icon size={19} />
            </span>
            <h3 className="mt-3 text-base font-extrabold text-[#171717]">{c.title}</h3>
            <p className="mt-1 text-sm text-[#6B6B6B] leading-relaxed">{c.body}</p>
          </MotionCard>
        )
      })}
    </StaggerContainer>
  )
}

// Small phone showing the patient's tracking screen. Sample values only.
function TrackPhone() {
  const reduce = useReducedMotion()
  return (
    <div aria-hidden className="relative mx-auto w-[250px]">
      <div className="absolute -inset-10 rounded-full bg-[#FF8A3D]/25 blur-3xl" />
      <motion.div
        animate={reduce ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative rounded-[40px] bg-[#10141c] p-[6px] shadow-[0_30px_70px_rgba(0,0,0,0.3)]"
      >
        <div className="absolute left-1/2 top-[10px] z-10 h-[20px] w-[80px] -translate-x-1/2 rounded-full bg-black" />
        <div className="rounded-[34px] bg-[#FFF9F5] px-4 pb-6 pt-10">
          <p className="text-[11px] font-bold text-[#6B6B6B]">City Care Hospital</p>
          <p className="text-sm font-extrabold text-[#171717]">Your OPD token</p>
          <div className="mt-3 rounded-2xl bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] p-4 text-center text-white">
            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-50">Token</p>
            <p className="text-3xl font-black">A-013</p>
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-white/15 p-2 text-[10px] font-bold">
              <span>Now serving<br /><span className="text-sm">A-011</span></span>
              <span>Ahead of you<br /><span className="text-sm">2</span></span>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {['Booked', 'Details received', 'In queue'].map((t, i) => (
              <motion.div
                key={t}
                initial={reduce ? false : { opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.4, ease: EASE_OUT }}
                className="flex items-center gap-2 rounded-xl border border-orange-100 bg-white px-3 py-2 text-[11px] font-bold text-[#171717]"
              >
                <CheckCircle size={13} className="text-[#FF6A00]" /> {t}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function Section({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <AnimatedSection id={id}>
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">{children}</div>
      </section>
    </AnimatedSection>
  )
}

const ROLES = [
  { id: 'setup', label: 'Setup', icon: Building2 },
  { id: 'patients', label: 'Patients', icon: Smartphone },
  { id: 'doctors', label: 'Doctors', icon: Stethoscope },
  { id: 'hospital', label: 'Hospital admin', icon: LayoutDashboard },
]

export default function HowItWorksPage() {
  useSEO({
    title: 'How It Works | MedTech Fixaters OPD & Queue Software',
    description:
      'How MedTech Fixaters works for patients, doctors and hospital admins: QR booking, live queue tracking, consultations with patient history, prescriptions and follow-ups.',
  })
  const reduce = useReducedMotion()
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  const anim = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 24, filter: 'blur(10px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' }, transition: { duration: 0.8, ease: EASE_OUT, delay } }

  return (
    <div className="relative min-h-[100dvh] text-[#171717] selection:bg-orange-200 font-sans antialiased overflow-x-hidden">
      <AmbientBackground />
      <PublicHeader />

      <main>
        <section className="pt-32 sm:pt-40 pb-10 px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-5">
            <motion.p {...anim(0)} className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/70 px-4 py-1.5 text-xs font-bold text-[#C2410C] backdrop-blur-xl">
              How it works
            </motion.p>
            <motion.h1 {...anim(0.1)} className="text-[clamp(2rem,5vw,3.75rem)] font-extrabold tracking-[-0.03em] leading-[1.08]">
              From the QR code at reception{' '}
              <span className="bg-gradient-to-r from-[#FF8A3D] to-[#FF6A00] bg-clip-text text-transparent">to the prescription on their phone</span>
            </motion.h1>
            <motion.p {...anim(0.2)} className="text-sm sm:text-base md:text-lg text-[#6B6B6B] max-w-[58ch] mx-auto">
              One connected system for patients, doctors and hospital admins. Here is what each of them does, step by step.
            </motion.p>
            <motion.div {...anim(0.3)} className="flex flex-wrap justify-center gap-2 pt-2">
              {ROLES.map((r) => {
                const Icon = r.icon
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => jump(r.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-white/80 px-4 py-2 text-sm font-bold text-[#171717] backdrop-blur-xl transition hover:border-orange-300 hover:text-[#C2410C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
                  >
                    <Icon size={15} className="text-[#FF6A00]" /> {r.label}
                  </button>
                )
              })}
            </motion.div>
          </div>

          {/* The whole flow in one line */}
          <StaggerContainer as="ul" stagger={0.1} className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              [QrCode, 'Scan QR'], [ClipboardList, 'Book & share details'], [Ticket, 'Token & live queue'],
              [Stethoscope, 'Consultation'], [FileText, 'Prescription'], [CheckCircle, 'Follow-up'],
            ].map(([Icon, label], i) => {
              const I = Icon as typeof QrCode
              return (
                <MotionCard as="li" key={label as string} className="relative rounded-2xl border border-orange-100/70 bg-white/80 p-4 backdrop-blur-xl">
                  <span className="text-[11px] font-extrabold text-[#C2410C]">{String(i + 1).padStart(2, '0')}</span>
                  <I size={20} className="mx-auto mt-1 text-[#FF6A00]" />
                  <p className="mt-2 text-xs font-bold text-[#171717]">{label as string}</p>
                </MotionCard>
              )
            })}
          </StaggerContainer>

          <button
            type="button"
            onClick={() => jump('setup')}
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-bold text-[#6B6B6B] hover:text-[#C2410C]"
          >
            Start with setup <ArrowDown size={15} />
          </button>
        </section>

        <Section id="setup">
          <SectionHead eyebrow="Before your first patient" title="Getting set up" sub="Three steps before your first patient walks in." />
          <StaggerContainer as="ul" stagger={0.1} className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {SETUP.map((s, i) => {
              const Icon = s.icon
              return (
                <MotionCard as="li" key={s.title} className="rounded-[24px] border border-orange-100/70 bg-white/80 p-6 backdrop-blur-xl shadow-[0_15px_35px_-28px_rgba(23,23,23,0.35)]">
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] text-white"><Icon size={21} /></span>
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-extrabold text-[#C2410C]">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-extrabold text-[#171717]">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-[#6B6B6B] leading-relaxed">{s.body}</p>
                  {s.tag && <p className="mt-3 text-xs font-bold text-[#C2410C]">{s.tag}</p>}
                </MotionCard>
              )
            })}
          </StaggerContainer>
        </Section>

        <Section id="patients">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <SectionHead eyebrow="For patients" title="A visit, from the patient’s phone" sub="Everything happens in the phone’s browser. Nothing to download, no account to create." />
              <Timeline steps={PATIENT} />
            </div>
            <div className="hidden lg:col-span-5 lg:block">
              <div className="sticky top-32 pt-24">
                <TrackPhone />
              </div>
            </div>
          </div>
        </Section>

        <Section id="doctors">
          <SectionHead eyebrow="For doctors" title="A consultation, from the doctor’s screen" sub="Your own login, your own patients, and everything you need for the visit on one screen." />
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <Timeline steps={DOCTOR} />
            </div>
            <div className="lg:col-span-5 lg:pt-10">
              <Reveal>
                <p className="text-sm font-extrabold text-[#171717]">Also in the doctor workspace</p>
              </Reveal>
              <StaggerContainer as="ul" stagger={0.08} className="mt-4 space-y-3">
                {DOCTOR_EXTRAS.map((c) => {
                  const Icon = c.icon
                  return (
                    <MotionCard as="li" key={c.title} className="flex gap-4 rounded-[20px] border border-orange-100/70 bg-white/80 p-4 backdrop-blur-xl">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FF6A00]"><Icon size={18} /></span>
                      <div>
                        <h3 className="text-sm font-extrabold text-[#171717]">{c.title}</h3>
                        <p className="mt-0.5 text-sm text-[#6B6B6B]">{c.body}</p>
                      </div>
                    </MotionCard>
                  )
                })}
              </StaggerContainer>
              <Reveal className="mt-5">
                <Link to="/features#simulator" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#C2410C] hover:text-[#9A3412]">
                  Try the doctor dashboard demo <ArrowRight size={15} />
                </Link>
              </Reveal>
            </div>
          </div>
        </Section>

        <Section id="hospital">
          <SectionHead eyebrow="For hospital admins" title="The whole hospital, from one dashboard" sub="Admins see across every doctor and department, and control who can do what." />
          <CardGrid items={ADMIN} />
        </Section>

        <AnimatedSection>
          <section className="px-4 sm:px-6 py-8 md:py-10">
            <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#FF6A00_0%,#FF9A5B_100%)] px-6 py-12 md:px-12 md:py-14 shadow-[0_40px_80px_-40px_rgba(255,106,0,0.7)]">
              <div aria-hidden className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/25 blur-3xl" />
              <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
                <Reveal className="lg:col-span-5 space-y-3">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#3B1D08]">Behind the scenes</p>
                  <h2 className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-extrabold tracking-tight text-white">What happens to the data</h2>
                  <p className="font-medium text-[#2B1405] max-w-[46ch]">Patient records are sensitive. These rules are enforced by the database itself, not just the screens.</p>
                  <Link to="/privacy" className="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#C2410C] shadow-sm transition hover:-translate-y-0.5">
                    Read our privacy policy
                  </Link>
                </Reveal>
                <StaggerContainer as="ul" className="lg:col-span-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {PRIVACY.map((p) => {
                    const Icon = p.icon
                    return (
                      <MotionCard as="li" key={p.title} className="rounded-[24px] border border-white/60 bg-white/85 p-5 backdrop-blur-xl">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] text-white"><Icon size={20} /></span>
                        <h3 className="mt-4 text-base font-extrabold text-[#171717]">{p.title}</h3>
                        <p className="mt-1 text-sm text-[#6B6B6B]">{p.body}</p>
                      </MotionCard>
                    )
                  })}
                </StaggerContainer>
              </div>
            </div>
          </section>
        </AnimatedSection>

        <div className="flex justify-center pt-8">
          <motion.div whileHover={reduce ? undefined : { scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }} transition={SPRING_UI}>
            <Link to="/features" className={`inline-flex items-center gap-2 rounded-full ${PRIMARY_BUTTON} px-7 py-3.5 text-sm font-bold`}>
              See all features <ArrowRight size={15} />
            </Link>
          </motion.div>
        </div>
        <FinalCta />
      </main>

      <PublicFooter />
    </div>
  )
}

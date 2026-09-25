import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Users, ShieldCheck, LayoutDashboard, UserCircle, Globe, Sparkles, MousePointerClick, Printer,
  Check, ArrowRight, ArrowDown, Zap, HeartPulse, LineChart,
} from 'lucide-react'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'
import DoctorDashboardSimulator from '../components/DoctorDashboardSimulator'
import AmbientBackground from '../components/motion/AmbientBackground'
import { AnimatedSection, MotionCard, Reveal, StaggerContainer } from '../components/motion'
import FinalCta from '../components/home/FinalCta'
import { useSEO } from '../hooks/useSEO'
import { EASE_OUT, PRIMARY_BUTTON, SPRING_UI } from '../lib/motion'

// Each feature says only what the product does today. The "screen" rows are sample values
// for the illustration, not real data.
const FEATURES = [
  {
    id: 'crowd',
    icon: Users,
    tab: 'Crowd management',
    eyebrow: 'Effective crowd management',
    title: 'A smooth OPD flow',
    body: 'Patients book by QR code or at the desk and wait from their phone, so the waiting area stays calm and wait times drop.',
    points: ['Instant patient registration', 'Easy appointment scheduling', 'Live patient flow tracking'],
    screen: { title: 'Live queue', rows: [['A-012', 'With doctor'], ['A-013', 'Next'], ['A-014', 'Waiting'], ['W-003', 'Walk-in added']] },
  },
  {
    id: 'emr',
    icon: ShieldCheck,
    tab: 'Secure cloud EMR',
    eyebrow: 'Keep your data safe',
    title: 'Secure cloud-based records',
    body: 'Patient records live in an encrypted cloud database. Each clinic is kept separate, and staff see only what their role allows.',
    points: ['Encrypted in transit and at rest', 'Nothing to install or maintain', 'Role-based access and audit logs'],
    screen: { title: 'Access control', rows: [['Doctor', 'Own patients'], ['Reception', 'Queue & bookings'], ['Admin', 'Clinic reports'], ['Other clinics', 'No access']] },
  },
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    tab: 'Intelligent dashboard',
    eyebrow: 'Informed decisions',
    title: 'Your whole practice on one screen',
    body: 'See appointments, patient flow, collections and doctor-wise activity together, and make decisions without waiting for reports.',
    points: ['Data-driven insights', 'Live updates', 'Timely patient care'],
    screen: { title: 'Today', rows: [['Appointments', '48'], ['Waiting now', '9'], ['Completed', '31'], ['Collections', '₹18,400']] },
  },
  {
    id: 'patient360',
    icon: UserCircle,
    tab: 'Patient 360',
    eyebrow: 'Stay informed',
    title: 'Patient 360',
    body: 'Open any patient to see their basic details, visit history, appointments, notes and prescriptions in one place.',
    points: ['A short, simple layout that is easy to scan', 'Full visit and prescription history', 'Follow-ups due, at a glance'],
    screen: { title: 'Patient record', rows: [['Visits', '6'], ['Last visit', '12 Sep'], ['Prescriptions', '6'], ['Follow-up', 'Due 26 Sep']] },
  },
  {
    id: 'website',
    icon: Globe,
    tab: 'Online presence',
    eyebrow: 'Better online presence',
    title: 'A website for your clinic',
    body: 'Get a clinic website with your doctors, departments and online booking. It is free on yearly plans and we set it up for you.',
    points: ['Doctor and department listings', 'Online appointment booking', 'Your colours and branding'],
    screen: { title: 'yourclinic.in', rows: [['General Medicine', 'Book'], ['Paediatrics', 'Book'], ['Orthopaedics', 'Book'], ['Next free slot', '11:00']] },
  },
  {
    id: 'notes',
    icon: Sparkles,
    tab: 'Clinical suggestions',
    eyebrow: 'Save time, get more done',
    title: 'Clinical note and medicine suggestions',
    body: 'Suggestions come from the medicines and rules you save, plus Gemini-powered suggestions for medicines, tests and patient advice. Each one shows its reason and confidence, and the doctor always decides.',
    points: ['Your own saved rules', 'Gemini-powered clinical assistance', 'Allergy warnings, doctor review required'],
    screen: { title: 'Suggested for fever', rows: [['Paracetamol 650', 'Add'], ['ORS sachets', 'Add'], ['Rest & fluids advice', 'Add'], ['Review in 3 days', 'Add']] },
  },
  {
    id: 'ux',
    icon: MousePointerClick,
    tab: 'Smooth experience',
    eyebrow: 'Smooth user experience',
    title: 'A hassle-free journey',
    body: 'A simple, clean interface takes everyone from booking to consultation without training manuals.',
    points: ['Simple navigation', 'Minimal design', 'Works on phone, tablet and desktop'],
    screen: { title: 'Booking to consult', rows: [['Scan QR', 'Done'], ['Pick doctor', 'Done'], ['Token issued', 'A-013'], ['Consultation', 'Next']] },
  },
  {
    id: 'branding',
    icon: Printer,
    tab: 'Branding',
    eyebrow: 'Branding',
    title: 'Prescriptions on your letterhead',
    body: 'Print or share prescriptions with your clinic’s name, doctor details and letterhead, so every page looks like your practice.',
    points: ['Your clinic name and doctor details', 'Print on A4 or share digitally', 'Consistent look on every prescription'],
    screen: { title: 'Prescription', rows: [['Clinic', 'Your letterhead'], ['Doctor', 'Name & reg. no.'], ['Medicines', '3 items'], ['Format', 'A4 / PDF']] },
  },
] as const

type Feature = (typeof FEATURES)[number]

function FeatureScreen({ f }: { f: Feature }) {
  const reduce = useReducedMotion()
  const Icon = f.icon
  return (
    <div aria-hidden className="relative">
      <div className="absolute -inset-6 rounded-full bg-[#FF8A3D]/20 blur-3xl" />
      <div className="relative rounded-[24px] border border-orange-100 bg-white p-4 sm:p-5 shadow-[0_30px_70px_-40px_rgba(255,106,0,0.55)]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] text-white">
            <Icon size={17} />
          </span>
          <p className="text-sm font-extrabold text-[#171717]">{f.screen.title}</p>
          <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Live</span>
        </div>
        <ul className="mt-4 space-y-2">
          {f.screen.rows.map(([label, value], i) => (
            <motion.li
              key={label}
              initial={reduce ? false : { opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.3 + i * 0.08 }}
              className="flex items-center justify-between rounded-xl border border-orange-100/70 bg-[#FFF9F5] px-3 py-2.5"
            >
              <span className="text-xs font-semibold text-[#171717]">{label}</span>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#C2410C] border border-orange-100">{value}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function FeatureCopy({ f }: { f: Feature }) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-wider text-[#C2410C]">{f.eyebrow}</p>
      <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171717]">{f.title}</h3>
      <p className="mt-3 text-sm sm:text-base text-[#6B6B6B] leading-relaxed max-w-[52ch]">{f.body}</p>
      <ul className="mt-5 space-y-2.5">
        {f.points.map((p) => (
          <li key={p} className="flex items-center gap-2.5 text-sm font-medium text-[#171717]">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF6A00] text-white">
              <Check size={11} strokeWidth={3} />
            </span>
            {p}
          </li>
        ))}
      </ul>
    </div>
  )
}

// Heading for the feature list, with quick links that jump to each feature's section.
function FeaturesIntro() {
  const reduce = useReducedMotion()
  return (
    <section id="features-list" className="pt-12 md:pt-16 pb-2 scroll-mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Reveal className="max-w-2xl mx-auto text-center space-y-3">
          <h2 className="text-[clamp(1.875rem,3.5vw,2.75rem)] font-extrabold tracking-tight text-[#171717]">
            A wide range of features, so your clinic runs smoothly
          </h2>
          <p className="text-[#6B6B6B]">Simple, carefully built tools for every part of your OPD.</p>
        </Reveal>
        <StaggerContainer as="ul" stagger={0.04} className="mt-7 flex flex-wrap justify-center gap-2">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <motion.li key={f.id} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
                <a
                  href={`#${f.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(f.id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-white/80 px-3.5 py-2 text-xs sm:text-sm font-bold text-[#171717] backdrop-blur-xl transition hover:border-orange-300 hover:text-[#C2410C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
                >
                  <Icon size={14} className="text-[#FF6A00]" /> {f.tab}
                </a>
              </motion.li>
            )
          })}
        </StaggerContainer>
      </div>
    </section>
  )
}

// One feature per section; copy and screen swap sides on every other section.
function FeatureSection({ f, index }: { f: Feature; index: number }) {
  const reduce = useReducedMotion()
  const flip = index % 2 === 1
  return (
    <section className="py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center rounded-[28px] border border-orange-100/70 bg-white/70 p-6 sm:p-8 lg:p-10 backdrop-blur-xl shadow-[0_15px_40px_-25px_rgba(255,106,0,0.22)]">
          <motion.div
            className={flip ? 'lg:order-2' : ''}
            initial={reduce ? false : { opacity: 0, x: flip ? 40 : -40, filter: 'blur(8px)' }}
            whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
          >
            <p className="text-5xl font-extrabold tracking-tight text-orange-100 select-none" aria-hidden>
              {String(index + 1).padStart(2, '0')}
            </p>
            <div className="-mt-2">
              <FeatureCopy f={f} />
            </div>
          </motion.div>
          <motion.div
            className={flip ? 'lg:order-1' : ''}
            initial={reduce ? false : { opacity: 0, y: 40, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.1 }}
          >
            <FeatureScreen f={f} />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

const PROMISES = [
  { icon: Zap, title: 'Faster bookings', body: 'QR and online booking with no queue at the counter.' },
  { icon: HeartPulse, title: 'Quicker care', body: 'Doctors see history and write prescriptions in seconds.' },
  { icon: LineChart, title: 'Deeper insights', body: 'Daily numbers for every doctor and department.' },
]

function AssuranceBand() {
  return (
    <section className="px-4 sm:px-6 py-8 md:py-10">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#FF6A00_0%,#FF9A5B_100%)] px-6 py-12 md:px-12 md:py-14 shadow-[0_40px_80px_-40px_rgba(255,106,0,0.7)]">
        <div aria-hidden className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/25 blur-3xl" />
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <Reveal className="lg:col-span-5 space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#3B1D08]">Streamlining care</p>
            <h2 className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-extrabold tracking-tight text-white">MedTech Fixaters assures you</h2>
            <p className="font-medium text-[#2B1405] max-w-[46ch]">
              We keep simplifying clinic work with regular updates and new modules, so the software stays suited to how you practise.
            </p>
          </Reveal>
          <StaggerContainer as="ul" className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PROMISES.map((p) => {
              const Icon = p.icon
              return (
                <MotionCard as="li" key={p.title} className="rounded-[24px] border border-white/60 bg-white/85 p-5 backdrop-blur-xl">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] text-white">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-4 text-base font-extrabold text-[#171717]">{p.title}</h3>
                  <p className="mt-1 text-sm text-[#6B6B6B]">{p.body}</p>
                </MotionCard>
              )
            })}
          </StaggerContainer>
        </div>
      </div>
    </section>
  )
}

export default function FeaturesPage() {
  useSEO({
    title: 'Features | MedTech Fixaters OPD & Clinic Management Software',
    description:
      'Crowd management, secure cloud EMR, a live clinic dashboard, Patient 360, a clinic website with online booking, clinical suggestions and prescriptions on your letterhead.',
  })
  const reduce = useReducedMotion()
  const anim = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 24, filter: 'blur(10px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' }, transition: { duration: 0.8, ease: EASE_OUT, delay } }

  return (
    <div className="relative min-h-[100dvh] text-[#171717] selection:bg-orange-200 font-sans antialiased overflow-x-hidden">
      <AmbientBackground />
      <PublicHeader />

      <main>
        <section className="relative pt-32 sm:pt-40 pb-12 md:pb-16 px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-5">
            <motion.p {...anim(0)} className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/70 px-4 py-1.5 text-xs font-bold text-[#C2410C] backdrop-blur-xl">
              <Sparkles size={13} /> Features
            </motion.p>
            <motion.h1 {...anim(0.1)} className="text-[clamp(2rem,5vw,3.75rem)] font-extrabold tracking-[-0.03em] leading-[1.08]">
              Everything your clinic needs,{' '}
              <span className="bg-gradient-to-r from-[#FF8A3D] to-[#FF6A00] bg-clip-text text-transparent">in one simple system</span>
            </motion.h1>
            <motion.p {...anim(0.2)} className="text-sm sm:text-base md:text-lg text-[#6B6B6B] max-w-[56ch] mx-auto">
              From the QR code at your reception to the prescription in your patient’s hand. Try the live demo below.
            </motion.p>
            <motion.div {...anim(0.3)} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <motion.div whileHover={reduce ? undefined : { scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }} transition={SPRING_UI} className="w-full sm:w-auto">
                <Link to="/book-demo" className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full ${PRIMARY_BUTTON} px-7 py-3.5 text-sm font-bold`}>
                  Book a Demo <ArrowRight size={15} />
                </Link>
              </motion.div>
              <a
                href="#features-list"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('features-list')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-orange-200 bg-white/80 px-7 py-3.5 text-sm font-bold text-[#171717] hover:border-orange-300"
              >
                See all features <ArrowDown size={15} />
              </a>
            </motion.div>
          </div>

          {/* Live demo dashboard */}
          <motion.div
            id="simulator"
            initial={reduce ? false : { opacity: 0, y: 40, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, ease: EASE_OUT, delay: 0.4 }}
            className="mt-12 max-w-7xl mx-auto text-left scroll-mt-28"
          >
            <DoctorDashboardSimulator />
          </motion.div>
        </section>

        <FeaturesIntro />
        {FEATURES.map((f, i) => (
          <AnimatedSection key={f.id} id={f.id}>
            <FeatureSection f={f} index={i} />
          </AnimatedSection>
        ))}
        <AnimatedSection>
          <AssuranceBand />
        </AnimatedSection>
        <FinalCta />
      </main>

      <PublicFooter />
    </div>
  )
}

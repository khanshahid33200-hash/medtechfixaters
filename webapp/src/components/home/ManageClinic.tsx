import { motion, useReducedMotion } from 'framer-motion'
import {
  Sunrise,
  Sun,
  Sunset,
  CalendarClock,
  Pill,
  QrCode,
  ListOrdered,
  UserPlus,
  Stethoscope,
  FileText,
  CalendarCheck,
  BarChart3,
  History,
  Bell,
  Building2,
  Users,
  ShieldCheck,
  MessageSquare,
  ScrollText,
  Layers,
} from 'lucide-react'
import { MotionCard, Reveal, StaggerContainer } from '../motion'
import { EASE_OUT } from '../../lib/motion'

// Everything listed here maps to a real screen in the doctor or hospital dashboard.
const DAY = [
  {
    icon: Sunrise,
    title: 'Before OPD',
    tint: 'from-[#FFF3E6] to-white',
    items: [
      { icon: CalendarClock, text: 'Set your OPD hours and mark leave days, so patients can’t book you on a day off' },
      { icon: Pill, text: 'Keep your own medicine list, with your usual doses ready to use' },
      { icon: QrCode, text: 'Print your QR code for reception, posters or visiting cards' },
    ],
  },
  {
    icon: Sun,
    title: 'During OPD',
    tint: 'from-[#FFE9D9] to-white',
    items: [
      { icon: ListOrdered, text: 'See today’s queue and call the next patient in one tap' },
      { icon: UserPlus, text: 'Add walk-in patients alongside online bookings' },
      { icon: Stethoscope, text: 'Open a patient to see their reason for visit and past history' },
      { icon: FileText, text: 'Write the prescription and suggest tests, then share it with the patient' },
    ],
  },
  {
    icon: Sunset,
    title: 'After OPD',
    tint: 'from-[#FFE1CC] to-white',
    items: [
      { icon: CalendarCheck, text: 'Check follow-ups that are due today, upcoming or missed' },
      { icon: BarChart3, text: 'See the day’s patients, completed visits and collections' },
      { icon: History, text: 'Look back at any patient’s previous visits and prescriptions' },
      { icon: Bell, text: 'Get notified about new bookings and cancellations' },
    ],
  },
]

const HOSPITAL = [
  { icon: Stethoscope, text: 'Add doctors and give each a login' },
  { icon: Building2, text: 'Create departments' },
  { icon: Layers, text: 'Watch every doctor’s live queue' },
  { icon: Users, text: 'Hospital-wide patient list' },
  { icon: QrCode, text: 'One QR code for the whole hospital' },
  { icon: BarChart3, text: 'Reports and analytics' },
  { icon: ShieldCheck, text: 'Staff roles and access' },
  { icon: MessageSquare, text: 'Team chat' },
  { icon: ScrollText, text: 'Activity log of who did what' },
]

export default function ManageClinic() {
  const reduce = useReducedMotion()

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Reveal className="max-w-2xl space-y-3">
          <h2 className="text-[clamp(1.875rem,3.5vw,2.75rem)] font-extrabold tracking-tight text-[#171717]">How doctors run their clinic, day to day</h2>
          <p className="text-[#6B6B6B] max-w-[60ch]">
            Everything a doctor manages from one dashboard, from setting OPD hours in the morning to checking collections at night.
          </p>
        </Reveal>

        <StaggerContainer className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {DAY.map((phase, i) => {
            const PhaseIcon = phase.icon
            return (
              <MotionCard key={phase.title} className={`rounded-[28px] border border-orange-100/80 bg-gradient-to-b ${phase.tint} p-6 md:p-7 shadow-[0_18px_45px_-28px_rgba(23,23,23,0.25)]`}>
                {/* The day's progress: fills left to right as the section comes into view */}
                <motion.span
                  aria-hidden
                  initial={reduce ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.9, delay: 0.3 + i * 0.25, ease: EASE_OUT }}
                  className="absolute top-0 left-0 right-0 h-1 origin-left bg-[linear-gradient(90deg,#FF6A00,#FF8A3D,#FFB067)]"
                />
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#FF6A00] shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                    <PhaseIcon size={22} />
                  </span>
                  <h3 className="text-xl font-extrabold text-[#171717]">{phase.title}</h3>
                </div>
                <ul className="mt-5 space-y-4">
                  {phase.items.map((item, j) => {
                    const Icon = item.icon
                    return (
                      <motion.li
                        key={item.text}
                        initial={reduce ? false : { opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.6 }}
                        transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.2 + i * 0.1 + j * 0.06 }}
                        className="flex gap-3 text-sm text-[#171717]/80 leading-relaxed"
                      >
                        <Icon size={18} className="mt-0.5 shrink-0 text-[#FF6A00]" aria-hidden />
                        {item.text}
                      </motion.li>
                    )
                  })}
                </ul>
              </MotionCard>
            )
          })}
        </StaggerContainer>

        <Reveal delay={0.1} className="mt-8 rounded-[28px] border border-orange-100/70 bg-white/80 backdrop-blur-xl p-6 md:p-8 shadow-[0_18px_45px_-28px_rgba(23,23,23,0.25)]">
          <h3 className="text-lg font-extrabold text-[#171717]">Running a hospital? The admin dashboard adds:</h3>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {HOSPITAL.map((h, i) => {
              const Icon = h.icon
              return (
                <motion.li
                  key={h.text}
                  initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={reduce ? undefined : { y: -3 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: i * 0.04 }}
                  className="flex items-center gap-2 rounded-full border border-orange-100 bg-[#FFF3EA] px-4 py-2 text-sm font-semibold text-[#171717] transition-colors hover:border-orange-300"
                >
                  <Icon size={16} className="text-[#FF6A00]" aria-hidden /> {h.text}
                </motion.li>
              )
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

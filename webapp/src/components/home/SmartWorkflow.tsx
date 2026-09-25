import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Bot, CalendarCheck, Stethoscope, MessageCircle, LayoutDashboard, Sparkles, AlertTriangle, Pill } from 'lucide-react'
import { MotionCard, Reveal, StaggerContainer } from '../motion'
import { EASE_OUT } from '../../lib/motion'

// Two AI layers, both real: "MedTechFixaters AI" is built in (booking, website assistant,
// follow-up automation, CRM) and uses no external model; "Gemini" powers the doctor-only clinical
// suggestions. WhatsApp reminders need a provider, so that part is labelled as coming soon.
type Badge = 'MedTechFixaters AI' | 'Gemini'

const CARDS: { icon: typeof Bot; kicker: string; title: string; body: string; badge: Badge }[] = [
  {
    icon: Bot,
    kicker: 'AI booking',
    title: 'Book by just saying what you need',
    body: 'Patients type “skin doctor tomorrow” or “Dr. Rahul on Monday”. The assistant understands the date, specialty and doctor, shows only real availability, and books a real token.',
    badge: 'MedTechFixaters AI',
  },
  {
    icon: MessageCircle,
    kicker: 'Website assistant',
    title: 'Answers visitors, safely',
    body: 'Answers questions about your clinic and the platform from approved public information only. It never reveals private data and never diagnoses.',
    badge: 'MedTechFixaters AI',
  },
  {
    icon: CalendarCheck,
    kicker: 'Automatic follow-up',
    title: 'Follow-up reminders that go out on time',
    body: 'Reminders before, on and after the follow-up date, only to patients who agreed. Email is live; WhatsApp is coming soon.',
    badge: 'MedTechFixaters AI',
  },
  {
    icon: LayoutDashboard,
    kicker: 'CRM management',
    title: 'A CRM that tells you what to do next',
    body: 'Today’s and overdue follow-ups, patients who haven’t returned, failed reminders, and ready-to-send message drafts, from your live records.',
    badge: 'MedTechFixaters AI',
  },
  {
    icon: Pill,
    kicker: 'Clinical AI',
    title: 'Medicine and test suggestions',
    body: 'During a consultation, doctors can ask for medicines and tests to consider, with reasons, confidence and allergy warnings. The doctor reviews and adds each one.',
    badge: 'Gemini',
  },
  {
    icon: Stethoscope,
    kicker: 'Clinical AI',
    title: 'Clear advice for patients',
    body: 'The doctor jots a short note; AI turns it into clear, kind patient advice for the doctor to edit and use. Never sent to a patient automatically.',
    badge: 'Gemini',
  },
]

const BADGE_STYLE: Record<Badge, string> = {
  'MedTechFixaters AI': 'bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] text-white',
  Gemini: 'bg-[#171717] text-white',
}

// Sample events for the illustration; not real patients.
const EVENTS = [
  { icon: Bot, text: 'Booked “skin doctor tomorrow” with Dr. Mehta', meta: 'AI booking · D-005' },
  { icon: AlertTriangle, text: 'Emergency words spotted: advised to call 112', meta: 'AI booking' },
  { icon: CalendarCheck, text: 'Follow-up reminder emailed to 12 patients', meta: 'Automatic follow-up' },
  { icon: Sparkles, text: '3 overdue follow-ups: call them today', meta: 'CRM next action' },
  { icon: Pill, text: '4 medicines suggested, doctor added 2', meta: 'Gemini clinical AI' },
  { icon: Stethoscope, text: 'Advice draft ready for the doctor to review', meta: 'Gemini clinical AI' },
]

function ActivityFeed() {
  const reduce = useReducedMotion()
  const [start, setStart] = useState(0)

  useEffect(() => {
    if (reduce) return
    const t = window.setInterval(() => setStart((s) => (s + 1) % EVENTS.length), 2600)
    return () => window.clearInterval(t)
  }, [reduce])

  const visible = [0, 1, 2, 3].map((i) => EVENTS[(start + i) % EVENTS.length])

  return (
    <div aria-hidden className="relative">
      <div className="absolute -inset-8 rounded-full bg-[#FF8A3D]/20 blur-3xl" />
      <div className="relative rounded-[28px] border border-orange-100 bg-white/90 p-5 backdrop-blur-xl shadow-[0_30px_70px_-40px_rgba(255,106,0,0.55)]">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-extrabold text-[#171717]"><Sparkles size={15} className="text-[#FF6A00]" /> MedTechFixaters AI · today</p>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 motion-reduce:animate-none" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        </div>
        <ul className="mt-4 space-y-2.5">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((e, i) => {
              const Icon = e.icon
              return (
                <motion.li
                  key={e.text}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: -16, filter: 'blur(6px)' }}
                  animate={{ opacity: i === 3 ? 0.45 : 1, y: 0, filter: 'blur(0px)' }}
                  exit={reduce ? undefined : { opacity: 0, y: 16, filter: 'blur(6px)' }}
                  transition={{ duration: 0.5, ease: EASE_OUT }}
                  className="flex items-center gap-3 rounded-2xl border border-orange-100/70 bg-[#FFF9F5] px-3.5 py-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] text-white">
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[#171717]">{e.text}</p>
                    <p className="text-[11px] text-[#6B6B6B]">{e.meta}</p>
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  )
}

export default function SmartWorkflow() {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <Reveal className="space-y-4">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] px-3 py-1 text-xs font-bold text-white">
              <Sparkles size={13} /> MedTechFixaters AI
            </p>
            <h2 className="text-[clamp(1.875rem,3.5vw,2.75rem)] font-extrabold tracking-tight text-[#171717]">
              AI that works beyond appointment booking
            </h2>
            <p className="text-[#6B6B6B] max-w-[52ch]">
              Built-in AI books appointments from plain language, answers visitors, sends follow-up reminders and runs your CRM.
              For doctors, Gemini-powered clinical assistance suggests medicines, tests and patient advice. AI suggests; the doctor decides.
            </p>
          </Reveal>
          <ActivityFeed />
        </div>

        <StaggerContainer as="ul" stagger={0.07} className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CARDS.map((c) => {
            const Icon = c.icon
            return (
              <MotionCard
                as="li"
                key={c.title}
                className="rounded-[24px] border border-orange-100/70 bg-white/80 p-5 backdrop-blur-xl shadow-[0_15px_35px_-28px_rgba(23,23,23,0.35)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6A00]">
                    <Icon size={20} />
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${BADGE_STYLE[c.badge]}`}>{c.badge}</span>
                </div>
                <p className="mt-4 text-xs font-extrabold uppercase tracking-wider text-[#C2410C]">{c.kicker}</p>
                <h3 className="mt-1 text-lg font-extrabold text-[#171717]">{c.title}</h3>
                <p className="mt-1.5 text-sm text-[#6B6B6B] leading-relaxed">{c.body}</p>
              </MotionCard>
            )
          })}
        </StaggerContainer>
      </div>
    </section>
  )
}

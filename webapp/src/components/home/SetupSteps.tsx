import { motion, useReducedMotion } from 'framer-motion'
import { Building2, Users, CalendarCheck, Check } from 'lucide-react'
import { MotionCard, Reveal, StaggerContainer } from '../motion'
import { EASE_OUT, SPRING_UI } from '../../lib/motion'

const STEPS = [
  {
    icon: Building2,
    title: 'Create your clinic profile',
    body: 'A guided setup walks you through your clinic’s name, address, timings and departments.',
    preview: ['Clinic name & address', 'OPD timings', 'Departments'],
  },
  {
    icon: Users,
    title: 'Add your team',
    body: 'Invite your doctors and staff. Each person gets access that matches their role.',
    preview: ['Doctors', 'Reception', 'Admin'],
  },
  {
    icon: CalendarCheck,
    title: 'Schedule and manage bookings',
    body: 'Set each doctor’s availability and patients can book only the slots that are open.',
    preview: ['Weekly availability', 'Leave days', 'Live bookings'],
  },
]

// First section after the hero: how quickly a clinic gets going.
export default function SetupSteps() {
  const reduce = useReducedMotion()
  return (
    <section className="py-8 sm:py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Reveal className="max-w-2xl mx-auto text-center space-y-2.5 sm:space-y-3">
          <p className="text-xs sm:text-sm font-bold text-[#C2410C]">Quick to start</p>
          <h2 className="text-[clamp(1.5rem,5vw,2.75rem)] font-extrabold tracking-tight text-[#171717]">
            Set up MedTech Fixaters in 3 simple steps
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#6B6B6B]">
            Get your OPD software running quickly, so you can start managing your clinic with ease.
          </p>
        </Reveal>

        <StaggerContainer as="ul" stagger={0.12} className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <MotionCard
                as="li"
                key={s.title}
                className="relative rounded-2xl sm:rounded-[28px] border border-orange-100/70 bg-white/80 backdrop-blur-xl p-4.5 sm:p-6 md:p-7 shadow-[0_12px_35px_-20px_rgba(23,23,23,0.18)]"
              >
                <div className="flex items-center justify-between">
                  <motion.span
                    whileHover={reduce ? undefined : { scale: 1.08, rotate: -4 }}
                    transition={SPRING_UI}
                    className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] text-white shadow-[0_8px_20px_-6px_rgba(255,106,0,0.55)]"
                  >
                    <Icon size={19} className="sm:hidden" />
                    <Icon size={22} className="hidden sm:block" />
                  </motion.span>
                  <span className="rounded-full bg-orange-50 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-extrabold text-[#C2410C]">Step {i + 1}</span>
                </div>

                <h3 className="mt-3.5 sm:mt-5 text-base sm:text-lg font-extrabold text-[#171717]">{s.title}</h3>
                <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">{s.body}</p>

                {/* Small checklist preview that fills in as the card arrives */}
                <ul className="mt-3.5 sm:mt-5 space-y-1.5 sm:space-y-2 rounded-xl sm:rounded-2xl border border-orange-100/70 bg-[#FFF9F5] p-3 sm:p-4" aria-hidden>
                  {s.preview.map((item, j) => (
                    <motion.li
                      key={item}
                      initial={reduce ? false : { opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.8 }}
                      transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.3 + i * 0.12 + j * 0.1 }}
                      className="flex items-center gap-2 sm:gap-2.5 text-[11px] sm:text-xs font-semibold text-[#171717]"
                    >
                      <span className="flex h-4 w-4 sm:h-[18px] sm:w-[18px] items-center justify-center rounded-full bg-[#FF6A00] text-white shrink-0">
                        <Check size={10} strokeWidth={3} />
                      </span>
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </MotionCard>
            )
          })}
        </StaggerContainer>
      </div>
    </section>
  )
}

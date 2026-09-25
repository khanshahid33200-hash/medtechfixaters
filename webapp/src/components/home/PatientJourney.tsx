import { motion, useReducedMotion } from 'framer-motion'
import { QrCode, Smartphone, Stethoscope } from 'lucide-react'
import { MotionCard, Reveal, StaggerContainer } from '../motion'
import { EASE_OUT, SPRING_UI } from '../../lib/motion'

const STEPS = [
  {
    icon: QrCode,
    title: 'Scan the QR code',
    body: 'Patients scan the code at your reception or on your poster, pick a doctor and get a token number.',
  },
  {
    icon: Smartphone,
    title: 'Wait from anywhere',
    body: 'Their phone shows the live queue and tells them when their turn is close. No crowd at the counter.',
  },
  {
    icon: Stethoscope,
    title: 'Meet the doctor',
    body: 'The doctor already sees the reason for the visit and past history, then writes the prescription.',
  },
]

export default function PatientJourney() {
  const reduce = useReducedMotion()
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Reveal className="max-w-2xl space-y-3">
          <h2 className="text-[clamp(1.875rem,3.5vw,2.75rem)] font-extrabold tracking-tight text-[#171717]">How a visit works for your patients</h2>
          <p className="text-[#6B6B6B] max-w-[60ch]">Three steps, all from the patient's own phone. Nothing to install.</p>
        </Reveal>

        <div className="relative mt-8">
          {/* Connector drawing itself across the three steps */}
          <motion.span
            aria-hidden
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.2 }}
            className="hidden md:block absolute top-[52px] left-[16%] right-[16%] h-0.5 origin-left bg-[linear-gradient(90deg,#FFB067,#FF6A00,#FFB067)]"
          />
          <StaggerContainer as="ul" stagger={0.12} className="relative grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <MotionCard
                  as="li"
                  key={s.title}
                  className="rounded-[28px] border border-orange-100/70 bg-white/80 backdrop-blur-xl p-6 md:p-7 shadow-[0_18px_45px_-28px_rgba(23,23,23,0.25)]"
                >
                  <div className="flex md:flex-col md:items-center md:text-center gap-5">
                    <motion.span
                      whileHover={reduce ? undefined : { scale: 1.08, rotate: -4 }}
                      transition={SPRING_UI}
                      className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] text-white shadow-[0_10px_25px_-8px_rgba(255,106,0,0.55)]"
                    >
                      <Icon size={24} />
                      <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-extrabold text-[#C2410C] ring-2 ring-orange-100">{i + 1}</span>
                    </motion.span>
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-extrabold text-[#171717]">{s.title}</h3>
                      <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-[34ch] md:mx-auto">{s.body}</p>
                    </div>
                  </div>
                </MotionCard>
              )
            })}
          </StaggerContainer>
        </div>
      </div>
    </section>
  )
}

import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Lock, ShieldCheck, HeartHandshake, Eye } from 'lucide-react'
import { MotionCard, Reveal, StaggerContainer } from '../motion'
import { TIMING } from '../../lib/motion'

// Every claim here is backed by the privacy policy (/privacy). Do not add certification or
// hosting-provider claims that the policy does not make.
const POINTS = [
  { icon: Lock, title: 'Strong encryption', body: 'Data is encrypted in transit (TLS) and at rest, and every sign-in is tied to a unique user.' },
  { icon: ShieldCheck, title: 'Every clinic kept separate', body: 'Row-level security keeps each clinic’s patients and records apart, and staff see only what their role allows.' },
  { icon: HeartHandshake, title: 'Your data stays yours', body: 'We never sell, rent or trade your clinic’s or your patients’ data.' },
  { icon: Eye, title: 'Full transparency', body: 'Audit logs record important changes, and our privacy policy explains exactly how data is handled.' },
]

// The page's orange gradient moment. Card text sits on white for readability.
export default function TrustSection() {
  const reduce = useReducedMotion()
  const drift = { duration: TIMING.ambient, repeat: Infinity, ease: 'easeInOut' as const }

  return (
    <section className="px-4 sm:px-6 py-8 md:py-10">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#FF6A00_0%,#FF9A5B_100%)] px-6 py-12 md:px-12 md:py-14 shadow-[0_40px_80px_-40px_rgba(255,106,0,0.7)]">
        {/* Slowly moving soft shapes */}
        <motion.div
          aria-hidden
          className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/25 blur-3xl"
          animate={reduce ? undefined : { x: [0, -30, 10, 0], y: [0, 20, -10, 0] }}
          transition={drift}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-32 left-10 h-96 w-96 rounded-full bg-[#FFB067]/40 blur-3xl"
          animate={reduce ? undefined : { x: [0, 40, -10, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ ...drift, duration: TIMING.ambient + 3 }}
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <Reveal className="lg:col-span-5 space-y-4">
            <h2 className="text-[clamp(1.875rem,3.5vw,2.75rem)] font-extrabold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(120,40,0,0.25)]">
              Your clinic’s data is secure and protected
            </h2>
            <p className="text-lg font-medium text-[#2B1405] max-w-[46ch]">
              Patient data is sensitive, and we treat it that way. Security is built into every layer of MedTech Fixaters, not added on top.
            </p>
            <Link
              to="/privacy"
              className="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#C2410C] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              Read our privacy policy
            </Link>
          </Reveal>

          <StaggerContainer as="ul" className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {POINTS.map((p) => {
              const Icon = p.icon
              return (
                <MotionCard
                  as="li"
                  key={p.title}
                  className="rounded-[24px] border border-white/60 bg-white/85 p-6 backdrop-blur-xl shadow-[0_20px_40px_-24px_rgba(90,30,0,0.45)]"
                >
                  <div className="flex flex-col gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] text-white transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                      <Icon size={22} />
                    </span>
                    <div className="space-y-1">
                      <h3 className="text-lg font-extrabold text-[#171717]">{p.title}</h3>
                      <p className="text-[#6B6B6B]">{p.body}</p>
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

import { motion, useReducedMotion } from 'framer-motion'
import { CalendarDays, Activity, IndianRupee, Users, Stethoscope, CalendarCheck, Palette, PhoneOff } from 'lucide-react'
import { MotionCard, Reveal, StaggerContainer } from '../motion'
import { EASE_OUT, slideLeft, slideRight } from '../../lib/motion'

const DASHBOARD_POINTS = [
  { icon: CalendarDays, title: 'Appointment overview', body: 'Track bookings, walk-ins and online appointments in one place.' },
  { icon: Activity, title: 'Live patient status', body: 'See who is waiting, with the doctor, done or cancelled.' },
  { icon: IndianRupee, title: 'Revenue overview', body: 'Monitor billing and collections for any day or period.' },
  { icon: Users, title: 'Doctor-wise activity', body: 'See appointment load per doctor before the OPD slows down.' },
]

const WEBSITE_POINTS = [
  { icon: Stethoscope, title: 'Doctor and department details', body: 'Show profiles, specialisations, departments and services.' },
  { icon: CalendarCheck, title: 'Online appointment booking', body: 'Patients pick a suitable slot straight from your website.' },
  { icon: Palette, title: 'Your look and feel', body: 'Colours and design that match your clinic’s brand.' },
  { icon: PhoneOff, title: 'Fewer front desk calls', body: 'Patients book directly instead of calling to ask for slots.' },
]

type Point = (typeof DASHBOARD_POINTS)[number]

function PointGrid({ points }: { points: readonly Point[] }) {
  return (
    <StaggerContainer as="ul" stagger={0.08} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {points.map((p) => {
        const Icon = p.icon
        return (
          <MotionCard
            as="li"
            key={p.title}
            className="rounded-2xl border border-orange-100/70 bg-white/80 p-4 backdrop-blur-xl shadow-[0_12px_30px_-24px_rgba(23,23,23,0.3)]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#FF6A00]">
              <Icon size={18} />
            </span>
            <h4 className="mt-3 text-sm font-extrabold text-[#171717]">{p.title}</h4>
            <p className="mt-1 text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">{p.body}</p>
          </MotionCard>
        )
      })}
    </StaggerContainer>
  )
}

// Illustrative dashboard, drawn in code. Numbers are sample values, not real data.
function DashboardMock() {
  const reduce = useReducedMotion()
  const bars = [42, 68, 55, 80, 62, 90, 74]
  const kpis = [
    ['Appointments', '48'],
    ['Waiting', '9'],
    ['Completed', '31'],
    ['Collections', '₹18,400'],
  ]
  return (
    <div aria-hidden className="rounded-[24px] border border-orange-100 bg-white p-4 sm:p-5 shadow-[0_30px_70px_-40px_rgba(255,106,0,0.5)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold text-[#171717]">Today at a glance</p>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Live</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {kpis.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-[#FFF9F5] border border-orange-100/70 p-2.5">
            <p className="text-[10px] font-semibold text-[#6B6B6B]">{label}</p>
            <p className="text-base sm:text-lg font-extrabold text-[#171717]">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-orange-100/70 p-3">
        <p className="text-[10px] font-semibold text-[#6B6B6B]">Patients per doctor</p>
        <div className="mt-2 flex h-24 items-end gap-2">
          {bars.map((h, i) => (
            <motion.span
              key={i}
              initial={reduce ? false : { scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.2 + i * 0.06 }}
              style={{ height: `${h}%` }}
              className="flex-1 origin-bottom rounded-t-md bg-[linear-gradient(180deg,#FF8A3D,#FF6A00)]"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Illustrative clinic website, drawn in code.
function WebsiteMock() {
  const reduce = useReducedMotion()
  const slots = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30']
  return (
    <div aria-hidden className="rounded-[24px] border border-orange-100 bg-white shadow-[0_30px_70px_-40px_rgba(255,106,0,0.5)] overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-orange-100/70 bg-[#FFF9F5] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-orange-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-orange-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-orange-200" />
        <span className="ml-3 flex-1 truncate rounded-full bg-white px-3 py-0.5 text-[10px] text-[#6B6B6B] border border-orange-100/70">yourclinic.in</span>
      </div>
      <div className="p-4 sm:p-5">
        <p className="text-sm font-extrabold text-[#171717]">Book with our doctors</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {['General Medicine', 'Paediatrics'].map((dept) => (
            <div key={dept} className="flex items-center gap-2 rounded-xl border border-orange-100/70 p-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[#FF6A00]">
                <Stethoscope size={15} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-[#171717]">Doctor profile</p>
                <p className="truncate text-[10px] text-[#6B6B6B]">{dept}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[10px] font-semibold text-[#6B6B6B]">Pick a slot</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {slots.map((s, i) => (
            <motion.span
              key={s}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.2 + i * 0.05 }}
              className={`rounded-lg py-1.5 text-center text-[11px] font-bold ${i === 2 ? 'bg-[#FF6A00] text-white' : 'border border-orange-100 text-[#171717]'}`}
            >
              {s}
            </motion.span>
          ))}
        </div>
        <div className="mt-4 rounded-full bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] py-2 text-center text-xs font-bold text-white">Confirm appointment</div>
      </div>
    </div>
  )
}

export default function WhatWeOffer() {
  const reduce = useReducedMotion()
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Reveal className="max-w-2xl mx-auto text-center space-y-3">
          <p className="text-sm font-bold text-[#C2410C]">What we offer</p>
          <h2 className="text-[clamp(1.875rem,3.5vw,2.75rem)] font-extrabold tracking-tight text-[#171717]">
            Simple, thoughtful tools at your fingertips
          </h2>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <Reveal>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#171717]">See your clinic’s day at a glance</h3>
              <p className="mt-2 text-sm sm:text-base text-[#6B6B6B] max-w-[56ch]">
                Daily OPD activity, patient flow and clinic performance on one dashboard, so owners and admins decide faster without manual reports or switching screens.
              </p>
            </Reveal>
            <PointGrid points={DASHBOARD_POINTS} />
          </div>
          <motion.div variants={reduce ? undefined : slideLeft} initial={reduce ? false : 'hidden'} whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
            <DashboardMock />
          </motion.div>
        </div>

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div
            className="order-2 lg:order-1"
            variants={reduce ? undefined : slideRight}
            initial={reduce ? false : 'hidden'}
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <WebsiteMock />
          </motion.div>
          <div className="order-1 lg:order-2">
            <Reveal>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#171717]">A website for your clinic, with online booking</h3>
              <p className="mt-2 text-sm sm:text-base text-[#6B6B6B] max-w-[56ch]">
                A simple clinic website where patients see your doctors, departments and services, and book online without calling the front desk. Free on yearly plans.
              </p>
            </Reveal>
            <PointGrid points={WEBSITE_POINTS} />
          </div>
        </div>
      </div>
    </section>
  )
}

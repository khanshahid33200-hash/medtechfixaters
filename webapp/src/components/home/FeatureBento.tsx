import { MonitorPlay, FileText, CalendarClock } from 'lucide-react'
import { MotionCard, ParallaxElement, Reveal, StaggerContainer } from '../motion'

const CARD = 'rounded-[28px] border border-orange-100/70 bg-white/80 backdrop-blur-xl shadow-[0_18px_45px_-28px_rgba(23,23,23,0.25)]'

export default function FeatureBento() {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Reveal className="max-w-2xl space-y-3">
          <h2 className="text-[clamp(1.875rem,3.5vw,2.75rem)] font-extrabold tracking-tight text-[#171717]">What your team uses every day</h2>
          <p className="text-[#6B6B6B] max-w-[60ch]">Doctors, reception and management each get their own screen, all working from the same up-to-date information.</p>
        </Reveal>

        <StaggerContainer className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <MotionCard className={`${CARD} md:col-span-2 lg:row-span-2`}>
            <div className="flex h-full flex-col">
              <div className="relative h-64 md:h-80 lg:flex-1 overflow-hidden">
                <ParallaxElement speed={24} className="absolute -inset-y-8 inset-x-0">
                  <img
                    src="/assets/docon_doctor.jpg"
                    alt="A doctor at his desk in a clinic"
                    width={1200}
                    height={896}
                    loading="lazy"
                    className="h-full w-full object-cover object-[center_30%] transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none"
                  />
                </ParallaxElement>
              </div>
              <div className="p-6 md:p-7 space-y-2">
                <h3 className="text-xl font-extrabold text-[#171717]">Doctor workspace</h3>
                <p className="text-[#6B6B6B] max-w-[52ch]">Today's patients, their history, prescriptions and follow-ups on one screen. Each doctor sees only their own patients.</p>
              </div>
            </div>
          </MotionCard>

          <MotionCard className="rounded-[28px] border border-orange-100 bg-[linear-gradient(160deg,#FFE9D9,#FFF9F5)] p-6 md:p-7">
            <div className="space-y-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#FF6A00] shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"><MonitorPlay size={22} /></span>
              <h3 className="text-lg font-extrabold text-[#171717]">Reception and live queue</h3>
              <p className="text-sm text-[#171717]/75 leading-relaxed">Add walk-in patients, call the next token and show the queue on a waiting-room TV.</p>
            </div>
          </MotionCard>

          <MotionCard className={`${CARD} p-6 md:p-7`}>
            <div className="space-y-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6A00] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"><FileText size={22} /></span>
              <h3 className="text-lg font-extrabold text-[#171717]">Digital prescriptions</h3>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">Pick medicines from your own list, check the dose and share the prescription as a PDF.</p>
            </div>
          </MotionCard>

          <MotionCard className="rounded-[28px] border border-transparent bg-[linear-gradient(135deg,#FF6A00_0%,#FF9A5B_100%)] p-6 md:p-7 text-white shadow-[0_20px_45px_-20px_rgba(255,106,0,0.6)]">
            <div className="space-y-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"><CalendarClock size={22} /></span>
              <h3 className="text-lg font-extrabold">Follow-ups that happen</h3>
              <p className="text-sm font-medium text-[#3B1D08] leading-relaxed">Book the next visit before the patient leaves. It appears in their doctor's queue on the day.</p>
            </div>
          </MotionCard>

          <MotionCard className={`${CARD} md:col-span-1 lg:col-span-2`}>
            <div className="grid h-full grid-cols-1 sm:grid-cols-2">
              <div className="relative h-56 sm:h-full overflow-hidden">
                <img
                  src="/assets/medical_team.jpg"
                  alt="A hospital team of doctors and nurses"
                  width={1376}
                  height={768}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none"
                />
              </div>
              <div className="p-6 md:p-7 space-y-2 self-center">
                <h3 className="text-lg font-extrabold text-[#171717]">Hospital dashboard</h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">Manage doctors and departments, and see daily reports on appointments and collections.</p>
              </div>
            </div>
          </MotionCard>
        </StaggerContainer>
      </div>
    </section>
  )
}

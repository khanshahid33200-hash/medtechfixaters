import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Building2, Users, CalendarCheck, Check, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [activeStep, setActiveStep] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const dragStartX = useRef<number | null>(null)
  const dragStartY = useRef<number | null>(null)
  const isHorizontalSwipe = useRef<boolean>(false)
  const isDragging = useRef<boolean>(false)

  const handleNext = useCallback(() => {
    setActiveStep((prev) => (prev + 1) % STEPS.length)
  }, [])

  const handlePrev = useCallback(() => {
    setActiveStep((prev) => (prev - 1 + STEPS.length) % STEPS.length)
  }, [])

  // Auto-slide effect on mobile (slides every 3.8s, pauses on touch or hover)
  useEffect(() => {
    if (isPaused || reduce) return

    const timer = setInterval(() => {
      handleNext()
    }, 3800)

    return () => clearInterval(timer)
  }, [isPaused, reduce, handleNext, activeStep])

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true)
    dragStartX.current = e.touches[0].clientX
    dragStartY.current = e.touches[0].clientY
    isHorizontalSwipe.current = false
    isDragging.current = true
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || dragStartX.current === null || dragStartY.current === null) return
    const diffX = Math.abs(e.touches[0].clientX - dragStartX.current)
    const diffY = Math.abs(e.touches[0].clientY - dragStartY.current)
    if (diffX > diffY && diffX > 10) {
      isHorizontalSwipe.current = true
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false)
    if (isDragging.current && isHorizontalSwipe.current && dragStartX.current !== null) {
      const endX = e.changedTouches[0].clientX
      const diff = dragStartX.current - endX
      if (diff > 35) {
        handleNext()
      } else if (diff < -35) {
        handlePrev()
      }
    }
    dragStartX.current = null
    dragStartY.current = null
    isHorizontalSwipe.current = false
    isDragging.current = false
  }

  // Mouse handlers for desktop browser emulation / testing
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPaused(true)
    dragStartX.current = e.clientX
    isDragging.current = true
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsPaused(false)
    if (isDragging.current && dragStartX.current !== null) {
      const diff = dragStartX.current - e.clientX
      if (diff > 35) {
        handleNext()
      } else if (diff < -35) {
        handlePrev()
      }
    }
    dragStartX.current = null
    isDragging.current = false
  }

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

        {/* Mobile View: Sidewise Auto-sliding Cards */}
        <div className="block md:hidden mt-6">
          <div
            className="relative overflow-hidden w-full cursor-grab active:cursor-grabbing select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => {
              setIsPaused(false)
              isDragging.current = false
            }}
          >
            <motion.div
              className="flex"
              animate={{ x: `-${activeStep * 100}%` }}
              transition={
                reduce
                  ? { duration: 0.1 }
                  : { type: 'spring', stiffness: 280, damping: 30 }
              }
            >
              {STEPS.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={s.title} className="w-full shrink-0 px-1">
                    <div className="relative rounded-2xl border border-orange-100/80 bg-white/90 backdrop-blur-xl p-5 shadow-[0_12px_35px_-20px_rgba(23,23,23,0.18)] min-h-[300px] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#FF6A00,#FF8A3D)] text-white shadow-[0_8px_20px_-6px_rgba(255,106,0,0.55)]">
                            <Icon size={19} />
                          </span>
                          <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-extrabold text-[#C2410C]">
                            Step {i + 1}
                          </span>
                        </div>

                        <h3 className="mt-3.5 text-base font-extrabold text-[#171717]">
                          {s.title}
                        </h3>
                        <p className="mt-1 text-xs text-[#6B6B6B] leading-relaxed">
                          {s.body}
                        </p>
                      </div>

                      {/* Small checklist preview */}
                      <ul
                        className="mt-3.5 space-y-1.5 rounded-xl border border-orange-100/70 bg-[#FFF9F5] p-3"
                        aria-hidden
                      >
                        {s.preview.map((item) => (
                          <li
                            key={item}
                            className="flex items-center gap-2 text-[11px] font-semibold text-[#171717]"
                          >
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6A00] text-white shrink-0">
                              <Check size={10} strokeWidth={3} />
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </motion.div>
          </div>

          {/* Navigation Controls: Animated Dots + Step Count + Prev/Next Buttons */}
          <div className="mt-4 flex items-center justify-between px-2">
            {/* Step indicator pills with auto-slide progress fill */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setActiveStep(i)
                    setIsPaused(true)
                    setTimeout(() => setIsPaused(false), 3000)
                  }}
                  aria-label={`Go to step ${i + 1}`}
                  className={`relative h-2 rounded-full transition-all duration-300 overflow-hidden ${
                    activeStep === i
                      ? 'w-8 bg-orange-100'
                      : 'w-2 bg-orange-200/70 hover:bg-orange-300'
                  }`}
                >
                  {activeStep === i && (
                    <motion.span
                      key={`prog-${activeStep}-${isPaused}`}
                      initial={{ width: '0%' }}
                      animate={{ width: isPaused ? '100%' : '100%' }}
                      transition={{
                        duration: isPaused ? 0.2 : 3.8,
                        ease: 'linear',
                      }}
                      className="absolute inset-0 bg-[#FF6A00] rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Step Counter & Arrow Controls */}
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-bold text-[#6B6B6B]">
                Step {activeStep + 1} of {STEPS.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    handlePrev()
                    setIsPaused(true)
                    setTimeout(() => setIsPaused(false), 3000)
                  }}
                  aria-label="Previous step"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-orange-200/80 bg-white text-stone-700 shadow-sm transition hover:bg-orange-50 active:scale-90"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleNext()
                    setIsPaused(true)
                    setTimeout(() => setIsPaused(false), 3000)
                  }}
                  aria-label="Next step"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-orange-200/80 bg-white text-stone-700 shadow-sm transition hover:bg-orange-50 active:scale-90"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop View: 3-column Grid (hidden on mobile) */}
        <StaggerContainer as="ul" stagger={0.12} className="hidden md:grid md:grid-cols-3 gap-5 mt-8">
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


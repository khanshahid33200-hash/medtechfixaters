import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, CheckCircle2, Play, Sparkles } from 'lucide-react'
import { PRIMARY_BUTTON, SPRING_UI } from '../../lib/motion'
import HeroPhone from './HeroPhone'

// Spring entrance used across the home page (same feel as the previous design).
export const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (custom = 0) => ({
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 18, delay: custom * 0.08 },
  }),
}

// Primary orange gradient button (shared with the rest of the home page).
export const ctaGradient = PRIMARY_BUTTON

// Blur-in entrance: each hero element comes into focus in sequence.
const blurIn = {
  hidden: { opacity: 0, y: 28, filter: 'blur(12px)' },
  visible: (custom = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring' as const, stiffness: 90, damping: 20, delay: 0.1 + custom * 0.12 },
  }),
}

export default function HomeHero() {
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll()
  const { scrollYProgress: heroProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  // Spring-smoothed scroll, so every scroll-linked effect glides instead of snapping.
  const smooth = useSpring(heroProgress, { stiffness: 120, damping: 30, mass: 0.4 })
  const pageProgress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 })

  const textOpacity = useTransform(smooth, [0, 0.7], [1, 0])
  const textY = useTransform(smooth, [0, 1], [0, -90])
  const textBlur = useTransform(smooth, [0, 0.7], ['blur(0px)', 'blur(10px)'])
  const imageY = useTransform(smooth, [0, 1], [0, -160])
  const imageScale = useTransform(smooth, [0, 1], [1, 0.9])
  const bgScale = useTransform(smooth, [0, 1], [1.08, 1.2])
  const glowY = useTransform(smooth, [0, 1], [0, 120])

  const anim = reduce ? {} : { variants: blurIn, initial: 'hidden', animate: 'visible' }
  const bg = { backgroundImage: "url('/assets/hero-hospital-bg.jpg')" }

  return (
    <>
      {/* Reading-progress bar */}
      {!reduce && (
        <motion.div
          style={{ scaleX: pageProgress }}
          className="fixed top-0 left-0 right-0 h-1 bg-[linear-gradient(90deg,#FF6A00,#FF8A3D,#FFB067)] origin-left z-[100] pointer-events-none"
        />
      )}

      <section ref={sectionRef} className="relative bg-[#0E0B0A] pt-24 sm:pt-32 pb-20 sm:pb-32 lg:pb-36 px-4 sm:px-6 overflow-hidden">
        {/* Background photo with a slow parallax zoom */}
        <motion.div aria-hidden style={reduce ? bg : { ...bg, scale: bgScale }} className="absolute inset-0 bg-cover bg-top will-change-transform" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/15 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Soft blurred orange light behind the headline */}
        <motion.div aria-hidden style={reduce ? undefined : { y: glowY }} className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-[#FF6A00]/30 blur-[120px]"
            animate={reduce ? undefined : { opacity: [0.55, 0.85, 0.55], scale: [1, 1.08, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute left-[28%] top-[45%] h-[300px] w-[300px] rounded-full bg-[#FF8A3D]/20 blur-[110px]"
            animate={reduce ? undefined : { opacity: [0.4, 0.7, 0.4], x: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-8 items-center relative z-10">
          <motion.div
            style={reduce ? undefined : { opacity: textOpacity, y: textY, filter: textBlur }}
            className="lg:col-span-6 text-left space-y-4 sm:space-y-6 will-change-transform"
          >
            <motion.div
              {...anim}
              custom={0}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 sm:px-3.5 sm:py-1.5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            >
              <Sparkles size={12} className="text-orange-300 animate-pulse motion-reduce:animate-none" />
              <span className="text-[11px] sm:text-xs font-bold text-orange-200">For clinics and hospitals in India</span>
            </motion.div>

            <motion.h1 {...anim} custom={1} className="text-[clamp(1.85rem,6.5vw,4rem)] font-extrabold tracking-[-0.035em] text-white leading-[1.1]">
              Run your OPD
              <br />
              <span className="bg-gradient-to-r from-[#FFB067] via-[#FF8A3D] to-[#FF6A00] bg-clip-text text-transparent pb-1">
                without the crowd.
              </span>
            </motion.h1>

            <motion.p {...anim} custom={2} className="text-sm sm:text-base md:text-lg text-slate-200 leading-relaxed max-w-[46ch]">
              Patients book by scanning your QR code and follow their turn on their phone. Doctors prescribe in seconds.
            </motion.p>

            <motion.div {...anim} custom={3} className="space-y-3.5 pt-1 sm:pt-2">
              <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3.5">
                <motion.div whileHover={reduce ? undefined : { scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }} transition={SPRING_UI} className="w-full sm:w-auto">
                  <Link
                    to="/login"
                    className={`w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 rounded-full ${ctaGradient} font-bold text-xs sm:text-sm flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300`}
                  >
                    Try it for free <ArrowRight size={15} />
                  </Link>
                </motion.div>
                <motion.div whileHover={reduce ? undefined : { scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }} transition={SPRING_UI} className="w-full sm:w-auto">
                  <a
                    href="#how-it-works"
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById('how-it-works')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
                    }}
                    className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Play size={13} fill="currentColor" className="text-[#FF8A3D]" /> See how it works
                  </a>
                </motion.div>
              </div>

              {/* Free Trial Trust Highlights */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] sm:text-xs text-slate-300 font-medium pt-1">
                <span className="flex items-center gap-1.5 text-orange-200 font-semibold">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  Start your free trial
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  All Features, Zero Cost
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  No Credit Card Required
                </span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div style={reduce ? undefined : { y: imageY, scale: imageScale }} className="lg:col-span-6 relative flex items-center justify-center will-change-transform">
            <HeroPhone />
          </motion.div>
        </div>

        {/* Soft curve melting the dark hero into the light page */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none pointer-events-none z-10">
          <svg className="relative block w-full h-20 sm:h-28 lg:h-36 text-[#FFF9F5] fill-current" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden>
            <path d="M0,0 C480,240 960,240 1440,0 L1440,320 L0,320 Z" />
          </svg>
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#FFF9F5] via-[#FFF9F5]/80 to-transparent" />
        </div>
      </section>
    </>
  )
}

/** Three plain facts that answer a visitor's first practical questions. */
export function HeroFacts() {
  const reduce = useReducedMotion()
  const facts = ['Patients need no app, any phone works', 'A separate login for every doctor', 'Your own QR code and booking link']
  return (
    <section aria-label="Key facts">
      <ul className="max-w-7xl mx-auto px-4 sm:px-6 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm font-semibold text-[#171717]">
        {facts.map((t, i) => (
          <motion.li
            key={t}
            initial={reduce ? false : 'hidden'}
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            custom={i}
            className="flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={17} className="text-[#FF6A00] shrink-0" /> {t}
          </motion.li>
        ))}
      </ul>
    </section>
  )
}

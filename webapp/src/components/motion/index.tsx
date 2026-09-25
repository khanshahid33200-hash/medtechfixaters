import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from 'framer-motion'
import { SPRING_UI, VIEWPORT, blurReveal, cardItem, fadeUp, reducedFade, staggerContainer } from '../../lib/motion'

/** True on small screens (media query, no scroll/resize listener). */
export function useIsMobile(query = '(max-width: 767px)') {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMobile(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return mobile
}

type Tag = 'div' | 'li' | 'section' | 'ul'
const tags = { div: motion.div, li: motion.li, section: motion.section, ul: motion.ul }

/** Reveal content once as it scrolls into view. */
export function Reveal({
  children,
  className,
  variants = fadeUp,
  delay = 0,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  variants?: Variants
  delay?: number
  as?: Tag
}) {
  const reduce = useReducedMotion()
  const Comp = tags[as]
  return (
    <Comp
      className={className}
      variants={reduce ? reducedFade : variants}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      transition={delay ? { delay } : undefined}
    >
      {children}
    </Comp>
  )
}

/** Children using `cardItem`/variants appear one after another. */
export function StaggerContainer({
  children,
  className,
  stagger,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  stagger?: number
  as?: Tag
}) {
  const reduce = useReducedMotion()
  const Comp = tags[as]
  return (
    <Comp className={className} variants={staggerContainer(reduce ? 0 : stagger)} initial="hidden" whileInView="visible" viewport={VIEWPORT}>
      {children}
    </Comp>
  )
}

/**
 * Section wrapper that makes the page feel continuous: the content blurs in as it
 * arrives, and eases back (slight fade, scale and lift) as it scrolls away above.
 * Blur on exit is desktop-only and reduced motion keeps opacity only.
 */
export function AnimatedSection({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const mobile = useIsMobile()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['end 0.5', 'end start'] })
  const leave = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 })
  const opacity = useTransform(leave, [0, 1], [1, 0.35])
  const scale = useTransform(leave, [0, 1], [1, 0.97])
  const y = useTransform(leave, [0, 1], [0, -40])
  const filter = useTransform(leave, [0, 1], ['blur(0px)', 'blur(6px)'])

  const exitStyle = reduce ? undefined : mobile ? { opacity } : { opacity, scale, y, filter }

  return (
    <div ref={ref} id={id} className={`relative scroll-mt-24 ${className || ''}`}>
      <motion.div style={exitStyle} className="will-change-transform">
        <motion.div variants={reduce ? reducedFade : blurReveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.08 }}>
          {children}
        </motion.div>
      </motion.div>
    </div>
  )
}

/**
 * Card with the shared entrance (use inside StaggerContainer) and a subtle premium
 * hover: small lift, stronger border and orange glow, and a soft highlight that
 * follows the pointer (motion values, no re-renders).
 */
export function MotionCard({ children, className, as = 'div' }: { children: ReactNode; className?: string; as?: Tag }) {
  const reduce = useReducedMotion()
  const mx = useMotionValue(-200)
  const my = useMotionValue(-200)
  const highlight = useMotionTemplate`radial-gradient(260px circle at ${mx}px ${my}px, rgba(255,138,61,0.14), transparent 70%)`
  const Comp = tags[as]

  const onMove = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set(e.clientX - r.left)
    my.set(e.clientY - r.top)
  }

  return (
    <Comp
      variants={reduce ? reducedFade : cardItem}
      whileHover={reduce ? undefined : { y: -6, scale: 1.015, transition: SPRING_UI }}
      onMouseMove={reduce ? undefined : onMove}
      onMouseLeave={() => {
        mx.set(-200)
        my.set(-200)
      }}
      className={`group relative overflow-hidden transition-[box-shadow,border-color] duration-300 hover:border-orange-200 hover:shadow-[0_24px_50px_-20px_rgba(255,106,0,0.35)] ${className || ''}`}
    >
      {!reduce && <motion.span aria-hidden className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: highlight }} />}
      <div className="relative z-[1] h-full">{children}</div>
    </Comp>
  )
}

/** Moves an element at a different speed from the scroll, for depth. Reduced on phones. */
export function ParallaxElement({ children, className, speed = 60 }: { children: ReactNode; className?: string; speed?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const mobile = useIsMobile()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 100, damping: 30, mass: 0.5 })
  const distance = reduce ? 0 : mobile ? speed * 0.3 : speed
  const y = useTransform(smooth, [0, 1], [distance, -distance])
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  )
}

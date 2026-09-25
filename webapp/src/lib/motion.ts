import type { Transition, Variants } from 'framer-motion'

// Shared animation system for the public site. Every timing and variant used on the
// home page comes from here, so motion stays consistent across sections.

export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]
export const EASE_SMOOTH: [number, number, number, number] = [0.45, 0, 0.2, 1]

export const TIMING = {
  micro: 0.2, // hovers, taps
  card: 0.65, // card entrances
  section: 0.85, // section reveals
  large: 1.05, // big visuals
  stagger: 0.08,
  ambient: 12, // background drift
} as const

export const SPRING_UI: Transition = { type: 'spring', stiffness: 380, damping: 26 }
export const SPRING_SOFT: Transition = { type: 'spring', stiffness: 110, damping: 20 }

export const BRAND = {
  orange: '#FF6A00',
  orange2: '#FF8A3D',
  orangeLight: '#FFB067',
  bg: '#FFF9F5',
  text: '#171717',
  muted: '#6B6B6B',
} as const

/** Tailwind class for the primary orange gradient buttons. */
export const PRIMARY_BUTTON =
  'bg-[linear-gradient(135deg,#FF6A00_0%,#FF8A3D_100%)] text-white shadow-[0_10px_30px_-8px_rgba(255,106,0,0.55)] hover:shadow-[0_16px_36px_-8px_rgba(255,106,0,0.6)] hover:brightness-105 transition-[filter,box-shadow] duration-200'

// ---------------------------------------------------------------- variants
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: TIMING.section, ease: EASE_OUT } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: TIMING.section, ease: EASE_OUT } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: TIMING.large, ease: EASE_OUT } },
}

export const blurReveal: Variants = {
  hidden: { opacity: 0, y: 60, scale: 0.96, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { duration: TIMING.section, ease: EASE_OUT } },
}

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 48 },
  visible: { opacity: 1, x: 0, transition: { duration: TIMING.card, ease: EASE_OUT } },
}

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -48 },
  visible: { opacity: 1, x: 0, transition: { duration: TIMING.card, ease: EASE_OUT } },
}

export const cardItem: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: TIMING.card, ease: EASE_OUT } },
}

export const staggerContainer = (stagger: number = TIMING.stagger, delayChildren = 0.05): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
})

/** Reduced-motion versions keep only a short opacity fade. */
export const reducedFade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
}

export const VIEWPORT = { once: true, amount: 0.2 } as const

import { motion, useReducedMotion } from 'framer-motion'
import { TIMING } from '../../lib/motion'

// Warm off-white page background with a few large, slowly drifting orange orbs.
// Fixed and behind everything, limited to three elements to keep painting cheap.
export default function AmbientBackground() {
  const reduce = useReducedMotion()
  const drift = (d: number) =>
    reduce ? undefined : { duration: TIMING.ambient + d, repeat: Infinity, ease: 'easeInOut' as const }

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#FFF9F5]">
      <motion.div
        className="absolute -top-40 -right-40 h-[38rem] w-[38rem] rounded-full bg-[#FF6A00]/[0.13] blur-[120px]"
        animate={reduce ? undefined : { x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={drift(0)}
      />
      <motion.div
        className="absolute top-[40%] -left-48 h-[34rem] w-[34rem] rounded-full bg-[#FFB067]/[0.22] blur-[120px]"
        animate={reduce ? undefined : { x: [0, -30, 30, 0], y: [0, 40, -20, 0], scale: [1, 0.95, 1.08, 1] }}
        transition={drift(3)}
      />
      <motion.div
        className="absolute bottom-[-12rem] right-[15%] h-[28rem] w-[28rem] rounded-full bg-white blur-[100px]"
        animate={reduce ? undefined : { x: [0, 30, -30, 0], y: [0, -20, 10, 0] }}
        transition={drift(-2)}
      />
    </div>
  )
}

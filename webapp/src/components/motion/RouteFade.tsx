import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT } from '../../lib/motion'

// Marketing pages that get a soft fade when you move between them. App routes are left
// out on purpose: several share one component (e.g. /medicines and /medicines/import),
// and re-keying them on the path would remount the page and drop its state.
const PUBLIC_PATHS = new Set([
  '/', '/how-it-works', '/features', '/features/product', '/features/upcoming', '/upcoming-features',
  '/architecture', '/platform', '/pricing', '/about', '/contact', '/book-demo', '/demo',
  '/privacy', '/privacy-policy', '/terms', '/terms-and-conditions', '/refund-policy',
  '/refund-and-cancellation', '/thank-you',
])

// Opacity only: a transform on this wrapper would turn it into the containing block for
// the fixed navbar and chat button, and they would scroll away with the page.
export default function RouteFade({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  const key = PUBLIC_PATHS.has(path) ? path : 'app'

  return (
    <motion.div
      key={key}
      initial={reduce || key === 'app' ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  )
}

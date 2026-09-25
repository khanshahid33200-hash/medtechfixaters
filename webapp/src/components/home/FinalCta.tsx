import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Phone } from 'lucide-react'
import seoContent from '../../content/seoRoutes.json'
import { PRIMARY_BUTTON, SPRING_UI, TIMING, scaleIn } from '../../lib/motion'
import { reducedFade } from '../../lib/motion'

export default function FinalCta() {
  const reduce = useReducedMotion()
  const phone = seoContent.telephone.replace(/-/g, ' ')

  return (
    <section className="px-4 sm:px-6 pt-8 pb-16 md:pb-20">
      <motion.div
        variants={reduce ? reducedFade : scaleIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-[36px] border border-orange-100 bg-white/80 px-6 py-12 text-center backdrop-blur-xl md:px-14 md:py-14 shadow-[0_40px_90px_-45px_rgba(255,106,0,0.55)]"
      >
        {/* Subtle orange glow behind the call to action */}
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-72 w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF8A3D]/25 blur-3xl"
          animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: TIMING.ambient - 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative">
          <p className="text-sm font-bold text-[#C2410C]">Book a free walkthrough</p>
          <h2 className="mt-3 text-[clamp(1.875rem,4vw,3rem)] font-extrabold tracking-tight text-[#171717]">See it working for your clinic</h2>
          <p className="mt-3 text-[#6B6B6B] max-w-[52ch] mx-auto">
            A short video call where we show the booking, queue and prescription screens with your own doctors and departments.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <motion.div whileHover={reduce ? undefined : { scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }} transition={SPRING_UI}>
              <Link
                to="/book-demo"
                className={`inline-flex items-center justify-center gap-2 rounded-full ${PRIMARY_BUTTON} px-8 py-4 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400`}
              >
                Book a Demo <ArrowRight size={16} />
              </Link>
            </motion.div>
            <motion.div whileHover={reduce ? undefined : { scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }} transition={SPRING_UI}>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center rounded-full border border-orange-200 bg-white px-8 py-4 text-sm font-bold text-[#171717] hover:border-orange-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
              >
                See pricing
              </Link>
            </motion.div>
          </div>
          <a
            href={`tel:${seoContent.telephone.replace(/-/g, '')}`}
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#6B6B6B] hover:text-[#C2410C]"
          >
            <Phone size={15} /> Prefer to talk? Call {phone}
          </a>
        </div>
      </motion.div>
    </section>
  )
}

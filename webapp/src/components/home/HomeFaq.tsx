import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Plus } from 'lucide-react'
import faqs from '../../content/landingFaqs.json'
import { Reveal, StaggerContainer } from '../motion'
import { EASE_OUT, fadeUp } from '../../lib/motion'

// The questions visitors ask first; the rest stay one click away. The full list is also
// published as FAQ structured data by the SEO build (seo/build-seo.mjs).
const FIRST = [
  'How does the QR appointment system work?',
  'How does the live queue system work?',
  'Can each doctor see every hospital patient?',
  'Is each hospital\'s data kept separate?',
  'Will patients receive notifications?',
  'Can the system store patient history?',
]

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const id = `faq-${question.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`
  return (
    <motion.li variants={fadeUp} className="rounded-[20px] border border-orange-100/70 bg-white/80 backdrop-blur-xl">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-bold text-[#171717] rounded-[20px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
        >
          {question}
          <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 text-[#FF6A00]" aria-hidden>
            <Plus size={18} />
          </motion.span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 pr-10 text-[#6B6B6B] leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}

export default function HomeFaq() {
  const [showAll, setShowAll] = useState(false)
  const first = FIRST.map((q) => faqs.find((f) => f.question === q)).filter(Boolean) as typeof faqs
  const rest = faqs.filter((f) => !FIRST.includes(f.question))
  const list = showAll ? [...first, ...rest] : first

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Reveal className="space-y-3 text-center">
          <h2 className="text-[clamp(1.875rem,3.5vw,2.75rem)] font-extrabold tracking-tight text-[#171717]">Common questions</h2>
          <p className="text-[#6B6B6B]">Short answers to what clinics usually ask us first.</p>
        </Reveal>

        <StaggerContainer as="ul" stagger={0.05} className="mt-7 space-y-3">
          {list.map((f) => (
            <FaqItem key={f.question} question={f.question} answer={f.answer} />
          ))}
        </StaggerContainer>

        {!showAll && rest.length > 0 && (
          <div className="mt-8 text-center">
            <motion.button
              type="button"
              onClick={() => setShowAll(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-full border border-orange-200 bg-white/80 backdrop-blur px-6 py-3 text-sm font-bold text-[#171717] hover:border-orange-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
            >
              Show all {faqs.length} questions
            </motion.button>
          </div>
        )}
      </div>
    </section>
  )
}

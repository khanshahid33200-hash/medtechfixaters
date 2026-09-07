import React from "react"
import { motion } from "framer-motion"
import { ArrowRight, QrCode, Stethoscope, Building2 } from "lucide-react"

export default function FinalCTA({ onOpenDemo }: { onOpenDemo?: () => void }) {
  return (
    <section className="relative overflow-hidden px-5 py-28 md:py-36">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[40px] border border-white bg-white/65 px-6 py-20 text-center shadow-[0_30px_100px_rgba(15,23,42,0.09)] backdrop-blur-2xl md:px-12">
        <div className="pointer-events-none absolute left-[-100px] top-[-100px] h-72 w-72 rounded-full bg-orange-300/20 blur-[100px]" />
        <div className="pointer-events-none absolute right-[-100px] bottom-[-100px] h-72 w-72 rounded-full bg-blue-300/20 blur-[100px]" />

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-center gap-2"
          >
            <IconBox icon={Building2} />
            <IconBox icon={Stethoscope} />
            <IconBox icon={QrCode} />
          </motion.div>

          <motion.h2
            initial={{
              opacity: 0,
              y: 30,
              filter: "blur(10px)",
            }}
            whileInView={{
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
            }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mt-8 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl"
          >
            Ready To See
            <br />
            <span className="bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-transparent">
              MedTech Fixaters In Action?
            </span>
          </motion.h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-500">
            Explore how hospitals, doctors, patients, AI-assisted booking,
            and live queues work together inside one connected platform.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4">
            {onOpenDemo ? (
              <button
                onClick={onOpenDemo}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 cursor-pointer hover:scale-105 active:scale-98 transition"
              >
                Book a Demo
                <ArrowRight size={16} />
              </button>
            ) : (
              <motion.a
                href="/contact"
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20"
              >
                Book a Demo
                <ArrowRight size={16} />
              </motion.a>
            )}

            <motion.a
              href="/features"
              whileHover={{ y: -3 }}
              className="rounded-2xl border border-white bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-xl"
            >
              Explore Features
            </motion.a>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-[-180px] left-1/2 h-[300px] w-[1000px] -translate-x-1/2 rounded-[50%] bg-white blur-3xl" />
    </section>
  )
}

function IconBox({
  icon: Icon,
}: {
  icon: React.ElementType
}) {
  return (
    <motion.div
      whileHover={{ y: -4, rotate: 4 }}
      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white bg-white/75 text-blue-600 shadow-sm backdrop-blur-xl"
    >
      <Icon size={20} />
    </motion.div>
  )
}

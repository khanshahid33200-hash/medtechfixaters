import { useState } from 'react'
import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'
import ContactModal from '../components/ContactModal'
import { useSEO } from '../hooks/useSEO'
import seoContent from '../content/seoRoutes.json'

const PLAN_UI: Record<string, { cta: string; popular: boolean }> = {
  'Clinic Starter': { cta: 'Start 14-Day Free Trial', popular: false },
  'Hospital Pro': { cta: 'Get Hospital Pro', popular: true },
  'Enterprise Mesh': { cta: 'Contact Sales', popular: false },
}

export default function PricingPage() {
  useSEO({
    title: 'Pricing Plans — Transparent OPD Software | MedTech Fixaters',
    description: 'Affordable, transparent pricing plans for standalone clinics, multi-doctor polyclinics, and enterprise multi-bed hospitals.',
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')

  // Plan data is shared with the SEO build (structured data, llms.txt) so prices never drift.
  const plans = seoContent.routes
    .find((r) => r.path === '/pricing')!
    .pricing!.map((p) => ({ ...p, ...PLAN_UI[p.name] }))

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-[#5B4DF5] selection:text-white">
      <PublicHeader />

      {/* Hero Header with Lavender Cloud Backdrop */}
      <section className="relative pt-36 sm:pt-44 pb-20 px-6 bg-gradient-to-b from-[#E9EDFF] via-[#F4F5FF] to-white text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="px-3.5 py-1.5 rounded-full bg-white/90 border border-indigo-100 text-xs font-extrabold text-[#5B4DF5] inline-block shadow-2xs">
            Transparent Pricing
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.035em] text-slate-900 leading-tight">
            Simple, Transparent Plans.<br />No Hidden Fees.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium max-w-xl mx-auto">
            Scale your outpatient department with confidence. All plans include automated QR check-in, live queues, and 30-sec digital prescriptions.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="w-12 h-6 rounded-full bg-[#5B4DF5] p-1 flex items-center transition-all"
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === 'annual' ? 'text-slate-900' : 'text-slate-400'}`}>
              <span>Annual</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">Save 20%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="py-16 sm:py-24 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {plans.map((p, idx) => {
            const price = billingCycle === 'annual' ? p.priceAnnual : p.priceMonthly
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -6 }}
                className={`p-8 rounded-3xl border flex flex-col justify-between transition-all ${
                  p.popular
                    ? 'bg-white border-[#5B4DF5] shadow-xl shadow-indigo-500/10 relative ring-2 ring-[#5B4DF5]/20'
                    : 'bg-white border-slate-200/80 shadow-xs'
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#5B4DF5] text-white text-[10px] font-black uppercase tracking-wider">
                    Most Popular
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-[#5B4DF5] block uppercase tracking-wider">{p.tag}</span>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{p.name}</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{p.desc}</p>
                  </div>

                  <div className="pt-2 flex items-baseline gap-1 font-mono">
                    <span className="text-4xl font-black text-slate-900">₹{price.toLocaleString()}</span>
                    <span className="text-xs font-bold text-slate-400">/ month</span>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-2.5">
                    {p.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                        <Check size={15} className="text-[#5B4DF5] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => setModalOpen(true)}
                    className={`w-full py-3.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                      p.popular
                        ? 'bg-[#5B4DF5] hover:bg-[#4939E8] text-white shadow-indigo-500/25'
                        : 'bg-slate-900 hover:bg-black text-white'
                    }`}
                  >
                    {p.cta}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      <PublicFooter />
      <ContactModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}

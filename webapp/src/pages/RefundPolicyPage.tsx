import { RotateCcw, CheckCircle, FileText } from 'lucide-react'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'
import { useSEO } from '../hooks/useSEO'

export default function RefundPolicyPage() {
  useSEO({
    title: 'Refund & Cancellation Policy',
    description: '7-day money-back guarantee and subscription refund policy for MedTech Fixaters Smart OPD & EMR system.',
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      <PublicHeader />

      <main className="max-w-4xl w-full mx-auto px-4 py-12 sm:py-20 space-y-8 my-auto">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200/80 space-y-8 text-left">
          {/* Header */}
          <div className="border-b border-slate-100 pb-6 space-y-3">
            <span className="px-4 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-black uppercase tracking-wider inline-block">
              Billing & Refund Policy
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Subscription Refund & Cancellation Terms
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              7-Day Money Back Risk-Free Trial Guarantee • MedTech Fixaters SaaS
            </p>
          </div>

          {/* Policy Sections */}
          <div className="space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <RotateCcw size={18} className="text-[#00875A]" /> 1. 7-Day Money-Back Guarantee
              </h2>
              <p>
                We stand by the transformation MedTech Fixaters brings to OPD daily workflow. If your hospital or clinic is dissatisfied within 7 days of subscribing to any software tier, you are entitled to a full 100% refund, no questions asked.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle size={18} className="text-[#00875A]" /> 2. Processing Refund Requests
              </h2>
              <p>
                Approved refunds are processed within 3-5 business days directly back to the original payment method (Bank Transfer, UPI, or Credit Card).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-[#00875A]" /> 3. How to Initiate a Refund
              </h2>
              <p>
                To request a subscription cancellation or refund:
              </p>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-mono space-y-1">
                <p><strong>Billing Desk:</strong> MedTech Fixaters Billing Support</p>
                <p><strong>Email:</strong> billing@medtechfixaters.in / shahidbcsm@gmail.com</p>
                <p><strong>Subject:</strong> Subscription Refund Request - [Hospital Name]</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}

import { FileText, ShieldCheck, CheckCircle, Scale } from 'lucide-react'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'
import { useSEO } from '../hooks/useSEO'

export default function TermsPage() {
  useSEO({
    title: 'Terms of Service - Software Licensing & SLA',
    description: 'Terms of service agreement for MedTech Fixaters Smart OPD & EMR system detailing subscription terms, doctor licensing, and 99.9% uptime SLA.',
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      <PublicHeader />

      <main className="max-w-4xl w-full mx-auto px-4 py-12 sm:py-20 space-y-8 my-auto">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200/80 space-y-8 text-left">
          {/* Header */}
          <div className="border-b border-slate-100 pb-6 space-y-3">
            <span className="px-4 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-black uppercase tracking-wider inline-block">
              Terms & Conditions
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Software Licensing Agreement & Terms of Service
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Effective Date: August 26, 2026 • MedTech Fixaters SaaS Subscription Agreement
            </p>
          </div>

          {/* Policy Sections */}
          <div className="space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Scale size={18} className="text-[#00875A]" /> 1. Acceptance of Terms
              </h2>
              <p>
                By registering a hospital facility, issuing doctor administrator credentials, or utilizing the MedTech Fixaters QR OPD check-in kiosk and EMR prescription interface, your healthcare institution agrees to be bound by these Terms of Service.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#00875A]" /> 2. Doctor Seat Limits & License Rights
              </h2>
              <p>
                Hospital Administrators are granted non-transferable, non-exclusive license access based on the allocated doctor seat capacity defined by the Platform Owner at <code className="text-emerald-700 font-mono font-bold">/hospitaldashboard</code>. Re-selling or sub-licensing doctor accounts without written authorization is strictly prohibited.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle size={18} className="text-[#00875A]" /> 3. Service Level Agreement (SLA) & Medical Advice Disclaimer
              </h2>
              <p>
                MedTech Fixaters provides a 99.9% uptime commitment for cloud prescription generation and digital queue calling. MedTech Fixaters is a clinical software tool to streamline OPD workflow and does not independently provide medical advice or substitute professional physician clinical judgment.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-[#00875A]" /> 4. Governing Law & Dispute Resolution
              </h2>
              <p>
                These terms are governed by the laws of India. Any disputes arising from platform usage shall be subject to arbitration in Kolkata, West Bengal.
              </p>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}

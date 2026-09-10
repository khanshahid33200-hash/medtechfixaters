import { ShieldCheck, Lock, CheckCircle, FileText } from 'lucide-react'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'
import { useSEO } from '../hooks/useSEO'

export default function PrivacyPolicyPage() {
  useSEO({
    title: 'Privacy Policy - ABDM & Patient Data Privacy',
    description: 'Privacy policy for MedTech Fixaters Smart OPD & EMR system detailing ABDM compliance, 256-bit encryption, and data protection rules.',
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      <PublicHeader />

      <main className="max-w-4xl w-full mx-auto px-4 py-12 sm:py-20 space-y-8 my-auto">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200/80 space-y-8 text-left">
          {/* Header */}
          <div className="border-b border-slate-100 pb-6 space-y-3">
            <span className="px-4 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-black uppercase tracking-wider inline-block">
              Legal & Compliance
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Privacy Policy & Data Security
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Last Updated: August 26, 2026 • ABDM M3 Compliant & HIPAA-Aligned Standard
            </p>
          </div>

          {/* Policy Sections */}
          <div className="space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#00875A]" /> 1. Commitment to Health Data Privacy
              </h2>
              <p>
                MedTech Fixaters ("we," "our," or "us") operates the Smart OPD Reception and EMR Prescription SaaS Platform. We prioritize patient confidentiality and electronic health record (EHR) integrity in strict accordance with the Ayushman Bharat Digital Mission (ABDM) standards and national data protection frameworks.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Lock size={18} className="text-[#00875A]" /> 2. Information We Collect & Process
              </h2>
              <p>
                To facilitate digital OPD check-ins, queue callouts, and voice-assisted prescription generation, we collect:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-600 text-xs font-mono">
                <li><strong>Patient Demographic Info:</strong> Name, age, gender, phone number, chief complaints provided during QR check-in.</li>
                <li><strong>Clinical Records:</strong> Doctor prescriptions, diagnoses, vitals, lab orders, and dosage instructions.</li>
                <li><strong>Hospital & Doctor Account Credentials:</strong> Facility registration details, doctor registration license numbers, and staff seat allocations.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle size={18} className="text-[#00875A]" /> 3. Data Storage & Encryption Standard
              </h2>
              <p>
                All data transmitted through our web application is encrypted using 256-bit SSL/TLS protocol in transit and stored in AES-256 encrypted databases hosted in ISO 27001 certified cloud datacenters in India. We do not sell or monetize patient personal health information (PHI) to third-party advertisers.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-[#00875A]" /> 4. Contact Data Protection Officer
              </h2>
              <p>
                If you have questions regarding health data privacy or request record deletion:
              </p>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-mono space-y-1">
                <p><strong>Data Protection Officer:</strong> MedTech Fixaters Legal Team</p>
                <p><strong>Email:</strong> privacy@medtechfixaters.in / shahidbcsm@gmail.com</p>
                <p><strong>Helpline:</strong> +91 98765 43210</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}

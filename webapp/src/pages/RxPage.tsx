import React, { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  FileText,
  Download,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Printer,
  Loader2,
  Lock,
  Calendar,
  User,
  Building
} from 'lucide-react'
import { Card } from '../components/Card'
import PrescriptionDocumentView from '../components/prescription/PrescriptionDocumentView'
import {
  fetchAuthoritativePrescriptionData,
  generatePrescriptionPdf,
  downloadPdfBlob,
  printPrescriptionDocument
} from '../services/prescriptionPdfService'
import type { PrescriptionDocumentData } from '../types/prescriptionPdf'

export default function RxPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || searchParams.get('id')

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp' | 'prescriptions' | 'token_view'>(token ? 'token_view' : 'phone')

  const [tokenRxData, setTokenRxData] = useState<PrescriptionDocumentData | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const [rxList, setRxList] = useState<any[]>([])

  // If a token is provided in query params, load prescription directly
  useEffect(() => {
    if (!token) return

    setStep('token_view')
    setTokenLoading(true)
    setTokenError(null)

    // Token can be full UUID or appointment ID
    fetchAuthoritativePrescriptionData(token)
      .then((res) => {
        if (res.success && res.data) {
          setTokenRxData(res.data)
        } else {
          setTokenError(res.error || 'Prescription not found or invalid token.')
        }
      })
      .catch((err) => {
        setTokenError(err?.message || 'Server error while loading verified document.')
      })
      .finally(() => {
        setTokenLoading(false)
      })
  }, [token])

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) return
    setStep('otp')
  }

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp) return

    // In a real flow, OTP is verified against Supabase/SMS gateway
    setRxList([
      {
        id: 'rx-2026082230',
        token_number: '2026082230',
        doctor_name: 'Dr. Ashok Verma',
        hospital_name: 'City Care Hospital',
        department: 'Orthopaedics',
        date: '22 Aug 2026',
        diagnosis: 'Acute Knee Tendonitis',
        medicines: 'Tab. Paracetamol 650mg, Cap. Omeprazole 20mg'
      }
    ])
    setStep('prescriptions')
  }

  const handleDownloadTokenPdf = async () => {
    const rootEl = document.getElementById('prescription-document-root')
    if (!rootEl) {
      alert('Prescription preview element not ready.')
      return
    }

    setIsGeneratingPdf(true)
    const patientName = tokenRxData?.patient.name.replace(/[^a-zA-Z0-9]/g, '_') || 'Patient'
    const dateStr = tokenRxData?.metadata.issued_at.slice(0, 10).replace(/-/g, '') || '2026'
    const filename = `MedTechFixaters_RX_${patientName}_${dateStr}.pdf`

    const res = await generatePrescriptionPdf(rootEl, filename)
    setIsGeneratingPdf(false)

    if (res.success && res.blob) {
      downloadPdfBlob(res.blob, res.filename)
    } else {
      alert(`Could not compile PDF: ${res.error || 'Server error'}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-6 selection:bg-blue-600 selection:text-white">
      <header className="max-w-3xl mx-auto text-center space-y-2 mb-6">
        <Link to="/">
          <img src="/assets/logo.png" alt="Clinic OS Logo" className="h-10 mx-auto object-contain" />
        </Link>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight font-recoleta">
          Verified Digital Prescription Portal
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Official tamper-evident digital prescription retrieval • MedTechFixaters
        </p>
      </header>

      <div className="max-w-3xl mx-auto">
        {/* Token Direct View */}
        {step === 'token_view' && (
          <div className="space-y-4">
            {tokenLoading && (
              <Card className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3">
                <Loader2 size={36} className="animate-spin text-blue-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">Verifying Authoritative Medical Record…</h3>
                <p className="text-xs text-slate-500">Checking signature, tenant verification, and cryptographic hash.</p>
              </Card>
            )}

            {tokenError && (
              <Card className="rounded-3xl border border-rose-200 bg-rose-50/70 p-8 text-center space-y-3">
                <AlertCircle size={36} className="text-rose-600 mx-auto" />
                <h3 className="text-base font-bold text-rose-900">Unable to Verify Prescription</h3>
                <p className="text-xs text-rose-700">{tokenError}</p>
                <div className="pt-2">
                  <button
                    onClick={() => setStep('phone')}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition"
                  >
                    Look Up via Phone & OTP
                  </button>
                </div>
              </Card>
            )}

            {tokenRxData && !tokenLoading && (
              <div className="space-y-4">
                {/* Verification Badge */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={24} className="text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-extrabold text-emerald-900 block">Digitally Verified & Authentic</span>
                      <span className="text-emerald-700 text-[11px]">
                        Prescription #{tokenRxData.metadata.prescription_number} • Issued by {tokenRxData.doctor.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={printPrescriptionDocument}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Printer size={14} />
                      <span>Print</span>
                    </button>
                    <button
                      onClick={handleDownloadTokenPdf}
                      disabled={isGeneratingPdf}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {isGeneratingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      <span>Download Signed PDF</span>
                    </button>
                  </div>
                </div>

                {/* Prescription Document Renderer */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-x-auto p-4 sm:p-6">
                  <PrescriptionDocumentView data={tokenRxData} showWatermark={false} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step: Enter Phone */}
        {step === 'phone' && (
          <Card className="rounded-3xl border border-slate-200 shadow-xl bg-white p-6 sm:p-8">
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <FileText className="text-blue-600 mx-auto" size={36} />
                <h3 className="text-xl font-bold font-recoleta">Enter Patient Phone Number</h3>
                <p className="text-xs text-slate-500">We will send a 6-digit OTP to verify your identity</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition"
              >
                Send Verification OTP →
              </button>
            </form>
          </Card>
        )}

        {/* Step: OTP */}
        {step === 'otp' && (
          <Card className="rounded-3xl border border-slate-200 shadow-xl bg-white p-6 sm:p-8">
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-center">
              <div className="space-y-1">
                <CheckCircle className="text-emerald-600 mx-auto" size={36} />
                <h3 className="text-xl font-bold font-recoleta">Enter 6-Digit OTP</h3>
                <p className="text-xs text-slate-500">Sent via SMS to +91-{phone}</p>
              </div>

              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="1 2 3 4 5 6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-48 text-center text-2xl tracking-widest px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-600 outline-none mx-auto"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition"
              >
                Verify & Retrieve Prescriptions
              </button>
            </form>
          </Card>
        )}

        {/* Step: Prescription List from OTP */}
        {step === 'prescriptions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 font-recoleta">Verified Prescriptions ({rxList.length})</h3>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <ShieldCheck size={14} /> 128-bit Encrypted
              </span>
            </div>

            {rxList.map((rx) => (
              <Card key={rx.id} className="rounded-3xl border border-slate-200 bg-white p-6 space-y-3 shadow-md hover:shadow-xl transition">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-mono text-[11px] font-bold rounded-full border border-blue-100">
                      Token: {rx.token_number}
                    </span>
                    <h4 className="text-base font-black text-slate-900 mt-1">{rx.doctor_name}</h4>
                    <p className="text-xs text-slate-500">{rx.hospital_name} • {rx.department}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{rx.date}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
                  <p><strong>Diagnosis:</strong> {rx.diagnosis}</p>
                  <p className="text-slate-600"><strong>Prescribed:</strong> {rx.medicines}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    fetchAuthoritativePrescriptionData(rx.id).then(res => {
                      if (res.success && res.data) {
                        setTokenRxData(res.data)
                        setStep('token_view')
                      } else {
                        alert('Prescription details not available.')
                      }
                    })
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Download size={16} /> View & Download Signed PDF Rx
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


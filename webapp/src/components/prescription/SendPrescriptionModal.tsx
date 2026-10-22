import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  X,
  Phone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Mail,
  Copy,
  Check
} from 'lucide-react'
import { generateWhatsAppRxUrl } from '../../services/prescriptionPdfService'
import { emailPrescription } from '../../lib/rxEmail'
import type { PrescriptionDocumentData } from '../../types/prescriptionPdf'

interface SendPrescriptionModalProps {
  data?: PrescriptionDocumentData | null
  isOpen: boolean
  onClose: () => void
  onSent?: () => void
  patientName?: string
  patientPhone?: string
  prescriptionNumber?: string
  verificationUrl?: string
  doctorName?: string
  hospitalName?: string
  patientId?: string
  appointmentId?: string
}

export default function SendPrescriptionModal({
  data,
  isOpen,
  onClose,
  onSent,
  patientName,
  patientPhone,
  prescriptionNumber,
  verificationUrl,
  doctorName,
  hospitalName,
  patientId,
  appointmentId
}: SendPrescriptionModalProps) {
  const patient = {
    name: data?.patient?.name || patientName || 'Patient',
    phone: data?.patient?.phone || patientPhone || '',
    patient_number: data?.patient?.patient_number || patientId || 'Patient'
  }
  const doctor = {
    name: data?.doctor?.name || doctorName || 'Authorized Doctor'
  }
  const hospital = {
    name: data?.hospital?.name || hospitalName || 'MedTechFixaters Healthcare'
  }
  const metadata = {
    prescription_number: data?.metadata?.prescription_number || prescriptionNumber || 'RX-2026',
    verification_url: data?.metadata?.verification_url || verificationUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/rx`,
    issued_date_formatted: data?.metadata?.issued_date_formatted || new Date().toLocaleDateString('en-GB')
  }

  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp')
  const [recipientPhone, setRecipientPhone] = useState(patient.phone || '')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [sentSuccess, setSentSuccess] = useState(false)
  const [emailConsent, setEmailConsent] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [doneMsg, setDoneMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCopyLink = () => {
    navigator.clipboard.writeText(metadata.verification_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const finishSent = (message: string) => {
    setSending(false)
    setSentSuccess(true)
    setDoneMsg(message)
    if (onSent) onSent()
    setTimeout(() => {
      setSentSuccess(false)
      onClose()
    }, 2500)
  }

  const handleSendConfirm = async () => {
    setErrorMsg(null)
    if (channel === 'whatsapp') {
      setSending(true)
      const waUrl = generateWhatsAppRxUrl(
        recipientPhone,
        patient.name,
        metadata.prescription_number,
        metadata.verification_url,
        doctor.name,
        hospital.name
      )
      window.open(waUrl, '_blank', 'noopener,noreferrer')
      finishSent('WhatsApp opened with the prescription link. Press send in WhatsApp.')
      return
    }

    if (channel === 'sms') {
      setErrorMsg('SMS is not connected yet. Use Email or WhatsApp.')
      return
    }

    // Email: the server builds the PDF from the saved prescription and sends it via SMTP.
    const appt = data?.metadata?.appointment_id || appointmentId
    if (!appt) {
      setErrorMsg('Save the consultation before emailing the prescription.')
      return
    }
    const email = recipientEmail.trim()
    if (email && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) {
      setErrorMsg('Please enter a valid email address.')
      return
    }
    if (email && !emailConsent) {
      setErrorMsg('Please confirm the patient agreed to receive their prescription by email.')
      return
    }
    setSending(true)
    try {
      const r = await emailPrescription({ appointmentId: appt, mode: 'manual', email: email || undefined, recordConsent: Boolean(email && emailConsent) })
      if (r.sent) finishSent(`Prescription PDF emailed${r.recipient_masked ? ` to ${r.recipient_masked}` : ''}.`)
      else {
        setSending(false)
        setErrorMsg(r.message || 'Not sent.')
      }
    } catch (e) {
      setSending(false)
      setErrorMsg(e instanceof Error ? e.message : 'The prescription could not be emailed.')
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden z-10 font-sans text-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Send size={18} />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 leading-tight">
                  Send Prescription to Patient
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Secure verified link dispatch
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Confirmation Banner */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Prescription Details
              </span>
              <p className="text-sm font-black text-slate-900">
                {patient.name} · {patient.patient_number}
              </p>
              <p className="text-xs text-slate-600">
                Prescription: <span className="font-mono font-bold text-blue-700">{metadata.prescription_number}</span> ({metadata.issued_date_formatted})
              </p>
            </div>

            {/* Channel Tabs */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Select Dispatch Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('whatsapp')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    channel === 'whatsapp'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare size={16} className={channel === 'whatsapp' ? 'text-emerald-600' : 'text-slate-400'} />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('sms')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    channel === 'sms'
                      ? 'bg-blue-500/10 border-blue-500 text-blue-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Phone size={16} className={channel === 'sms' ? 'text-blue-600' : 'text-slate-400'} />
                  <span>SMS Alert</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    channel === 'email'
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Mail size={16} className={channel === 'email' ? 'text-indigo-600' : 'text-slate-400'} />
                  <span>Email</span>
                </button>
              </div>
            </div>

            {/* Input for Phone / Email */}
            {channel === 'email' ? (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Leave blank to use the email on file"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
                {recipientEmail.trim() && (
                  <label className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                    <input type="checkbox" checked={emailConsent} onChange={(e) => setEmailConsent(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
                    The patient agreed to receive their prescription by email
                  </label>
                )}
                <p className="mt-1.5 text-[10px] text-slate-400">The PDF is generated from the saved prescription and sent from the clinic’s email account.</p>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Recipient Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {channel === 'sms' && (
              <p className="text-[11px] font-semibold text-amber-700">SMS is not connected yet. Use Email or WhatsApp.</p>
            )}
            {errorMsg && (
              <p className="flex items-start gap-1.5 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-[11px] font-semibold text-rose-700">
                <AlertCircle size={13} className="mt-0.5 shrink-0" /> {errorMsg}
              </p>
            )}
            {doneMsg && sentSuccess && (
              <p className="flex items-start gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0" /> {doneMsg}
              </p>
            )}

            {/* Direct Verification Link Copy */}
            <div className="pt-2">
              <label className="text-[11px] font-bold text-slate-500 block mb-1">
                Verified Prescription Access Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={metadata.verification_url}
                  className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-600 truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={sending || sentSuccess || channel === 'sms'}
              onClick={handleSendConfirm}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition cursor-pointer"
            >
              {sending ? (
                channel === 'email' ? 'Sending email…' : 'Opening…'
              ) : sentSuccess ? (
                <>
                  <CheckCircle2 size={16} /> {channel === 'email' ? 'Emailed' : 'Opened'}
                </>
              ) : (
                <>
                  <Send size={15} /> Send Prescription
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

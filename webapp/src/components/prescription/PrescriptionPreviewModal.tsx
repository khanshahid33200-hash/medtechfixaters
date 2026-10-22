import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Download,
  Printer,
  Send,
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react'
import PrescriptionDocumentView from './PrescriptionDocumentView'
import SendPrescriptionModal from './SendPrescriptionModal'
import {
  fetchAuthoritativePrescriptionData,
  generatePrescriptionPdf,
  downloadPdfBlob,
  printPrescriptionDocument
} from '../../services/prescriptionPdfService'
import type { PrescriptionDocumentData } from '../../types/prescriptionPdf'

interface PrescriptionPreviewModalProps {
  appointmentId?: string
  prescriptionId?: string
  initialData?: PrescriptionDocumentData
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void
}

export default function PrescriptionPreviewModal({
  appointmentId,
  prescriptionId,
  initialData,
  isOpen,
  onClose,
  onEdit
}: PrescriptionPreviewModalProps) {
  const [data, setData] = useState<PrescriptionDocumentData | null>(initialData || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [zoomScale, setZoomScale] = useState(1)

  const docContainerRef = useRef<HTMLDivElement>(null)

  // Fetch authoritative data from Supabase if not passed initially
  useEffect(() => {
    if (!isOpen) return

    if (initialData) {
      setData(initialData)
      return
    }

    if (!appointmentId && !prescriptionId) {
      setError('Missing appointment or prescription identifier.')
      return
    }

    setLoading(true)
    setError(null)

    fetchAuthoritativePrescriptionData(appointmentId || '', prescriptionId)
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data)
        } else {
          setError(res.error || 'Failed to load authoritative prescription record.')
        }
      })
      .catch((err) => {
        setError(err?.message || 'Server error while loading prescription.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [isOpen, appointmentId, prescriptionId, initialData])

  if (!isOpen) return null

  const getCleanFilename = () => {
    if (!data) return 'Prescription.pdf'
    const cleanPatientName = data.patient.name.replace(/[^a-zA-Z0-9]/g, '_')
    const dateStr = data.metadata.issued_at.slice(0, 10).replace(/-/g, '')
    return `MedTechFixaters_RX_${cleanPatientName}_${dateStr}.pdf`
  }

  const handleGeneratePdf = async () => {
    const rootEl = document.getElementById('prescription-document-root')
    if (!rootEl) {
      alert('Prescription preview container not found.')
      return
    }

    setIsGeneratingPdf(true)
    const filename = getCleanFilename()
    const res = await generatePrescriptionPdf(rootEl, filename)
    setIsGeneratingPdf(false)

    if (res.success && res.blob) {
      setGeneratedPdfBlob(res.blob)
      downloadPdfBlob(res.blob, res.filename)
    } else {
      alert(`Could not compile PDF: ${res.error || 'Unknown error'}`)
    }
  }

  const handlePrint = () => {
    printPrescriptionDocument()
  }

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[10005] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            className="relative w-full max-w-5xl bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl flex flex-col max-h-[92vh] z-10 overflow-hidden font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-white leading-tight">
                    Official Prescription Preview
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {data ? `${data.metadata.prescription_number} · ${data.patient.name}` : 'Loading verified record...'}
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Zoom Controls */}
                <div className="hidden md:flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button
                    onClick={() => setZoomScale((s) => Math.max(0.7, s - 0.1))}
                    className="p-1 text-slate-300 hover:text-white rounded-lg transition"
                    title="Zoom Out"
                  >
                    <ZoomOut size={15} />
                  </button>
                  <span className="text-[10.5px] font-mono font-bold px-1 text-slate-300">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomScale((s) => Math.min(1.3, s + 0.1))}
                    className="p-1 text-slate-300 hover:text-white rounded-lg transition"
                    title="Zoom In"
                  >
                    <ZoomIn size={15} />
                  </button>
                </div>

                {onEdit && (
                  <button
                    onClick={() => {
                      onClose()
                      onEdit()
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                  >
                    <Edit3 size={14} />
                    <span>Edit Consultation</span>
                  </button>
                )}

                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>

                <button
                  onClick={() => setSendModalOpen(true)}
                  disabled={!data}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Send size={14} />
                  <span>Send to Patient</span>
                </button>

                <button
                  onClick={handleGeneratePdf}
                  disabled={!data || isGeneratingPdf}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  {isGeneratingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>{isGeneratingPdf ? 'Compiling PDF...' : 'Download PDF'}</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Document Preview */}
            <div
              ref={docContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/60 flex items-center justify-center [scrollbar-width:thin]"
            >
              {loading && (
                <div className="py-20 text-center space-y-3">
                  <Loader2 size={36} className="text-blue-500 animate-spin mx-auto" />
                  <p className="text-sm font-bold text-slate-300">
                    Loading authoritative consultation & prescription data...
                  </p>
                </div>
              )}

              {error && !loading && (
                <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 max-w-md text-center space-y-2">
                  <AlertCircle size={32} className="mx-auto text-red-400" />
                  <h4 className="font-bold text-sm">Unable to generate prescription preview</h4>
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}

              {data && !loading && !error && (
                <div
                  style={{
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.15s ease-out'
                  }}
                  className="rounded-2xl shadow-2xl overflow-hidden"
                >
                  <PrescriptionDocumentView data={data} />
                </div>
              )}
            </div>

            {/* Modal Footer Status Bar */}
            <div className="px-6 py-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Verified Supabase Healthcare Record • A4 Compliant</span>
              </span>

              <span>Single/Multi-page Smart Flow</span>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Nested Send to Patient Modal */}
      {data && (
        <SendPrescriptionModal
          data={data}
          isOpen={sendModalOpen}
          onClose={() => setSendModalOpen(false)}
        />
      )}
    </>
  )
}

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Layers,
  Calendar,
  Pill,
  QrCode,
  CalendarClock,
  Activity,
  CheckCircle,
  Radio,
  Settings,
  MousePointerClick
} from 'lucide-react'

export interface TourStep {
  id: string
  title: string
  actionLabel: string
  description: string
  targetSelector: string
  placement?: 'right' | 'bottom' | 'auto'
  icon: React.ElementType
  color: string
  badge: string
}

export const DOCTOR_TOUR_STEPS: TourStep[] = [
  {
    id: 'status',
    title: 'Live Consultation Status',
    actionLabel: 'Click your Status button to toggle',
    description:
      'Control your OPD presence in real-time. Switch between Available, On Break, or Offline. When Available, queued patients get turn alerts.',
    targetSelector: '[data-tour="doctor-status"]',
    placement: 'bottom',
    icon: Radio,
    color: 'from-emerald-500 to-teal-600',
    badge: '1 of 8: OPD Availability'
  },
  {
    id: 'dashboard',
    title: 'OPD Workspace & Digital Rx',
    actionLabel: 'Click Dashboard to view clinical workspace',
    description:
      'Your main clinical hub. Write digital prescriptions in seconds, view today’s consultation stats, and manage active patient care.',
    targetSelector: '[data-tour="nav-dashboard"]',
    placement: 'right',
    icon: Activity,
    color: 'from-blue-600 to-indigo-600',
    badge: '2 of 8: Clinical Workspace'
  },
  {
    id: 'queue',
    title: 'Live Queue & Token Calling',
    actionLabel: 'Click Live Queue to see queue management',
    description:
      'Triage patients in real-time. Call next token, view triage vitals (BP, SpO2), check wait times, and launch one-click consultations.',
    targetSelector: '[data-tour="nav-live-queue"]',
    placement: 'right',
    icon: Layers,
    color: 'from-cyan-500 to-blue-600',
    badge: '3 of 8: Live Token Queue'
  },
  {
    id: 'appointments',
    title: 'All Appointments & Schedules',
    actionLabel: 'Click All Appointments to view bookings',
    description:
      'View upcoming appointments, calendar slots, and register instant walk-in/emergency patients on the spot.',
    targetSelector: '[data-tour="nav-all-appointments"]',
    placement: 'right',
    icon: Calendar,
    color: 'from-violet-500 to-purple-600',
    badge: '4 of 8: Patient Bookings'
  },
  {
    id: 'qr',
    title: 'Doctor QR Standee & Link',
    actionLabel: 'Click QR to view touchless booking standee',
    description:
      'Download your clinic QR standee. Patients simply scan with their mobile phone to book tokens with zero app downloads.',
    targetSelector: '[data-tour="nav-qr"]',
    placement: 'right',
    icon: QrCode,
    color: 'from-amber-500 to-orange-600',
    badge: '5 of 8: QR Standee'
  },
  {
    id: 'medicines',
    title: 'Medicines & Dosage Catalog',
    actionLabel: 'Click Medicines to manage drug formulary',
    description:
      'Save frequent medicines, custom dosages (e.g. 1-0-1), and durations for rapid 1-click prescribing during consultation.',
    targetSelector: '[data-tour="nav-medicines"]',
    placement: 'right',
    icon: Pill,
    color: 'from-rose-500 to-pink-600',
    badge: '6 of 8: Prescriptions Library'
  },
  {
    id: 'availability',
    title: 'Shift Timings & Availability',
    actionLabel: 'Click Availability to configure hours',
    description:
      'Define morning/evening consultation hours, max patient slot limits, consultation fees, and schedule leave dates.',
    targetSelector: '[data-tour="nav-availability"]',
    placement: 'right',
    icon: CalendarClock,
    color: 'from-emerald-500 to-teal-600',
    badge: '7 of 8: Shifts & Timings'
  },
  {
    id: 'settings',
    title: 'Clinic Settings & Security',
    actionLabel: 'Click Settings to customize your clinic',
    description:
      'Customize doctor profile, clinic name, digital signature, print headers, notifications, and security credentials.',
    targetSelector: '[data-tour="nav-settings"]',
    placement: 'right',
    icon: Settings,
    color: 'from-slate-600 to-slate-800',
    badge: '8 of 8: Clinic Preferences'
  }
]

interface DoctorGuideTourProps {
  doctorId?: string
  forceOpen?: boolean
  onClose?: () => void
}

export default function DoctorGuideTour({ doctorId, forceOpen, onClose }: DoctorGuideTourProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const storageKey = `doctor_guide_tour_completed_${doctorId || 'default'}`

  // Check first time login status or forceOpen
  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true)
      setCurrentStepIndex(0)
      return
    }

    try {
      const completed = localStorage.getItem(storageKey)
      if (!completed) {
        const timer = setTimeout(() => {
          setIsOpen(true)
          setCurrentStepIndex(0)
        }, 900)
        return () => clearTimeout(timer)
      }
    } catch {
      // ignore
    }
  }, [doctorId, forceOpen, storageKey])

  const currentStep = DOCTOR_TOUR_STEPS[currentStepIndex] || DOCTOR_TOUR_STEPS[0]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === DOCTOR_TOUR_STEPS.length - 1

  // Measure target bounding rect
  const updateTargetRect = useCallback(() => {
    if (!isOpen || !currentStep?.targetSelector) {
      setTargetRect(null)
      return
    }

    const el = document.querySelector(currentStep.targetSelector)
    if (el) {
      const rect = el.getBoundingClientRect()
      // Scroll into view if offscreen
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      setTargetRect(rect)
    } else {
      setTargetRect(null)
    }
  }, [isOpen, currentStep])

  useEffect(() => {
    updateTargetRect()
    const handleScrollOrResize = () => updateTargetRect()
    window.addEventListener('resize', handleScrollOrResize)
    window.addEventListener('scroll', handleScrollOrResize, true)
    return () => {
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
    }
  }, [updateTargetRect, currentStepIndex])

  const handleNext = useCallback(() => {
    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStepIndex((prev) => Math.min(prev + 1, DOCTOR_TOUR_STEPS.length - 1))
    }
  }, [isLastStep])

  const handlePrevious = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  const handleSkip = useCallback(() => {
    handleComplete()
  }, [])

  const handleComplete = () => {
    try {
      localStorage.setItem(storageKey, 'true')
    } catch {}
    setIsOpen(false)
    if (onClose) onClose()
  }

  // Auto-advance when the doctor actually clicks the highlighted target button on the page!
  useEffect(() => {
    if (!isOpen || !currentStep?.targetSelector) return

    const targetEl = document.querySelector(currentStep.targetSelector)
    if (!targetEl) return

    const handleTargetClick = () => {
      // Advance tour step automatically after user clicks the real button
      setTimeout(() => {
        handleNext()
      }, 250)
    }

    targetEl.addEventListener('click', handleTargetClick)
    return () => {
      targetEl.removeEventListener('click', handleTargetClick)
    }
  }, [isOpen, currentStep, handleNext])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrevious()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleSkip()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleNext, handlePrevious, handleSkip])

  if (!isOpen) return null

  const StepIcon = currentStep.icon

  // Calculate anchored popover style
  const getPopoverStyle = () => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }
    }

    const isMobile = window.innerWidth < 768
    if (isMobile) {
      return {
        bottom: 16,
        left: 16,
        right: 16,
        maxWidth: 'calc(100vw - 32px)'
      }
    }

    const placement = currentStep.placement || 'right'

    if (placement === 'bottom') {
      const top = Math.min(window.innerHeight - 300, targetRect.bottom + 14)
      const left = Math.max(16, Math.min(window.innerWidth - 380, targetRect.left - 120))
      return { top: `${top}px`, left: `${left}px` }
    }

    // Default 'right' placement for sidebar buttons
    const popoverWidth = 360
    const top = Math.max(16, Math.min(window.innerHeight - 320, targetRect.top - 20))
    const left = Math.min(window.innerWidth - popoverWidth - 20, targetRect.right + 18)

    return { top: `${top}px`, left: `${left}px` }
  }

  const popoverStyle = getPopoverStyle()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none select-none">
        {/* Transparent dark scrim with light blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-slate-950/45 backdrop-blur-[2px] pointer-events-auto"
          onClick={handleSkip}
        />

        {/* Pulsing Spotlight Frame directly around the target button */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: 1,
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8
            }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            className="fixed pointer-events-none rounded-2xl border-2 border-blue-500 bg-blue-500/15 shadow-[0_0_25px_rgba(59,130,246,0.6)] z-[10000] ring-4 ring-blue-400/40 animate-pulse"
          >
            {/* Pulsing target pointer pin */}
            <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </div>
          </motion.div>
        )}

        {/* Anchored Floating Popover Tooltip attached directly to the feature button */}
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: 8, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          style={popoverStyle}
          className="fixed w-full max-w-[360px] bg-slate-900/95 text-white rounded-2xl border border-blue-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-[10001] pointer-events-auto overflow-hidden backdrop-blur-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Connecting Arrow for desktop (Left arrow for sidebar items, Top arrow for topbar) */}
          {!isMobile && targetRect && currentStep.placement !== 'bottom' && (
            <div
              className="absolute -left-2 top-8 w-4 h-4 bg-slate-900 border-l border-b border-blue-500/40 rotate-45 pointer-events-none"
            />
          )}
          {!isMobile && targetRect && currentStep.placement === 'bottom' && (
            <div
              className="absolute -top-2 left-12 w-4 h-4 bg-slate-900 border-l border-t border-blue-500/40 rotate-45 pointer-events-none"
            />
          )}

          {/* Top Progress Gradient Bar */}
          <div className="h-1 w-full bg-slate-800">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-orange-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStepIndex + 1) / DOCTOR_TOUR_STEPS.length) * 100}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>

          {/* Header */}
          <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {currentStep.badge}
              </span>
            </div>

            <button
              onClick={handleSkip}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Skip Tour (Esc)"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-2.5">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${currentStep.color} p-0.5 shadow-md shrink-0 flex items-center justify-center text-white`}>
                <StepIcon size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-white tracking-tight leading-snug">
                  {currentStep.title}
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                  {currentStep.description}
                </p>
              </div>
            </div>

            {/* Interactive Click Callout Banner */}
            <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-500/30 flex items-center gap-2 text-[11px] text-blue-200 font-medium">
              <MousePointerClick size={14} className="text-blue-400 shrink-0 animate-bounce" />
              <span>
                <strong className="text-white font-bold">Action: </strong>
                {currentStep.actionLabel} (auto-next on click)
              </span>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <button
              onClick={handleSkip}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 hover:underline underline-offset-2 transition cursor-pointer"
            >
              Skip
            </button>

            <div className="flex items-center gap-1.5">
              {!isFirstStep && (
                <button
                  onClick={handlePrevious}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition flex items-center gap-1 cursor-pointer border border-slate-700"
                >
                  <ArrowLeft size={12} />
                  <span>Prev</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-3 py-1.5 rounded-lg text-[11px] font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition flex items-center gap-1 shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
              >
                <span>{isLastStep ? 'Finish' : 'Next'}</span>
                {isLastStep ? <CheckCircle2 size={12} /> : <ArrowRight size={12} />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

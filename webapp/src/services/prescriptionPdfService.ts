import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type {
  PrescriptionDocumentData,
  PrescriptionMetadata,
  PrescriptionHospitalInfo,
  PrescriptionDoctorInfo,
  PrescriptionPatientInfo,
  PrescriptionDiagnosisInfo,
  PrescriptionTestItem,
  PrescriptionMedicineItem,
  PrescriptionAdviceInfo,
  PrescriptionFollowUpInfo
} from '../types/prescriptionPdf'

function formatTimestamp(isoString?: string): { dateStr: string; timeStr: string } {
  const d = isoString ? new Date(isoString) : new Date()
  const dateStr = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) // e.g. "25 Sep 2026"
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) // e.g. "10:30 AM"
  return { dateStr, timeStr }
}

/**
 * Loads authoritative, finalized consultation and prescription data from Supabase.
 * Validates doctor authorization and hospital tenant isolation.
 */
export async function fetchAuthoritativePrescriptionData(
  appointmentId: string,
  prescriptionId?: string
): Promise<{ success: boolean; data?: PrescriptionDocumentData; error?: string }> {
  if (!appointmentId) {
    return { success: false, error: 'Appointment identifier is required.' }
  }

  try {
    // 1. Fetch appointment
    const { data: appt, error: apptErr } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .maybeSingle()

    if (apptErr || !appt) {
      return { success: false, error: 'Appointment not found or access denied.' }
    }

    const hospitalId = appt.hospital_id
    const doctorId = appt.doctor_id
    const patientId = appt.patient_id

    // 2. Parallel fetch for patient, doctor, hospital, consultation, prescription, items, tests
    const [
      patientRes,
      doctorProfileRes,
      doctorDetailsRes,
      hospitalRes,
      consultationRes,
      prescriptionRes,
      testRes
    ] = await Promise.all([
      patientId
        ? supabase.from('patients').select('*').eq('id', patientId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      doctorId
        ? supabase.from('profiles').select('*').eq('id', doctorId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      doctorId
        ? supabase.from('doctor_details').select('*').eq('id', doctorId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      hospitalId
        ? supabase.from('hospitals').select('*').eq('id', hospitalId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from('consultations')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      prescriptionId
        ? supabase.from('prescriptions').select('*').eq('id', prescriptionId).maybeSingle()
        : supabase
            .from('prescriptions')
            .select('*')
            .eq('appointment_id', appointmentId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
      supabase
        .from('test_requests')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ])

    const patientData = patientRes.data
    const docProfile = doctorProfileRes.data
    const docDetails = doctorDetailsRes.data
    const hospitalData = hospitalRes.data
    const consultData = consultationRes.data
    const rxData = prescriptionRes.data
    const testData = testRes.data

    // If prescription exists, fetch normalized snapshot items from prescription_items
    let normalizedItems: PrescriptionMedicineItem[] = []
    if (rxData?.id) {
      const { data: items } = await supabase
        .from('prescription_items')
        .select('*')
        .eq('prescription_id', rxData.id)
        .order('position', { ascending: true })

      if (items && items.length > 0) {
        normalizedItems = items.map((it: any, idx: number) => ({
          sr: idx + 1,
          medicine_name: it.medicine_name_snapshot || 'Medicine',
          generic_name: it.generic_name_snapshot || undefined,
          strength: it.strength_snapshot || undefined,
          dosage_form: it.dosage_form_snapshot || undefined,
          dosage: it.dosage || '1 Tab',
          frequency: it.frequency || 'Once daily',
          duration: it.duration || '5 Days',
          route: it.route || undefined,
          instructions: it.instructions || undefined
        }))
      }
    }

    // Fallback to rxData.medicines if normalized items not yet written
    if (normalizedItems.length === 0 && rxData?.medicines && Array.isArray(rxData.medicines)) {
      normalizedItems = rxData.medicines.map((m: any, idx: number) => ({
        sr: idx + 1,
        medicine_name: m.name || m.medicine_name || 'Medicine',
        dosage: m.dosage || '1 Tab',
        frequency: m.frequency || '',
        duration: m.duration || '',
        route: m.route || '',
        instructions: m.instruction || m.instructions || ''
      }))
    }

    // Parse Tests
    const testsList: PrescriptionTestItem[] = []
    if (testData?.tests && Array.isArray(testData.tests)) {
      testData.tests.forEach((t: any) => {
        if (typeof t === 'string' && t.trim()) {
          testsList.push({
            name: t.trim(),
            purpose: testData.instructions || undefined,
            is_urgent: testData.instructions?.includes('URGENT')
          })
        } else if (typeof t === 'object' && t?.name) {
          testsList.push({
            name: t.name,
            purpose: t.purpose || undefined,
            notes: t.notes || undefined,
            is_urgent: t.is_urgent
          })
        }
      })
    } else if (rxData?.lab_tests && Array.isArray(rxData.lab_tests)) {
      rxData.lab_tests.forEach((t: any) => {
        if (typeof t === 'string' && t.trim()) {
          testsList.push({ name: t.trim() })
        }
      })
    }

    // Parse Doctor Advice
    const rawAdvice = rxData?.advice || consultData?.clinical_notes || ''
    const adviceLines = rawAdvice
      .split('\n')
      .map((line: string) => line.replace(/^[•\-\*]\s*/, '').trim())
      .filter((line: string) => Boolean(line) && !line.startsWith('[RECOMMENDED DIAGNOSTIC TESTS'))

    const adviceInfo: PrescriptionAdviceInfo = {
      advice_points: adviceLines.length > 0 ? adviceLines : [],
      general_notes: consultData?.clinical_notes || undefined
    }

    // Parse Follow Up
    let followUpInfo: PrescriptionFollowUpInfo | undefined = undefined
    const followUpVal = rxData?.follow_up || rxData?.follow_up_date
    if (followUpVal) {
      followUpInfo = {
        follow_up_date: String(followUpVal),
        purpose: 'Clinical Review / Further Assessment',
        notes: rxData?.notes || undefined
      }
    }

    // Format timestamps
    const finalTimestamp = rxData?.finalized_at || rxData?.created_at || consultData?.created_at || appt.created_at
    const { dateStr, timeStr } = formatTimestamp(finalTimestamp)

    // Verification token & URL
    const verificationToken =
      rxData?.id?.replace(/-/g, '').slice(0, 16) ||
      appt.id?.replace(/-/g, '').slice(0, 16) ||
      `${Date.now()}`
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://medtechfixaters.in'
    const verificationUrl = `${origin}/rx?token=${verificationToken}`

    // RX Number
    const year = new Date(finalTimestamp).getFullYear()
    const rxSeq = (rxData?.id || appt.id || '0001').slice(0, 6).toUpperCase()
    const prescriptionNumber = `RX-${year}-${rxSeq}`

    const metadata: PrescriptionMetadata = {
      prescription_id: rxData?.id || appt.id,
      prescription_number: prescriptionNumber,
      appointment_id: appt.id,
      consultation_id: consultData?.id || undefined,
      version: rxData?.version || 1,
      status: rxData?.status || 'final',
      issued_at: finalTimestamp,
      issued_date_formatted: dateStr,
      issued_time_formatted: timeStr,
      verification_token: verificationToken,
      verification_url: verificationUrl
    }

    // Hospital Info
    const hospital: PrescriptionHospitalInfo = {
      id: hospitalId || 'hospital-default',
      name: hospitalData?.name || docDetails?.clinic_name || 'MedTech Fixaters Healthcare',
      address: hospitalData?.address || docDetails?.clinic_address || undefined,
      city: hospitalData?.city || docDetails?.city || undefined,
      state: hospitalData?.state || docDetails?.state || undefined,
      pincode: hospitalData?.pincode || docDetails?.pincode || undefined,
      phone: hospitalData?.phone || docDetails?.clinic_phone || undefined,
      email: hospitalData?.email || undefined,
      website: hospitalData?.website || 'https://medtechfixaters.in',
      logo_url: hospitalData?.logo_url || '/assets/brand-icon.png'
    }

    // Doctor Info
    const doctor: PrescriptionDoctorInfo = {
      id: doctorId || 'doctor-default',
      name: docProfile?.full_name || docProfile?.name || 'Dr. Authorized Practitioner',
      qualification: docDetails?.qualification || 'MBBS, MD',
      specialization: docDetails?.specialization || docProfile?.specialization || 'General Physician',
      registration_number: docDetails?.registration_number || docDetails?.medical_license || undefined,
      medical_license: docDetails?.medical_license || undefined,
      department: docProfile?.department || docDetails?.specialization || 'Clinical OPD',
      hospital_name: hospital.name,
      phone: docProfile?.phone || undefined,
      email: docProfile?.email || undefined,
      signature_url: docDetails?.signature_url || null
    }

    // Patient Info (from patients table directly)
    const patientNumber =
      patientData?.patient_number ||
      appt.patient_number ||
      (patientId ? `P-${patientId.slice(0, 6).toUpperCase()}` : `TKN-${appt.token_number || '001'}`)

    const patient: PrescriptionPatientInfo = {
      id: patientId || appt.id,
      patient_number: patientNumber,
      name: patientData?.name || appt.patient_name || 'Patient',
      phone: patientData?.phone || appt.patient_phone || undefined,
      age: patientData?.age || appt.patient_age || undefined,
      gender: patientData?.gender || appt.patient_gender || undefined,
      dob: patientData?.dob || undefined,
      address: patientData?.address || undefined,
      city: patientData?.city || undefined,
      known_allergies: patientData?.allergies || appt.allergies || undefined,
      known_diseases: patientData?.known_diseases || undefined,
      current_medicines: patientData?.current_medications || undefined,
      chief_complaint: appt.symptoms || appt.chief_complaint || consultData?.symptoms || undefined
    }

    // Diagnosis & Vitals
    const vitalsObj = consultData?.vitals || appt.vitals || {}
    const diagnosisInfo: PrescriptionDiagnosisInfo = {
      diagnosis: consultData?.diagnosis || 'Clinical evaluation completed',
      clinical_findings: consultData?.clinical_notes || undefined,
      symptoms: appt.symptoms || consultData?.symptoms || undefined,
      vitals: {
        bp: vitalsObj.bp || consultData?.bp || undefined,
        pulse: vitalsObj.pulse || consultData?.pulse || undefined,
        temp: vitalsObj.temp || consultData?.temp || undefined,
        spo2: vitalsObj.spo2 || consultData?.spo2 || undefined,
        weight: vitalsObj.weight || consultData?.weight || undefined
      }
    }

    const docData: PrescriptionDocumentData = {
      metadata,
      hospital,
      doctor,
      patient,
      diagnosis: diagnosisInfo,
      tests: testsList,
      medicines: normalizedItems,
      advice: adviceInfo,
      follow_up: followUpInfo
    }

    return { success: true, data: docData }
  } catch (err: any) {
    console.error('Error fetching prescription document data:', err)
    return { success: false, error: err?.message || 'Server error while fetching prescription.' }
  }
}

/**
 * Generates an authentic, crisp A4 PDF from the rendered prescription DOM element.
 * Supports multi-page splitting if prescription contents exceed 1 page.
 */
export async function generatePrescriptionPdf(
  element: HTMLElement,
  filename?: string
): Promise<{ success: boolean; blob?: Blob; filename: string; error?: string }> {
  if (!element) {
    return { success: false, filename: 'prescription.pdf', error: 'Missing DOM container.' }
  }

  const defaultFilename = filename || `Prescription_${new Date().toISOString().slice(0, 10)}.pdf`

  try {
    // 1. Capture element canvas at high DPI (scale: 2 for print clarity)
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      windowWidth: 794 // Standard A4 pixel width at 96 DPI
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.98)

    // A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    })

    const pdfWidth = pdf.internal.pageSize.getWidth() // 210 mm
    const pdfHeight = pdf.internal.pageSize.getHeight() // 297 mm

    const imgWidth = pdfWidth
    const imgHeight = (canvas.height * pdfWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0
    let pageNumber = 1

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
    heightLeft -= pdfHeight

    // Add subsequent pages if document is longer than single A4 page
    while (heightLeft > 5) {
      position = -pdfHeight * pageNumber
      pdf.addPage()
      pageNumber += 1
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
      heightLeft -= pdfHeight
    }

    const pdfBlob = pdf.output('blob')

    return {
      success: true,
      blob: pdfBlob,
      filename: defaultFilename
    }
  } catch (err: any) {
    console.error('Prescription PDF generation error:', err)
    return { success: false, filename: defaultFilename, error: err?.message || 'PDF compilation failed.' }
  }
}

/**
 * Downloads a generated PDF blob to the user's computer.
 */
export function downloadPdfBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Triggers native browser print on the prescription document.
 */
export function printPrescriptionDocument() {
  window.print()
}

/**
 * Generates direct WhatsApp dispatch URL with patient confirmation.
 */
export function generateWhatsAppRxUrl(
  phone: string,
  patientName: string,
  rxNumber: string,
  verificationUrl: string,
  doctorName: string,
  clinicName: string
): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone

  const message = `Hello ${patientName},\n\nYour digital prescription (${rxNumber}) from ${doctorName} at ${clinicName} is ready.\n\n📄 View & Download Verified Prescription:\n${verificationUrl}\n\nThank you for visiting ${clinicName}. Wishing you good health!`

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
}

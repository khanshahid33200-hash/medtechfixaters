import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import type { PrescriptionDocumentData } from '../../types/prescriptionPdf'

interface PrescriptionDocumentViewProps {
  data: PrescriptionDocumentData
  id?: string
  isPrintMode?: boolean
  showWatermark?: boolean
}

export default function PrescriptionDocumentView({
  data,
  id = 'prescription-document-root',
  isPrintMode = false,
  showWatermark = false
}: PrescriptionDocumentViewProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const {
    metadata,
    hospital,
    doctor,
    patient,
    diagnosis,
    tests,
    medicines,
    advice,
    follow_up
  } = data

  // Generate QR code for prescription verification
  useEffect(() => {
    if (metadata.verification_url) {
      QRCode.toDataURL(metadata.verification_url, {
        width: 140,
        margin: 1,
        color: {
          dark: '#1E293B',
          light: '#FFFFFF'
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.warn('QR Code generation error:', err))
    }
  }, [metadata.verification_url])

  const hasVitals =
    diagnosis.vitals &&
    Object.values(diagnosis.vitals).some((v) => Boolean(v && String(v).trim()))

  const hasTests = tests && tests.length > 0
  const hasMedicines = medicines && medicines.length > 0
  const hasAdvice = advice && advice.advice_points && advice.advice_points.length > 0
  const hasFollowUp = Boolean(follow_up?.follow_up_date)

  return (
    <div
      id={id}
      className={`bg-white text-slate-900 font-sans mx-auto shadow-xl border border-slate-200 overflow-hidden ${
        isPrintMode ? 'w-full shadow-none border-none p-0' : 'w-full max-w-[794px] p-8 sm:p-10'
      }`}
      style={{
        width: isPrintMode ? '100%' : '794px',
        minHeight: isPrintMode ? 'auto' : '1123px', // Standard A4 Aspect Ratio at 96 DPI
        boxSizing: 'border-box',
        backgroundColor: '#FFFFFF',
        color: '#0F172A'
      }}
    >
      {/* ═════════════════════════════════════════════════════════════════════
          HEADER: CLINIC & DOCTOR INFORMATION
      ═════════════════════════════════════════════════════════════════════ */}
      <header className="border-b-2 border-blue-600 pb-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          {/* Clinic Brand & Address */}
          <div className="flex items-start gap-3.5 max-w-[58%]">
            {hospital.logo_url && (
              <img
                src={hospital.logo_url}
                alt="Clinic Logo"
                className="w-14 h-14 object-contain rounded-xl border border-slate-200 p-1 shrink-0 bg-white"
                crossOrigin="anonymous"
              />
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {hospital.name}
              </h1>
              {hospital.address && (
                <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
                  {hospital.address}
                  {hospital.city ? `, ${hospital.city}` : ''}
                  {hospital.state ? `, ${hospital.state}` : ''}
                  {hospital.pincode ? ` - ${hospital.pincode}` : ''}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10.5px] text-slate-500 font-medium mt-1">
                {hospital.phone && <span>📞 {hospital.phone}</span>}
                {hospital.email && <span>✉️ {hospital.email}</span>}
                {hospital.website && <span>🌐 {hospital.website}</span>}
              </div>
            </div>
          </div>

          {/* Right Top Area: RX Number & Exact Consultation Timestamp */}
          <div className="text-right shrink-0">
            <div className="inline-block bg-blue-50 border border-blue-200 text-blue-900 px-3 py-1.5 rounded-xl text-right">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">
                Prescription No.
              </span>
              <span className="text-sm font-mono font-black text-blue-900 block">
                {metadata.prescription_number}
              </span>
              <span className="text-[9.5px] font-semibold text-blue-600 block">
                Version {metadata.version} ({metadata.status.toUpperCase()})
              </span>
            </div>

            <div className="mt-2 text-[11px] text-slate-600 font-medium space-y-0.5">
              <div>
                <strong className="text-slate-800">Date:</strong> {metadata.issued_date_formatted}
              </div>
              <div>
                <strong className="text-slate-800">Time:</strong> {metadata.issued_time_formatted}
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Information Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50/80 px-3.5 py-2 rounded-xl">
          <div>
            <span className="font-extrabold text-slate-900 text-sm">{doctor.name}</span>
            <span className="text-slate-500 font-semibold ml-2">
              {doctor.qualification} · {doctor.specialization}
            </span>
          </div>
          <div className="text-slate-600 font-medium text-[11px]">
            {doctor.registration_number && (
              <span className="mr-3">
                <strong className="text-slate-800">Reg No:</strong> {doctor.registration_number}
              </span>
            )}
            {doctor.department && (
              <span>
                <strong className="text-slate-800">Dept:</strong> {doctor.department}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════════════
          PATIENT DETAILS SECTION
      ═════════════════════════════════════════════════════════════════════ */}
      <section className="mb-5 border border-slate-200 rounded-2xl p-4 bg-slate-50/40">
        <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-slate-200">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <h2 className="text-xs font-black uppercase tracking-wider text-blue-900">
            Patient Details
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2.5 gap-x-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Patient Name</span>
            <span className="font-extrabold text-slate-900 text-sm">{patient.name}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Patient ID</span>
            <span className="font-mono font-bold text-blue-800 text-xs">
              {patient.patient_number}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Age / Gender</span>
            <span className="font-semibold text-slate-800">
              {patient.age ? `${patient.age} Yrs` : '—'} / {patient.gender || '—'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Contact Phone</span>
            <span className="font-semibold text-slate-800">{patient.phone || '—'}</span>
          </div>

          {patient.address && (
            <div className="col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Address</span>
              <span className="font-medium text-slate-700">
                {patient.address}
                {patient.city ? `, ${patient.city}` : ''}
              </span>
            </div>
          )}

          {patient.chief_complaint && (
            <div className="col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Chief Complaint</span>
              <span className="font-semibold text-slate-800">{patient.chief_complaint}</span>
            </div>
          )}

          {patient.known_allergies && (
            <div className="col-span-2 bg-red-50 p-1.5 rounded-lg border border-red-200 text-red-900">
              <span className="text-[10px] font-black uppercase text-red-700 block">⚠️ Known Allergies</span>
              <span className="font-bold text-xs">{patient.known_allergies}</span>
            </div>
          )}

          {patient.known_diseases && (
            <div className="col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Medical History</span>
              <span className="font-medium text-slate-700">{patient.known_diseases}</span>
            </div>
          )}
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          DIAGNOSED DETAILS & CLINICAL OBSERVATIONS
      ═════════════════════════════════════════════════════════════════════ */}
      <section className="mb-5 border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <h2 className="text-xs font-black uppercase tracking-wider text-indigo-950">
              Diagnosed Details & Clinical Findings
            </h2>
          </div>

          {hasVitals && (
            <div className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              {diagnosis.vitals?.bp && <span>BP: <strong>{diagnosis.vitals.bp}</strong></span>}
              {diagnosis.vitals?.pulse && <span>Pulse: <strong>{diagnosis.vitals.pulse} bpm</strong></span>}
              {diagnosis.vitals?.temp && <span>Temp: <strong>{diagnosis.vitals.temp}</strong></span>}
              {diagnosis.vitals?.spo2 && <span>SpO2: <strong>{diagnosis.vitals.spo2}</strong></span>}
              {diagnosis.vitals?.weight && <span>Wt: <strong>{diagnosis.vitals.weight} kg</strong></span>}
            </div>
          )}
        </div>

        <div className="space-y-1.5 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Primary Diagnosis</span>
            <p className="text-sm font-black text-indigo-900 leading-snug">
              {diagnosis.diagnosis}
              {diagnosis.secondary_diagnosis && (
                <span className="text-slate-600 text-xs font-semibold ml-2">
                  (Secondary: {diagnosis.secondary_diagnosis})
                </span>
              )}
            </p>
          </div>

          {diagnosis.clinical_findings && (
            <div className="pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Clinical Findings / Notes</span>
              <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                {diagnosis.clinical_findings}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          SUGGESTED TESTS (Hidden if empty)
      ═════════════════════════════════════════════════════════════════════ */}
      {hasTests && (
        <section className="mb-5 border border-amber-200 bg-amber-50/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-amber-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
            <h2 className="text-xs font-black uppercase tracking-wider text-amber-950">
              Suggested Diagnostic Tests
            </h2>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-amber-200 text-[10.5px] font-extrabold text-amber-900 uppercase">
                <th className="py-1.5 pr-2 w-10">Sr.</th>
                <th className="py-1.5 px-2">Test Name / Investigation</th>
                <th className="py-1.5 px-2">Purpose / Indication</th>
                <th className="py-1.5 pl-2">Notes / Instructions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 font-medium text-slate-800">
              {tests.map((t, idx) => (
                <tr key={idx} className="py-1.5">
                  <td className="py-1.5 pr-2 font-bold text-amber-900">{idx + 1}.</td>
                  <td className="py-1.5 px-2 font-bold text-slate-900">
                    {t.name}
                    {t.is_urgent && (
                      <span className="ml-2 text-[9.5px] font-extrabold bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-300">
                        STAT / URGENT
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-slate-600">{t.purpose || '—'}</td>
                  <td className="py-1.5 pl-2 text-slate-600">{t.notes || 'Routine'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          PRESCRIPTION / RX SECTION
      ═════════════════════════════════════════════════════════════════════ */}
      <section className="mb-5 border border-orange-200 rounded-2xl p-4 bg-orange-500/[0.02]">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-orange-200">
          <div className="flex items-center gap-2">
            <span className="text-xl font-serif font-black text-orange-600 leading-none">℞</span>
            <h2 className="text-xs font-black uppercase tracking-wider text-orange-950">
              Prescription / Medication Chart
            </h2>
          </div>
          <span className="text-[10px] font-extrabold text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded-full border border-orange-200">
            {medicines.length} Item(s) Prescribed
          </span>
        </div>

        {hasMedicines ? (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-orange-200 text-[10.5px] font-extrabold text-orange-900 uppercase">
                <th className="py-2 pr-2 w-8">#</th>
                <th className="py-2 px-2">Drug / Medicine Name</th>
                <th className="py-2 px-2">Dosage</th>
                <th className="py-2 px-2">Frequency</th>
                <th className="py-2 px-2">Duration</th>
                <th className="py-2 px-2">Route</th>
                <th className="py-2 pl-2">Special Instructions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {medicines.map((m, idx) => (
                <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                  <td className="py-2.5 pr-2 font-black text-orange-800 align-top">{idx + 1}.</td>
                  <td className="py-2.5 px-2 align-top">
                    <span className="font-black text-slate-900 text-xs block">
                      {m.medicine_name} {m.strength ? `(${m.strength})` : ''}
                    </span>
                    {m.generic_name && (
                      <span className="text-[10px] text-slate-500 font-semibold block">
                        Gen: {m.generic_name}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 font-bold text-slate-800 align-top">{m.dosage || '1 unit'}</td>
                  <td className="py-2.5 px-2 font-extrabold text-blue-700 align-top">{m.frequency}</td>
                  <td className="py-2.5 px-2 font-bold text-slate-800 align-top">{m.duration}</td>
                  <td className="py-2.5 px-2 text-slate-600 align-top">{m.route || 'Oral'}</td>
                  <td className="py-2.5 pl-2 text-slate-700 font-medium align-top">
                    {m.instructions || 'After food with water'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-slate-400 italic py-2">
            No medications prescribed during this visit.
          </p>
        )}
      </section>

      {/* ═════════════════════════════════════════════════════════════════════
          DOCTOR'S ADVICE & DIETARY INSTRUCTIONS
      ═════════════════════════════════════════════════════════════════════ */}
      {hasAdvice && (
        <section className="mb-5 border border-emerald-200 bg-emerald-500/[0.03] rounded-2xl p-4">
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-emerald-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <h2 className="text-xs font-black uppercase tracking-wider text-emerald-950">
              Doctor's Advice & Dietary Guidelines
            </h2>
          </div>

          <ul className="space-y-1 text-xs text-slate-800 font-medium">
            {advice.advice_points.map((adv, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold shrink-0 mt-0.5">•</span>
                <span>{adv}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          FOLLOW UP SECTION (Hidden if empty)
      ═════════════════════════════════════════════════════════════════════ */}
      {hasFollowUp && (
        <section className="mb-5 border border-purple-200 bg-purple-500/[0.03] rounded-2xl p-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-purple-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <h2 className="text-xs font-black uppercase tracking-wider text-purple-950">
                Scheduled Review / Follow-Up
              </h2>
            </div>
            <span className="text-xs font-black text-purple-900 bg-purple-100 px-3 py-1 rounded-xl border border-purple-200">
              📅 {follow_up?.follow_up_date}
            </span>
          </div>

          <div className="text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2 font-medium">
            <span>
              <strong>Purpose:</strong> {follow_up?.purpose || 'Routine Clinical Review'}
            </span>
            {follow_up?.notes && (
              <span>
                <strong>Notes:</strong> {follow_up.notes}
              </span>
            )}
            <span className="text-[11px] text-purple-700 italic">
              Please bring this prescription copy and recent lab reports on follow-up visit.
            </span>
          </div>
        </section>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          FOOTER: SIGNATURE, VERIFICATION QR & WATERMARK
      ═════════════════════════════════════════════════════════════════════ */}
      <footer className="pt-4 border-t-2 border-slate-200 mt-6 flex items-end justify-between gap-4">
        {/* Verification QR Code */}
        <div className="flex items-center gap-3">
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="Prescription Verification QR Code"
              className="w-16 h-16 object-contain rounded-xl border border-slate-300 p-1 bg-white shrink-0"
            />
          )}
          <div className="text-[10px] text-slate-500 max-w-[220px] leading-tight">
            <strong className="text-slate-800 font-bold block">Verified Medical Document</strong>
            <span>Scan QR with any phone to verify authentic prescription authenticity online.</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              Secure Token: {metadata.verification_token.slice(0, 10)}...
            </span>
          </div>
        </div>

        {/* Doctor Signature Block */}
        <div className="text-right">
          {doctor.signature_url ? (
            <img
              src={doctor.signature_url}
              alt="Doctor Signature"
              className="h-12 object-contain ml-auto mb-1"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="h-12 flex items-end justify-end mb-1">
              <span className="text-slate-400 text-xs italic font-serif underline decoration-dotted">
                (Authorized Clinical Signature)
              </span>
            </div>
          )}
          <div className="border-t border-slate-400 pt-1">
            <span className="font-extrabold text-slate-900 text-xs block">{doctor.name}</span>
            <span className="text-[10.5px] text-slate-500 font-medium block">
              {doctor.qualification}
              {doctor.registration_number ? ` · Reg: ${doctor.registration_number}` : ''}
            </span>
          </div>
        </div>
      </footer>

      {/* Discreet Platform Watermark */}
      <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-medium">
        <span>Generated via MedTechFixaters Clinical Operating System</span>
        <span>Confidential Medical Record • Valid with authorized practitioner signature</span>
      </div>
    </div>
  )
}

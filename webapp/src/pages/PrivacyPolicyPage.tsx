import React from "react";
import LegalPageLayout, { LegalSection } from "../components/legal/LegalPageLayout";
import { useSEO } from "../hooks/useSEO";
import {
  Shield,
  Lock,
  Database,
  Users,
  Building2,
  Stethoscope,
  CreditCard,
  Server,
  FileCheck,
  AlertCircle,
  Clock,
  Trash2,
  UserCheck,
  BellRing,
  Globe,
  Baby,
  Cpu,
  ExternalLink,
  RefreshCw,
  Mail,
  ShieldCheck,
  Key,
  Layers,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  useSEO({
    title: "Privacy Policy - Healthcare Data Privacy & Security | MedTechFixaters",
    description:
      "Comprehensive Privacy Policy for MedTechFixaters Healthcare SaaS platform. Learn how we safeguard electronic Protected Health Information (ePHI), enforce role-based access, multi-tenant isolation, and support HIPAA-aligned administrative, physical, and technical safeguards.",
  });

  const sections: LegalSection[] = [
    {
      id: "introduction",
      number: "1",
      title: "Introduction & Scope",
      content: (
        <div className="space-y-4">
          <p>
            Welcome to <strong>MedTechFixaters</strong> ("MedTechFixaters," "we," "our," or "us"). MedTechFixaters provides a specialized, multi-tenant cloud-based healthcare software-as-a-service (SaaS) platform designed for hospitals, healthcare systems, multi-specialty clinics, independent physicians, clinical staff, and patients.
          </p>
          <p>
            This Privacy Policy sets forth our policies and practices regarding the collection, use, processing, storage, sharing, and protection of information when you access or interact with our platform, web applications, appointment booking workflows, digital queue systems, clinical dashboards, electronic medical records (EMR) interfaces, and associated services (collectively, the "<strong>Platform</strong>" or "<strong>Services</strong>").
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Summary of Key Privacy Principles:
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
              <li><strong>Healthcare Data Protection:</strong> We implement administrative, physical, and technical safeguards designed to protect sensitive patient and healthcare organizational records.</li>
              <li><strong>Strict Access Boundaries:</strong> We enforce granular Role-Based Access Control (RBAC) and database-level Row-Level Security (RLS) to keep institutional data segregated.</li>
              <li><strong>No Unauthorized Monetization:</strong> We do not sell, rent, or trade patient personal health data to third-party data brokers or advertising networks.</li>
              <li><strong>Institutional Record Ownership:</strong> Healthcare organizations retain administrative governance and custody of their clinical records.</li>
            </ul>
          </div>
          <p className="font-semibold text-slate-900 bg-blue-50/70 p-3.5 rounded-xl border border-blue-200/60">
            By using MedTechFixaters, you acknowledge that you have read and understood this Privacy Policy.
          </p>
        </div>
      ),
    },
    {
      id: "who-we-are",
      number: "2",
      title: "Who We Are & Organizational Details",
      content: (
        <div className="space-y-4">
          <p>
            MedTechFixaters operates as a technology infrastructure and software service provider. Depending on your jurisdiction and how you interact with our Services, the legal entity acting as the data controller or data processor is outlined below:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Company Legal Name:</span>
              <strong className="text-slate-800 text-sm">MedTechFixaters</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Brand / Platform:</span>
              <strong className="text-slate-800 text-sm">MedTechFixaters</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Platform Website:</span>
              <strong className="text-slate-800 text-sm">medtechfixaters.in</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Registered Corporate Address:</span>
              <strong className="text-slate-800 text-sm">Jaipur, Rajasthan, India</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Privacy Office Contact:</span>
              <strong className="text-slate-800 text-sm">contact@medtechfixaters.in</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Technical & General Support:</span>
              <strong className="text-slate-800 text-sm">contact@medtechfixaters.in</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 md:col-span-2">
              <span className="text-slate-400 block mb-0.5">Data Protection Officer / Privacy Officer:</span>
              <strong className="text-slate-800 text-sm">Shahid Khan</strong>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "types-of-users",
      number: "3",
      title: "Types of Users & Access Profiles",
      content: (
        <div className="space-y-4">
          <p>
            MedTechFixaters serves various user personas across healthcare environments. Our platform architecture applies strict permission boundaries tailored to each user type:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Users size={14} className="text-blue-600" /> Platform Administrators
              </div>
              <p className="text-slate-600">
                System engineers and platform operators managing global infrastructure health, tenant provisioning, system configurations, and security logging.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 size={14} className="text-indigo-600" /> Hospital & Clinic Administrators
              </div>
              <p className="text-slate-600">
                Authorized institutional officers managing hospital settings, doctor rosters, department allocations, queue displays, operational metrics, and facility staff.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Stethoscope size={14} className="text-emerald-600" /> Doctors & Medical Practitioners
              </div>
              <p className="text-slate-600">
                Licensed healthcare professionals accessing patient appointment queues, clinical notes, diagnosis records, prescription generation tools, and follow-up schedules.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Users size={14} className="text-amber-600" /> Hospital Staff & Reception Personnel
              </div>
              <p className="text-slate-600">
                Authorized receptionists and triage nurses facilitating patient intake, queue token issuance, in-person check-ins, and schedule coordination.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1 sm:col-span-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <UserCheck size={14} className="text-purple-600" /> Patients & Legal Representatives
              </div>
              <p className="text-slate-600">
                Individuals booking consultations via QR codes or links, viewing live queue positions, receiving appointment notifications, and retrieving digital prescriptions issued by their healthcare providers.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 italic">
            Each user category is restricted to the specific data scopes necessary to perform their respective clinical, administrative, or personal healthcare workflows.
          </p>
        </div>
      ),
    },
    {
      id: "information-we-collect",
      number: "4",
      title: "Information We Collect",
      content: (
        <div className="space-y-6">
          <p>
            We collect and process information across several distinct categories depending on how our Platform is utilized and configured by our healthcare customers:
          </p>

          {/* 4.A Account Information */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Key size={16} className="text-blue-600" /> A. Account & Authentication Information
            </h4>
            <p className="text-xs text-slate-600">
              When users register, onboard, or are provisioned access by a healthcare organization, we may collect: full name, email address, phone number, institutional role, assigned Doctor ID, Hospital ID, and clinic affiliation details.
            </p>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <strong>Authentication Security Guarantee:</strong> Passwords and login credentials are <em>never</em> stored in plain text. Authentication is executed through cryptographic hashing, salted tokens, and enterprise authentication infrastructure (such as Supabase Auth) with secure session token management.
            </div>
          </div>

          {/* 4.B Doctor & Clinic Information */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Stethoscope size={16} className="text-emerald-600" /> B. Doctor & Clinic Professional Information
            </h4>
            <p className="text-xs text-slate-600">
              For doctors, specialists, and clinical practitioners, we may collect: professional qualifications, clinical specializations, medical council license/registration numbers, clinic name, physical address, clinic contact phone numbers, consultation fees, availability schedules, profile photos, and verification documents where required.
            </p>
          </div>

          {/* 4.C Hospital Information */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 size={16} className="text-indigo-600" /> C. Hospital & Institutional Operational Information
            </h4>
            <p className="text-xs text-slate-600">
              For hospital and healthcare facility accounts, we may store: institution name, physical facility addresses, department hierarchies, doctor rosters, staff seat allocations, operational logs, aggregate appointment counts, billing and subscription status, and administrative audit trails.
            </p>
          </div>

          {/* 4.D Patient Information & PHI */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileCheck size={16} className="text-purple-600" /> D. Patient Information & Protected Health Information (PHI)
            </h4>
            <p className="text-xs text-slate-600">
              Depending on how the healthcare institution configures the platform and what data is provided during in-person QR check-ins, online appointment scheduling, or clinical consultations, patient records may include:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>• Patient Name & Generated Patient ID</div>
              <div>• Phone Number & Email Address</div>
              <div>• Age, Gender & Date of Birth</div>
              <div>• Residential / Mailing Address</div>
              <div>• Appointment Times & Token Numbers</div>
              <div>• Chief Complaints & Symptoms</div>
              <div>• Medical History & Chronic Conditions</div>
              <div>• Known Drug / Food Allergies</div>
              <div>• Current / Previous Medications</div>
              <div>• Digital Prescriptions (Rx)</div>
              <div>• Clinical Consultation Summaries</div>
              <div>• Uploaded Diagnostic Reports / Scans</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
              <strong>Health Information Classification:</strong> Where applicable under the Health Insurance Portability and Accountability Act of 1996 (HIPAA) and applicable privacy laws, information relating to the past, present, or future physical or mental health of an individual, provision of healthcare, or payment for healthcare constitutes <strong>Protected Health Information (PHI)</strong> or <strong>electronic Protected Health Information (ePHI)</strong>.
            </div>
          </div>

          {/* 4.E Payment Information */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CreditCard size={16} className="text-blue-600" /> E. Payment Information
            </h4>
            <p className="text-xs text-slate-600">
              Subscription billing and payment transactions are processed through certified third-party payment gateways such as <strong>[PAYMENT PROVIDER]</strong> (e.g., Razorpay). MedTechFixaters does not capture, store, or process complete credit card numbers, debit card PINs, or CVVs on our own servers. Payment information is subject to the third-party payment provider's own privacy policy and terms.
            </p>
          </div>

          {/* 4.F Device / Technical Information */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Server size={16} className="text-slate-600" /> F. Device, Technical & Usage Information
            </h4>
            <p className="text-xs text-slate-600">
              When users interact with our web applications, our systems automatically log technical metadata strictly for security, telemetry, and service reliability. This may include: IP addresses, browser types, operating systems, device types, approximate location derived from IP, session durations, authentication events, audit timestamps, and API error logs. We adhere to data minimization principles and do not log unnecessary personal telemetry.
            </p>
          </div>

          {/* 4.G Cookies */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Database size={16} className="text-amber-600" /> G. Cookies & Local Storage Technologies
            </h4>
            <p className="text-xs text-slate-600">
              We utilize cookies and browser storage technologies to maintain secure sessions and operational integrity:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
              <li><strong>Essential & Authentication Cookies:</strong> Required to authenticate users, protect against CSRF attacks, maintain logged-in states, and verify authorization tokens.</li>
              <li><strong>Security & Session Cookies:</strong> Utilized to detect suspicious session anomalies, protect hospital workspaces, and prevent unauthorized portal access.</li>
              <li><strong>Preference Storage:</strong> Used to remember user interface preferences (such as language, clinic filters, and display modes).</li>
            </ul>
            <p className="text-xs text-slate-500">
              <strong>Cookie Management:</strong> Users may manage or disable non-essential cookies through their browser preferences or our cookie management banner. Note that disabling essential authentication cookies will prevent access to secure dashboards.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "how-information-is-used",
      number: "5",
      title: "How Information Is Used",
      content: (
        <div className="space-y-4">
          <p>
            We process collected information strictly for legitimate operational, clinical, administrative, and legal purposes, including:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              • Creating and administering hospital, doctor, and clinic accounts.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              • Authenticating users and enforcing cryptographic permission boundaries.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              • Generating unique QR appointment codes, Patient IDs, and queue passes.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              • Providing live real-time OPD queue positions and display board updates.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              • Facilitating electronic prescription (Rx) generation and medical note recording.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              • Dispatching appointment confirmations and follow-up notices via SMS or WhatsApp where configured.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              • Processing SaaS subscription billing and generating tax invoices.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              • Detecting fraud, preventing security incidents, and monitoring audit logs.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              • Improving platform stability, application performance, and uptime.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              • Complying with applicable statutory, regulatory, and healthcare legal mandates.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "healthcare-phi-hipaa",
      number: "6",
      title: "Healthcare Information and HIPAA Safeguards",
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-blue-950 space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-600" /> Compliance Framework & Safeguards Commitment
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              MedTechFixaters is designed to support privacy and security requirements applicable to healthcare organizations. Where HIPAA applies, our contractual and technical safeguards are implemented based on the applicable HIPAA requirements and Business Associate Agreements.
            </p>
          </div>

          <p>
            Where MedTechFixaters handles Protected Health Information (PHI) on behalf of a healthcare entity that is a "Covered Entity" under HIPAA, MedTechFixaters operates as a "Business Associate." In such cases:
          </p>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <strong className="text-slate-900 block">1. Administrative Safeguards</strong>
              <p>We maintain access governance policies, workforce confidentiality obligations, risk management reviews, and security incident response procedures designed to protect ePHI.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <strong className="text-slate-900 block">2. Technical Safeguards</strong>
              <p>We implement role-based access controls, cryptographic transmission encryption (TLS 1.3), database encryption at rest, Row-Level Security, unique user identification, audit logs, and automatic session terminations.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <strong className="text-slate-900 block">3. Physical Safeguards</strong>
              <p>Our cloud infrastructure hosts enforce strict datacenter physical access controls, biometric security barriers, environmental disaster prevention, and certified hardware decommissioning.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
            <strong>Important Regulatory Notice:</strong> The HIPAA Security Rule requires appropriate administrative, physical, and technical safeguards for ePHI. MedTechFixaters does not claim third-party "HIPAA Certification" as government regulatory bodies (including the U.S. Department of Health and Human Services) do not provide or endorse commercial certifications. Compliance is an ongoing operational commitment shared between the platform and the healthcare organization.
          </div>
        </div>
      ),
    },
    {
      id: "minimum-necessary-rbac",
      number: "7",
      title: "Minimum Necessary Principle & Role-Based Access Control",
      content: (
        <div className="space-y-4">
          <p>
            In alignment with data protection standards and the HIPAA "Minimum Necessary" standard, MedTechFixaters restricts data access to only what is required for authorized personnel to perform their specific duties:
          </p>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <span className="font-bold text-blue-700 shrink-0">Platform Admin:</span>
              <span className="text-slate-600">Restricted to authorized system-level configurations, provisioning, and high-level infrastructure telemetry. Prohibited from accessing clinical notes without authorized technical support consent.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <span className="font-bold text-indigo-700 shrink-0">Hospital Admin:</span>
              <span className="text-slate-600">Authorized strictly to access their facility's doctors, departments, aggregated operational metrics, and facility-specific queues. Cannot access data from other healthcare institutions.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <span className="font-bold text-emerald-700 shrink-0">Doctor / Clinician:</span>
              <span className="text-slate-600">Authorized strictly to access patients in their active queues, scheduled appointments, and clinical consultation records assigned to their care.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <span className="font-bold text-purple-700 shrink-0">Patient:</span>
              <span className="text-slate-600">Authorized strictly to access their own digital queue status, appointment token, and prescriptions issued to their verified profile.</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-semibold">
            Users are strictly prohibited from attempting to circumvent authentication, manipulate IDs, or access information outside their authorized permission tier.
          </p>
        </div>
      ),
    },
    {
      id: "data-isolation",
      number: "8",
      title: "Multi-Tenant Data Isolation & Security Architecture",
      content: (
        <div className="space-y-4">
          <p>
            MedTechFixaters employs a multi-tenant cloud architecture engineered to guarantee complete logical separation between independent healthcare institutions:
          </p>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Layers size={16} className="text-blue-600" /> Multi-Tenant Logical Separation
            </div>
            <p className="text-slate-700">
              Hospital accounts are logically separated. An authorized user of one hospital is not permitted to access another hospital's private patient, doctor, appointment, financial, or administrative information.
            </p>
            <p className="text-slate-600">
              Data isolation is enforced at the database engine level via PostgreSQL <strong>Row-Level Security (RLS)</strong> policies. Every database transaction requires cryptographically verified tenant identifiers (`hospital_id` / `clinic_id`), preventing cross-tenant data leakage.
            </p>
          </div>
          <p className="text-xs text-slate-500 italic">
            While we implement reasonable and appropriate technical and organizational safeguards to protect data confidentiality, no computer network or internet transmission is guaranteed to be 100% invulnerable.
          </p>
        </div>
      ),
    },
    {
      id: "how-data-is-shared",
      number: "9",
      title: "When & How Data Is Shared",
      content: (
        <div className="space-y-4">
          <p>
            We share information only under defined, authorized circumstances and never sell patient data:
          </p>
          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong>A. Healthcare Organizations & Providers:</strong> Patient appointment details, intake complaints, and records are shared with the specific hospital, clinic, and doctor selected by or assigned to the patient.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong>B. Authorized Users:</strong> Information is shared within the healthcare institution among authorized clinical and administrative personnel in accordance with their assigned roles.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong>C. Core Cloud & Database Infrastructure:</strong> We engage reputable cloud hosting and database providers (such as Supabase and Vercel) to host platform databases, application code, and encrypted backups.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong>D. Payment Processors:</strong> Transaction details are shared with certified payment gateways (such as [PAYMENT PROVIDER]) strictly to process subscription payments and renewals.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong>E. Communication & Notification Gateways:</strong> Patient contact numbers and notification payloads may be transmitted to SMS or messaging service providers strictly to deliver automated appointment reminders or queue updates.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong>F. AI Service Provider (Google):</strong> The booking assistant, website assistant, follow-up reminders and CRM assistance run inside MedTechFixaters and do not send data to any external AI service. Only the doctor-facing clinical assistant uses Google’s Gemini API, on a paid plan under which Google does not use this data to train its models, and only when a doctor clicks an AI assistance button during their own consultation. It then sends the minimum needed for that request: age, gender, allergies, known conditions, current medicines, relevant history, symptoms, the doctor’s notes and assessment, vitals and the draft prescription or tests. The patient’s name, phone number and patient ID are never sent. AI output is a suggestion only: it does not diagnose, nothing is added to a record without the doctor’s action, and nothing is sent to patients automatically. Follow-up reminder emails are sent through our email provider only to patients who agreed to receive them.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong>G. Legal & Regulatory Compliance:</strong> We may disclose information if required by applicable law, court order, subpoena, or lawful regulatory request.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong>H. Corporate Transactions:</strong> In the event of a merger, acquisition, or asset transfer, information may be transferred subject to equivalent confidentiality commitments.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "business-associates-subprocessors",
      number: "10",
      title: "Business Associates and Subcontractors",
      content: (
        <div className="space-y-4">
          <p>
            Certain third-party service providers and sub-processors may process Protected Health Information (PHI) or electronic PHI (ePHI) on behalf of MedTechFixaters or our healthcare customers in connection with providing the Services.
          </p>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">Sub-Processor Governance Requirements:</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Where required by HIPAA, appropriate <strong>Business Associate Agreements (BAAs)</strong> are established prior to permitting sub-processors to transmit or store ePHI.</li>
              <li>Sub-processors are bound by contractual commitments to implement reasonable administrative, physical, and technical safeguards.</li>
              <li>Permitted uses and disclosures by sub-processors are restricted strictly to providing the contracted infrastructure or communication services.</li>
            </ul>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
            <strong>Authorized Third-Party Data Processors & Sub-Processors:</strong>
            <br />
            [LIST / LINK TO SUBPROCESSOR PAGE]
          </div>
        </div>
      ),
    },
    {
      id: "data-security",
      number: "11",
      title: "Data Security Measures",
      content: (
        <div className="space-y-4">
          <p>
            We implement comprehensive technical, administrative, and organizational controls designed to preserve the confidentiality, integrity, and availability of healthcare data:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <strong className="text-slate-900 flex items-center gap-1.5"><Lock size={14} className="text-blue-600" /> Encryption in Transit</strong>
              <p className="text-slate-600">All network communications are encrypted using modern Transport Layer Security (TLS 1.2 / TLS 1.3) protocols with HTTPS and WSS.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <strong className="text-slate-900 flex items-center gap-1.5"><Database size={14} className="text-indigo-600" /> Encryption at Rest</strong>
              <p className="text-slate-600">Database storage volumes and encrypted object storage are protected with industry-standard AES-256 encryption.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <strong className="text-slate-900 flex items-center gap-1.5"><Key size={14} className="text-emerald-600" /> Row-Level Security (RLS)</strong>
              <p className="text-slate-600">Database engine level authorization guarantees that queries execute strictly within the authenticated tenant's scope.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <strong className="text-slate-900 flex items-center gap-1.5"><Clock size={14} className="text-amber-600" /> Audit Logging & Monitoring</strong>
              <p className="text-slate-600">Security-sensitive actions, authentication attempts, and authorization changes are tracked in immutable audit logs.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <strong className="text-slate-900 flex items-center gap-1.5"><Shield size={14} className="text-purple-600" /> Principle of Least Privilege</strong>
              <p className="text-slate-600">Internal engineering access is restricted strictly to authorized personnel with multi-factor authentication (MFA).</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <strong className="text-slate-900 flex items-center gap-1.5"><RefreshCw size={14} className="text-slate-600" /> Backup & Disaster Recovery</strong>
              <p className="text-slate-600">Automated, encrypted daily database snapshots support rapid disaster recovery and business continuity.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "data-retention",
      number: "12",
      title: "Data Retention Policies",
      content: (
        <div className="space-y-4">
          <p>
            We retain information only for as long as reasonably necessary for the purposes described in this Privacy Policy, contractual requirements with healthcare customers, legal and regulatory obligations, security monitoring, dispute resolution, and legitimate operational requirements.
          </p>
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-2">
            <h4 className="font-bold text-slate-900 text-sm">Healthcare Medical Record Retention Governance:</h4>
            <p>
              Healthcare organizations (covered entities) determine applicable medical-record retention periods in compliance with federal, state, and local statutory medical laws and remain legally responsible for establishing and maintaining retention schedules for their patient records.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Account & Profile Data:</span>
              <strong className="text-slate-800">[RETENTION PERIOD]</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Security & Audit Logs:</span>
              <strong className="text-slate-800">[RETENTION PERIOD]</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Clinical & Patient Records:</span>
              <strong className="text-slate-800">[RETENTION POLICY]</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Disaster Recovery Backups:</span>
              <strong className="text-slate-800">[BACKUP RETENTION]</strong>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "data-deletion",
      number: "13",
      title: "Data Deletion & Record Retention Exceptions",
      content: (
        <div className="space-y-4">
          <p>
            Users and healthcare customers may submit requests to delete account profiles or platform data by contacting our Privacy Office at <strong className="font-mono text-xs">contact@medtechfixaters.in</strong>.
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600" /> Statutory Retention Exceptions
            </h4>
            <p>
              Please note that healthcare organizations have legal and regulatory obligations requiring the mandatory retention of certain patient histories, prescriptions, consultation notes, and billing audit trails for statutorily defined periods.
            </p>
            <p className="font-semibold text-slate-900">
              Therefore, deletion requests may be subject to legal, regulatory, contractual, medical-record retention, security, or fraud-prevention requirements.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "patient-rights",
      number: "14",
      title: "Patient Rights & Healthcare Provider Channels",
      content: (
        <div className="space-y-4">
          <p>
            Depending on applicable jurisdiction and law, individuals may have rights concerning their personal information, including rights to access, review, request amendments to inaccurate records, obtain copies of data, and request accounting of certain disclosures.
          </p>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">Exercising Rights: Platform vs. Healthcare Provider Channels</h4>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-900 space-y-1">
              <strong>Clinical & Medical Records:</strong>
              <p>
                When MedTechFixaters hosts patient medical information on behalf of a healthcare provider, the healthcare provider remains the primary custodian of the official medical record. Patients seeking to access, correct, or amend clinical charts, diagnostic records, or prescriptions should submit their request directly to their healthcare provider.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1">
              <strong>Platform User Accounts:</strong>
              <p>
                Inquiries regarding platform login profiles, general web telemetry, or direct communications may be submitted directly to MedTechFixaters at <strong className="font-mono">contact@medtechfixaters.in</strong>.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "security-incidents-breaches",
      number: "15",
      title: "Security Incidents and Breach Notifications",
      content: (
        <div className="space-y-4">
          <p>
            MedTechFixaters maintains formal security incident response protocols. In the event of a suspected or confirmed security incident affecting platform data:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
            <li>Our incident response team conducts an immediate technical investigation and executes containment, mitigation, and remediation procedures.</li>
            <li>Affected healthcare customers will be notified in accordance with contractual agreements, applicable Business Associate Agreements, and statutory legal requirements.</li>
            <li>Where HIPAA applies to governed entities and data, breach notification obligations will be handled strictly in compliance with the HIPAA Breach Notification Rule and applicable state breach disclosure laws.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "cross-border-transfers",
      number: "16",
      title: "International & Cross-Border Data Processing",
      content: (
        <div className="space-y-4">
          <p>
            MedTechFixaters and its authorized infrastructure sub-processors may store and process information in datacenters located in regions where our cloud service providers operate:
          </p>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
            <strong>Platform Primary Cloud Hosting Locations:</strong> [HOSTING LOCATIONS]
          </div>
          <p className="text-xs text-slate-600">
            Where cross-border data transfers occur, we implement appropriate contractual safeguards, standard contractual clauses, and encryption measures designed to maintain data security in accordance with applicable data protection laws.
          </p>
        </div>
      ),
    },
    {
      id: "children-privacy",
      number: "17",
      title: "Children's Privacy & Pediatric Healthcare Records",
      content: (
        <div className="space-y-4">
          <p>
            MedTechFixaters provides software services designed for healthcare institutions and authorized adult users. Where our platform is utilized by healthcare organizations to manage pediatric care or minor patients:
          </p>
          <p className="text-xs text-slate-600">
            The participating healthcare organization and authorized medical practitioners are responsible for ensuring that all required parental, legal guardian, or representative consents and authorizations are established in accordance with applicable healthcare laws before registering or processing minor health records.
          </p>
        </div>
      ),
    },
    {
      id: "ai-automated-processing",
      number: "18",
      title: "AI and Automated Processing Workflows",
      content: (
        <div className="space-y-4">
          <p>
            Where MedTechFixaters deploys artificial intelligence (AI), automated symptom triage helpers, smart auto-fill prescription catalogs, or administrative voice-to-text features:
          </p>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Cpu size={16} className="text-blue-600" /> Clinical Decision Disclaimers & Safeguards
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>AI features assist strictly with administrative workflows, symptom intake sorting, triage summaries, and documentation assistance.</li>
              <li><strong>AI output does not constitute medical diagnosis or independent clinical treatment.</strong></li>
              <li>Licensed healthcare professionals remain solely responsible for reviewing, verifying, and making all clinical, diagnostic, and prescription decisions.</li>
              <li>Patient information is never transmitted to third-party AI models for public model training unless specifically configured under certified enterprise privacy terms.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "third-party-links",
      number: "19",
      title: "Third-Party Links & External Services",
      content: (
        <div className="space-y-4">
          <p>
            Our web platform may occasionally include links to third-party portals, regulatory authorities, or external resources. MedTechFixaters is not responsible for the privacy practices, content, or security standards of third-party websites. We encourage users to review the privacy policies of any third-party services they visit.
          </p>
        </div>
      ),
    },
    {
      id: "policy-changes",
      number: "20",
      title: "Policy Changes & Revision History",
      content: (
        <div className="space-y-4">
          <p>
            We may periodically update this Privacy Policy to reflect enhancements in our platform, evolving regulatory mandates, or changes in operational practices. When material updates are published, we will revise the "Last Updated" date and provide appropriate notification through platform announcements or email communication where required.
          </p>
          <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div><strong>Effective Date:</strong> September 25, 2026</div>
            <div><strong>Last Updated:</strong> September 25, 2026</div>
            <div><strong>Version:</strong> 2.0 (Healthcare Enterprise SaaS Standard)</div>
          </div>
        </div>
      ),
    },
    {
      id: "contact",
      number: "21",
      title: "Contact Information & Privacy Office",
      content: (
        <div className="space-y-4">
          <p>
            If you have questions, feedback, or privacy-related requests concerning this Privacy Policy or our data protection safeguards, please reach our dedicated offices:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 block">Privacy Office:</span>
              <strong className="text-slate-800 text-sm">contact@medtechfixaters.in</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 block">Security Team:</span>
              <strong className="text-slate-800 text-sm">contact@medtechfixaters.in</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 block">Technical Support:</span>
              <strong className="text-slate-800 text-sm">contact@medtechfixaters.in</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 block">Postal Address:</span>
              <strong className="text-slate-800 text-sm">Jaipur, Rajasthan, India</strong>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <LegalPageLayout
      pageTitle="Privacy Policy"
      pageSubtitle="Your privacy and the security of healthcare information are important to us."
      documentType="Privacy Policy"
      lastUpdated="September 25, 2026"
      effectiveDate="September 25, 2026"
      complianceBadge="Healthcare SaaS Compliance Standard"
      complianceFootnote="This Privacy Policy describes our privacy practices at a general level and does not constitute legal advice. Healthcare organizations and other customers remain responsible for determining their own legal and regulatory obligations. Where HIPAA applies, contractual arrangements such as Business Associate Agreements may be required."
      sections={sections}
      activeRoute="/privacy-policy"
    />
  );
}

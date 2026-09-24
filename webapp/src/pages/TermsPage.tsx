import React from "react";
import LegalPageLayout, { LegalSection } from "../components/legal/LegalPageLayout";
import { useSEO } from "../hooks/useSEO";
import {
  Scale,
  Shield,
  Stethoscope,
  Building2,
  Users,
  AlertTriangle,
  FileText,
  Key,
  Database,
  Lock,
  Cpu,
  Clock,
  CreditCard,
  Ban,
  HelpCircle,
  Mail,
  ShieldAlert,
  Server,
  Layers,
  Sparkles,
} from "lucide-react";

export default function TermsPage() {
  useSEO({
    title: "Terms & Conditions - Healthcare SaaS Master Terms | MedTechFixaters",
    description:
      "Terms & Conditions governing the licensing, acceptable use, healthcare provider responsibilities, multi-tenant isolation, and data governance for MedTechFixaters platform.",
  });

  const sections: LegalSection[] = [
    {
      id: "acceptance",
      number: "1",
      title: "Acceptance of Terms",
      content: (
        <div className="space-y-4">
          <p>
            These Terms & Conditions ("<strong>Terms</strong>" or "<strong>Agreement</strong>") constitute a legally binding agreement between <strong>MedTechFixaters</strong> ("<strong>MedTechFixaters</strong>," "we," "our," or "us") and the individual, clinic, hospital, healthcare institution, or organization accessing or utilizing our platform ("<strong>Customer</strong>," "you," or "User").
          </p>
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 text-slate-800 text-xs leading-relaxed">
            By registering an account, accessing any portal, deploying a hospital workspace, utilizing our doctor prescription studio, scanning QR appointment links, or interacting with our APIs, you acknowledge that you have read, understood, and agree to be bound by these Terms.
          </div>
          <p className="text-xs text-amber-900 font-bold bg-amber-50 p-3 rounded-xl border border-amber-200">
            If you do not agree to these Terms, you must not access or use the MedTechFixaters platform.
          </p>
        </div>
      ),
    },
    {
      id: "definitions",
      number: "2",
      title: "Definitions",
      content: (
        <div className="space-y-3 text-xs">
          <p className="text-slate-700 mb-2">
            Throughout these Terms, the following capitalized terms shall have the meanings ascribed below:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block">MedTechFixaters:</strong>
              <span className="text-slate-600">The healthcare technology platform and software services provided by MedTechFixaters.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block">Platform / Services:</strong>
              <span className="text-slate-600">The cloud-hosted software applications, EMR tools, QR appointment engines, queue displays, APIs, and dashboards.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block">Customer:</strong>
              <span className="text-slate-600">The healthcare institution, hospital, clinic, physician, or enterprise entering into this Agreement.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block">Hospital / Clinic:</strong>
              <span className="text-slate-600">The medical facility utilizing a dedicated, logically isolated tenant workspace on the Platform.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block">Hospital Administrator:</strong>
              <span className="text-slate-600">An authorized institutional representative managing facility settings, doctor seats, and operational queues.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block">Doctor / Clinician:</strong>
              <span className="text-slate-600">A licensed healthcare practitioner authorized to conduct consultations and generate clinical notes.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block">Patient:</strong>
              <span className="text-slate-600">An individual receiving medical services or scheduling consultations with participating healthcare providers.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block">PHI / ePHI:</strong>
              <span className="text-slate-600">Protected Health Information or electronic Protected Health Information as defined under applicable healthcare laws (e.g., HIPAA).</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block">Authorized User:</strong>
              <span className="text-slate-600">Any individual authorized by Customer to access the Platform under Customer's account and credentials.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block">Customer Content:</strong>
              <span className="text-slate-600">All clinical records, diagnostic files, patient data, text, and images uploaded to the Platform by Customer.</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "platform-description",
      number: "3",
      title: "Platform Description & Service Scope",
      content: (
        <div className="space-y-4">
          <p>
            MedTechFixaters provides healthcare technology and software-as-a-service infrastructure designed to streamline outpatient department (OPD) workflows, clinical documentation, and patient communication. Depending on subscription tier and configuration, Platform features include:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
              • QR-based appointment booking & self-service digital check-in
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
              • Live multi-screen OPD waiting room queue engines & tokens
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
              • High-speed Doctor Workspace & electronic prescription studio (Rx)
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
              • Longitudinal patient records, allergy logging & visit histories
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
              • Hospital administrative controls, department rosters & analytics
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
              • Automated patient follow-up notifications and recall sequences
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "not-medical-advice",
      number: "4",
      title: "Medical Advice Disclaimer (Critical Notice)",
      content: (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-red-50/80 border border-red-200 text-red-950 text-xs leading-relaxed space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-red-900 text-sm">
              <AlertTriangle size={18} className="text-red-600" />
              IMPORTANT CLINICAL & MEDICAL DISCLAIMER
            </div>
            <p className="font-semibold text-slate-900 text-sm leading-snug">
              MedTechFixaters is a technology platform and is not a healthcare provider.
            </p>
            <p>
              MedTechFixaters does not practice medicine, offer medical diagnoses, render clinical treatment, or replace professional medical judgment. All medical determinations, diagnostic assessments, clinical evaluations, and therapeutic interventions are made solely by independent licensed healthcare professionals.
            </p>
            <p>
              Patients should always consult qualified healthcare professionals for diagnosis, treatment, medication, and medical decisions. If you are experiencing a medical emergency, you must immediately contact emergency medical services or proceed to the nearest emergency healthcare facility.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "healthcare-provider-responsibility",
      number: "5",
      title: "Healthcare Provider Responsibilities",
      content: (
        <div className="space-y-4">
          <p>
            Hospitals, clinics, and medical practitioners utilizing MedTechFixaters maintain sole and exclusive responsibility for:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-700">
            <li>
              <strong>Clinical & Diagnostic Decisions:</strong> All medical judgments, diagnoses, treatment pathways, and drug prescriptions issued through the Platform.
            </li>
            <li>
              <strong>Patient Consent & Authorization:</strong> Obtaining all legally required patient authorizations, telemedicine consents, and notices of privacy practices.
            </li>
            <li>
              <strong>Medical Record Accuracy:</strong> Ensuring that all clinical entries, medication dosages, allergy warnings, and diagnostic notes are verified and accurate.
            </li>
            <li>
              <strong>Statutory Licensing:</strong> Maintaining valid medical licenses, council registrations, and institutional accreditations required to practice medicine in their respective jurisdictions.
            </li>
            <li>
              <strong>Healthcare Law Compliance:</strong> Adhering to all applicable national, federal, state, and local healthcare privacy and operational regulations.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "user-accounts-security",
      number: "6",
      title: "User Accounts, Credentials & Security",
      content: (
        <div className="space-y-4">
          <p>
            To access institutional workspaces or clinical dashboards, Users must be provisioned authorized account credentials. Each User agrees:
          </p>
          <div className="space-y-2 text-xs text-slate-700">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              • To provide accurate, complete, and updated profile and institutional information.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              • To maintain the strict confidentiality of authentication passwords and access tokens.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              • <strong>Strict Prohibition of Credential Sharing:</strong> Doctor and administrator credentials are individual to the designated user and must not be shared among multiple staff members.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              • To immediately notify MedTechFixaters of any suspected unauthorized access, account compromise, or security anomaly.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "role-based-access",
      number: "7",
      title: "Role-Based Access Control & Permission Boundaries",
      content: (
        <div className="space-y-4">
          <p>
            MedTechFixaters enforces strict Role-Based Access Control (RBAC). Users may only access platform capabilities, administrative tools, and patient records that align with their designated organizational role:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <strong className="text-blue-700 block">Platform Administrator:</strong>
              <p className="text-slate-600">Global system monitoring, server health telemetry, and tenant provisioning.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <strong className="text-indigo-700 block">Hospital Administrator:</strong>
              <p className="text-slate-600">Authorized facility configurations, doctor allocations, and institutional queue settings.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <strong className="text-emerald-700 block">Doctor / Practitioner:</strong>
              <p className="text-slate-600">Clinical consultations, patient visit histories, and prescription generation for assigned OPD queues.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <strong className="text-purple-700 block">Patient / Guardian:</strong>
              <p className="text-slate-600">Personal queue token viewing, appointment confirmations, and personal prescription retrieval.</p>
            </div>
          </div>
          <p className="text-xs text-red-700 font-bold bg-red-50 p-3 rounded-xl border border-red-200">
            Any attempt to escalate privileges, manipulate JWT claims, or access data outside your authorized role constitutes a material breach of these Terms.
          </p>
        </div>
      ),
    },
    {
      id: "multi-tenant-isolation",
      number: "8",
      title: "Multi-Tenant Data Isolation & Security Obligations",
      content: (
        <div className="space-y-4">
          <p>
            MedTechFixaters operates as a multi-tenant cloud software platform with logical data isolation enforced at the database engine layer:
          </p>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">Tenancy Rules & Prohibitions:</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li>Each hospital or clinic account is strictly segregated via PostgreSQL Row-Level Security (RLS) policies.</li>
              <li>Users are strictly prohibited from probing, querying, or attempting to access another hospital's patient records, financial metrics, doctor rosters, or operational files.</li>
              <li>Users must not alter, spoof, or inject hospital identifiers (`hospital_id` / `clinic_id`) or doctor identifiers in API requests.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "acceptable-use",
      number: "9",
      title: "Acceptable Use Policy & Prohibited Conduct",
      content: (
        <div className="space-y-4">
          <p>
            You agree to use the Platform strictly in compliance with all applicable laws and these Terms. You shall not:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 font-medium">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              • Reverse engineer, decompile, or extract platform source code.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              • Conduct unauthorized vulnerability scans, pen-tests, or load testing.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              • Scrape or bulk-harvest healthcare data, provider listings, or patient data.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              • Upload malicious code, viruses, spyware, or harmful payloads.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              • Impersonate any healthcare practitioner, hospital staff, or patient.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              • Abuse API rate limits or launch distributed denial-of-service (DDoS) attacks.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "patient-data-hipaa",
      number: "10",
      title: "Patient Data & Healthcare Compliance",
      content: (
        <div className="space-y-4">
          <p>
            Where patient data includes Protected Health Information (PHI) or electronic PHI (ePHI) governed by HIPAA or applicable healthcare data protection laws:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-700">
            <li>
              <strong>Covered Entity Responsibilities:</strong> Healthcare organizations maintain primary responsibility as Covered Entities (or data controllers) for lawful basis, patient notifications, and authorization management.
            </li>
            <li>
              <strong>Business Associate Obligations:</strong> Where applicable by contract and law, MedTechFixaters will handle ePHI in compliance with applicable provisions of the HIPAA Security Rule and the terms of an executed Business Associate Agreement.
            </li>
            <li>
              <strong>No Universal HIPAA Application:</strong> HIPAA applicability depends on the specific healthcare entity, data classification, and governing jurisdiction.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "business-associate-agreement",
      number: "11",
      title: "Business Associate Agreement (BAA) Relationship",
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-blue-950 text-xs leading-relaxed space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText size={16} className="text-blue-600" /> BAA Execution Clause
            </h4>
            <p>
              Where MedTechFixaters qualifies as a Business Associate under HIPAA, the parties may enter into a Business Associate Agreement addressing permitted uses and disclosures of PHI and applicable safeguards.
            </p>
            <p className="font-semibold text-slate-900">
              These Terms of Service do not, in and of themselves, constitute or replace a formal Business Associate Agreement.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "security-safeguards",
      number: "12",
      title: "Security Safeguards & Realistic Commitments",
      content: (
        <div className="space-y-4">
          <p>
            MedTechFixaters implements reasonable and appropriate administrative, physical, and technical safeguards designed to protect platform security and ePHI confidentiality:
          </p>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <strong>Security Limitations Disclosure:</strong> While we employ industry-standard encryption, Row-Level Security, and automated monitoring, no software platform can guarantee 100% absolute invulnerability against sophisticated cyberattacks, zero-day vulnerabilities, or external communication failures.
          </div>
        </div>
      ),
    },
    {
      id: "availability-maintenance",
      number: "13",
      title: "Platform Availability & Maintenance",
      content: (
        <div className="space-y-4">
          <p>
            We strive to provide reliable platform availability for healthcare operations; however, services may occasionally experience planned maintenance, system upgrades, emergency security patches, or third-party infrastructure outages. MedTechFixaters shall not be liable for transient interruptions caused by telecommunication network failures or cloud provider service disruptions.
          </p>
        </div>
      ),
    },
    {
      id: "appointments-queues",
      number: "14",
      title: "Appointments, Tokens & Live Queues",
      content: (
        <div className="space-y-4">
          <p>
            Concerning QR booking, token generation, and OPD queue tracking:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
            <li>Appointment scheduling and doctor consultation availability are controlled solely by participating healthcare providers.</li>
            <li>Queue token sequences and estimated wait times are dynamic calculations based on real-time OPD flow and may fluctuate depending on emergency cases or extended physician consultations.</li>
            <li>Patients should not treat digital queue estimates as guaranteed consultation times.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "payments-subscriptions",
      number: "15",
      title: "Fees, Subscriptions & Payments",
      content: (
        <div className="space-y-4">
          <p>
            Subscription fees for hospital and doctor plans are billed in advance according to the selected tier. Transactions are processed via certified third-party payment gateways (such as [PAYMENT PROVIDER]). Subscription renewal, billing rules, and refund requests are governed by our <a href="/refund-policy" className="text-blue-600 font-semibold underline">Refund & Cancellation Policy</a>.
          </p>
        </div>
      ),
    },
    {
      id: "intellectual-property",
      number: "16",
      title: "Intellectual Property Rights",
      content: (
        <div className="space-y-4">
          <p>
            All right, title, and interest in and to the MedTechFixaters Platform—including software, UI components, proprietary algorithms, design systems, documentation, trademarks, and logos—remain the exclusive property of MedTechFixaters and its licensors.
          </p>
          <p className="text-xs text-slate-600">
            <strong>Customer Data Ownership:</strong> Customers retain all ownership rights in their uploaded patient records, clinical charts, and institutional files. Customers grant MedTechFixaters a limited license to host, transmit, and process such data solely to deliver the contracted Services.
          </p>
        </div>
      ),
    },
    {
      id: "user-content",
      number: "17",
      title: "Customer Content & Clinical Data Submissions",
      content: (
        <div className="space-y-4">
          <p>
            Customer represents and warrants that it possesses all necessary legal rights, patient consents, and statutory authority to upload Customer Content to the Platform. Customer shall not upload defamatory, unlawful, or infringing materials.
          </p>
        </div>
      ),
    },
    {
      id: "prohibited-medical-practices",
      number: "18",
      title: "Prohibited Medical & Clinical Practices",
      content: (
        <div className="space-y-4">
          <p>
            Users are strictly prohibited from utilizing the Platform for:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
            <li>Unlicensed or unauthorized practice of medicine.</li>
            <li>Automated, unverified drug dispensing or clinical decision-making without physician sign-off.</li>
            <li>Falsifying patient medical charts, prescriptions, or clinical notes.</li>
            <li>Impersonating licensed physicians or government health authorities.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "ai-features",
      number: "19",
      title: "AI Features & Administrative Assistance",
      content: (
        <div className="space-y-4">
          <p>
            Where AI-assisted features (such as smart symptom intake or prescription drug dosage auto-complete) are active:
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <p>
              AI features provide administrative drafting and organizational assistance only. AI-generated text may contain inaccuracies or incomplete suggestions.
            </p>
            <p className="font-semibold text-slate-900">
              Healthcare professionals must independently verify all AI outputs before utilizing them in patient care. AI outputs must never override human medical judgment.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "third-party-services",
      number: "20",
      title: "Third-Party Integrations & Sub-Processors",
      content: (
        <div className="space-y-4">
          <p>
            The Platform integrates with third-party infrastructure providers for core operations (including Supabase for database management, Vercel for hosting, and certified payment processors). Third-party services operate subject to their respective terms and privacy commitments.
          </p>
        </div>
      ),
    },
    {
      id: "termination-suspension",
      number: "21",
      title: "Suspension & Termination",
      content: (
        <div className="space-y-4">
          <p>
            MedTechFixaters may suspend or terminate access immediately upon notice in the event of: (a) material breach of these Terms; (b) security threats or suspected tenant breaches; (c) fraudulent or unlawful activity; or (d) overdue payment. Following termination, data handling is governed by our Privacy Policy.
          </p>
        </div>
      ),
    },
    {
      id: "disclaimers",
      number: "22",
      title: "Warranty Disclaimers",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed uppercase">
            EXCEPT AS EXPRESSLY PROVIDED HEREIN, THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. TO THE MAXIMUM EXTENT PERMITTED BY LAW, MEDTECHFIXATERS DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
        </div>
      ),
    },
    {
      id: "limitation-of-liability",
      number: "23",
      title: "Limitation of Liability",
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 font-mono space-y-2">
            <strong>[LEGAL COUNSEL TO COMPLETE LIABILITY LIMITATION BASED ON APPLICABLE JURISDICTION AND CUSTOMER TYPE]</strong>
            <p className="font-sans text-slate-700">
              To the maximum extent permitted by applicable law, neither party shall be liable for indirect, incidental, special, consequential, or punitive damages arising out of or related to this Agreement.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "indemnification",
      number: "24",
      title: "Indemnification",
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 font-mono space-y-2">
            <strong>[LEGAL COUNSEL REVIEW CLAUSE]</strong>
            <p className="font-sans text-slate-700">
              Customer agrees to indemnify, defend, and hold harmless MedTechFixaters, its officers, directors, and employees from and against third-party claims arising out of: (a) Customer Content; (b) medical malpractice or clinical decisions; (c) violation of applicable healthcare laws; or (d) breach of these Terms.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "governing-law",
      number: "25",
      title: "Governing Law & Jurisdiction",
      content: (
        <div className="space-y-4">
          <p className="text-xs font-mono text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            These Terms are governed by the laws of <strong>[JURISDICTION]</strong>, subject to applicable mandatory laws.
          </p>
        </div>
      ),
    },
    {
      id: "dispute-resolution",
      number: "26",
      title: "Dispute Resolution & Arbitration",
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 space-y-2">
            <div><strong>Dispute Resolution Method:</strong> [DISPUTE RESOLUTION METHOD]</div>
            <div><strong>Forum / Forum Location:</strong> [ARBITRATION / COURTS / OTHER] in [LOCATION]</div>
            <p className="font-sans text-slate-500 italic mt-2">
              Note: Formal dispute resolution mechanisms must be reviewed by qualified legal counsel prior to final commercial execution.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "changes-to-terms",
      number: "27",
      title: "Modifications to Terms",
      content: (
        <div className="space-y-4">
          <p>
            We may update these Terms periodically. Material updates will be communicated through platform notifications or direct email communication. Continued use of the Platform after the effective date of revisions constitutes acceptance of the modified Terms.
          </p>
        </div>
      ),
    },
    {
      id: "contact",
      number: "28",
      title: "Legal Notices & Contact Information",
      content: (
        <div className="space-y-4">
          <p>
            For legal notices, contractual inquiries, or compliance notices, please contact:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 block">Legal Department:</span>
              <strong className="text-slate-800 text-sm">contact@medtechfixaters.in</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 block">General Support:</span>
              <strong className="text-slate-800 text-sm">contact@medtechfixaters.in</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 sm:col-span-2">
              <span className="text-slate-400 block">Company Name & Corporate Address:</span>
              <strong className="text-slate-800 text-sm">MedTechFixaters • Jaipur, Rajasthan, India</strong>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <LegalPageLayout
      pageTitle="Terms & Conditions"
      pageSubtitle="Terms and conditions governing the access, licensing, and operation of MedTechFixaters healthcare platform."
      documentType="Terms & Conditions"
      lastUpdated="September 25, 2026"
      effectiveDate="September 25, 2026"
      complianceBadge="Healthcare SaaS Master Terms"
      complianceFootnote="Nothing in these Terms is intended to create a Business Associate Agreement. Where required, HIPAA-related obligations will be governed by the applicable Business Associate Agreement and other contractual arrangements."
      sections={sections}
      activeRoute="/terms-and-conditions"
    />
  );
}

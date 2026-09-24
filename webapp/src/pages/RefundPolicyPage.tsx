import React from "react";
import LegalPageLayout, { LegalSection } from "../components/legal/LegalPageLayout";
import { useSEO } from "../hooks/useSEO";
import {
  RotateCcw,
  CreditCard,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Building2,
  Stethoscope,
  ShieldCheck,
  Mail,
  HelpCircle,
  Layers,
  Sparkles,
} from "lucide-react";

export default function RefundPolicyPage() {
  useSEO({
    title: "Refund & Cancellation Policy | MedTechFixaters Healthcare SaaS",
    description:
      "Subscription cancellation terms, billing schedules, and refund policy for MedTechFixaters healthcare software platform, clinic systems, and doctor subscriptions.",
  });

  const sections: LegalSection[] = [
    {
      id: "scope",
      number: "1",
      title: "Scope & Applicability",
      content: (
        <div className="space-y-4">
          <p>
            This Refund & Cancellation Policy ("<strong>Policy</strong>") governs the cancellation, billing, and refund terms for all software subscriptions, licenses, and paid modules provided through the <strong>MedTechFixaters</strong> platform.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <strong className="text-slate-900 flex items-center gap-1.5 font-bold">
                <Building2 size={14} className="text-indigo-600" /> Hospital Enterprise Subscriptions
              </strong>
              <p className="text-slate-600">
                Multi-department hospital deployments, institution-wide doctor seat licenses, custom queue kiosk systems, and administrative suites.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <strong className="text-slate-900 flex items-center gap-1.5 font-bold">
                <Stethoscope size={14} className="text-emerald-600" /> Clinic & Doctor Plans
              </strong>
              <p className="text-slate-600">
                Independent medical practitioner subscriptions, multi-specialty clinic tiers, digital prescription studio access, and OPD token managers.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <strong className="text-slate-900 flex items-center gap-1.5 font-bold">
                <Layers size={14} className="text-blue-600" /> Add-On Features & Modules
              </strong>
              <p className="text-slate-600">
                Dedicated SMS credits, WhatsApp notification packs, additional doctor seats, priority queue displays, and integration plugins.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <strong className="text-slate-900 flex items-center gap-1.5 font-bold">
                <FileText size={14} className="text-purple-600" /> Professional Onboarding Services
              </strong>
              <p className="text-slate-600">
                Dedicated technical onboarding, staff training sessions, custom data migration, and onsite QR standee delivery.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "subscription-plans",
      number: "2",
      title: "Subscription Plans & Billing Models",
      content: (
        <div className="space-y-4">
          <p>
            MedTechFixaters offers subscription billing on periodic cycles. Pricing, billing cadence, and plan tier features are detailed during plan selection or in customer Master Service Agreements:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Subscription Plan Tier:</span>
              <strong className="text-slate-800 text-sm">[PLAN NAME]</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Billing Cadence:</span>
              <strong className="text-slate-800 text-sm">[MONTHLY/ANNUAL]</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Plan Fee & Currency:</span>
              <strong className="text-slate-800 text-sm">[PRICE]</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Payment Gateway Provider:</span>
              <strong className="text-slate-800 text-sm">[PAYMENT PROVIDER]</strong>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Subscriptions automatically renew at the conclusion of each billing period unless cancelled in accordance with this Policy.
          </p>
        </div>
      ),
    },
    {
      id: "cancellation",
      number: "3",
      title: "Subscription Cancellation Terms",
      content: (
        <div className="space-y-4">
          <p>
            Customers may initiate subscription cancellations at any time through their administrator billing portal or by contacting billing support:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-700">
            <li>
              <strong>Non-Renewal Notice:</strong> When a cancellation request is submitted, automatic recurring billing is terminated for subsequent billing cycles.
            </li>
            <li>
              <strong>Access Through Paid Period:</strong> Cancellation does not immediately terminate platform access. Your healthcare facility retains active access to all subscribed features through the conclusion of your current paid billing period, unless otherwise agreed or terminated for cause.
            </li>
            <li>
              <strong>No Retroactive Proration:</strong> Except where explicitly provided under our refund eligibility rules or required by applicable statutory consumer protection law, partial billing cycle fees are non-refundable upon mid-cycle cancellation.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "refunds",
      number: "4",
      title: "Refund Eligibility & Category Rules",
      content: (
        <div className="space-y-4">
          <p>
            Refund determinations are evaluated according to the specific circumstances and plan configurations outlined below:
          </p>
          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start justify-between gap-3">
              <div>
                <strong className="text-slate-900 block">Standard Voluntary Cancellation:</strong>
                <p className="text-slate-600">Voluntary cancellation during an active subscription term.</p>
              </div>
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg shrink-0">[REFUND RULE]</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start justify-between gap-3">
              <div>
                <strong className="text-slate-900 block">Duplicate Payment Transactions:</strong>
                <p className="text-slate-600">Accidental duplicate charge for the same billing period/invoice.</p>
              </div>
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg shrink-0">[REFUND RULE]</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start justify-between gap-3">
              <div>
                <strong className="text-slate-900 block">Platform Service Failure / Critical Downtime:</strong>
                <p className="text-slate-600">Verified platform unavailability exceeding contractual SLA parameters.</p>
              </div>
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg shrink-0">[REFUND RULE]</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start justify-between gap-3">
              <div>
                <strong className="text-slate-900 block">Unauthorized Payment / Fraudulent Transaction:</strong>
                <p className="text-slate-600">Verified unauthorized billing confirmed following fraud investigation.</p>
              </div>
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg shrink-0">[REFUND RULE]</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start justify-between gap-3">
              <div>
                <strong className="text-slate-900 block">Technical Billing Errors & Gateway Anomalies:</strong>
                <p className="text-slate-600">Incorrect charge amounts resulting from billing gateway sync errors.</p>
              </div>
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg shrink-0">[REFUND RULE]</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start justify-between gap-3">
              <div>
                <strong className="text-slate-900 block">Annual Subscription Tiers:</strong>
                <p className="text-slate-600">Cancellation rules applicable to long-term 12-month commitments.</p>
              </div>
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg shrink-0">[REFUND RULE]</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start justify-between gap-3">
              <div>
                <strong className="text-slate-900 block">Monthly Subscription Tiers:</strong>
                <p className="text-slate-600">Standard monthly recurring software subscriptions.</p>
              </div>
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg shrink-0">[REFUND RULE]</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start justify-between gap-3">
              <div>
                <strong className="text-slate-900 block">Promotional & Discounted Pricing:</strong>
                <p className="text-slate-600">Special promotional, pilot, or customized enterprise contracts.</p>
              </div>
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg shrink-0">[REFUND RULE]</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "non-refundable-services",
      number: "5",
      title: "Non-Refundable Services",
      content: (
        <div className="space-y-4">
          <p>
            Except where explicitly required by applicable statutory consumer protection law, the following fees and services are non-refundable once initiated or delivered:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
            <li><strong>Completed Onboarding & Professional Setup Fees:</strong> Custom installation, staff training, and initial hospital configuration hours once fulfilled.</li>
            <li><strong>Custom Software Development:</strong> Bespoke EMR connectors, custom API endpoints, or tailored interface modifications delivered per custom statement of work.</li>
            <li><strong>Third-Party Telephony & Messaging Charges:</strong> Consumed SMS credits, WhatsApp business messaging fees, and carrier routing costs.</li>
          </ul>
          <p className="text-xs text-slate-500 italic">
            Mandatory consumer protection rights provided under statutory legislation in your governing jurisdiction shall supersede any conflicting contractual restrictions.
          </p>
        </div>
      ),
    },
    {
      id: "payment-disputes-chargebacks",
      number: "6",
      title: "Payment Disputes & Chargebacks",
      content: (
        <div className="space-y-4">
          <p>
            We encourage healthcare customers to contact our billing support desk directly at <strong className="font-mono text-xs">contact@medtechfixaters.in</strong> prior to filing formal dispute or chargeback proceedings with their financial institution:
          </p>
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" /> Dispute Protocol & Account Status
            </h4>
            <p>
              Initiating a formal chargeback without prior consultation may result in automated temporary suspension of affected administrative portals pending dispute resolution, to protect against unauthorized account takeover.
            </p>
            <p>
              Upon receiving notice of a dispute, our finance team conducts an immediate investigation into transaction logs, invoice records, and service access timestamps.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "refund-process",
      number: "7",
      title: "Refund Request & Review Workflow",
      content: (
        <div className="space-y-4">
          <p>
            To request a refund, follow the verified four-step review workflow:
          </p>
          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">1</span>
              <div>
                <strong className="text-slate-900 block">Submit Written Request:</strong>
                <p className="text-slate-600">Email <strong className="font-mono">contact@medtechfixaters.in</strong> including Hospital Name, Account ID, invoice number, and rationale for the refund request.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">2</span>
              <div>
                <strong className="text-slate-900 block">Verification & Eligibility Review:</strong>
                <p className="text-slate-600">Our billing desk verifies account authorization, payment gateway records, and plan terms against this Policy.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">3</span>
              <div>
                <strong className="text-slate-900 block">Decision & Payment Processor Instruction:</strong>
                <p className="text-slate-600">If approved, refund instructions are transmitted directly to the original payment gateway (e.g., [PAYMENT PROVIDER]).</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">4</span>
              <div>
                <strong className="text-slate-900 block">Settlement & Processing Timeline:</strong>
                <p className="text-slate-600">Typical platform refund processing time: <strong className="font-mono font-bold">[NUMBER] business days</strong>. Final credit appearance on your bank/card statement depends on your card issuer or banking network.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "account-termination-data",
      number: "8",
      title: "Account Termination & Clinical Data Retention",
      content: (
        <div className="space-y-4">
          <p>
            Following cancellation or termination of a healthcare subscription:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
            <li>
              <strong>Transition & Data Export Window:</strong> Healthcare organizations may request data exports of patient records, queue analytics, and audit logs during a defined post-termination transition period.
            </li>
            <li>
              <strong>Data Retention & Secure Deletion:</strong> Following the transition period, platform data is archived and purged in accordance with our <a href="/privacy-policy" className="text-blue-600 font-semibold underline">Privacy Policy</a> and statutory medical record retention requirements.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "contact",
      number: "9",
      title: "Billing & Refund Contact Information",
      content: (
        <div className="space-y-4">
          <p>
            For all billing inquiries, invoice clarifications, cancellation submissions, or refund requests, please contact our billing desk:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 block">Refund Desk:</span>
              <strong className="text-slate-800 text-sm">contact@medtechfixaters.in</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 block">General Support:</span>
              <strong className="text-slate-800 text-sm">contact@medtechfixaters.in</strong>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <LegalPageLayout
      pageTitle="Refund & Cancellation Policy"
      pageSubtitle="Clear, transparent subscription billing, cancellation terms, and refund guidelines for healthcare organizations."
      documentType="Refund & Cancellation"
      lastUpdated="September 25, 2026"
      effectiveDate="September 25, 2026"
      complianceBadge="Commercial Subscription Governance"
      complianceFootnote="This Refund & Cancellation Policy sets forth standard commercial subscription terms for MedTechFixaters SaaS platform services. Specific enterprise service tiers may be subject to customized terms set forth in a signed Master Services Agreement."
      sections={sections}
      activeRoute="/refund-policy"
    />
  );
}

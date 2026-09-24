import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Brain,
  Building2,
  ArrowUpRight,
  Lock,
  Mail,
} from "lucide-react";

const productLinks = [
  ["Product Features", "/features"],
  ["Upcoming Features", "/features/upcoming"],
  ["How It Works", "/how-it-works"],
  ["System Architecture", "/architecture"],
  ["Pricing & Plans", "/pricing"],
];

const workspaceLinks = [
  ["Hospital Dashboard", "/hospitaldashboard"],
  ["Doctor Workspace", "/doctor"],
  ["Live Queue", "/track"],
];

const companyLinks = [
  ["About Us", "/about"],
  ["Contact Us", "/contact"],
  ["Privacy Policy", "/privacy-policy"],
  ["Terms & Conditions", "/terms-and-conditions"],
  ["Refund & Cancellation", "/refund-policy"],
];

export default function PublicFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#F7F8FC] px-5 pt-20 text-slate-900 border-t border-slate-200/70">

      {/* Soft background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-20 h-96 w-96 rounded-full bg-blue-300/20 blur-[120px]" />
        <div className="absolute right-[-5%] bottom-0 h-96 w-96 rounded-full bg-violet-300/20 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">

        {/* AI banner */}
        <div className="mb-16 overflow-hidden rounded-[28px] border border-white/70 bg-white/65 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur-2xl md:p-8 text-left">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-5">

              <div className="flex h-14 w-14 animate-bounce items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 shrink-0" style={{ animationDuration: '4s' }}>
                <Brain size={27} />
              </div>

              <div>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">
                    Built with MedTech AI
                  </h3>

                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-600">
                    ACTIVE
                  </span>
                </div>

                <p className="text-sm text-slate-500">
                  Intelligent workflows for hospitals, doctors and patients.
                </p>
              </div>

            </div>

            <div className="flex flex-wrap gap-2.5 text-xs font-semibold">

              <span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-blue-700">
                AI Workflows
              </span>

              <span className="rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-violet-700">
                Secure Data
              </span>

              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-emerald-700">
                Live Analytics
              </span>

            </div>

          </div>
        </div>

        {/* Main footer */}
        <div className="grid gap-12 pb-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] text-left">

          {/* Brand */}
          <div>

            <Link to="/" className="mb-6 inline-flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white bg-white shadow-md">
                <img
                  src="/assets/brand-icon.png"
                  alt="MedTech Fixaters"
                  className="w-8 h-8 object-contain"
                />
              </div>

              <div>
                <h2 className="font-bold text-slate-900 leading-tight">MedTech Fixaters</h2>

                <p className="text-xs font-semibold text-blue-600">
                  AI-Powered Healthcare Platform
                </p>
              </div>

            </Link>

            <h3 className="text-base font-bold text-slate-900">
              MedTech Fixaters
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              An AI-powered Smart OPD and hospital operations system
              connecting appointments, doctors, patients and live queues.
            </p>

            <a
              href="mailto:support@medtechfixaters.in"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              <Mail size={16} />
              support@medtechfixaters.in
            </a>

          </div>

          <FooterLinks title="Product" links={productLinks} />

          <FooterLinks title="Workspaces" links={workspaceLinks} />

          <FooterLinks title="Company" links={companyLinks} />

        </div>

        {/* Trust cards */}
        <div className="grid gap-4 border-t border-slate-200/70 py-8 md:grid-cols-3 text-left">

          <TrustCard
            icon={<ShieldCheck size={20} />}
            title="Protected Data"
            text="Hospital-level data separation"
          />

          <TrustCard
            icon={<Building2 size={20} />}
            title="Multi-Hospital System"
            text="Independent workspaces"
          />

          <TrustCard
            icon={<Brain size={20} />}
            title="AI-Powered Platform"
            text="Intelligent healthcare workflows"
          />

        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-5 border-t border-slate-200/70 py-8 text-xs text-slate-500 md:flex-row md:items-center md:justify-between text-left">

          <div>
            © 2026 MedTech Fixaters Healthcare Systems. All rights reserved.
          </div>

          <div className="flex flex-wrap items-center gap-4 font-medium">

            <span className="flex items-center gap-1.5 text-slate-600">
              <Lock size={13} className="text-slate-400" />
              SSL/TLS Encrypted
            </span>

            <span className="text-slate-300">•</span>
            <span>Mumbai</span>
            <span className="text-slate-300">•</span>
            <span>Delhi NCR</span>
            <span className="text-slate-300">•</span>
            <span>Bengaluru</span>
            <span className="text-slate-300">•</span>
            <span>Pune</span>

          </div>

        </div>

      </div>

    </footer>
  );
}

function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: string[][];
}) {
  return (
    <div>

      <h3 className="mb-5 text-sm font-bold text-slate-900 uppercase tracking-wider">
        {title}
      </h3>

      <div className="space-y-3">

        {links.map(([name, href]) => (

          <Link
            key={name}
            to={href}
            className="group flex items-center text-sm text-slate-500 transition hover:text-blue-600"
          >

            <span>{name}</span>

            <ArrowUpRight
              size={13}
              className="ml-1 opacity-0 transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-100 text-blue-600"
            />

          </Link>

        ))}

      </div>

    </div>
  );
}

function TrustCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-white/80 bg-white/70 p-4 shadow-2xs backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-md hover:bg-white">

      <div className="rounded-xl bg-blue-50 p-3 text-blue-600 transition duration-300 group-hover:scale-110 shrink-0">
        {icon}
      </div>

      <div>
        <div className="text-sm font-bold text-slate-800">
          {title}
        </div>

        <div className="mt-0.5 text-xs text-slate-500">
          {text}
        </div>
      </div>

    </div>
  );
}

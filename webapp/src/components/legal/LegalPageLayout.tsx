import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Printer,
  Share2,
  Check,
  ChevronRight,
  Shield,
  FileText,
  HelpCircle,
  Sparkles,
  ArrowUp,
  Info,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";
import PublicHeader from "../PublicHeader";
import PublicFooter from "../PublicFooter";

export interface LegalSection {
  id: string;
  number: string;
  title: string;
  content: React.ReactNode;
  category?: string;
}

interface LegalPageLayoutProps {
  pageTitle: string;
  pageSubtitle: string;
  documentType: "Privacy Policy" | "Refund & Cancellation" | "Terms & Conditions";
  lastUpdated: string;
  effectiveDate: string;
  complianceBadge?: string;
  complianceFootnote: string;
  sections: LegalSection[];
  activeRoute: "/privacy-policy" | "/refund-policy" | "/terms-and-conditions";
}

export default function LegalPageLayout({
  pageTitle,
  pageSubtitle,
  documentType,
  lastUpdated,
  effectiveDate,
  complianceBadge = "Healthcare SaaS Compliance Standard",
  complianceFootnote,
  sections,
  activeRoute,
}: LegalPageLayoutProps) {
  const [activeSectionId, setActiveSectionId] = useState<string>(
    sections[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const query = searchQuery.toLowerCase();
    return sections.filter((section) => {
      const titleMatch = section.title.toLowerCase().includes(query);
      const numberMatch = section.number.toLowerCase().includes(query);
      return titleMatch || numberMatch;
    });
  }, [sections, searchQuery]);

  // Scrollspy to track active section
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);

      const sectionElements = sections.map((sec) =>
        document.getElementById(sec.id)
      );

      const scrollPosition = window.scrollY + 180;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSectionId(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    setMobileNavOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveSectionId(id);
    }
  };

  const copySectionLink = (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSectionId(id);
      setTimeout(() => setCopiedSectionId(null), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Screen Navigation */}
      <div className="print:hidden">
        <PublicHeader />
      </div>

      {/* Hero Header Banner */}
      <header className="relative pt-28 pb-12 sm:pt-36 sm:pb-16 bg-gradient-to-b from-blue-50/70 via-white to-[#F8FAFC] border-b border-slate-200/80 overflow-hidden print:bg-white print:pt-4 print:pb-4">
        {/* Subtle Background Lighting Glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden print:hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-gradient-to-r from-blue-400/10 via-indigo-300/10 to-blue-500/10 blur-[100px] rounded-full" />
          <div className="absolute top-1/2 right-10 w-72 h-72 bg-blue-400/5 blur-[90px] rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-4 print:hidden">
            <Link to="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <ChevronRight size={13} className="text-slate-400" />
            <span className="text-slate-400">Legal Documentation</span>
            <ChevronRight size={13} className="text-slate-400" />
            <span className="text-blue-600 font-semibold">{documentType}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-3xl space-y-3 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-xs font-bold tracking-wide uppercase">
                <Shield size={13} className="text-blue-600" />
                <span>{complianceBadge}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                {pageTitle}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                "{pageSubtitle}"
              </p>

              {/* Version & Date Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-500 font-mono">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <strong>Effective Date:</strong> {effectiveDate}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <strong>Last Updated:</strong> {lastUpdated}
                </span>
              </div>
            </div>

            {/* Quick Actions (Print, Share, Tab Switcher) */}
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-semibold shadow-2xs transition-all hover:border-slate-300"
                title="Print this document or save as PDF"
              >
                <Printer size={14} className="text-slate-500" />
                <span>Print / Save PDF</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopiedSectionId("full-url");
                  setTimeout(() => setCopiedSectionId(null), 2000);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-semibold shadow-2xs transition-all hover:border-slate-300"
                title="Copy link to this document"
              >
                {copiedSectionId === "full-url" ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-700">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={14} className="text-slate-500" />
                    <span>Share Page</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Legal Document Switcher Bar */}
          <div className="mt-8 pt-4 border-t border-slate-200/70 flex items-center gap-2 overflow-x-auto pb-1 text-sm scrollbar-none print:hidden">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 shrink-0">
              Legal Documents:
            </span>
            <Link
              to="/privacy-policy"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeRoute === "/privacy-policy"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-and-conditions"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeRoute === "/terms-and-conditions"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Terms & Conditions
            </Link>
            <Link
              to="/refund-policy"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeRoute === "/refund-policy"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Refund & Cancellation
            </Link>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Mobile Table of Contents Bar */}
        <div className="lg:hidden mb-6 sticky top-20 z-20 print:hidden">
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200/90 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-2 truncate text-left">
              <FileText size={16} className="text-blue-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800 truncate">
                {sections.find((s) => s.id === activeSectionId)?.number}{" "}
                {sections.find((s) => s.id === activeSectionId)?.title ||
                  "Table of Contents"}
              </span>
            </div>
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors shrink-0"
            >
              {mobileNavOpen ? <X size={14} /> : <Menu size={14} />}
              <span>{mobileNavOpen ? "Close" : "Contents"}</span>
            </button>
          </div>

          {/* Mobile TOC Drawer */}
          {mobileNavOpen && (
            <div className="mt-2 bg-white rounded-2xl border border-slate-200 p-4 shadow-xl max-h-80 overflow-y-auto space-y-1 text-left animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Jump to Section ({sections.length})
              </div>
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    activeSectionId === sec.id
                      ? "bg-blue-50 text-blue-700 font-bold"
                      : "text-slate-600 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <span className="truncate">
                    <span className="text-slate-400 mr-2 font-mono">
                      {sec.number}
                    </span>
                    {sec.title}
                  </span>
                  {activeSectionId === sec.id && (
                    <ChevronRight size={13} className="text-blue-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sticky Sidebar (TOC & Search) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 print:hidden">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-5 text-left max-h-[calc(100vh-120px)] flex flex-col">
              {/* Search Bar */}
              <div className="relative shrink-0">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search within policy..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Table of Contents Header */}
              <div className="flex items-center justify-between shrink-0 border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText size={13} /> Table of Contents
                </span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {filteredSections.length} Sections
                </span>
              </div>

              {/* Scrollable Navigation List */}
              <nav className="overflow-y-auto space-y-1 pr-1.5 flex-1 scrollbar-thin scrollbar-thumb-slate-200">
                {filteredSections.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No sections match "{searchQuery}"
                  </div>
                ) : (
                  filteredSections.map((section) => {
                    const isActive = activeSectionId === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`group w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                          isActive
                            ? "bg-blue-50/90 text-blue-700 font-bold shadow-2xs border border-blue-200/50"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                        }`}
                      >
                        <span className="truncate pr-2">
                          <span
                            className={`font-mono mr-2 ${
                              isActive ? "text-blue-500 font-bold" : "text-slate-400"
                            }`}
                          >
                            {section.number}
                          </span>
                          {section.title}
                        </span>
                        <ChevronRight
                          size={13}
                          className={`shrink-0 transition-transform ${
                            isActive
                              ? "text-blue-600 translate-x-0.5"
                              : "text-slate-300 opacity-0 group-hover:opacity-100"
                          }`}
                        />
                      </button>
                    );
                  })
                )}
              </nav>

              {/* Legal Review Advisory Card */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-amber-900 text-[11px] leading-relaxed shrink-0">
                <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-800">
                  <AlertTriangle size={13} className="text-amber-600" /> Legal Counsel Advisory
                </div>
                This text provides standard healthcare SaaS compliance terms. Final operational documents must be reviewed by qualified legal counsel.
              </div>
            </div>
          </aside>

          {/* Right Main Content Area */}
          <div
            ref={contentContainerRef}
            className="lg:col-span-8 space-y-8 text-left"
          >
            {/* Disclaimer Callout Box */}
            <div className="p-5 rounded-3xl bg-blue-50/60 border border-blue-200/70 text-blue-950 text-xs leading-relaxed shadow-2xs print:bg-white print:border-slate-300">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
                  <Info size={16} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Legal Notice & Regulatory Framework
                  </h4>
                  <p className="text-slate-600 leading-normal">
                    MedTechFixaters is designed to support privacy, confidentiality, and data security requirements applicable to modern healthcare facilities, clinics, and hospitals. Where HIPAA applies, our contractual, technical, and administrative safeguards are implemented based on applicable HIPAA rules and formal Business Associate Agreements (BAAs).
                  </p>
                </div>
              </div>
            </div>

            {/* Sections Container */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm border border-slate-200/90 divide-y divide-slate-100">
              {filteredSections.map((section, idx) => (
                <article
                  key={section.id}
                  id={section.id}
                  className={`scroll-mt-28 ${idx === 0 ? "pb-10" : "py-10"}`}
                >
                  {/* Section Title Bar */}
                  <div className="flex items-start justify-between gap-4 mb-4 group">
                    <div className="space-y-1">
                      <div className="text-xs font-mono font-bold text-blue-600 tracking-wide uppercase">
                        Section {section.number}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        {section.title}
                      </h2>
                    </div>

                    <button
                      onClick={() => copySectionLink(section.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 text-xs font-mono flex items-center gap-1.5 shrink-0 print:hidden"
                      title="Copy link to this section"
                    >
                      {copiedSectionId === section.id ? (
                        <>
                          <Check size={13} className="text-emerald-600" />
                          <span className="text-[11px] text-emerald-700 font-sans">
                            Copied
                          </span>
                        </>
                      ) : (
                        <>
                          <Share2 size={13} />
                          <span className="text-[11px] font-sans">Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Section Rich Content */}
                  <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed space-y-4">
                    {section.content}
                  </div>
                </article>
              ))}
            </div>

            {/* Compliance Footnote Box */}
            <div className="p-6 rounded-3xl bg-slate-100 border border-slate-200/80 text-slate-600 text-xs leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                <Shield size={14} className="text-blue-600" /> Mandatory Compliance Disclosure
              </div>
              <p className="font-normal italic">
                {complianceFootnote}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Scroll To Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-30 p-3 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white shadow-lg transition-all duration-300 hover:scale-105 print:hidden"
          title="Back to Top"
        >
          <ArrowUp size={18} />
        </button>
      )}

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}

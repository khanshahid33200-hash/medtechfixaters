"use client";

import PublicHeader from "../components/PublicHeader";
import PublicFooter from "../components/PublicFooter";
import ContactPageContent from "../components/contact/ContactPage";
import { useSEO } from "../hooks/useSEO";

export default function ContactPage() {
  useSEO({
    title: "Contact MedTech Fixaters | AI-Powered Healthcare Technology",
    description:
      "Contact MedTech Fixaters to discuss hospital digital workflows, AI-assisted healthcare operations, and technology partnerships.",
  });

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      <PublicHeader />
      <main>
        <ContactPageContent />
      </main>
      <PublicFooter />
    </div>
  );
}

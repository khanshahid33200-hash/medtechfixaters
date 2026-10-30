import PublicHeader from "../components/PublicHeader";
import PublicFooter from "../components/PublicFooter";
import ContactPageContent from "../components/contact/ContactPage";
import AmbientBackground from "../components/motion/AmbientBackground";
import { AnimatedSection } from "../components/motion";
import AudienceTabs from "../components/home/AudienceTabs";
import TrustSection from "../components/home/TrustSection";
import FinalCta from "../components/home/FinalCta";
import { useSEO } from "../hooks/useSEO";

export default function ContactPage() {
  useSEO({
    title: "Contact MedTech Fixaters | AI-Powered Healthcare Technology",
    description:
      "Contact MedTech Fixaters to discuss hospital digital workflows, AI-assisted healthcare operations, and technology partnerships.",
  });

  return (
    <div className="relative min-h-[100dvh] text-[#171717] selection:bg-orange-200 font-sans antialiased overflow-x-hidden">
      <AmbientBackground />
      <PublicHeader />
      <main>
        <ContactPageContent />

        {/* Target Audience & Practice Fit */}
        <AnimatedSection>
          <AudienceTabs />
        </AnimatedSection>

        {/* Verified Healthcare Credibility */}
        <AnimatedSection>
          <TrustSection />
        </AnimatedSection>

        {/* Master Platform Call to Action */}
        <FinalCta />
      </main>
      <PublicFooter />
    </div>
  );
}

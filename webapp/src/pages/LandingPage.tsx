import { useSEO } from '../hooks/useSEO'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'
import HomeHero, { HeroFacts } from '../components/home/HomeHero'
import AudienceTabs from '../components/home/AudienceTabs'
import PatientJourney from '../components/home/PatientJourney'
import FeatureBento from '../components/home/FeatureBento'
import TrustSection from '../components/home/TrustSection'
import HomeFaq from '../components/home/HomeFaq'
import FinalCta from '../components/home/FinalCta'
import ManageClinic from '../components/home/ManageClinic'
import SetupSteps from '../components/home/SetupSteps'
import WhatWeOffer from '../components/home/WhatWeOffer'
import SmartWorkflow from '../components/home/SmartWorkflow'
import AmbientBackground from '../components/motion/AmbientBackground'
import { AnimatedSection } from '../components/motion'
import seoContent from '../content/seoRoutes.json'

const home = seoContent.routes.find((r) => r.path === '/')!

// Home page, written for clinic owners and doctors rather than engineers. One continuous
// scroll: every section blurs in as it arrives and eases back as it leaves.
export default function LandingPage() {
  useSEO({ title: home.title, description: home.description })

  return (
    <div className="relative min-h-[100dvh] text-[#171717] selection:bg-orange-200 font-sans antialiased overflow-x-hidden">
      <AmbientBackground />
      <PublicHeader />
      <main>
        <HomeHero />
        <HeroFacts />
        <AnimatedSection>
          <SetupSteps />
        </AnimatedSection>
        <AnimatedSection>
          <AudienceTabs />
        </AnimatedSection>
        <AnimatedSection>
          <WhatWeOffer />
        </AnimatedSection>
        <AnimatedSection>
          <SmartWorkflow />
        </AnimatedSection>
        <AnimatedSection>
          <FeatureBento />
        </AnimatedSection>
        <AnimatedSection>
          <ManageClinic />
        </AnimatedSection>
        <AnimatedSection id="how-it-works">
          <PatientJourney />
        </AnimatedSection>
        <AnimatedSection>
          <TrustSection />
        </AnimatedSection>
        <AnimatedSection>
          <HomeFaq />
        </AnimatedSection>
        <FinalCta />
      </main>
      <PublicFooter />
    </div>
  )
}

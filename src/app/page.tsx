import {
  Header,
  Hero,
  SocialProof,
  Features,
  Demo,
  HowItWorks,
  Testimonials,
  Pricing,
  FAQ,
  CTA,
  Footer,
} from '@/components/landing'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background dark">
      <Header />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <Demo />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}

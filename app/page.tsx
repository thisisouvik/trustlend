import {
  AboutSection,
  FaqSection,
  HeroSection,
  ProcessSection,
  ServicesSection,
  SiteFooter,
  SiteHeader,
  UspSection,
} from "@/components/landing";
import {
  aboutContent,
  faqItems,
  footerLinks,
  heroContent,
  highlightContent,
  metrics,
  navItems,
  p2pSteps,
  processSteps,
  reasons,
} from "@/lib/content/landing-content";

export default function Home() {
  return (
    <div className="site-shell">
      <SiteHeader items={navItems} />

      <main>
        <HeroSection content={heroContent} />
        <ServicesSection metrics={metrics} content={highlightContent} />
        <ProcessSection steps={processSteps} />
        <UspSection items={reasons} />
        <AboutSection content={aboutContent} steps={p2pSteps} />
        <FaqSection items={faqItems} />
      </main>

      <SiteFooter links={footerLinks} />
    </div>
  );
}

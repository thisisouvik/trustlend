import Image from "next/image";
import type { HeroContent } from "@/types/landing";

interface HeroSectionProps {
  content: HeroContent;
}

export function HeroSection({ content }: HeroSectionProps) {
  return (
    <section id="home" className="hero-section section-anchor">
      {/* Decorative floating orbs */}
      <div className="hero-orb hero-orb-1" aria-hidden="true" />
      <div className="hero-orb hero-orb-2" aria-hidden="true" />
      <div className="hero-orb hero-orb-3" aria-hidden="true" />
      <div className="hero-orb hero-orb-4" aria-hidden="true" />

      <div className="crypto-container hero-grid">
        {/* Left copy column */}
        <article className="hero-copy">
          <div className="hero-badge" role="note">
            <span className="hero-badge-dot" aria-hidden="true" />
            Behavior-first credit network
          </div>

          <h1 className="hero-title font-display">
            {content.titleMain}
            <span className="hero-title-accent">{content.titleAccent}</span>
          </h1>

          <p className="hero-description">{content.description}</p>

          {/* Role CTA cards — link to dedicated auth page */}
          <div className="hero-role-cards">
            <a href="/auth?role=borrower" className="hero-role-card">
              <div className="hero-role-icon" aria-hidden="true">💸</div>
              <div className="hero-role-text">
                <p className="hero-role-name">I&apos;m a Borrower</p>
                <p className="hero-role-hint">Access micro-loans based on real behavior</p>
              </div>
              <span className="hero-role-btn" aria-hidden="true">Get started →</span>
            </a>

            <a href="/auth?role=lender" className="hero-role-card">
              <div className="hero-role-icon" aria-hidden="true">📈</div>
              <div className="hero-role-text">
                <p className="hero-role-name">I&apos;m a Lender</p>
                <p className="hero-role-hint">Earn returns with transparent risk signals</p>
              </div>
              <span className="hero-role-btn" aria-hidden="true">Get started →</span>
            </a>
          </div>

          {/* Trust pills */}
          <div className="hero-trust-pills" role="list" aria-label="TrustLend highlights">
            <span className="hero-trust-pill" role="listitem">Email auth</span>
            <span className="hero-trust-pill hero-trust-pill-sep" aria-hidden="true">·</span>
            <span className="hero-trust-pill" role="listitem">Continue with Google</span>
            <span className="hero-trust-pill hero-trust-pill-sep" aria-hidden="true">·</span>
            <span className="hero-trust-pill" role="listitem">Free to join</span>
          </div>
        </article>

        {/* Right visual column */}
        <article className="hero-visual" aria-hidden="true">
          <div className="hero-visual-glow" />
          <div className="hero-art">
            <Image
              src="/assets/hero-trust.png"
              alt=""
              fill
              priority
              sizes="(max-width: 960px) 90vw, 48vw"
              className="object-contain"
              unoptimized
            />
          </div>

          {/* Floating stat chips */}
          <div className="hero-stat hero-stat-tl">
            <span className="hero-stat-val">98.5%</span>
            <span className="hero-stat-lbl">Repayment target</span>
          </div>
          <div className="hero-stat hero-stat-br">
            <span className="hero-stat-val">&lt;2 Min</span>
            <span className="hero-stat-lbl">Onboarding time</span>
          </div>
        </article>
      </div>
    </section>
  );
}

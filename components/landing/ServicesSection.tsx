import { MonitorPlay, TrendingUp } from "lucide-react";
import type { HighlightContent, MetricItem } from "@/types/landing";

interface ServicesSectionProps {
  metrics: MetricItem[];
  content: HighlightContent;
}

export function ServicesSection({ metrics, content }: ServicesSectionProps) {
  return (
    <>
      <section id="introduce" className="metrics-strip section-anchor">
        <div className="crypto-container grid gap-5 py-10 md:grid-cols-4">
          {metrics.map((item) => (
            <article key={item.label} className="metric-card">
              <p className="metric-value font-display">{item.value}</p>
              <p className="metric-label">{item.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="showcase-section">
        <div className="crypto-container grid items-center gap-12 py-20 lg:grid-cols-[0.9fr_1.1fr]">
          <article>
            <p className="showcase-kicker">HIGHLIGHT</p>
            <h2 className="showcase-title font-display">{content.title}</h2>
            <p className="showcase-description">{content.description}</p>
            <p className="showcase-callout">{content.callout}</p>
          </article>

          <article className="dashboard-shell">
            <div className="dashboard-bar" />
            <div className="dashboard-grid">
              <div className="dashboard-card dashboard-card-strong">
                <span className="dashboard-caption">Trust graph</span>
                <TrendingUp size={18} />
              </div>
              <div className="dashboard-card">
                <span className="dashboard-caption">Risk monitor</span>
                <MonitorPlay size={18} />
              </div>
              <div className="dashboard-chart" />
              <div className="dashboard-mini" />
            </div>
          </article>
        </div>
      </section>
    </>
  );
}

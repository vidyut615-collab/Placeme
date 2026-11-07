'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MarketingHeader } from '@/components/MarketingHeader';
import { MarketingFooter } from '@/components/MarketingFooter';
import {
  PolicyEngineDemo,
  RoleDashboardDemo,
  ApplicationPipelineDemo,
  AnalyticsDemo,
  OfferUpgradeDemo,
} from '@/components/demos';

// ─── Feature Deep-Dive data ────────────────────────────────────────────────────

const FEATURES = [
  {
    tag: 'Autonomous Engine',
    title: 'Truskill Policy Engine',
    body: 'Configure up to 20 distinct institutional policies — from withdrawal consequences to Dream / Super Dream tier classifications. The engine auto-resolves conflicting constraints and enforces disciplinary suspensions without coordinator bottleneck. Every rule operates with its own configurable reinstatement buffer.',
    bullets: [
      '20 configurable policies with zero custom code',
      'Autonomous conflict detection & blacklist trigger',
      'Per-policy reinstatement chances & cooling buffers',
      'Full administrative override with tamper-proof audit trail',
    ],
    visual: <PolicyEngineDemo />,
    flip: false,
  },
  {
    tag: 'Access Architecture',
    title: 'Tri-Party Role Isolation',
    body: "Three completely isolated operational surfaces: Students navigate their personalized application journey, college placement cells manage cohorts and institutional policy, and enterprise agencies coordinate partner campuses. Powered by Supabase Row Level Security — tenant boundaries are mathematically enforced at the database layer.",
    bullets: [
      'Database-level RLS on every single SQL query',
      'Zero cross-college or cross-student data leakage',
      'JWT-based multi-tenant security perimeter',
      'Custom role workflows for coordinators, deans, and recruiters',
    ],
    visual: <RoleDashboardDemo />,
    flip: true,
  },
  {
    tag: 'Lifecycle Engine',
    title: '14-State Application Machine',
    body: "Every student application moves through a deterministic state machine: Applied → Shortlisted → Technical Rounds → Interviewing → Selected → Offered → Hired. Each transition is cryptographically logged, timestamped, and auditable. Candidate drops are strictly categorized by cause: no-show, withdrawal, or disciplinary lock.",
    bullets: [
      '14 explicit, immutable application states',
      'Structured drop attribution (no-show, fraud, opt-out)',
      'Sub-second audit history with timestamp verification',
      'Bulk transition dispatch for university placement officers',
    ],
    visual: <ApplicationPipelineDemo />,
    flip: false,
  },
  {
    tag: 'Offer Governance',
    title: 'Offer Upgrade & Multiplier Gate',
    body: 'Eliminate lateral compensation disputes and prevent students from taking minor side-grade offers. The upgrade engine automatically computes the required CTC threshold (e.g. 1.5× base multiplier) before permitting subsequent applications, unlocking Dream and Super Dream tiers transparently.',
    bullets: [
      'Configurable 1.5× to 2.5× CTC multiplier threshold',
      'Automated Dream & Super Dream tier unlocking',
      'Coexistence rules with maximum simultaneous offer caps',
      'Instant candidate notification upon tier promotion',
    ],
    visual: <OfferUpgradeDemo />,
    flip: true,
  },
  {
    tag: 'Institutional Intelligence',
    title: 'NIRF Analytics & Real-Time Telemetry',
    body: 'Real-time placement velocity, branch-wise clearance rates, and median CTC computation formatted directly for NIRF accreditation and board reviews. Coordinators monitor drive efficiency, funnel conversion, and YoY trends without exporting spreadsheets.',
    bullets: [
      'Real-time batch clearance velocity & acceptance rate',
      'Department-level compensation breakdowns',
      'Automated NIRF-ready data exports & institutional reports',
      'Zero-latency sync across all placement cell terminals',
    ],
    visual: <AnalyticsDemo />,
    flip: false,
  },
];

// ─── Feature Section Component ─────────────────────────────────────────────────

function FeatureSection({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.05 }}
      className={`flex flex-col ${feature.flip ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-10 lg:gap-16 items-center`}
    >
      {/* Text column */}
      <div className="w-full lg:w-5/12 max-w-xl">
        <span className="inline-block font-mono text-[11px] uppercase tracking-[0.12em] text-[#2b59d1] bg-[#cfdaf5]/50 border border-[#2b59d1]/20 rounded-full px-4 py-1.5 mb-5 font-semibold">
          [{String(index + 1).padStart(2, '0')}] {feature.tag}
        </span>
        <h3 className="font-heading font-[400] text-[32px] md:text-[42px] text-[#242424] leading-[1.2] tracking-[-0.8px] mb-4">
          {feature.title}
        </h3>
        <p className="font-mono text-[15px] text-[#4e4d4d] leading-[1.65] mb-6">
          {feature.body}
        </p>
        <ul className="space-y-3">
          {feature.bullets.map((b) => (
            <li key={b} className="flex items-start gap-3">
              <span className="font-mono text-[#2b59d1] font-semibold mt-0.5">→</span>
              <span className="font-mono text-[13px] text-[#4e4d4d] leading-relaxed">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Visual column — broad, filling its space */}
      <div className="w-full lg:w-7/12">
        {feature.visual}
      </div>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f6f3f1] selection:bg-[#242424] selection:text-white">
      <MarketingHeader />

      <main className="flex-1">

        {/* Hero */}
        <section className="max-w-[1000px] mx-auto px-6 py-20 md:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center bg-[#cfdaf5] text-[#2b59d1] font-mono text-[11px] uppercase tracking-[0.1em] px-4 py-1.5 rounded-full mb-6 font-semibold"
          >
            System Capabilities
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-heading font-[400] text-[48px] md:text-[68px] text-[#242424] leading-[1.1] tracking-[-1.6px] mb-6"
          >
            Engineered for zero conflicts.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-mono text-[16px] md:text-[18px] text-[#4e4d4d] max-w-2xl mx-auto leading-relaxed"
          >
            Five dedicated engines working synchronously to govern candidate eligibility, multi-role security, offer tiering, and institutional telemetry.
          </motion.p>
        </section>

        {/* Feature deep-dives */}
        <section className="max-w-[1400px] mx-auto px-6 pb-24 md:pb-36 space-y-24 md:space-y-36">
          {FEATURES.map((f, i) => (
            <FeatureSection key={f.title} feature={f} index={i} />
          ))}
        </section>

        {/* CTA Banner */}
        <section className="max-w-[1240px] mx-auto px-6 pb-24 md:pb-32">
          <div className="bg-[#242424] rounded-[36px] px-8 py-16 md:py-20 text-center relative overflow-hidden shadow-xl">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#cfdaf5] block font-semibold">
                Enterprise Deployment
              </span>
              <h2 className="font-heading font-[400] text-[36px] md:text-[48px] text-white leading-[1.2] tracking-[-0.96px]">
                Ready to deploy the Truskill Engine?
              </h2>
              <p className="font-mono text-[15px] text-white/70 leading-relaxed">
                Connect your student information system, configure your institutional rulebook, and launch your automated placement season in under 48 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-[#2b59d1] px-8 h-12 font-mono text-[13px] uppercase tracking-[0.06em] text-white font-medium hover:bg-[#2448b8] transition-colors"
                >
                  Schedule Institutional Onboarding →
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 h-12 font-mono text-[13px] uppercase tracking-[0.06em] text-white hover:bg-white/10 transition-colors"
                >
                  Access Live Console
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      <MarketingFooter />
    </div>
  );
}

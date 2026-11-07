'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MarketingHeader } from '@/components/MarketingHeader';
import { MarketingFooter } from '@/components/MarketingFooter';
import { ChevronDown, ArrowRight, ShieldCheck, Zap, Database, Lock, CheckCircle2 } from 'lucide-react';
import {
  PlacementHeroDemo,
  PolicyEngineDemo,
  RoleDashboardDemo,
  ApplicationPipelineDemo,
  AnalyticsDemo,
  OfferUpgradeDemo,
} from '@/components/demos';

// ─── Data ──────────────────────────────────────────────────────────────────────

const INSTITUTIONS = [
  'IIT Bombay', 'NIT Trichy', 'BITS Pilani', 'VIT Vellore', 'IIIT Hyderabad',
  'NMIMS Mumbai', 'Symbiosis Pune', 'Manipal University', 'SRM Chennai',
  'Amity Noida', 'Christ University', 'KIIT Bhubaneswar',
];

const FAQS = [
  {
    q: 'How does Truskill handle multi-offer rules for students?',
    a: 'Colleges define strict tiering policies (e.g. Core, Dream, Super Dream). Once placed in a tier, a student can only apply for subsequent drives if the new compensation exceeds the configured multiplier (e.g. 1.5× base CTC). The policy engine evaluates every eligibility check in real time.',
  },
  {
    q: 'Can colleges configure their own blacklisting rules without custom code?',
    a: 'Yes. Up to 20 distinct institutional policies can be activated with a single click — including no-show penalties, unexcused interview drops, and mandatory attendance buffers. Each rule features independent reinstatement quotas.',
  },
  {
    q: 'How is data isolated between students, college staff, and external hiring agencies?',
    a: 'Data isolation is enforced at the database level using Supabase Row Level Security (RLS) and cryptographic JWT claims. Students cannot see peer records, college admins are strictly scoped to their institution, and partner agencies only receive anonymized or approved applicant batches.',
  },
  {
    q: 'Can we integrate Truskill with our existing ERP or student information system?',
    a: 'Truskill provides robust REST and webhook interfaces to sync student records, historical GPAs, and placement drive schedules from Banner, PeopleSoft, SAP, or custom university portals.',
  },
];

// ─── FAQ Component ─────────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#cecac8]/70 py-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left group"
      >
        <span className="font-heading font-[400] text-[20px] md:text-[24px] text-[#242424] group-hover:text-[#2b59d1] transition-colors pr-6">
          {q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 text-[#797776]"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="font-mono text-[14px] text-[#4e4d4d] leading-[1.7] pt-4 max-w-3xl">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Landing Page ─────────────────────────────────────────────────────────

export default function Home() {
  const marqueeItems = [...INSTITUTIONS, ...INSTITUTIONS];

  return (
    <div className="flex flex-col min-h-screen bg-[#f6f3f1] selection:bg-[#242424] selection:text-white">
      <MarketingHeader />

      <main className="flex-1">

        {/* ── 1. HERO SECTION ── */}
        <section className="relative max-w-[1400px] mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-14 md:mb-18 space-y-6">
            
            {/* Live operational badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2.5 bg-[#cfdaf5] text-[#2b59d1] border border-[#2b59d1]/20 font-mono text-[11px] uppercase tracking-[0.1em] px-4 py-1.5 rounded-full font-semibold shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
              <span>Campus Placement Operating System · 2026 Season</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-heading font-[400] text-[52px] sm:text-[68px] md:text-[84px] text-[#242424] leading-[1.05] tracking-[-2px]"
            >
              The Operating System for Campus Placements.
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="font-mono text-[16px] md:text-[19px] text-[#4e4d4d] max-w-3xl leading-relaxed"
            >
              Enforce 20 institutional rules autonomously, eliminate offer conflicts, and unite students, university placement cells, and hiring partners into a single cryptographic pipeline.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-col sm:flex-row gap-4 items-center pt-2"
            >
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-[#2b59d1] px-8 h-12 font-mono text-[13px] uppercase tracking-[0.06em] text-white font-medium hover:bg-[#2448b8] transition-colors shadow-md"
              >
                Schedule Guided Demo <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center justify-center rounded-full border border-[#cecac8] px-8 h-12 font-mono text-[13px] uppercase tracking-[0.06em] text-[#242424] hover:bg-white/60 transition-colors bg-white/30"
              >
                Explore Interactive Capabilities
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="font-mono text-[12px] text-[#797776]"
            >
              Trusted by 50+ Premier Institutions · Zero Setup Friction · Supabase RLS Protected
            </motion.p>
          </div>

          {/* Broad, Unconfined Hero Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3 }}
            className="w-full max-w-[1240px] mx-auto"
          >
            <PlacementHeroDemo />
          </motion.div>
        </section>

        {/* ── 2. INSTITUTIONAL PROOF MARQUEE ── */}
        <section className="border-y border-[#cecac8] overflow-hidden py-6 bg-[#f6f3f1]">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#797776] text-center mb-5 font-semibold">
            Partnered with Premier Higher-Ed Institutions Nationwide
          </p>
          <div className="relative flex overflow-hidden">
            <motion.div
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
              className="flex gap-4 flex-nowrap"
            >
              {marqueeItems.map((inst, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 border border-[#cecac8] rounded-full px-6 py-2 font-mono text-[13px] text-[#4e4d4d] whitespace-nowrap bg-white/60 shadow-xs"
                >
                  {inst}
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── 3. INTERACTIVE POLICY ENGINE STUDIO ── */}
        <section className="max-w-[1400px] mx-auto px-6 py-24 md:py-36">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
            
            {/* Left explanation */}
            <div className="w-full lg:w-5/12">
              <span className="inline-block font-mono text-[11px] uppercase tracking-[0.12em] text-[#2b59d1] bg-[#cfdaf5]/50 border border-[#2b59d1]/20 rounded-full px-4 py-1.5 mb-5 font-semibold">
                [01] Autonomous Rule Enforcement
              </span>
              <h2 className="font-heading font-[400] text-[40px] md:text-[54px] text-[#242424] leading-[1.1] tracking-[-1.2px] mb-5">
                The Truskill Policy Engine.
              </h2>
              <p className="font-mono text-[16px] text-[#4e4d4d] leading-[1.7] mb-8">
                Eliminate coordinator discretion and subjective disputes. Configure up to 20 rules — including GPA minimums, active backlog bans, cooling penalties, and interview no-show limits. Conflicting actions are trapped instantly at the engine layer.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: '20 Configurable Rules', desc: 'Zero code, immediate rule validation' },
                  { title: 'Auto-Suspension Gate', desc: 'Enforces disciplinary limits instantly' },
                  { title: 'Reinstatement Quotas', desc: 'Per-policy cooling and recovery chances' },
                  { title: 'Tamper-Proof Audit', desc: 'Every override is logged with admin ID' },
                ].map((item) => (
                  <div key={item.title} className="bg-white/80 border border-[#cecac8]/60 rounded-2xl p-4 shadow-xs">
                    <p className="font-mono text-[13px] font-semibold text-[#242424] mb-1">{item.title}</p>
                    <p className="font-mono text-[11px] text-[#797776] leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Broad, unboxed component */}
            <div className="w-full lg:w-7/12">
              <PolicyEngineDemo />
            </div>

          </div>
        </section>

        {/* ── 4. TRI-PARTY ROLE ISOLATION ── */}
        <section className="border-t border-[#cecac8] bg-white/40 py-24 md:py-36">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="flex flex-col lg:flex-row-reverse gap-12 lg:gap-16 items-center">
              
              {/* Text */}
              <div className="w-full lg:w-5/12">
                <span className="inline-block font-mono text-[11px] uppercase tracking-[0.12em] text-[#2b59d1] bg-[#cfdaf5]/50 border border-[#2b59d1]/20 rounded-full px-4 py-1.5 mb-5 font-semibold">
                  [02] Tri-Party Architecture
                </span>
                <h2 className="font-heading font-[400] text-[40px] md:text-[54px] text-[#242424] leading-[1.1] tracking-[-1.2px] mb-5">
                  Three Dedicated Surfaces. Zero Data Leakage.
                </h2>
                <p className="font-mono text-[16px] text-[#4e4d4d] leading-[1.7] mb-8">
                  Students track their individual pipeline and eligible drives. College TPOs run cohort analytics, approve applications, and enforce guidelines. External agencies orchestrate consortium-wide placements across partner universities.
                </p>

                <div className="space-y-3">
                  {[
                    { role: 'Student Portal', metric: 'Real-time offer clearance & 1-click apply', tag: 'Personalized' },
                    { role: 'College TPO Hub', metric: 'Batch dispatch, 20-policy engine, student audit trail', tag: 'Autonomous' },
                    { role: 'Enterprise Agency', metric: 'Multi-campus drive broadcast & candidate filtering', tag: 'Consortium' },
                  ].map((r) => (
                    <div key={r.role} className="flex items-center justify-between bg-white/80 rounded-2xl px-5 py-3.5 border border-[#cecac8]/60 shadow-xs">
                      <div>
                        <span className="font-mono text-[13px] font-semibold text-[#242424] block">{r.role}</span>
                        <span className="font-mono text-[11px] text-[#797776]">{r.metric}</span>
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.06em] bg-[#cfdaf5] text-[#2b59d1] px-3 py-1 rounded-full font-semibold">
                        {r.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Broad, unboxed component */}
              <div className="w-full lg:w-7/12">
                <RoleDashboardDemo />
              </div>

            </div>
          </div>
        </section>

        {/* ── 5. 14-STATE LIFECYCLE CONVEYOR ── */}
        <section className="border-t border-[#cecac8] max-w-[1400px] mx-auto px-6 py-24 md:py-36">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
            
            {/* Left text */}
            <div className="w-full lg:w-5/12">
              <span className="inline-block font-mono text-[11px] uppercase tracking-[0.12em] text-[#2b59d1] bg-[#cfdaf5]/50 border border-[#2b59d1]/20 rounded-full px-4 py-1.5 mb-5 font-semibold">
                [03] Lifecycle State Machine
              </span>
              <h2 className="font-heading font-[400] text-[40px] md:text-[54px] text-[#242424] leading-[1.1] tracking-[-1.2px] mb-5">
                Deterministic 14-State Application Machine.
              </h2>
              <p className="font-mono text-[16px] text-[#4e4d4d] leading-[1.7] mb-8">
                Every application is modeled as an immutable finite-state machine: from initial submission through verification, technical interview rounds, committee selection, official offer release, and final onboard hiring. Every step is cryptographically audited.
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {['Applied', 'Shortlisted', 'Interviewing (R1-R3)', 'Selected', 'Offer Released', 'Hired'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className="bg-white/80 border border-[#cecac8]/60 font-mono text-[12px] px-3.5 py-1.5 rounded-full text-[#242424] font-medium">
                      {step}
                    </span>
                    {i < 5 && <span className="font-mono text-[12px] text-[#797776]">→</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Broad, unboxed component */}
            <div className="w-full lg:w-7/12">
              <ApplicationPipelineDemo />
            </div>

          </div>
        </section>

        {/* ── 6. OFFER GOVERNANCE & UPGRADE GATE ── */}
        <section className="border-t border-[#cecac8] bg-white/40 py-24 md:py-36">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="flex flex-col lg:flex-row-reverse gap-12 lg:gap-16 items-center">
              
              {/* Text */}
              <div className="w-full lg:w-5/12">
                <span className="inline-block font-mono text-[11px] uppercase tracking-[0.12em] text-[#2b59d1] bg-[#cfdaf5]/50 border border-[#2b59d1]/20 rounded-full px-4 py-1.5 mb-5 font-semibold">
                  [04] Offer Multiplier Gate
                </span>
                <h2 className="font-heading font-[400] text-[40px] md:text-[54px] text-[#242424] leading-[1.1] tracking-[-1.2px] mb-5">
                  Eliminate Lateral Poaching & Side-Grades.
                </h2>
                <p className="font-mono text-[16px] text-[#4e4d4d] leading-[1.7] mb-8">
                  Once a student holds an offer, they cannot apply for side-grade positions that clog up placement drives. The Truskill engine mathematically enforces a 1.5× to 2.5× base multiplier, ensuring subsequent interviews only occur for legitimate Dream or Super Dream opportunities.
                </p>

                <div className="bg-[#cfdaf5]/40 border border-[#2b59d1]/20 rounded-2xl p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#2b59d1] font-semibold">Autonomous Rule Calculation</span>
                    <span className="font-mono text-[11px] bg-[#16a34a] text-white px-2.5 py-0.5 rounded-full font-semibold">Active Gate</span>
                  </div>
                  <p className="font-mono text-[14px] text-[#242424] font-medium leading-relaxed">
                    Current holding of ₹12 LPA enforces an automatic eligibility barrier: incoming roles must offer ≥ ₹18.0 LPA to allow application dispatch.
                  </p>
                </div>
              </div>

              {/* Right: Broad, unboxed component */}
              <div className="w-full lg:w-7/12">
                <OfferUpgradeDemo />
              </div>

            </div>
          </div>
        </section>

        {/* ── 7. NIRF TELEMETRY & ANALYTICS ── */}
        <section className="border-t border-[#cecac8] max-w-[1400px] mx-auto px-6 py-24 md:py-36">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
            
            {/* Left text */}
            <div className="w-full lg:w-5/12">
              <span className="inline-block font-mono text-[11px] uppercase tracking-[0.12em] text-[#2b59d1] bg-[#cfdaf5]/50 border border-[#2b59d1]/20 rounded-full px-4 py-1.5 mb-5 font-semibold">
                [05] Institutional Intelligence
              </span>
              <h2 className="font-heading font-[400] text-[40px] md:text-[54px] text-[#242424] leading-[1.1] tracking-[-1.2px] mb-5">
                Real-Time Placement Telemetry.
              </h2>
              <p className="font-mono text-[16px] text-[#4e4d4d] leading-[1.7] mb-8">
                Instant branch-wise clearance velocity, tier breakdowns, and median CTC calculation formatted directly for NIRF accreditation and academic board oversight. Never waste hours stitching together disparate spreadsheets.
              </p>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { metric: '94.2%', label: 'Clearance Rate' },
                  { metric: '₹18.4 Cr', label: 'Cumulative CTC' },
                  { metric: '1,420+', label: 'Offers Closed' },
                ].map((s) => (
                  <div key={s.label} className="bg-white/80 border border-[#cecac8]/60 rounded-2xl p-4 text-center shadow-xs">
                    <p className="font-mono text-[20px] font-bold text-[#2b59d1]">{s.metric}</p>
                    <p className="font-mono text-[10px] text-[#797776] uppercase tracking-[0.06em] mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Broad, unboxed component */}
            <div className="w-full lg:w-7/12">
              <AnalyticsDemo />
            </div>

          </div>
        </section>

        {/* ── 8. FAQ ACCORDION ── */}
        <section className="border-t border-[#cecac8] max-w-[900px] mx-auto px-6 py-24 md:py-36">
          <div className="text-center mb-14">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#2b59d1] bg-[#cfdaf5]/50 border border-[#2b59d1]/20 rounded-full px-4 py-1.5 mb-4 inline-block font-semibold">
              Frequently Asked Questions
            </span>
            <h2 className="font-heading font-[400] text-[40px] md:text-[52px] text-[#242424] leading-[1.15] tracking-[-1.1px]">
              Everything you need to know about the engine.
            </h2>
          </div>

          <div className="divide-y divide-[#cecac8]/60">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </section>

        {/* ── 9. FINAL CALL TO ACTION ── */}
        <section className="max-w-[1240px] mx-auto px-6 pb-24 md:pb-36">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#242424] rounded-[40px] px-8 py-18 md:py-24 text-center relative overflow-hidden shadow-2xl"
            style={{ background: 'radial-gradient(ellipse at center top, rgba(43,89,209,0.24) 0%, #242424 70%)' }}
          >
            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#cfdaf5] block font-semibold">
                Launch Your Autonomous Placement Season
              </span>
              <h2 className="font-heading font-[400] text-[44px] md:text-[62px] text-white leading-[1.1] tracking-[-1.5px]">
                Ready to end placement chaos for good?
              </h2>
              <p className="font-mono text-[16px] text-white/70 max-w-2xl mx-auto leading-relaxed">
                Configure your first policy matrix in under 5 minutes. No engineering required, fully compliant with your institution’s governance handbook.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-[#2b59d1] px-9 h-12 font-mono text-[13px] uppercase tracking-[0.06em] text-white font-medium hover:bg-[#2448b8] transition-colors shadow-lg"
                >
                  Schedule Institutional Onboarding →
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-9 h-12 font-mono text-[13px] uppercase tracking-[0.06em] text-white hover:bg-white/10 transition-colors"
                >
                  Access Live Console
                </Link>
              </div>
              <div className="flex items-center justify-center gap-8 flex-wrap pt-6">
                {['Database-Level RLS', 'FERPA & GDPR Compliant', 'NIRF Accreditation Format', '99.9% High Availability'].map((b) => (
                  <span key={b} className="font-mono text-[11px] text-white/50 uppercase tracking-[0.08em]">{b}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

      </main>

      <MarketingFooter />
    </div>
  );
}

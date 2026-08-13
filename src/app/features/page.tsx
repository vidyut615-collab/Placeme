'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MarketingHeader } from '@/components/MarketingHeader';
import { MarketingFooter } from '@/components/MarketingFooter';

// ─── Feature Deep-Dive data ────────────────────────────────────────────────────

const FEATURES = [
  {
    tag: 'Core Engine',
    title: 'Truskill Policy Engine',
    body: 'Configure up to 20 distinct policies — from withdrawal limits to Dream/Super Dream classifications. The engine auto-resolves conflicts and enforces blacklisting without any manual intervention. Every rule is independently configurable with its own reinstatement buffer.',
    bullets: [
      '20 configurable policies, zero code',
      'Per-policy reinstatement chances',
      'Auto-blacklist + auto-resolve on removal',
      'Override management with audit trail',
    ],
    visual: (
      <div className="bg-[#cfdaf5] rounded-[32px] p-8 space-y-3">
        {[
          { label: 'Eligibility Policy', enabled: true, sub: 'Min GPA 7.0 · No active backlogs' },
          { label: 'Offer Upgrade Gate', enabled: true, sub: '1.5× CTC multiplier · Dream tier' },
          { label: 'No-Show Limit', enabled: false, sub: 'Max 2 excused absences per cycle' },
          { label: 'Withdrawal Consequence', enabled: true, sub: 'Post-shortlist: suspension 30d' },
        ].map((item) => (
          <div key={item.label} className="bg-white/70 rounded-2xl px-5 py-4">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[13px] font-medium text-[#242424]">{item.label}</span>
              <div className={`w-9 h-5 rounded-full relative transition-colors ${item.enabled ? 'bg-[#2b59d1]' : 'bg-[#cecac8]'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${item.enabled ? 'right-0.5' : 'left-0.5'}`} />
              </div>
            </div>
            <p className="font-mono text-[11px] text-[#797776]">{item.sub}</p>
          </div>
        ))}
      </div>
    ),
    flip: false,
  },
  {
    tag: 'Access Control',
    title: 'Role-Based Access Control',
    body: "Three completely isolated dashboards: Students see their applications, colleges manage their students, agencies oversee partner colleges. Powered by Supabase Row Level Security — it's not just a UI gate, it's enforced at the database level.",
    bullets: [
      'Database-level RLS on every query',
      'Zero cross-role data leakage',
      'JWT-based college isolation',
      'Custom per-role workflows',
    ],
    visual: (
      <div className="space-y-3">
        {[
          { role: 'Agency', desc: 'All colleges & jobs', count: '24 colleges', bg: 'bg-[#242424]', text: 'text-white', sub: 'text-white/60' },
          { role: 'College Admin', desc: 'Own students & policies', count: '342 students', bg: 'bg-[#cfdaf5]', text: 'text-[#242424]', sub: 'text-[#797776]' },
          { role: 'Student', desc: 'Own applications only', count: '8 applications', bg: 'bg-[#f6f3f1] border border-[#cecac8]', text: 'text-[#242424]', sub: 'text-[#797776]' },
        ].map((r) => (
          <div key={r.role} className={`${r.bg} rounded-2xl px-6 py-4 flex items-center justify-between`}>
            <div>
              <p className={`font-heading font-semibold text-[15px] ${r.text}`}>{r.role}</p>
              <p className={`font-mono text-[12px] ${r.sub}`}>{r.desc}</p>
            </div>
            <span className={`font-mono text-[13px] ${r.text} font-medium`}>{r.count}</span>
          </div>
        ))}
      </div>
    ),
    flip: true,
  },
  {
    tag: 'Lifecycle',
    title: 'Application Lifecycle Tracking',
    body: "Every application moves through a strict state machine: Applied → Shortlisted → Interviewing → Selected → Offered → Hired. Each transition is logged, timestamped, and auditable. Drops are categorized: no-show, withdrawal, misconduct, data fraud.",
    bullets: [
      '14 explicit application states',
      'Categorized drop reasons',
      'Full timestamp audit trail',
      'Bulk status updates for college staff',
    ],
    visual: (
      <div className="space-y-2">
        {[
          { stage: 'Applied', date: 'Aug 1', done: true },
          { stage: 'Shortlisted', date: 'Aug 3', done: true },
          { stage: 'Interviewing', date: 'Aug 6', done: true },
          { stage: 'Selected', date: 'Aug 9', done: true },
          { stage: 'Offered', date: 'Aug 10', done: false, active: true },
          { stage: 'Hired', date: '—', done: false },
        ].map((s) => (
          <div key={s.stage} className={`flex items-center gap-4 rounded-2xl px-5 py-3 ${s.active ? 'bg-[#cfdaf5]' : s.done ? 'bg-white/80' : 'bg-[#f6f3f1]/50'}`}>
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.done || s.active ? 'bg-[#2b59d1]' : 'bg-[#cecac8]'}`} />
            <span className={`font-mono text-[13px] flex-1 ${s.done || s.active ? 'text-[#242424]' : 'text-[#cecac8]'}`}>{s.stage}</span>
            <span className="font-mono text-[11px] text-[#797776]">{s.date}</span>
          </div>
        ))}
      </div>
    ),
    flip: false,
  },
  {
    tag: 'Offer Management',
    title: 'Offer & Upgrade Management',
    body: 'Once placed, students can apply for better opportunities — but only if the new offer exceeds a configurable CTC multiplier (e.g., 1.5×). The upgrade policy prevents lowball lateral moves while keeping aspirations alive.',
    bullets: [
      'Configurable CTC multiplier gate',
      'Dream/Super Dream classification',
      'Offer coexistence rules',
      'Max offers per cycle enforcement',
    ],
    visual: (
      <div className="space-y-3">
        <div className="bg-[#f6f3f1] border border-[#cecac8] rounded-2xl px-6 py-5">
          <p className="font-mono text-[11px] text-[#797776] uppercase tracking-[0.08em] mb-2">Current Offer</p>
          <p className="font-heading font-semibold text-[28px] text-[#242424]">₹12 LPA</p>
          <p className="font-mono text-[12px] text-[#797776]">TCS · SDE-1 · Core Tier</p>
        </div>
        <div className="flex items-center gap-3 justify-center">
          <div className="flex-1 h-px bg-[#cecac8]" />
          <span className="font-mono text-[12px] text-[#797776]">1.5× gate = ₹18 LPA min</span>
          <div className="flex-1 h-px bg-[#cecac8]" />
        </div>
        <div className="bg-[#cfdaf5] rounded-2xl px-6 py-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-mono text-[11px] text-[#2b59d1] uppercase tracking-[0.08em]">Upgrade Offer</p>
            <span className="font-mono text-[11px] bg-[#a7fccd]/60 text-[#16a34a] px-2 py-0.5 rounded-full">✓ Eligible</span>
          </div>
          <p className="font-heading font-semibold text-[28px] text-[#242424]">₹22 LPA</p>
          <p className="font-mono text-[12px] text-[#4e4d4d]">Google · SDE-1 · Dream Tier</p>
        </div>
      </div>
    ),
    flip: true,
  },
  {
    tag: 'Analytics',
    title: 'Analytics & Reporting',
    body: 'Real-time placement statistics per college, per drive, per department. Monitor offer acceptance rates, track student demographics, and benchmark against previous cycles. Data never leaves your institution\'s scope.',
    bullets: [
      'Per-drive placement rates',
      'Department-wise analytics',
      'Offer acceptance funnel',
      'Year-over-year benchmarking',
    ],
    visual: (
      <div className="bg-[#f6f3f1] border border-[#cecac8] rounded-[32px] p-6 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Placed', value: '78%', color: 'text-[#16a34a]' },
            { label: 'Offers', value: '124', color: 'text-[#2b59d1]' },
            { label: 'Avg CTC', value: '₹9.2L', color: 'text-[#242424]' },
          ].map((s) => (
            <div key={s.label} className="text-center bg-white rounded-2xl p-3">
              <p className={`font-heading font-semibold text-[20px] ${s.color}`}>{s.value}</p>
              <p className="font-mono text-[11px] text-[#797776] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="font-mono text-[11px] text-[#797776] uppercase tracking-[0.08em] mb-2">Monthly Placements</p>
          <div className="flex items-end gap-1.5 h-16">
            {[20, 45, 35, 60, 50, 80, 65, 90, 72, 88, 76, 95].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{ height: `${h}%`, backgroundColor: i === 11 ? '#2b59d1' : i > 7 ? 'rgba(43,89,209,0.35)' : 'rgba(43,89,209,0.15)' }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    flip: false,
  },
  {
    tag: 'Multi-College',
    title: 'Agency–College Bridge',
    body: "Placement agencies can manage multiple partner colleges from a unified dashboard. Post global jobs visible to all partner colleges, track cross-college drives, and maintain each institution's separate policy context seamlessly.",
    bullets: [
      'Unified agency overview',
      'Global job posting to all colleges',
      'Per-college policy isolation',
      'Cross-college drive analytics',
    ],
    visual: (
      <div className="space-y-4">
        <div className="bg-[#242424] rounded-2xl px-6 py-4 text-center">
          <p className="font-mono text-[11px] text-white/60 uppercase tracking-[0.08em]">Agency</p>
          <p className="font-heading font-semibold text-[16px] text-white mt-0.5">TruskillHire Corp</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="flex-1 h-px bg-[#cecac8]" />
          <div className="w-1 h-1 rounded-full bg-[#cecac8]" />
          <div className="flex-1 h-px bg-[#cecac8]" />
          <div className="w-1 h-1 rounded-full bg-[#cecac8]" />
          <div className="flex-1 h-px bg-[#cecac8]" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['IIT Bombay', 'NIT Trichy', 'BITS Pilani'].map((c) => (
            <div key={c} className="bg-[#cfdaf5] rounded-2xl px-3 py-3 text-center">
              <p className="font-mono text-[11px] text-[#2b59d1] font-medium leading-tight">{c}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <span className="font-mono text-[12px] text-[#797776]">+ 47 more partner colleges</span>
        </div>
      </div>
    ),
    flip: true,
  },
];

// ─── Feature Section Component ─────────────────────────────────────────────────

function FeatureSection({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: 0.05 }}
      className={`flex flex-col ${feature.flip ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 lg:gap-20 items-center`}
    >
      {/* Text */}
      <div className="flex-1">
        <span className="inline-block font-mono text-[11px] uppercase tracking-[0.12em] text-[#797776] border border-[#cecac8] rounded-full px-4 py-1.5 mb-6">
          {feature.tag}
        </span>
        <h3 className="font-heading font-[400] text-[36px] md:text-[44px] text-[#242424] leading-[1.2] tracking-[-0.88px] mb-5">
          {feature.title}
        </h3>
        <p className="font-mono text-[16px] text-[#4e4d4d] leading-[1.65] mb-8">
          {feature.body}
        </p>
        <ul className="space-y-3">
          {feature.bullets.map((b) => (
            <li key={b} className="flex items-start gap-3">
              <span className="font-mono text-[#2b59d1] mt-0.5">→</span>
              <span className="font-mono text-[14px] text-[#4e4d4d]">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Visual */}
      <div className="flex-1 w-full max-w-[480px] lg:max-w-none">
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
        <section className="max-w-[900px] mx-auto px-6 py-24 md:py-36 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center bg-[#cfdaf5] text-[#2b59d1] font-mono text-[11px] uppercase tracking-[0.1em] px-4 py-1.5 rounded-full mb-8"
          >
            Product Features
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="font-heading font-[400] text-[52px] md:text-[72px] text-[#242424] leading-[1.1] tracking-[-1.44px] mb-7"
          >
            Every tool placement coordinators have been asking for.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="font-mono text-[18px] md:text-[20px] text-[#4e4d4d] leading-[1.55]"
          >
            Placeme doesn't just track. It reasons, enforces, and resolves.
          </motion.p>
        </section>

        {/* Feature Sections */}
        <section className="max-w-[1200px] mx-auto px-6 pb-24 md:pb-32 space-y-32">
          {FEATURES.map((feature, i) => (
            <div key={feature.tag}>
              {i > 0 && <div className="border-t border-[#cecac8] mb-24" />}
              <FeatureSection feature={feature} index={i} />
            </div>
          ))}
        </section>

        {/* Bottom CTA */}
        <section className="max-w-[1200px] mx-auto px-6 pb-24 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[40px] px-10 py-20 text-center"
            style={{ background: 'radial-gradient(ellipse at center top, rgba(43,89,209,0.12) 0%, #242424 60%)' }}
          >
            <h2 className="font-heading font-[400] text-[44px] md:text-[56px] text-white leading-[1.15] tracking-[-1.12px] mb-5">
              See it live in your institution.
            </h2>
            <p className="font-mono text-[17px] text-[#cecac8] mb-10">
              Book a 30-minute walkthrough with a placement specialist.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-[#2b59d1] px-9 h-12 font-mono text-[14px] uppercase tracking-[0.06em] text-white hover:bg-[#2448b8] transition-colors"
              >
                Book a demo ▸
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-full border border-[#cecac8]/40 px-9 h-12 font-mono text-[14px] uppercase tracking-[0.06em] text-white hover:bg-white/10 transition-colors"
              >
                See pricing
              </Link>
            </div>
          </motion.div>
        </section>

      </main>

      <MarketingFooter />
    </div>
  );
}

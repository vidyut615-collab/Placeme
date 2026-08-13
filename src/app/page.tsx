'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { MarketingHeader } from '@/components/MarketingHeader';
import { MarketingFooter } from '@/components/MarketingFooter';
import { ChevronDown, X } from 'lucide-react';

// ─── Data ──────────────────────────────────────────────────────────────────────

const INSTITUTIONS = [
  'IIT Bombay', 'NIT Trichy', 'BITS Pilani', 'VIT Vellore', 'NMIMS Mumbai',
  'IIIT Hyderabad', 'Symbiosis Pune', 'Manipal University', 'SRM Chennai',
  'Amity Noida', 'Christ University', 'KIIT Bhubaneswar',
];

const FEATURES = [
  {
    index: '01',
    title: 'Truskill Policy Engine',
    body: 'Configure 20 distinct placement rules without writing code. Auto-resolve conflicts, enforce blacklists, and manage Dream / Super Dream tiers from a unified interface.',
    color: 'bg-[#cfdaf5]',
    accent: 'text-[#2b59d1]',
    mockup: (
      <div className="space-y-3">
        {[
          { label: 'Eligibility Policy', on: true },
          { label: 'Offer Upgrade Gate', on: true },
          { label: 'No-Show Limit', on: false },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between bg-white/60 rounded-2xl px-4 py-3">
            <span className="font-mono text-[13px] text-[#242424]">{item.label}</span>
            <div className={`w-9 h-5 rounded-full relative transition-colors ${item.on ? 'bg-[#2b59d1]' : 'bg-[#cecac8]'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${item.on ? 'right-0.5' : 'left-0.5'}`} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    index: '02',
    title: 'Role-Based Dashboards',
    body: 'Students, colleges, and agencies each get a completely isolated view. Powered by Supabase Row Level Security — not a UI gate, but enforced at the database layer.',
    color: 'bg-[#f6f3f1]',
    accent: 'text-[#4e4d4d]',
    mockup: (
      <div className="grid grid-cols-3 gap-2">
        {['Student', 'College', 'Agency'].map((role, i) => (
          <div key={role} className={`rounded-2xl p-3 text-center ${i === 0 ? 'bg-[#cfdaf5]' : i === 1 ? 'bg-[#f6f3f1] border border-[#cecac8]' : 'bg-[#242424]'}`}>
            <div className={`font-mono text-[10px] uppercase tracking-[0.08em] mb-1 ${i === 2 ? 'text-white' : 'text-[#797776]'}`}>{role}</div>
            <div className={`font-heading text-[18px] font-semibold ${i === 2 ? 'text-white' : 'text-[#242424]'}`}>
              {i === 0 ? '12' : i === 1 ? '8' : '24'}
            </div>
            <div className={`font-mono text-[10px] ${i === 2 ? 'text-white/60' : 'text-[#797776]'}`}>
              {i === 0 ? 'Applications' : i === 1 ? 'Jobs Posted' : 'Colleges'}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    index: '03',
    title: 'Auto-Blacklisting',
    body: 'Violations automatically trigger blacklist flags per policy. Each policy carries its own reinstatement buffer — so one mistake doesn\'t ruin a student\'s entire placement season.',
    color: 'bg-[#f6f3f1]',
    accent: 'text-[#4e4d4d]',
    mockup: (
      <div className="space-y-2">
        {[
          { student: 'Riya Sharma', status: 'Active', color: 'bg-[#a7fccd]/40 text-[#16a34a]' },
          { student: 'Aman Gupta', status: 'Blacklisted', color: 'bg-[#ff9473]/20 text-[#c2410c]' },
          { student: 'Priya Nair', status: 'Reinstated', color: 'bg-[#cfdaf5] text-[#2b59d1]' },
        ].map((s) => (
          <div key={s.student} className="flex items-center justify-between bg-white/80 rounded-2xl px-4 py-2.5">
            <span className="font-mono text-[13px] text-[#242424]">{s.student}</span>
            <span className={`font-mono text-[10px] uppercase tracking-[0.08em] px-2.5 py-1 rounded-full ${s.color}`}>{s.status}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    index: '04',
    title: 'Offer Management',
    body: 'Track every offer alongside its CTC, level, and category. The upgrade policy enforces a configurable CTC multiplier, preventing lateral moves disguised as upgrades.',
    color: 'bg-[#f6f3f1]',
    accent: 'text-[#4e4d4d]',
    mockup: (
      <div className="space-y-2">
        <div className="bg-white/80 rounded-2xl px-4 py-3 border border-[#cecac8]">
          <div className="font-mono text-[10px] text-[#797776] uppercase tracking-[0.08em] mb-1">Current Offer</div>
          <div className="font-heading text-[20px] font-semibold text-[#242424]">₹12 LPA</div>
          <div className="font-mono text-[12px] text-[#797776]">TCS · SDE-1 · Core</div>
        </div>
        <div className="bg-[#cfdaf5] rounded-2xl px-4 py-3">
          <div className="font-mono text-[10px] text-[#2b59d1] uppercase tracking-[0.08em] mb-1">Upgrade Offer ✓</div>
          <div className="font-heading text-[20px] font-semibold text-[#242424]">₹22 LPA</div>
          <div className="font-mono text-[12px] text-[#4e4d4d]">Google · SDE-1 · Dream</div>
        </div>
      </div>
    ),
  },
  {
    index: '05',
    title: 'Application Timeline',
    body: 'Every application moves through a strict 14-state machine — Applied → Shortlisted → Interviewing → Selected → Offered → Hired. Every transition is logged and auditable.',
    color: 'bg-[#f6f3f1]',
    accent: 'text-[#4e4d4d]',
    mockup: (
      <div className="space-y-2">
        {[
          { stage: 'Applied', done: true },
          { stage: 'Shortlisted', done: true },
          { stage: 'Interviewing', done: true },
          { stage: 'Offered', done: false },
        ].map((s, i) => (
          <div key={s.stage} className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.done ? 'bg-[#2b59d1]' : 'bg-[#cecac8]'}`} />
            <span className={`font-mono text-[13px] ${s.done ? 'text-[#242424]' : 'text-[#cecac8]'}`}>{s.stage}</span>
            {s.done && <span className="ml-auto font-mono text-[10px] text-[#797776]">✓</span>}
          </div>
        ))}
      </div>
    ),
  },
  {
    index: '06',
    title: 'Analytics & Insights',
    body: 'Monitor placement rates, offer acceptance, drive performance, and student demographics. Data is always scoped to your institution — zero cross-college leakage.',
    color: 'bg-[#f6f3f1]',
    accent: 'text-[#4e4d4d]',
    mockup: (
      <div className="flex items-end gap-2 h-20">
        {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
          <div key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%`, background: i === 5 ? '#2b59d1' : '#cfdaf5' }} />
        ))}
      </div>
    ),
  },
];

const FAQS = [
  {
    q: 'How does the Truskill Policy Engine work?',
    a: 'The engine evaluates 20 independently configurable boolean-resolved rules for every student action. When a student applies, withdraws, or accepts an offer, the engine checks all active policies simultaneously and auto-resolves conflicts — no manual coordination needed.',
  },
  {
    q: 'Can we customize blacklisting rules per violation type?',
    a: 'Yes. Each policy carries its own reinstatement buffer. A no-show can have 2 reinstatement chances while a withdrawal violation has 1. Admins can configure these independently per policy without touching global settings.',
  },
  {
    q: "What's the difference between Dream and Super Dream placements?",
    a: 'Placement categories are fully configurable. Typically Dream denotes packages above a college-defined CTC threshold (e.g., ₹8 LPA+) and Super Dream is an even higher tier. These categories unlock different offer upgrade rules and attempt limits.',
  },
  {
    q: 'How does the Upgrade policy protect placed students?',
    a: 'Once a student holds an active offer, they can only apply to new opportunities if the new role exceeds their current CTC by a configurable multiplier (e.g., 1.5×). This prevents tactical re-applications to equivalent roles masking as upgrades.',
  },
  {
    q: 'Is student data isolated between colleges?',
    a: 'Absolutely. Every database row is guarded by Supabase Row Level Security policies that read the college_id from the authenticated JWT. A college admin physically cannot query records from another institution — it\'s enforced at the Postgres layer, not the UI.',
  },
];

// ─── Subcomponents ─────────────────────────────────────────────────────────────

function PipelineNode({ label, highlight = false, delay = 0 }: { label: string; highlight?: boolean; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.4 }}
      className={`px-5 py-2.5 rounded-full border font-mono text-[12px] uppercase tracking-[0.08em] select-none ${
        highlight
          ? 'bg-[#cfdaf5] border-[#2b59d1]/40 text-[#2b59d1] ring-2 ring-[#2b59d1]/20 font-semibold'
          : 'bg-[#f6f3f1] border-[#cecac8] text-[#242424]'
      }`}
    >
      {label}
    </motion.div>
  );
}

function PipelineConnector() {
  return <div className="w-6 h-px bg-[#cecac8] self-center flex-shrink-0" />;
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#cecac8]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-8 text-left gap-6"
      >
        <span className="font-heading text-[22px] font-[400] text-[#242424] leading-[1.25] tracking-[-0.44px]">
          {q}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
          <ChevronDown size={20} className="text-[#242424]" />
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
            <p className="font-mono text-[15px] text-[#4e4d4d] leading-[1.65] pb-8 max-w-3xl">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [barDismissed, setBarDismissed] = useState(false);

  const marqueeItems = [...INSTITUTIONS, ...INSTITUTIONS];

  return (
    <div className="flex flex-col min-h-screen bg-[#f6f3f1] selection:bg-[#242424] selection:text-white">
      {/* Announcement Bar */}
      {!barDismissed && (
        <div className="relative w-full bg-[#000000] flex items-center justify-center py-2.5 px-6">
          <p className="font-mono text-[13px] text-[#f6f3f1] tracking-[0.02em]">
            Introducing the Truskill Policy Engine — 20 configurable placement rules.{' '}
            <Link href="/features" className="underline underline-offset-2 hover:no-underline">
              Learn more →
            </Link>
          </p>
          <button
            onClick={() => setBarDismissed(true)}
            className="absolute right-4 text-white/60 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <MarketingHeader />

      <main className="flex-1">

        {/* ── HERO ── */}
        <section className="relative max-w-[1200px] mx-auto px-6 pt-28 pb-24 md:pt-36 md:pb-32 overflow-hidden">
          {/* Atmospheric gradient */}
          <div className="pointer-events-none absolute right-[-120px] top-[-80px] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-[#ff9473]/15 via-[#a0b5eb]/15 to-[#a7fccd]/15 blur-[100px]" />

          <div className="relative flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
            {/* Left */}
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-[#cfdaf5] text-[#2b59d1] font-mono text-[11px] uppercase tracking-[0.1em] px-4 py-1.5 rounded-full mb-8"
              >
                Campus Placement OS
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="font-heading font-[400] text-[52px] md:text-[68px] lg:text-[80px] leading-[1.1] tracking-[-1.6px] text-[#242424] mb-7"
              >
                The precision engine for campus placements.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.16 }}
                className="font-mono text-[17px] md:text-[20px] text-[#4e4d4d] leading-[1.55] mb-10 max-w-xl mx-auto lg:mx-0"
              >
                Configure 20 policies. Automate blacklisting. Track every application.
                Built for colleges that demand zero chaos.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.24 }}
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8"
              >
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full bg-[#2b59d1] px-8 h-12 font-mono text-[14px] uppercase tracking-[0.06em] text-white hover:bg-[#2448b8] transition-colors"
                >
                  Start free trial ▸
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-[#cecac8] px-8 h-12 font-mono text-[14px] uppercase tracking-[0.06em] text-[#242424] hover:bg-[#cecac8]/20 transition-colors"
                >
                  Request a demo
                </Link>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="font-mono text-[12px] text-[#797776]"
              >
                Trusted by 50+ institutions · Zero setup fees · FERPA compliant
              </motion.p>
            </div>

            {/* Right — Dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.65, delay: 0.2 }}
              className="flex-1 w-full max-w-[440px] lg:max-w-none"
            >
              <div className="bg-[#cfdaf5] rounded-[40px] p-8 md:p-10">
                {/* Card header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-heading font-semibold text-[18px] text-[#242424]">Active Placements</h3>
                    <p className="font-mono text-[12px] text-[#4e4d4d] mt-0.5">Live dashboard · Aug 2026</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                    <span className="font-mono text-[11px] text-[#4e4d4d]">Live</span>
                  </div>
                </div>

                {/* Application rows */}
                <div className="space-y-2 mb-6">
                  {[
                    { name: 'Arjun Mehta', role: 'SDE-1 · Google', status: 'Offered', tag: 'bg-[#a7fccd]/50 text-[#16a34a]' },
                    { name: 'Sneha Patel', role: 'Data Analyst · Flipkart', status: 'Shortlisted', tag: 'bg-[#cfdaf5] text-[#2b59d1]' },
                    { name: 'Rahul Verma', role: 'Frontend · Swiggy', status: 'In Review', tag: 'bg-white/60 text-[#797776]' },
                    { name: 'Nisha Iyer', role: 'PM · Razorpay', status: 'Interviewing', tag: 'bg-[#ecda98]/50 text-[#854d0e]' },
                  ].map((app) => (
                    <div key={app.name} className="flex items-center gap-3 bg-white/50 rounded-2xl px-4 py-3">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                        <span className="font-heading font-semibold text-[13px] text-[#242424]">{app.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-[13px] text-[#242424] font-medium truncate">{app.name}</p>
                        <p className="font-mono text-[11px] text-[#797776] truncate">{app.role}</p>
                      </div>
                      <span className={`font-mono text-[10px] uppercase tracking-[0.06em] px-2.5 py-1 rounded-full flex-shrink-0 ${app.tag}`}>
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Mini bar chart */}
                <div>
                  <p className="font-mono text-[11px] text-[#797776] uppercase tracking-[0.08em] mb-2">Weekly Activity</p>
                  <div className="flex items-end gap-1.5 h-10">
                    {[35, 55, 45, 70, 60, 85, 72].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t"
                        style={{ height: `${h}%`, backgroundColor: i === 5 ? '#2b59d1' : 'rgba(43,89,209,0.25)' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <section className="border-y border-[#cecac8] overflow-hidden py-6 bg-[#f6f3f1]">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#797776] text-center mb-5">
            Trusted by institutions across India
          </p>
          <div className="relative flex overflow-hidden">
            <motion.div
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              className="flex gap-3 flex-nowrap"
            >
              {marqueeItems.map((inst, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 border border-[#cecac8] rounded-full px-5 py-2 font-mono text-[13px] text-[#4e4d4d] whitespace-nowrap"
                >
                  {inst}
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── PIPELINE DIAGRAM ── */}
        <section className="max-w-[1200px] mx-auto px-6 py-24 md:py-32">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading font-[400] text-[40px] md:text-[56px] text-[#242424] leading-[1.2] tracking-[-1.12px] mb-4"
            >
              One engine. Every rule. Automatically enforced.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="font-mono text-[17px] text-[#4e4d4d] max-w-2xl mx-auto"
            >
              The Truskill engine sits between every student action and every placement outcome.
            </motion.p>
          </div>

          {/* Pipeline rows */}
          <div className="flex flex-col items-center gap-4">
            {/* Row 1 */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <PipelineNode label="Student Profile" delay={0} />
              <PipelineConnector />
              <PipelineNode label="Eligibility Check" delay={0.1} />
              <PipelineConnector />
              <PipelineNode label="Application Gate" delay={0.2} />
            </div>
            {/* Center arrow down */}
            <div className="w-px h-6 bg-[#cecac8]" />
            {/* Hub */}
            <PipelineNode label="⚙ Truskill Engine" highlight delay={0.3} />
            {/* Center arrow down */}
            <div className="w-px h-6 bg-[#cecac8]" />
            {/* Row 2 */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <PipelineNode label="Policy Matrix" delay={0.4} />
              <PipelineConnector />
              <PipelineNode label="Auto-Blacklist" delay={0.5} />
              <PipelineConnector />
              <PipelineNode label="Offer Upgrade" delay={0.6} />
            </div>
          </div>
        </section>

        {/* ── FEATURE CARDS GRID ── */}
        <section className="max-w-[1200px] mx-auto px-6 pb-24 md:pb-32">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading font-[400] text-[40px] md:text-[56px] text-[#242424] leading-[1.2] tracking-[-1.12px] mb-4"
            >
              Everything placement coordinators actually need.
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.index}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`${feature.color} rounded-[32px] p-8 border border-[#cecac8] flex flex-col gap-6`}
              >
                <div>
                  <span className={`font-mono text-[11px] uppercase tracking-[0.1em] ${feature.accent} mb-3 block`}>
                    [{feature.index}]
                  </span>
                  <h3 className="font-heading font-[400] text-[22px] text-[#242424] leading-[1.3] tracking-[-0.44px] mb-3">
                    {feature.title}
                  </h3>
                  <p className="font-mono text-[14px] text-[#4e4d4d] leading-[1.6]">
                    {feature.body}
                  </p>
                </div>
                <div className="mt-auto">{feature.mockup}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="max-w-[800px] mx-auto px-6 pb-24 md:pb-32">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading font-[400] text-[40px] md:text-[48px] text-[#242424] leading-[1.2] tracking-[-0.96px] mb-4 text-center"
          >
            Questions, answered.
          </motion.h2>
          <p className="font-mono text-[16px] text-[#797776] text-center mb-12">
            Still curious? <Link href="/contact" className="text-[#2b59d1] hover:underline">Reach out →</Link>
          </p>
          <div className="border-t border-[#cecac8]">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="max-w-[1200px] mx-auto px-6 pb-24 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#242424] rounded-[40px] px-10 py-20 text-center relative overflow-hidden"
            style={{ background: 'radial-gradient(ellipse at center top, rgba(43,89,209,0.12) 0%, #242424 60%)' }}
          >
            <h2 className="font-heading font-[400] text-[44px] md:text-[56px] text-white leading-[1.15] tracking-[-1.12px] mb-5">
              Ready to end placement chaos?
            </h2>
            <p className="font-mono text-[17px] text-[#cecac8] mb-10">
              Set up your first policy in under 5 minutes. No engineering required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-[#2b59d1] px-9 h-12 font-mono text-[14px] uppercase tracking-[0.06em] text-white hover:bg-[#2448b8] transition-colors"
              >
                Start free trial ▸
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-[#cecac8]/40 px-9 h-12 font-mono text-[14px] uppercase tracking-[0.06em] text-white hover:bg-white/10 transition-colors"
              >
                Contact sales
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {['SOC 2 Type II', 'FERPA Compliant', '99.9% Uptime'].map((b) => (
                <span key={b} className="font-mono text-[12px] text-white/40 uppercase tracking-[0.08em]">{b}</span>
              ))}
            </div>
          </motion.div>
        </section>

      </main>

      <MarketingFooter />
    </div>
  );
}

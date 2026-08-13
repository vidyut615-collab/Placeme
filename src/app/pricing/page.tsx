'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MarketingHeader } from '@/components/MarketingHeader';
import { MarketingFooter } from '@/components/MarketingFooter';
import { Check, Minus, ChevronDown } from 'lucide-react';

// ─── Data ──────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tag: 'Free forever',
    price: { monthly: 0, annual: 0 },
    tagline: 'Perfect for small colleges starting out.',
    surface: 'bg-[#f6f3f1] border border-[#cecac8]',
    textColor: 'text-[#242424]',
    subColor: 'text-[#797776]',
    priceColor: 'text-[#242424]',
    checkColor: 'text-[#2b59d1]',
    ctaText: 'Get started free',
    ctaStyle: 'border border-[#cecac8] text-[#242424] hover:bg-[#cecac8]/20',
    featured: false,
    features: [
      'Up to 250 students',
      '5 configurable policies',
      'Basic placement tracking',
      'Application state machine',
      'Email support',
      'Community access',
    ],
  },
  {
    id: 'pro',
    name: 'Professional',
    tag: 'Most popular',
    price: { monthly: 49, annual: 39 },
    tagline: 'For serious placement operations.',
    surface: 'bg-[#cfdaf5]',
    textColor: 'text-[#242424]',
    subColor: 'text-[#4e4d4d]',
    priceColor: 'text-[#242424]',
    checkColor: 'text-[#2b59d1]',
    ctaText: 'Start 14-day free trial',
    ctaStyle: 'bg-[#2b59d1] text-white hover:bg-[#2448b8]',
    featured: true,
    features: [
      'Up to 2,000 students',
      'All 20 Truskill policies',
      'Dream / Super Dream tiers',
      'Auto-blacklisting & reinstatement',
      'Analytics dashboard',
      'Offer upgrade automation',
      'Priority email support',
      'Placement cycles',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tag: 'Custom pricing',
    price: { monthly: null, annual: null },
    tagline: 'For large universities and placement agencies.',
    surface: 'bg-[#242424]',
    textColor: 'text-white',
    subColor: 'text-white/60',
    priceColor: 'text-white',
    checkColor: 'text-white',
    ctaText: 'Contact sales',
    ctaStyle: 'border border-white/30 text-white hover:bg-white/10',
    featured: false,
    features: [
      'Unlimited students',
      'All Professional features',
      'Agency mode (multi-college)',
      'Dedicated account manager',
      'Custom API integrations',
      'White-labeling',
      'SLA guarantee',
      'Custom training sessions',
    ],
  },
];

const TABLE_ROWS = [
  { label: 'Max Students', starter: '250', pro: '2,000', enterprise: 'Unlimited' },
  { label: 'Configurable Policies', starter: '5', pro: '20', enterprise: '20' },
  { label: 'Dream / Super Dream Tiers', starter: false, pro: true, enterprise: true },
  { label: 'Auto-Blacklisting', starter: false, pro: true, enterprise: true },
  { label: 'Offer Upgrade Automation', starter: false, pro: true, enterprise: true },
  { label: 'Analytics Dashboard', starter: false, pro: true, enterprise: true },
  { label: 'Placement Cycles', starter: false, pro: true, enterprise: true },
  { label: 'Agency Mode (Multi-College)', starter: false, pro: false, enterprise: true },
  { label: 'White Labeling', starter: false, pro: false, enterprise: true },
  { label: 'SLA Guarantee', starter: false, pro: false, enterprise: true },
  { label: 'Support', starter: 'Email', pro: 'Priority', enterprise: 'Dedicated' },
];

const FAQS = [
  {
    q: 'Can I switch plans at any time?',
    a: "Yes. You can upgrade or downgrade at any time. When upgrading, you'll be charged the pro-rated difference for the remaining billing period. Downgrades take effect at the end of the current period.",
  },
  {
    q: "What counts as a 'student'?",
    a: "Any user profile with the 'student' role that has completed onboarding in your Placeme instance. Invited but pending users (who haven't set a password yet) do not count toward your limit.",
  },
  {
    q: 'Is there a free trial for the Professional plan?',
    a: 'Yes — a full 14-day trial with no credit card required. You get access to all 20 Truskill policies, the analytics dashboard, and offer upgrade automation. At the end of the trial, you decide.',
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function TableCell({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value
      ? <Check className="w-4 h-4 text-[#2b59d1] mx-auto" />
      : <Minus className="w-4 h-4 text-[#cecac8] mx-auto" />;
  }
  return <span className="font-mono text-[13px] text-[#4e4d4d]">{value}</span>;
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#cecac8]">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-7 text-left gap-6">
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
            <p className="font-mono text-[15px] text-[#4e4d4d] leading-[1.65] pb-7 max-w-3xl">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div className="flex flex-col min-h-screen bg-[#f6f3f1] selection:bg-[#242424] selection:text-white">
      <MarketingHeader />

      <main className="flex-1">

        {/* Hero */}
        <section className="max-w-[800px] mx-auto px-6 py-24 md:py-36 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center bg-[#cfdaf5] text-[#2b59d1] font-mono text-[11px] uppercase tracking-[0.1em] px-4 py-1.5 rounded-full mb-8"
          >
            Pricing
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="font-heading font-[400] text-[52px] md:text-[72px] text-[#242424] leading-[1.1] tracking-[-1.44px] mb-7"
          >
            Simple pricing. No chaos.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="font-mono text-[18px] md:text-[20px] text-[#4e4d4d] leading-[1.55] mb-10"
          >
            Start free. Scale when you're ready. No surprise invoices.
          </motion.p>

          {/* Billing toggle */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="inline-flex items-center gap-1 border border-[#cecac8] rounded-full p-1"
          >
            {(['monthly', 'annual'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`relative rounded-full px-5 py-2 font-mono text-[13px] uppercase tracking-[0.06em] transition-colors ${
                  billing === b ? 'bg-[#242424] text-white' : 'text-[#4e4d4d] hover:text-[#242424]'
                }`}
              >
                {b}
                {b === 'annual' && (
                  <span className="ml-2 font-mono text-[10px] bg-[#a7fccd]/60 text-[#16a34a] px-1.5 py-0.5 rounded-full uppercase tracking-[0.06em]">
                    Save 20%
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        </section>

        {/* Pricing Cards */}
        <section className="max-w-[1200px] mx-auto px-6 pb-24 md:pb-28">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className={`${plan.surface} rounded-[40px] p-8 md:p-10 flex flex-col relative`}
              >
                {plan.featured && (
                  <div className="absolute top-6 right-6 font-mono text-[10px] uppercase tracking-[0.1em] bg-[#2b59d1] text-white px-3 py-1 rounded-full">
                    {plan.tag}
                  </div>
                )}
                {!plan.featured && (
                  <div className={`font-mono text-[11px] uppercase tracking-[0.08em] ${plan.subColor} mb-2`}>
                    {plan.tag}
                  </div>
                )}

                <h2 className={`font-heading font-semibold text-[22px] ${plan.textColor} mb-2 ${plan.featured ? 'mt-2' : ''}`}>
                  {plan.name}
                </h2>
                <p className={`font-mono text-[13px] ${plan.subColor} mb-8`}>{plan.tagline}</p>

                {/* Price */}
                <div className="mb-8">
                  {plan.price.monthly === null ? (
                    <p className={`font-heading font-[400] text-[48px] leading-[1] ${plan.priceColor}`}>Custom</p>
                  ) : plan.price.monthly === 0 ? (
                    <div className="flex items-baseline gap-2">
                      <span className={`font-heading font-[400] text-[56px] leading-[1] ${plan.priceColor}`}>$0</span>
                      <span className={`font-mono text-[14px] ${plan.subColor}`}>/month</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className={`font-heading font-[400] text-[56px] leading-[1] ${plan.priceColor}`}>
                          ${billing === 'monthly' ? plan.price.monthly : plan.price.annual}
                        </span>
                        <span className={`font-mono text-[14px] ${plan.subColor}`}>/month</span>
                      </div>
                      {billing === 'annual' && (
                        <p className={`font-mono text-[12px] ${plan.subColor} mt-1`}>
                          Billed annually · ${(plan.price.annual! * 12).toLocaleString()}/year
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-10 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.checkColor}`} />
                      <span className={`font-mono text-[13px] ${plan.subColor === 'text-[#797776]' ? 'text-[#4e4d4d]' : plan.subColor}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href="/login"
                  className={`inline-flex items-center justify-center rounded-full h-12 font-mono text-[13px] uppercase tracking-[0.06em] transition-colors ${plan.ctaStyle}`}
                >
                  {plan.ctaText}
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Comparison Table */}
        <section className="max-w-[1200px] mx-auto px-6 pb-24 md:pb-28">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading font-[400] text-[36px] md:text-[48px] text-[#242424] leading-[1.2] tracking-[-0.96px] mb-12 text-center"
          >
            Compare plans in detail.
          </motion.h2>

          <div className="overflow-hidden rounded-[32px] border border-[#cecac8]">
            <table className="w-full">
              <thead>
                <tr className="bg-[#cfdaf5]">
                  <th className="text-left px-6 py-5 font-mono text-[12px] uppercase tracking-[0.08em] text-[#4e4d4d]">Feature</th>
                  {['Starter', 'Professional', 'Enterprise'].map((h) => (
                    <th key={h} className="text-center px-6 py-5 font-mono text-[12px] uppercase tracking-[0.08em] text-[#4e4d4d]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? 'bg-[#f6f3f1]' : 'bg-white/60'}>
                    <td className="px-6 py-4 font-mono text-[13px] text-[#4e4d4d]">{row.label}</td>
                    <td className="px-6 py-4 text-center"><TableCell value={row.starter} /></td>
                    <td className="px-6 py-4 text-center"><TableCell value={row.pro} /></td>
                    <td className="px-6 py-4 text-center"><TableCell value={row.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-[700px] mx-auto px-6 pb-24 md:pb-28">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading font-[400] text-[36px] md:text-[44px] text-[#242424] leading-[1.2] tracking-[-0.88px] mb-12 text-center"
          >
            Pricing questions.
          </motion.h2>
          <div className="border-t border-[#cecac8]">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[1200px] mx-auto px-6 pb-24 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[40px] px-10 py-20 text-center"
            style={{ background: 'radial-gradient(ellipse at center top, rgba(43,89,209,0.12) 0%, #242424 60%)' }}
          >
            <h2 className="font-heading font-[400] text-[44px] md:text-[56px] text-white leading-[1.15] tracking-[-1.12px] mb-5">
              Start with zero risk.
            </h2>
            <p className="font-mono text-[17px] text-[#cecac8] mb-10">
              Free plan, no credit card. Upgrade only when your team is ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-[#2b59d1] px-9 h-12 font-mono text-[14px] uppercase tracking-[0.06em] text-white hover:bg-[#2448b8] transition-colors"
              >
                Get started free ▸
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-[#cecac8]/40 px-9 h-12 font-mono text-[14px] uppercase tracking-[0.06em] text-white hover:bg-white/10 transition-colors"
              >
                Talk to sales
              </Link>
            </div>
          </motion.div>
        </section>

      </main>

      <MarketingFooter />
    </div>
  );
}

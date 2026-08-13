"use client";

import { MarketingHeader } from "@/components/MarketingHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-paper font-sans selection:bg-ink selection:text-white">
      <MarketingHeader />
      
      <main className="flex-1">
        <section className="max-w-[800px] mx-auto px-6 py-24 md:py-32 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-5xl md:text-[64px] font-semibold leading-[1.1] tracking-[0.64px] text-graphite mb-6"
          >
            About Placeme.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-sans text-lg md:text-[20px] text-slate leading-[1.5] tracking-[-0.19px]"
          >
            We're building the operating system for campus placements.
          </motion.p>
        </section>

        <section className="max-w-[800px] mx-auto px-6 pb-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-xl p-8 md:p-12 shadow-sm-4 border border-silver/50 prose max-w-none"
          >
            <h3 className="font-heading text-[28px] font-semibold text-graphite mb-6 tracking-tight">Our Mission</h3>
            <p className="font-sans text-[16px] text-slate leading-[1.6] mb-8">
              Managing campus placements has traditionally been a chaotic mix of spreadsheets, email chains, and manual policy enforcement. We built Placeme to bring order, speed, and precision to the entire process.
            </p>
            <h3 className="font-heading text-[28px] font-semibold text-graphite mb-6 tracking-tight">The Architecture</h3>
            <p className="font-sans text-[16px] text-slate leading-[1.6] mb-8">
              At the core of Placeme is a strict, rule-based engine. We don't just track applications; our Truskill Policy Engine actively enforces eligibility criteria, manages attempt limits, and handles complex edge cases like Dream and Super Dream offer upgrades in real-time.
            </p>
            <h3 className="font-heading text-[28px] font-semibold text-graphite mb-6 tracking-tight">Open standards, modern tech</h3>
            <p className="font-sans text-[16px] text-slate leading-[1.6]">
              Built on Next.js and Supabase, we prioritize a fast, responsive user experience backed by a highly relational, secure data lake. Every stakeholder—from the student to the placement officer—gets a dedicated, real-time view of their placement universe.
            </p>
          </motion.div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

"use client";

import { MarketingHeader } from "@/components/MarketingHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { motion } from "framer-motion";

export default function FeaturesPage() {
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
            Features built for scale.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-sans text-lg md:text-[20px] text-slate leading-[1.5] tracking-[-0.19px]"
          >
            A deep dive into the architecture powering Placeme.
          </motion.p>
        </section>

        <section className="max-w-[1200px] mx-auto px-6 pb-32">
          <div className="grid gap-12">
            {[
              {
                title: "Truskill Policy Engine",
                desc: "An advanced boolean resolution engine that automatically handles eligibility conflicts, attempt limits, and offer upgrades without manual intervention.",
              },
              {
                title: "Unified Data Lake",
                desc: "Powered by Supabase, the highly relational structure ensures that updates to a student profile instantly reflect across all active job applications.",
              },
              {
                title: "Role-Based Access Control",
                desc: "Extremely strict Row Level Security (RLS) guarantees data isolation between students, college administrators, and agency recruiters.",
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-8 md:p-12 shadow-sm-4 border border-silver/50"
              >
                <h3 className="font-heading text-[28px] font-semibold tracking-[0.28px] text-graphite mb-4">{feature.title}</h3>
                <p className="font-sans text-[18px] text-slate max-w-3xl leading-[1.5]">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarketingHeader } from "@/components/MarketingHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { motion, Variants } from "framer-motion";

export default function Home() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div className="flex flex-col min-h-screen bg-paper font-sans selection:bg-ink selection:text-white">
      <MarketingHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-[1200px] mx-auto px-6 pt-32 pb-24 md:pt-40 md:pb-32">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col md:flex-row items-center gap-16"
          >
            {/* Left Content */}
            <div className="flex-1 text-center md:text-left">
              <motion.h1 
                variants={itemVariants}
                className="font-heading text-5xl md:text-[64px] font-semibold leading-[1.1] tracking-[0.64px] text-graphite mb-6"
              >
                The better way to manage campus placements.
              </motion.h1>
              <motion.p 
                variants={itemVariants}
                className="font-sans text-lg md:text-[20px] text-slate leading-[1.5] tracking-[-0.19px] max-w-xl mx-auto md:mx-0 mb-10"
              >
                A high-precision engine built on strict role-based access, automated policy resolution, and a unified data lake. Scheduling, tracking, and compliance—finally simplified.
              </motion.p>
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link 
                  href="/login" 
                  className={cn(
                    buttonVariants({ size: "lg" }), 
                    "font-sans text-base font-medium bg-ink hover:bg-graphite text-white rounded-full px-8 h-12 shadow-sm-2 transition-all hover:scale-[1.02]"
                  )}
                >
                  Start your free trial
                </Link>
                <Link 
                  href="/login" 
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "lg" }), 
                    "font-sans text-base font-medium text-graphite border border-silver hover:bg-white rounded-full px-8 h-12 transition-all hover:scale-[1.02]"
                  )}
                >
                  Contact Sales
                </Link>
              </motion.div>
            </div>

            {/* Right Widget Mockup */}
            <motion.div 
              variants={itemVariants}
              className="flex-1 w-full max-w-md md:max-w-none"
            >
              <div className="bg-white rounded-xl p-6 shadow-sm-4 border border-silver/50 transition-transform duration-500 hover:-translate-y-2 hover:shadow-sm-3">
                <div className="flex items-center justify-between mb-6 border-b border-silver pb-4">
                  <div>
                    <h3 className="font-heading text-[20px] font-semibold text-graphite">Upcoming Drives</h3>
                    <p className="font-sans text-[14px] text-slate">Next 7 days</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-paper flex items-center justify-center border border-silver">
                    <span className="text-graphite font-medium text-xs">AC</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {[
                    { company: "Acme Corp", role: "SDE-1", type: "Super Dream", time: "Tomorrow, 10:00 AM" },
                    { company: "Globex", role: "Data Analyst", type: "Dream", time: "Wed, 2:00 PM" },
                    { company: "Initech", role: "Frontend Eng", type: "Core", time: "Thu, 11:30 AM" },
                  ].map((job, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-paper transition-colors group cursor-pointer border border-transparent hover:border-silver/50">
                      <div className="w-10 h-10 rounded-md bg-paper border border-silver flex items-center justify-center">
                        <span className="font-heading font-semibold text-graphite text-sm">{job.company[0]}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-sans font-medium text-[14px] text-graphite">{job.company}</h4>
                          <span className="font-sans text-[10px] uppercase font-medium tracking-wider bg-silver/50 text-slate px-2 py-0.5 rounded-full">
                            {job.type}
                          </span>
                        </div>
                        <p className="font-sans text-[12px] text-slate mt-0.5">{job.role} • {job.time}</p>
                      </div>
                      <div className="w-6 h-6 rounded-full border border-silver flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white">
                        <span className="text-[10px]">→</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Feature Bento Grid */}
        <section className="max-w-[1200px] mx-auto px-6 py-24 border-t border-silver/50">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl md:text-[48px] font-semibold leading-[1.1] tracking-[0.48px] text-graphite mb-4">
              Everything you need to run placement seasons.
            </h2>
            <p className="font-sans text-[18px] text-slate max-w-2xl mx-auto">
              No more spreadsheets. Just a clean, highly structured engine that enforces your rules automatically.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Bento Card 1 - Large */}
            <motion.div 
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="md:col-span-2 bg-white rounded-xl p-8 shadow-sm-4 border border-silver/50 flex flex-col justify-between"
            >
              <div className="mb-12">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-paper border border-silver text-graphite font-heading font-semibold text-sm mb-4">1</div>
                <h3 className="font-heading text-[24px] font-semibold tracking-[0.24px] text-graphite mb-2">Automated Policy Matrix</h3>
                <p className="font-sans text-[16px] text-slate leading-[1.5] max-w-md">
                  Configure complex eligibility rules, attempt limits, and upgrade policies (Dream/Super Dream) without writing code. The system resolves conflicts instantly.
                </p>
              </div>
              <div className="w-full h-48 bg-paper rounded-lg border border-silver p-4 overflow-hidden relative">
                {/* Mock UI snippet inside the card */}
                <div className="absolute top-4 left-4 right-4 bg-white rounded-md shadow-sm border border-silver p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[14px] font-medium text-graphite">Dream Offer Policy</span>
                    <div className="w-10 h-5 bg-ink rounded-full relative">
                      <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="h-2 w-full bg-silver/50 rounded-full"></div>
                    <div className="h-2 w-2/3 bg-silver/50 rounded-full"></div>
                  </div>
                </div>
                <div className="absolute top-24 left-4 right-4 bg-white rounded-md shadow-sm border border-silver p-3 opacity-50">
                   <div className="flex items-center justify-between">
                    <span className="font-sans text-[14px] font-medium text-graphite">Attempt Limits</span>
                    <div className="w-10 h-5 bg-ink rounded-full relative">
                      <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bento Card 2 */}
            <motion.div 
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white rounded-xl p-8 shadow-sm-4 border border-silver/50 flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-paper border border-silver text-graphite font-heading font-semibold text-sm mb-4">2</div>
                <h3 className="font-heading text-[24px] font-semibold tracking-[0.24px] text-graphite mb-2">Unified Data Lake</h3>
                <p className="font-sans text-[16px] text-slate leading-[1.5]">
                  A highly structured Postgres database handling student profiles, jobs, and offers flawlessly.
                </p>
              </div>
              <div className="mt-8 w-full aspect-square bg-paper rounded-lg border border-silver flex items-center justify-center">
                {/* Abstract geometric representation of a database */}
                <div className="grid grid-cols-2 gap-2 p-4 w-full h-full">
                   <div className="bg-white rounded border border-silver"></div>
                   <div className="bg-ink/5 rounded border border-silver"></div>
                   <div className="bg-ink/5 rounded border border-silver"></div>
                   <div className="bg-white rounded border border-silver"></div>
                </div>
              </div>
            </motion.div>

            {/* Bento Card 3 */}
            <motion.div 
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white rounded-xl p-8 shadow-sm-4 border border-silver/50"
            >
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-paper border border-silver text-graphite font-heading font-semibold text-sm mb-4">3</div>
              <h3 className="font-heading text-[24px] font-semibold tracking-[0.24px] text-graphite mb-2">Role-Based Views</h3>
              <p className="font-sans text-[16px] text-slate leading-[1.5]">
                Students, colleges, and agencies get dedicated dashboards showing only what they are authorized to see.
              </p>
            </motion.div>

            {/* Bento Card 4 */}
            <motion.div 
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="md:col-span-2 bg-white rounded-xl p-8 shadow-sm-4 border border-silver/50"
            >
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-paper border border-silver text-graphite font-heading font-semibold text-sm mb-4">4</div>
              <h3 className="font-heading text-[24px] font-semibold tracking-[0.24px] text-graphite mb-2">Real-time Analytics</h3>
              <p className="font-sans text-[16px] text-slate leading-[1.5] max-w-md">
                Monitor drive performance, offer acceptances, and student demographics instantly with powerful built-in reporting tools.
              </p>
            </motion.div>
          </div>
        </section>
        
        {/* Bottom CTA */}
        <section className="max-w-[1200px] mx-auto px-6 py-24 text-center">
           <h2 className="font-heading text-3xl md:text-[40px] font-semibold leading-[1.1] tracking-[0.4px] text-graphite mb-6">
              Ready to upgrade your placement process?
            </h2>
            <Link 
              href="/login" 
              className={cn(
                buttonVariants({ size: "lg" }), 
                "font-sans text-base font-medium bg-ink hover:bg-graphite text-white rounded-full px-8 h-12 shadow-sm-2 transition-all hover:scale-[1.02] inline-flex items-center"
              )}
            >
              Get started for free
            </Link>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

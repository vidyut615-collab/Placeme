"use client";

import { MarketingHeader } from "@/components/MarketingHeader";
import { MarketingFooter } from "@/components/MarketingFooter";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function PricingPage() {
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
            Simple, transparent pricing.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-sans text-lg md:text-[20px] text-slate leading-[1.5] tracking-[-0.19px]"
          >
            No hidden fees. Scale your placement operations with predictable costs.
          </motion.p>
        </section>

        <section className="max-w-[1200px] mx-auto px-6 pb-32">
          <div className="grid md:grid-cols-2 gap-8 max-w-[900px] mx-auto">
            {/* Free Tier */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-8 shadow-sm-4 border border-silver/50 flex flex-col"
            >
              <h3 className="font-heading text-[24px] font-semibold text-graphite mb-2">Starter</h3>
              <p className="font-sans text-[14px] text-slate mb-6">Perfect for small colleges starting out.</p>
              <div className="mb-8">
                <span className="font-heading text-5xl font-semibold text-graphite">$0</span>
                <span className="font-sans text-slate">/month</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Up to 500 students', 'Basic placement policies', 'Community support', 'Standard analytics'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-graphite" />
                    <span className="font-sans text-[16px] text-slate">{item}</span>
                  </li>
                ))}
              </ul>
              <Link 
                href="/login" 
                className={cn(buttonVariants({ variant: "outline" }), "w-full font-sans font-medium text-graphite border-silver rounded-full h-12")}
              >
                Get Started
              </Link>
            </motion.div>

            {/* Pro Tier */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-ink rounded-xl p-8 shadow-sm-2 border border-ink flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-action-blue text-white font-sans text-xs font-semibold px-3 py-1 rounded-bl-lg">RECOMMENDED</div>
              <h3 className="font-heading text-[24px] font-semibold text-white mb-2">Enterprise</h3>
              <p className="font-sans text-[14px] text-slate mb-6">For large universities and placement agencies.</p>
              <div className="mb-8">
                <span className="font-heading text-5xl font-semibold text-white">Custom</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Unlimited students', 'Advanced Truskill Policy Engine', 'Dedicated account manager', 'Custom API integrations', 'White-labeling'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-white" />
                    <span className="font-sans text-[16px] text-silver">{item}</span>
                  </li>
                ))}
              </ul>
              <Link 
                href="/login" 
                className={cn(buttonVariants({ variant: "default" }), "w-full font-sans font-medium bg-white text-ink hover:bg-paper rounded-full h-12")}
              >
                Contact Sales
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

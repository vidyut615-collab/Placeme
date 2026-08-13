import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ArrowRight, ChevronDown, CheckCircle2, Shield, Settings, Users, Database } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-parchment font-sans relative overflow-x-hidden selection:bg-lake-blue/20">
      
      {/* Announcement Bar */}
      <div className="w-full bg-ink text-parchment py-3 px-4 flex items-center justify-center relative z-50">
        <div className="flex items-center gap-4 text-xs md:text-sm font-sans uppercase tracking-tight">
          <span>Introducing Truskill Configurable Policies for Campus Placements</span>
          <Button variant="outline" size="sm" className="hidden md:flex h-6 rounded-full border-parchment text-parchment bg-transparent hover:bg-parchment/10 text-[10px] uppercase tracking-wider px-3">
            Read Announcement
          </Button>
        </div>
        <button className="absolute right-4 text-parchment/70 hover:text-parchment transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-40 w-full bg-parchment/90 backdrop-blur-md supports-[backdrop-filter]:bg-parchment/60">
        <div className="max-w-[1432px] mx-auto flex h-20 items-center justify-between px-6 md:px-10">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-ink rounded-full" />
            <div className="font-sans font-medium uppercase tracking-tight text-ink text-lg">
              PlacementManagement
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="font-sans text-sm uppercase tracking-tight text-ink hover:opacity-70 transition-opacity">Features</Link>
            <Link href="#policies" className="font-sans text-sm uppercase tracking-tight text-ink hover:opacity-70 transition-opacity">Policies</Link>
            <Link href="#faq" className="font-sans text-sm uppercase tracking-tight text-ink hover:opacity-70 transition-opacity">FAQ</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className={cn(
                buttonVariants({ variant: "ghost" }), 
                "hidden md:flex font-sans uppercase tracking-tight text-sm text-ink border border-ink hover:bg-transparent rounded-full px-6 h-12"
              )}
            >
              Login
            </Link>
            <Link 
              href="/login" 
              className={cn(
                buttonVariants({ variant: "default" }), 
                "font-sans uppercase tracking-tight text-sm bg-lake-blue hover:bg-lake-blue/90 text-white rounded-full px-8 h-12"
              )}
            >
              Get a Demo <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </header>

      {/* Atmospheric Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-coral/30 mix-blend-multiply filter blur-[100px] opacity-60 pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-sky-blue/30 mix-blend-multiply filter blur-[100px] opacity-60 pointer-events-none" />
      <div className="absolute top-[50%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-mint/20 mix-blend-multiply filter blur-[120px] opacity-50 pointer-events-none" />

      {/* Typographic Hero Section */}
      <main className="flex-1 relative z-10">
        <section className="max-w-[1432px] mx-auto px-6 md:px-10 py-24 md:py-32 flex flex-col items-center text-center">
          <h1 className="font-heading text-6xl md:text-[80px] font-normal leading-[1.1] tracking-[-1.6px] text-off-black max-w-4xl mx-auto mb-8">
            The elegant engine for campus placements.
          </h1>
          <p className="font-sans text-lg md:text-[20px] text-graphite leading-[1.35] tracking-tight max-w-2xl mx-auto mb-12">
            A powerful, configurable platform to streamline job drives, track applications, and handle placement policies without compromising on design.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/login" 
              className={cn(
                buttonVariants({ size: "lg" }), 
                "font-sans uppercase tracking-tight text-sm bg-lake-blue hover:bg-lake-blue/90 text-white rounded-full px-8 h-12"
              )}
            >
              Start Building <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link 
              href="#docs" 
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }), 
                "font-sans uppercase tracking-tight text-sm text-ink border border-ink hover:bg-transparent rounded-full px-8 h-12"
              )}
            >
              Read Documentation
            </Link>
          </div>
        </section>

        {/* Logo Strip */}
        <section className="max-w-[1432px] mx-auto px-6 md:px-10 py-16 border-y border-ash/40">
          <p className="text-center font-sans text-xs uppercase tracking-widest text-smoke mb-12">Trusted by forward-thinking institutions</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-60 grayscale">
            {/* Placeholder Logos */}
            {['Acme Corp', 'Globex', 'Soylent', 'Initech', 'Umbrella', 'Stark Ind'].map((logo, i) => (
              <div key={i} className="font-heading text-2xl font-bold tracking-tighter text-off-black">{logo}</div>
            ))}
          </div>
        </section>

        {/* Elevated Feature Section (Periwinkle Mist) */}
        <section className="max-w-[1432px] mx-auto px-6 md:px-10 py-24 md:py-32">
          <div className="bg-periwinkle-mist rounded-[40px] p-10 md:p-16 flex flex-col lg:flex-row gap-16 items-center shadow-sm overflow-hidden relative">
            {/* Content */}
            <div className="flex-1 z-10">
              <div className="inline-flex items-center justify-center bg-white/50 backdrop-blur border border-ash/50 rounded-full px-4 py-1.5 mb-6">
                <span className="font-sans text-xs uppercase tracking-tight text-off-black font-medium">Policy Engine</span>
              </div>
              <h2 className="font-heading text-4xl md:text-5xl font-normal tracking-[-0.96px] text-off-black mb-6">
                20-Point Configurable Policy Matrix
              </h2>
              <p className="font-sans text-lg text-graphite leading-relaxed mb-8 max-w-md">
                Define complex eligibility rules, attempt limits, dream offers, and upgrade policies without writing a single line of code. The engine resolves conflicts automatically.
              </p>
              <Link 
                href="/login" 
                className="font-sans text-sm uppercase tracking-tight text-off-black flex items-center hover:opacity-70 transition-opacity"
              >
                Explore the Engine <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
            
            {/* Visual (Diagram Mockup) */}
            <div className="flex-1 relative w-full aspect-square md:aspect-[4/3] bg-white/40 border border-white/60 rounded-3xl p-8 shadow-sm backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-coral/20 via-transparent to-sky-blue/20 rounded-3xl" />
              
              {/* Pipeline Nodes */}
              <div className="absolute top-[20%] left-[10%] bg-parchment border border-ash rounded-full px-5 py-3 flex items-center gap-2 shadow-sm">
                <Users className="w-4 h-4 text-graphite" />
                <span className="font-sans text-sm uppercase text-off-black">Eligibility Check</span>
              </div>
              <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 bg-parchment border border-ash rounded-full px-5 py-3 flex items-center gap-2 shadow-sm z-10">
                <Settings className="w-4 h-4 text-lake-blue" />
                <span className="font-sans text-sm uppercase font-medium text-off-black">Truskill Resolution</span>
              </div>
              <div className="absolute bottom-[20%] right-[10%] bg-parchment border border-ash rounded-full px-5 py-3 flex items-center gap-2 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-graphite" />
                <span className="font-sans text-sm uppercase text-off-black">Offer Granted</span>
              </div>
              
              {/* Connecting Lines */}
              <svg className="absolute inset-0 w-full h-full -z-10" pointerEvents="none">
                <path d="M 150 150 Q 250 150 300 250 T 450 350" fill="none" stroke="var(--color-ash)" strokeWidth="1" strokeDasharray="4 4" />
              </svg>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="max-w-[1432px] mx-auto px-6 md:px-10 pb-24 md:pb-32">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-transparent border border-ash rounded-[40px] p-10 flex flex-col">
              <Shield className="w-6 h-6 text-off-black mb-8" />
              <h3 className="font-heading text-[24px] font-normal tracking-[-0.48px] text-off-black mb-4">
                Role-Based Security
              </h3>
              <p className="font-sans text-base text-graphite leading-relaxed">
                Supabase Row Level Security ensures students, college admins, and agency staff only see what they are authorized to see.
              </p>
            </div>
            {/* Card 2 */}
            <div className="bg-transparent border border-ash rounded-[40px] p-10 flex flex-col">
              <Database className="w-6 h-6 text-off-black mb-8" />
              <h3 className="font-heading text-[24px] font-normal tracking-[-0.48px] text-off-black mb-4">
                Unified Data Lake
              </h3>
              <p className="font-sans text-base text-graphite leading-relaxed">
                Consolidate student profiles, job postings, and offer letters in a single, highly relational Postgres database.
              </p>
            </div>
            {/* Card 3 */}
            <div className="bg-transparent border border-ash rounded-[40px] p-10 flex flex-col">
              <Settings className="w-6 h-6 text-off-black mb-8" />
              <h3 className="font-heading text-[24px] font-normal tracking-[-0.48px] text-off-black mb-4">
                Real-time Analytics
              </h3>
              <p className="font-sans text-base text-graphite leading-relaxed">
                Track placement progression instantly. Monitor offer acceptance rates, dream classifications, and cycle performance.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section id="faq" className="max-w-[800px] mx-auto px-6 md:px-10 pb-32">
          <h2 className="font-heading text-4xl md:text-5xl font-normal tracking-[-0.96px] text-off-black mb-16 text-center">
            Frequently Asked
          </h2>
          
          <div className="border-b border-ash flex justify-between items-center py-10 cursor-pointer hover:opacity-70 transition-opacity">
            <h3 className="font-heading text-[24px] font-normal text-off-black">How does the dream policy work?</h3>
            <ChevronDown className="w-6 h-6 text-off-black" />
          </div>
          <div className="border-b border-ash flex justify-between items-center py-10 cursor-pointer hover:opacity-70 transition-opacity">
            <h3 className="font-heading text-[24px] font-normal text-off-black">Can I configure custom placement levels?</h3>
            <ChevronDown className="w-6 h-6 text-off-black" />
          </div>
          <div className="border-b border-ash flex justify-between items-center py-10 cursor-pointer hover:opacity-70 transition-opacity">
            <h3 className="font-heading text-[24px] font-normal text-off-black">What happens during a policy conflict?</h3>
            <ChevronDown className="w-6 h-6 text-off-black" />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-ash bg-parchment">
        <div className="max-w-[1432px] mx-auto px-6 md:px-10 py-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-ink rounded-full" />
            <div className="font-sans font-medium uppercase tracking-tight text-ink text-sm">
              PlacementManagement
            </div>
          </div>
          <nav className="flex flex-wrap gap-8">
            <Link href="#" className="font-sans text-sm uppercase tracking-tight text-smoke hover:text-ink transition-colors">Privacy</Link>
            <Link href="#" className="font-sans text-sm uppercase tracking-tight text-smoke hover:text-ink transition-colors">Terms</Link>
            <Link href="#" className="font-sans text-sm uppercase tracking-tight text-smoke hover:text-ink transition-colors">Documentation</Link>
            <Link href="#" className="font-sans text-sm uppercase tracking-tight text-smoke hover:text-ink transition-colors">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

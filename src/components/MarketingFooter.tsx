import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="w-full border-t border-silver bg-paper mt-24">
      <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-ink rounded-sm" />
              <span className="font-heading font-semibold tracking-wide text-ink text-lg">Placeme</span>
            </div>
            <p className="font-sans text-sm text-slate max-w-xs leading-relaxed">
              The precision-engineered placement engine for forward-thinking institutions.
            </p>
          </div>
          <div>
            <h4 className="font-sans font-semibold text-graphite mb-4 text-sm tracking-tight">Product</h4>
            <ul className="space-y-3">
              <li><Link href="/features" className="font-sans text-sm text-slate hover:text-ink transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="font-sans text-sm text-slate hover:text-ink transition-colors">Pricing</Link></li>
              <li><Link href="/docs" className="font-sans text-sm text-slate hover:text-ink transition-colors">Documentation</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-sans font-semibold text-graphite mb-4 text-sm tracking-tight">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="font-sans text-sm text-slate hover:text-ink transition-colors">About</Link></li>
              <li><Link href="/contact" className="font-sans text-sm text-slate hover:text-ink transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="font-sans text-sm text-slate hover:text-ink transition-colors">Privacy</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-silver flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-sans text-xs text-slate">© {new Date().getFullYear()} Placeme. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="font-sans text-xs text-slate">System status: <span className="text-action-blue font-medium">All systems operational</span></span>
          </div>
        </div>
      </div>
    </footer>
  );
}

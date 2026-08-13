import Link from 'next/link';

const PRODUCT_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Documentation', href: '/docs' },
  { label: 'Changelog', href: '/changelog' },
];

const COMPANY_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/contact' },
];

const LEGAL_LINKS = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Security', href: '/security' },
];

export function MarketingFooter() {
  return (
    <footer className="w-full border-t border-[#cecac8] bg-[#f6f3f1]">
      <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-4 h-4 bg-[#242424] rounded-sm" />
              <span className="font-heading font-semibold text-[18px] text-[#242424]">Placeme</span>
            </div>
            <p className="font-mono text-[13px] text-[#797776] leading-[1.6] max-w-[200px]">
              The precision-engineered placement OS for forward-thinking institutions.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#242424] mb-5">Product</h4>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-mono text-[13px] text-[#797776] hover:text-[#242424] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#242424] mb-5">Company</h4>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-mono text-[13px] text-[#797776] hover:text-[#242424] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#242424] mb-5">Legal</h4>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-mono text-[13px] text-[#797776] hover:text-[#242424] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#cecac8] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-mono text-[12px] text-[#797776]">
            © {new Date().getFullYear()} Placeme. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
            <span className="font-mono text-[12px] text-[#797776]">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
];

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#f6f3f1]/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-4 h-4 bg-[#242424] rounded-sm" />
            <span className="font-heading font-semibold text-[18px] text-[#242424] tracking-tight">
              Placeme
            </span>
          </Link>

          {/* Center Nav — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-[13px] uppercase tracking-[0.08em] text-[#4e4d4d] hover:text-[#242424] transition-colors duration-150"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right CTA group — hidden on mobile */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-[#cecac8] px-6 h-10 font-mono text-[13px] uppercase tracking-[0.06em] text-[#242424] bg-transparent hover:bg-[#cecac8]/20 transition-colors duration-150"
            >
              Login
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full bg-[#2b59d1] px-6 h-10 font-mono text-[13px] uppercase tracking-[0.06em] text-white hover:bg-[#2448b8] transition-colors duration-150"
            >
              Get started free
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-[#242424]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#cecac8] bg-[#f6f3f1] px-6 py-6 flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-[14px] uppercase tracking-[0.08em] text-[#4e4d4d]"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-[#cecac8]">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-[#cecac8] h-11 font-mono text-[13px] uppercase tracking-[0.06em] text-[#242424]"
              >
                Login
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-[#2b59d1] h-11 font-mono text-[13px] uppercase tracking-[0.06em] text-white"
              >
                Get started free
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

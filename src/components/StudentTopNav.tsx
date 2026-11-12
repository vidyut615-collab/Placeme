'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, Coins, Search, FileText } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { StudentCommandPalette } from './StudentCommandPalette'

export interface StudentTopNavProps {
  collegeName: string
  firstName: string
  creditBalance: number
}

export function StudentTopNav({
  collegeName,
  firstName,
  creditBalance,
}: StudentTopNavProps) {
  const [isCommandOpen, setIsCommandOpen] = useState(false)

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsCommandOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleGlobalKey)
    return () => window.removeEventListener('keydown', handleGlobalKey)
  }, [])

  return (
    <>
      <header className="hidden md:flex items-center justify-between h-14 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] px-6 bg-white/85 dark:bg-[#191816]/85 backdrop-blur-md shrink-0 z-20">
        {/* Left: University Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] min-w-0">
          <div className="flex items-center gap-1.5 text-[#78716C] dark:text-[#8A847A] truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span className="truncate max-w-[200px]">{collegeName}</span>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-[#78716C] dark:text-[#8A847A] stroke-[1.5] shrink-0" />

          <span className="font-medium text-[#1C1917] dark:text-[#EFECE6] truncate">
            {firstName ? `Hello, ${firstName}` : 'Placement workspace'}
          </span>
        </div>

        {/* Center: Command Search Bar Trigger */}
        <div className="flex-1 max-w-sm mx-4">
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            className="w-full h-8.5 px-3 rounded-lg bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] hover:border-[#0F766E]/35 dark:hover:border-[#14B8A6]/35 flex items-center justify-between text-[12px] text-[#78716C] dark:text-[#8A847A] transition-colors duration-150 cursor-pointer shadow-[0_1px_2px_rgba(28,25,23,0.03)]"
          >
            <span className="inline-flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 stroke-[1.5] text-[#78716C] dark:text-[#8A847A]" />
              <span className="truncate">Search jobs, pages, or actions...</span>
            </span>

            <kbd className="hidden sm:inline-block font-mono text-[10px] bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[#57534E] dark:text-[#ACA59A] px-1.5 py-0.5 rounded shadow-[0_1px_1px_rgba(28,25,23,0.04)] shrink-0 ml-2">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right: Credit Balance + Applications + Theme */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/student/billing"
            className="inline-flex items-center gap-2 h-8 px-3 rounded-full bg-[#FAF8F5] hover:bg-[#F3EFE9] dark:bg-[#12110F] dark:hover:bg-[#24221F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[12px] transition-colors duration-150 group"
          >
            <Coins className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#14B8A6] stroke-[1.5]" />
            <span className="font-mono tabular-nums font-medium text-[#1C1917] dark:text-[#EFECE6]">
              {creditBalance.toLocaleString()} credits
            </span>
            <span className="text-[11px] text-[#0F766E] dark:text-[#14B8A6] font-medium group-hover:underline">
              + Top up
            </span>
          </Link>

          <Link
            href="/student/applications"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] hover:bg-[#F3EFE9] dark:hover:bg-[#24221F] text-[#57534E] hover:text-[#1C1917] dark:text-[#ACA59A] dark:hover:text-[#EFECE6] transition-colors duration-150"
            title="My Applications"
            aria-label="View My Applications"
          >
            <FileText className="w-3.5 h-3.5 stroke-[1.5]" />
          </Link>

          <ThemeToggle className="bg-[#FAF8F5] dark:bg-[#12110F] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]" />
        </div>
      </header>

      <StudentCommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
    </>
  )
}

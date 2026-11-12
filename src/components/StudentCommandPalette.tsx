'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Briefcase,
  Coins,
  Compass,
  FileCheck,
  FileText,
  LayoutDashboard,
  Moon,
  ScrollText,
  Search,
  Sun,
  UserCircle,
  X,
  ArrowRight,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'

interface CommandAction {
  id: string
  title: string
  subtitle: string
  category: 'Navigation' | 'Actions' | 'Preferences'
  icon: React.ComponentType<{ className?: string }>
  href?: string
  onSelect?: () => void
  badge?: string
}

export function StudentCommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const actions: CommandAction[] = useMemo(
    () => [
      {
        id: 'nav-dashboard',
        title: 'Dashboard',
        subtitle: 'Placement cycle metrics, tier eligibility & quick links',
        category: 'Navigation',
        icon: LayoutDashboard,
        href: '/student/dashboard',
      },
      {
        id: 'nav-jobs',
        title: 'Jobs & Placement Drives',
        subtitle: 'Explore campus recruitments, dream drives & apply',
        category: 'Navigation',
        icon: Briefcase,
        href: '/student/jobs',
      },
      {
        id: 'nav-applications',
        title: 'My Applications',
        subtitle: 'Track active interviews, stage pipeline & outcomes',
        category: 'Navigation',
        icon: FileText,
        href: '/student/applications',
      },
      {
        id: 'nav-ai-resume',
        title: 'AI Resume Maker',
        subtitle: 'Compile role-tailored single-page ATS resumes',
        category: 'Navigation',
        icon: ScrollText,
        href: '/student/ai-resume',
        badge: 'ATS',
      },
      {
        id: 'nav-ai-job-search',
        title: 'AI Job Search',
        subtitle: 'AI-matched off-campus entry-level tech opportunities',
        category: 'Navigation',
        icon: Compass,
        href: '/student/ai-job-search',
      },
      {
        id: 'nav-policies',
        title: 'Placement Policies',
        subtitle: 'Institutional eligibility, upgrade rules & strike policies',
        category: 'Navigation',
        icon: FileCheck,
        href: '/student/policies',
      },
      {
        id: 'nav-billing',
        title: 'Credit Balance & Billing',
        subtitle: 'Manage AI credits, subscription passes & top-ups',
        category: 'Navigation',
        icon: Coins,
        href: '/student/billing',
      },
      {
        id: 'nav-profile',
        title: 'DigiProfile Dossier',
        subtitle: 'Verified academic marks, technical projects & experience',
        category: 'Navigation',
        icon: UserCircle,
        href: '/student/profile',
      },
      {
        id: 'action-new-resume',
        title: 'Create new tailored resume',
        subtitle: 'Launch the AI Resume compilation wizard',
        category: 'Actions',
        icon: ScrollText,
        href: '/student/ai-resume',
      },
      {
        id: 'action-top-up',
        title: 'Top up AI credits',
        subtitle: 'Purchase credit packs for resume generation',
        category: 'Actions',
        icon: Coins,
        href: '/student/billing',
      },
      {
        id: 'pref-theme',
        title: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
        subtitle: 'Toggle interface appearance theme',
        category: 'Preferences',
        icon: theme === 'dark' ? Sun : Moon,
        onSelect: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      },
    ],
    [theme, setTheme]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return actions
    return actions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    )
  }, [actions, query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % (filtered.length || 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + (filtered.length || 1)) % (filtered.length || 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = filtered[selectedIndex]
        if (selected) {
          if (selected.onSelect) {
            selected.onSelect()
          } else if (selected.href) {
            router.push(selected.href)
          }
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filtered, selectedIndex, router, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden bg-white dark:bg-[#191816] border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-[#1C1917] dark:text-[#EFECE6] rounded-2xl shadow-2xl">
        <DialogTitle className="sr-only">Quick Navigation Command Palette</DialogTitle>

        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] gap-3 bg-[#FAF8F5]/60 dark:bg-[#12110F]/60">
          <Search className="w-4 h-4 text-[#78716C] dark:text-[#8A847A] stroke-[1.5] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Type a page, action, or command..."
            autoFocus
            className="flex-1 bg-transparent text-[13px] text-[#1C1917] dark:text-[#EFECE6] placeholder:text-[#78716C] dark:placeholder:text-[#8A847A] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setSelectedIndex(0)
              }}
              className="p-1 rounded text-[#78716C] hover:text-[#1C1917] dark:hover:text-[#EFECE6]"
            >
              <X className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
          )}
          <kbd className="hidden sm:inline-block font-mono text-[10px] text-[#78716C] dark:text-[#8A847A] bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[360px] overflow-y-auto p-2 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex
              const Icon = item.icon

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.onSelect) item.onSelect()
                    else if (item.href) router.push(item.href)
                    onClose()
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6]'
                      : 'hover:bg-[#FAF8F5] dark:hover:bg-[#12110F] text-[#1C1917] dark:text-[#EFECE6]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#0F766E] text-white'
                          : 'bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[#57534E] dark:text-[#ACA59A]'
                      }`}
                    >
                      <Icon className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate flex items-center gap-2">
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#0F766E]/10 text-[#0F766E] dark:text-[#14B8A6] border border-[#0F766E]/20">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#78716C] dark:text-[#8A847A] truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-3.5 h-3.5 stroke-[1.5] shrink-0 transition-opacity ${
                      isSelected ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </button>
              )
            })
          ) : (
            <div className="py-8 text-center text-[13px] text-[#78716C] dark:text-[#8A847A]">
              No commands matching &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* Footer Hints */}
        <div className="px-4 py-2.5 bg-[#FAF8F5] dark:bg-[#12110F] border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] flex items-center justify-between text-[11px] text-[#78716C] dark:text-[#8A847A]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="font-mono bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] px-1 rounded">
                ↑
              </kbd>
              <kbd className="font-mono bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] px-1 rounded">
                ↓
              </kbd>
              <span>navigate</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="font-mono bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] px-1.5 rounded">
                ↵
              </kbd>
              <span>select</span>
            </span>
          </div>
          <span>Placement OS</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

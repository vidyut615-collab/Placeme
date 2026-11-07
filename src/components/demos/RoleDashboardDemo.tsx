'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Building, Landmark, CheckCircle, ArrowRight, TrendingUp, Layers } from 'lucide-react'

export function RoleDashboardDemo() {
  const [activeTab, setActiveTab] = useState<'student' | 'college' | 'agency'>('student')

  // Auto-switch tabs in loop
  useEffect(() => {
    let mounted = true
    const tabs: Array<'student' | 'college' | 'agency'> = ['student', 'college', 'agency']
    let index = 0

    const interval = setInterval(() => {
      if (!mounted) return
      index = (index + 1) % tabs.length
      setActiveTab(tabs[index])
    }, 3800)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="w-full bg-[#faf9f8] text-[#242424] rounded-[24px] overflow-hidden border border-[#cecac8] shadow-lg font-mono text-[13px]">
      
      {/* Role Switcher Navigation (Not browser chrome, but real webapp tab control) */}
      <div className="px-6 py-3.5 bg-white border-b border-[#cecac8]/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#2b59d1]" />
          <span className="font-heading font-semibold text-[14px] text-[#242424]">
            Role-Based Access Control
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-[#f6f3f1] p-1 rounded-xl border border-[#cecac8]/60">
          {[
            { id: 'student', label: 'Student Portal', icon: User },
            { id: 'college', label: 'College TPO', icon: Building },
            { id: 'agency', label: 'Agency Console', icon: Landmark },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'student' | 'college' | 'agency')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#2b59d1] text-white shadow-xs'
                    : 'text-[#797776] hover:text-[#242424]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'student' && (
            <motion.div
              key="student"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-[#cecac8]/60 shadow-xs">
                  <span className="text-[10px] text-[#797776] uppercase block">Applications</span>
                  <span className="font-heading font-bold text-[22px] text-[#242424]">8 Active</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-[#cecac8]/60 shadow-xs">
                  <span className="text-[10px] text-[#797776] uppercase block">Interviews</span>
                  <span className="font-heading font-bold text-[22px] text-[#2b59d1]">3 Rounds</span>
                </div>
                <div className="bg-[#a7fccd]/20 p-3.5 rounded-xl border border-[#16a34a]/30 shadow-xs">
                  <span className="text-[10px] text-[#16a34a] font-semibold uppercase block">Top Package</span>
                  <span className="font-heading font-bold text-[22px] text-[#16a34a]">₹34.0 LPA</span>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { company: 'Google LLC', role: 'Staff SDE-2', status: 'Offer Released', color: 'bg-[#a7fccd]/40 text-[#16a34a]' },
                  { company: 'Flipkart', role: 'Backend Core', status: 'Shortlisted', color: 'bg-[#cfdaf5] text-[#2b59d1]' },
                  { company: 'Microsoft', role: 'Cloud SDE-1', status: 'In Review', color: 'bg-gray-100 text-[#4e4d4d]' },
                ].map((item) => (
                  <div key={item.company} className="bg-white px-4 py-3 rounded-xl border border-[#cecac8]/60 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="font-semibold text-[13px] text-[#242424] block">{item.company}</span>
                      <span className="text-[11px] text-[#797776]">{item.role} · Tier-1 Pool</span>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.06em] px-3 py-1 rounded-full ${item.color}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'college' && (
            <motion.div
              key="college"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-[#cecac8]/60 shadow-xs">
                  <span className="text-[10px] text-[#797776] uppercase block">Total Cohort</span>
                  <span className="font-heading font-bold text-[22px] text-[#242424]">342</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-[#cecac8]/60 shadow-xs">
                  <span className="text-[10px] text-[#797776] uppercase block">Placement Velocity</span>
                  <span className="font-heading font-bold text-[22px] text-[#2b59d1]">94.2%</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-[#cecac8]/60 shadow-xs">
                  <span className="text-[10px] text-[#797776] uppercase block">Cumulative Value</span>
                  <span className="font-heading font-bold text-[22px] text-[#242424]">₹18.4 Cr</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  { dept: 'Computer Science & Engineering', placed: '118/120 Placed', pct: '98.3%', width: '98%' },
                  { dept: 'Electronics & Communication', placed: '92/95 Placed', pct: '96.8%', width: '96%' },
                  { dept: 'Mechanical Engineering', placed: '74/82 Placed', pct: '90.2%', width: '90%' },
                ].map((d) => (
                  <div key={d.dept} className="bg-white p-3.5 rounded-xl border border-[#cecac8]/60 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-semibold text-[#242424]">{d.dept}</span>
                      <span className="text-[#2b59d1] font-bold">{d.pct}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#2b59d1] rounded-full" style={{ width: d.width }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'agency' && (
            <motion.div
              key="agency"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-[#cecac8]/60 shadow-xs">
                  <span className="text-[10px] text-[#797776] uppercase block">Campuses</span>
                  <span className="font-heading font-bold text-[22px] text-[#242424]">24 Active</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-[#cecac8]/60 shadow-xs">
                  <span className="text-[10px] text-[#797776] uppercase block">Offers Extended</span>
                  <span className="font-heading font-bold text-[22px] text-[#2b59d1]">1,420</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-[#cecac8]/60 shadow-xs">
                  <span className="text-[10px] text-[#797776] uppercase block">Security Layer</span>
                  <span className="font-heading font-bold text-[22px] text-[#16a34a]">RLS Scoped</span>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { name: 'IIT Delhi Consortium', candidates: '450 Hires', status: 'Drive Active' },
                  { name: 'BITS Pilani Campus', candidates: '380 Hires', status: 'Drive Active' },
                  { name: 'NIT Trichy Tier-1', candidates: '290 Hires', status: 'Drive Completed' },
                ].map((campus) => (
                  <div key={campus.name} className="bg-white px-4 py-3 rounded-xl border border-[#cecac8]/60 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="font-semibold text-[13px] text-[#242424] block">{campus.name}</span>
                      <span className="text-[11px] text-[#797776]">{campus.candidates} Verified</span>
                    </div>
                    <span className="text-[10px] font-semibold bg-[#242424] text-white px-3 py-1 rounded-full uppercase">
                      {campus.status}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}

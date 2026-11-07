'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, ArrowUpRight, PieChart, Activity } from 'lucide-react'

const DAYS = [
  { day: 'Mon', h: 58, offers: 18 },
  { day: 'Tue', h: 72, offers: 24 },
  { day: 'Wed', h: 64, offers: 21 },
  { day: 'Thu', h: 86, offers: 32 },
  { day: 'Fri', h: 94, offers: 38 },
  { day: 'Sat', h: 78, offers: 26 },
  { day: 'Sun', h: 62, offers: 19 },
]

export function AnalyticsDemo() {
  const [activeDay, setActiveDay] = useState(4) // default Friday

  useEffect(() => {
    let mounted = true
    let idx = 0

    const interval = setInterval(() => {
      if (!mounted) return
      idx = (idx + 1) % DAYS.length
      setActiveDay(idx)
    }, 1800)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="w-full bg-[#faf9f8] text-[#242424] rounded-[24px] overflow-hidden border border-[#cecac8] shadow-lg font-mono text-[13px]">
      
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-[#cecac8]/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2b59d1]/10 flex items-center justify-center text-[#2b59d1]">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-heading font-semibold text-[15px] text-[#242424] block">
              Placement Velocity & NIRF Telemetry
            </span>
            <span className="text-[10px] text-[#797776]">Institutional Intelligence · Automated Accreditation Export</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#a7fccd]/40 border border-[#16a34a]/30 px-3 py-1 rounded-full text-[10px] text-[#16a34a] font-semibold">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>Real-Time Sync Active</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-5">
        
        {/* Metric Cards Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-[#cecac8]/60 shadow-xs">
            <span className="text-[10px] text-[#797776] uppercase tracking-[0.06em] block">Clearance Rate</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-heading font-bold text-[22px] text-[#242424]">94.2%</span>
              <span className="text-[10px] text-[#16a34a] font-semibold">▲ +14%</span>
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-[#cecac8]/60 shadow-xs">
            <span className="text-[10px] text-[#797776] uppercase tracking-[0.06em] block">Cumulative CTC</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-heading font-bold text-[22px] text-[#2b59d1]">₹18.4 Cr</span>
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-[#cecac8]/60 shadow-xs">
            <span className="text-[10px] text-[#797776] uppercase tracking-[0.06em] block">Median Package</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-heading font-bold text-[22px] text-[#242424]">₹14.8 LPA</span>
            </div>
          </div>
        </div>

        {/* Dynamic Bar Chart with Day Scrub */}
        <div className="bg-white p-4 rounded-xl border border-[#cecac8]/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#797776]">Weekly Placement Output (Offers Dispatched)</span>
            <span className="text-[#2b59d1] font-semibold">
              {DAYS[activeDay].day}: {DAYS[activeDay].offers} Offers Confirmed
            </span>
          </div>

          <div className="flex items-end justify-between gap-3 h-28 pt-2">
            {DAYS.map((d, i) => {
              const isSelected = i === activeDay
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full flex-1 flex items-end justify-center">
                    <motion.div
                      animate={{ height: `${d.h}%` }}
                      transition={{ duration: 0.4 }}
                      className={`w-full max-w-[28px] rounded-t-md transition-colors ${
                        isSelected ? 'bg-[#2b59d1] shadow-sm' : 'bg-[#cfdaf5]/70 hover:bg-[#cfdaf5]'
                      }`}
                    />
                  </div>
                  <span className={`text-[10px] ${isSelected ? 'text-[#2b59d1] font-bold' : 'text-[#797776]'}`}>
                    {d.day}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tier Distribution Ratios */}
        <div className="flex items-center justify-between pt-1 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2b59d1]" />
            <span className="text-[#4e4d4d]">Super Dream: <strong>48%</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" />
            <span className="text-[#4e4d4d]">Dream: <strong>36%</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#cecac8]" />
            <span className="text-[#4e4d4d]">Core: <strong>16%</strong></span>
          </div>
        </div>

      </div>

    </div>
  )
}

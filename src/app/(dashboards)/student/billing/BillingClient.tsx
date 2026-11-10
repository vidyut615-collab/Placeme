'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, 
  Coins, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileText, 
  Search, 
  ShieldCheck, 
  Receipt, 
  Download, 
  Filter, 
  Sparkles, 
  Layers, 
  Building2, 
  Info,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  CreditCard,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { RollingCounter } from '@/components/ui/tactile/RollingCounter'
import { CheckoutButton } from './CheckoutButton'
import { InvoiceModal, InvoiceData } from './InvoiceModal'
import { formatDate } from '@/lib/utils'

function formatTimestampWithTime(date: string | Date | number | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'

  const dateStr = d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  const hours = d.getHours()
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const formattedHours = (hours % 12 || 12).toString().padStart(2, '0')

  return `${dateStr}, ${formattedHours}:${minutes} ${ampm}`
}

interface CreditLedgerItem {
  id: string
  user_id: string
  amount: number
  description: string
  created_at: string
}

interface PaymentRequestItem {
  id: string
  user_id: string
  college_id: string
  amount: number
  status: string
  type: string
  payload?: any
  razorpay_order_id?: string | null
  razorpay_payment_id?: string | null
  created_at: string
  updated_at?: string
}

interface BillingClientProps {
  student: {
    id: string
    college_id: string
    access_end_date: string | null
    credit_balance: number
    colleges?: {
      name: string
    } | null
    profile_data?: any
  }
  userEmail: string
  creditLedgers: CreditLedgerItem[]
  paymentRequests: PaymentRequestItem[]
}

export function BillingClient({
  student,
  userEmail,
  creditLedgers,
  paymentRequests
}: BillingClientProps) {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'credits' | 'payments'>('credits')
  const [creditFilter, setCreditFilter] = useState<'all' | 'deductions' | 'additions'>('all')
  const [creditSearch, setCreditSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all')

  // Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)

  // Candidate context
  const prof = student.profile_data || {}
  const candidateName = prof.first_name ? `${prof.first_name} ${prof.last_name || ''}`.trim() : prof.full_name || 'Candidate'
  const collegeName = student.colleges?.name || 'Placement Network'

  // Access state
  const isNeverPaid = !student.access_end_date
  const isExpired = student.access_end_date && new Date(student.access_end_date) < new Date()
  const isActive = student.access_end_date && new Date(student.access_end_date) >= new Date()
  const formattedExpiry = student.access_end_date 
    ? new Date(student.access_end_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Not Activated'

  // Credit metrics
  const creditBalance = student.credit_balance || 0
  const totalSpent = useMemo(() => {
    return creditLedgers
      .filter(l => l.amount < 0)
      .reduce((sum, l) => sum + Math.abs(l.amount), 0)
  }, [creditLedgers])

  const totalEarned = useMemo(() => {
    return creditLedgers
      .filter(l => l.amount > 0)
      .reduce((sum, l) => sum + l.amount, 0)
  }, [creditLedgers])

  const lifetimeTotal = totalEarned > 0 ? totalEarned : (creditBalance + totalSpent)
  const consumptionPercentage = lifetimeTotal > 0 ? Math.min(100, Math.round((totalSpent / lifetimeTotal) * 100)) : 0

  // Top-Up Pack Definitions with exact unit economics & savings tiers
  const creditPacks = [
    {
      id: 'plan_starter',
      name: 'Starter Pack',
      credits: 500,
      price: 100,
      effectiveRate: '₹0.20',
      rateSubtext: '20 paise',
      discountTag: 'Base Price',
      popularTag: null,
      savings: 'Accessible pocket-money entry price point.',
      coverage: '1–2 Weeks Quick Refuel',
      highlight: false
    },
    {
      id: 'plan_basic',
      name: 'Basic',
      credits: 1000,
      price: 190,
      effectiveRate: '₹0.19',
      rateSubtext: '19 paise',
      discountTag: '5% OFF',
      popularTag: 'Popular',
      savings: 'Saves ₹10 vs base rate',
      coverage: '3–4 Weeks Drive Sprint',
      highlight: false
    },
    {
      id: 'plan_pro',
      name: 'Pro',
      credits: 2000,
      price: 360,
      effectiveRate: '₹0.18',
      rateSubtext: '18 paise',
      discountTag: '10% OFF',
      popularTag: 'Most Purchased',
      savings: 'Saves ₹40 vs base rate',
      coverage: '2–3 Months Season Coverage',
      highlight: true
    },
    {
      id: 'plan_premium',
      name: 'Premium',
      credits: 5000,
      price: 800,
      effectiveRate: '₹0.16',
      rateSubtext: '16 paise',
      discountTag: '20% OFF',
      popularTag: 'Best Value',
      savings: 'Saves ₹200 vs base rate',
      coverage: 'Full Academic Year Marathon',
      highlight: false
    }
  ]

  // Expandable comparison matrix state
  const [showComparison, setShowComparison] = useState(false)

  // Pagination state (20 items per view)
  const ITEMS_PER_PAGE = 20
  const [creditPage, setCreditPage] = useState(1)
  const [paymentPage, setPaymentPage] = useState(1)

  // Filtered Credit Ledgers
  const filteredCreditLedgers = useMemo(() => {
    return creditLedgers.filter(item => {
      // Filter by type
      if (creditFilter === 'deductions' && item.amount >= 0) return false
      if (creditFilter === 'additions' && item.amount <= 0) return false

      // Filter by search query
      if (creditSearch.trim()) {
        const query = creditSearch.toLowerCase()
        const descMatch = (item.description || '').toLowerCase().includes(query)
        const amtMatch = Math.abs(item.amount).toString().includes(query)
        return descMatch || amtMatch
      }

      return true
    })
  }, [creditLedgers, creditFilter, creditSearch])

  const totalCreditPages = Math.max(1, Math.ceil(filteredCreditLedgers.length / ITEMS_PER_PAGE))
  const paginatedCreditLedgers = useMemo(() => {
    const start = (creditPage - 1) * ITEMS_PER_PAGE
    return filteredCreditLedgers.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredCreditLedgers, creditPage])

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return paymentRequests.filter(item => {
      if (paymentFilter === 'paid' && item.status !== 'paid') return false
      if (paymentFilter === 'pending' && item.status === 'paid') return false
      return true
    })
  }, [paymentRequests, paymentFilter])

  const totalPaymentPages = Math.max(1, Math.ceil(filteredPayments.length / ITEMS_PER_PAGE))
  const paginatedPayments = useMemo(() => {
    const start = (paymentPage - 1) * ITEMS_PER_PAGE
    return filteredPayments.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredPayments, paymentPage])

  // Handle invoice modal open from payment request
  const handleOpenInvoice = (payment: PaymentRequestItem) => {
    const inv: InvoiceData = {
      id: payment.id,
      invoiceNumber: `INV-2026-${payment.id.substring(0, 6).toUpperCase()}`,
      date: payment.created_at,
      type: payment.type,
      amount: payment.amount,
      status: payment.status,
      razorpayOrderId: payment.razorpay_order_id,
      razorpayPaymentId: payment.razorpay_payment_id,
      candidateName,
      candidateEmail: userEmail,
      collegeName,
      payload: payment.payload
    }
    setSelectedInvoice(inv)
    setIsInvoiceOpen(true)
  }

  // Handle previewing demo invoice
  const handlePreviewDemoInvoice = () => {
    const demo: InvoiceData = {
      id: 'demo-tx-998811',
      invoiceNumber: 'INV-2026-DEMO88',
      date: new Date().toISOString(),
      type: 'subscription',
      amount: 500,
      status: 'paid',
      razorpayOrderId: 'order_DEMO_998811',
      razorpayPaymentId: 'pay_DEMO_554433',
      candidateName,
      candidateEmail: userEmail,
      collegeName,
      payload: { extension_months: 12, credits_included: 150 }
    }
    setSelectedInvoice(demo)
    setIsInvoiceOpen(true)
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Billing & AI Credit Central
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/80">
              Razorpay Secured
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your annual placement drive pass, AI synthesis token balance, audit logs, and downloadable tax invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePreviewDemoInvoice}
            className="flex items-center gap-1.5 text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
          >
            <Receipt className="w-3.5 h-3.5 stroke-[1.5]" />
            Preview Invoice Template
          </button>

          {isActive ? (
            <span className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />
              Placement Pass Active
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 font-medium">
              <AlertCircle className="w-3.5 h-3.5 stroke-[1.5]" />
              {isExpired ? 'Pass Expired' : 'Pass Required'}
            </span>
          )}
        </div>
      </div>

      {/* 2-Card Hero Row: Institutional Pass (65%) + Available Credits (35%) */}
      <div className="flex flex-col lg:flex-row gap-4 w-full items-stretch">
        
        {/* Card 1: Institutional Placement Pass (~65% space) */}
        <div className="w-full lg:w-[65%] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 p-5 flex flex-col justify-between shadow-xs">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ShieldCheck className="w-4 h-4 stroke-[1.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Institutional Placement Pass
                    </h2>
                    <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">· {collegeName}</span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Annual clearance for on-campus company drives, 14-stage conveyor tracking, and verified DigiProfile seal.
                  </p>
                </div>
              </div>

              <span className={`text-[11px] font-mono px-2.5 py-1 rounded-md border shrink-0 font-medium ${
                isActive 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300'
              }`}>
                {isActive ? 'Active Season' : isExpired ? 'Pass Expired' : 'Pass Required'}
              </span>
            </div>

            {/* Compact Details & Validity Banner */}
            <div className="flex flex-wrap items-center justify-between text-xs font-mono pt-0.5 gap-2">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <span className="text-zinc-400 text-[11px]">Valid Until:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{formattedExpiry}</span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span className="text-zinc-400 text-[11px]">Fee:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">₹500 / Year</span>
              </div>

              <div className="text-[11px] text-zinc-400">
                Includes 150 starter credits
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[1.5]" />
              <span>Full campus drives clearance</span>
            </div>

            <div>
              {!isActive ? (
                <CheckoutButton
                  type="subscription"
                  label="Unlock Pass (₹500)"
                  userName={candidateName}
                  userEmail={userEmail}
                  icon="zap"
                  className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs h-8 px-4 rounded-lg shadow-2xs"
                />
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 px-3 py-1 rounded-lg border border-emerald-200/80 dark:border-emerald-900/50">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />
                  Verified Active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Available Credits (~35% space) */}
        <div className="w-full lg:w-[35%] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 p-5 flex flex-col justify-between shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <Zap className="w-4 h-4 stroke-[1.5]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Available Credits
                  </h2>
                  <span className="text-[10px] font-mono text-zinc-400 block">
                    AI Resume & Job Search Fuel
                  </span>
                </div>
              </div>

              {/* Minimalistic Lifetime Stat */}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/80">
                Used: {totalSpent} cr
              </span>
            </div>

            {/* Big Balanced Number */}
            <div className="flex items-baseline gap-2 pt-0.5">
              <RollingCounter 
                value={creditBalance} 
                className="text-3xl font-black text-zinc-900 dark:text-zinc-50"
              />
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider font-semibold">Credits Left</span>
            </div>
          </div>

          {/* Immersive & Actionable Buy CTA */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 mt-3">
            <button
              onClick={() => {
                const el = document.getElementById('topup-packs')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="group w-full h-8 px-3.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-semibold flex items-center justify-between shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 fill-white/20 stroke-[1.5]" />
                <span>Top Up Credits</span>
              </span>
              <span className="flex items-center gap-1 text-[11px] font-normal text-purple-100 group-hover:text-white transition">
                <span>From ₹100</span>
                <ArrowRight className="w-3 h-3 stroke-[2] group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* Credit Top-Up Packs Section */}
      <div id="topup-packs" className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400 stroke-[1.5]" />
              AI Credit Top-Up Packs
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Refuel your account instantly with transparent unit economics and zero hidden platform fees.
            </p>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            Instant credit provisioning via Razorpay Webhook
          </span>
        </div>

        {/* 4 Main Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {creditPacks.map((pack) => (
            <div
              key={pack.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all relative ${
                pack.highlight 
                  ? 'border-purple-300 dark:border-purple-700/80 bg-purple-50/20 dark:bg-purple-950/20 ring-1 ring-purple-500/20 shadow-sm'
                  : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs'
              }`}
            >
              {/* Header: Title + Popular Pill + Discount Tag */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">
                        {pack.name}
                      </span>
                      {pack.popularTag && (
                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${
                          pack.popularTag === 'Most Purchased'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                            : 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/60'
                        }`}>
                          {pack.popularTag}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                    pack.discountTag === 'Base Price'
                      ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80'
                  }`}>
                    {pack.discountTag}
                  </span>
                </div>

                {/* Big Credits Display */}
                <div className="pt-2 pb-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black font-mono tracking-tight text-zinc-900 dark:text-zinc-50">
                      {pack.credits.toLocaleString()}
                    </span>
                    <span className="text-xs font-mono text-zinc-500 font-semibold">Credits</span>
                  </div>
                </div>

                {/* Price & Effective Rate Row */}
                <div className="space-y-1.5 py-2.5 border-t border-zinc-100 dark:border-zinc-800/80 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Selling Price:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">₹{pack.price}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span>Effective Rate:</span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {pack.effectiveRate} <span className="text-zinc-400">({pack.rateSubtext}/cr)</span>
                    </span>
                  </div>
                </div>

                {/* What Student Saves */}
                <div className="pt-2 pb-4 border-t border-zinc-100 dark:border-zinc-800/60">
                  <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 block leading-tight">
                    {pack.savings}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <CheckoutButton
                type="credit_topup"
                planId={pack.id}
                credits={pack.credits}
                amount={pack.price}
                label={`Pay ₹${pack.price}`}
                userName={candidateName}
                userEmail={userEmail}
                icon="zap"
                variant={pack.highlight ? "default" : "outline"}
                className={`w-full text-xs font-mono font-medium h-9 rounded-xl ${
                  pack.highlight 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs' 
                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              />
            </div>
          ))}
        </div>

        {/* "Show Comparison" Accordion Trigger */}
        <div className="flex justify-center pt-1">
          <button
            onClick={() => setShowComparison(prev => !prev)}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 stroke-[1.5]" />
            <span>{showComparison ? 'Hide Plan Comparison' : 'Show Full Comparison & Maximum Capacities'}</span>
            {showComparison ? (
              <ChevronUp className="w-3.5 h-3.5 text-zinc-400 stroke-[2]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 stroke-[2]" />
            )}
          </button>
        </div>

        {/* Expandable Side-by-Side Comparison Matrix */}
        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs font-mono border-collapse min-w-[680px]">
                  <thead>
                    <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/40">
                      <th className="p-4 text-xs font-bold text-zinc-900 dark:text-zinc-100 w-[28%]">
                        Feature / Capacity
                      </th>
                      {creditPacks.map(p => (
                        <th 
                          key={p.id} 
                          className={`p-4 text-center font-bold text-xs ${
                            p.id === 'plan_pro' 
                              ? 'bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200' 
                              : 'text-zinc-900 dark:text-zinc-100'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span>{p.name}</span>
                            {p.popularTag && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-600 text-white uppercase">
                                {p.popularTag}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                    {/* Row 1: Credits */}
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30">
                      <td className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">Credits Provided</td>
                      <td className="p-4 text-center text-zinc-900 dark:text-zinc-100 font-bold">500 cr</td>
                      <td className="p-4 text-center text-zinc-900 dark:text-zinc-100 font-bold">1,000 cr</td>
                      <td className="p-4 text-center font-bold text-purple-600 dark:text-purple-400 bg-purple-50/30 dark:bg-purple-950/20">2,000 cr</td>
                      <td className="p-4 text-center text-zinc-900 dark:text-zinc-100 font-bold">5,000 cr</td>
                    </tr>
                    
                    {/* Row 2: Price */}
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30">
                      <td className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">Selling Price</td>
                      <td className="p-4 text-center font-bold text-zinc-900 dark:text-zinc-100">₹100</td>
                      <td className="p-4 text-center font-bold text-zinc-900 dark:text-zinc-100">₹190</td>
                      <td className="p-4 text-center font-bold text-purple-600 dark:text-purple-400 bg-purple-50/30 dark:bg-purple-950/20">₹360</td>
                      <td className="p-4 text-center font-bold text-zinc-900 dark:text-zinc-100">₹800</td>
                    </tr>

                    {/* Row 3: Effective Rate */}
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30">
                      <td className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">Effective Rate / Credit</td>
                      <td className="p-4 text-center text-zinc-600 dark:text-zinc-400">₹0.20 (20 paise)</td>
                      <td className="p-4 text-center text-zinc-600 dark:text-zinc-400">₹0.19 (19 paise)</td>
                      <td className="p-4 text-center text-purple-700 dark:text-purple-300 bg-purple-50/30 dark:bg-purple-950/20 font-semibold">₹0.18 (18 paise)</td>
                      <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 font-semibold">₹0.16 (16 paise)</td>
                    </tr>

                    {/* Row 4: Student Savings */}
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30">
                      <td className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">Direct Savings</td>
                      <td className="p-4 text-center text-zinc-400">Base Price</td>
                      <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 font-semibold">Save ₹10 (5% OFF)</td>
                      <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 font-semibold bg-purple-50/30 dark:bg-purple-950/20">Save ₹40 (10% OFF)</td>
                      <td className="p-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">Save ₹200 (20% OFF)</td>
                    </tr>

                    {/* Section Header: Capacities */}
                    <tr className="bg-zinc-100/60 dark:bg-zinc-800/40">
                      <td colSpan={5} className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        Maximum Capacities (If Dedicated to That Tool)
                      </td>
                    </tr>

                    {/* Row 5: Max Resumes */}
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30">
                      <td className="p-4">
                        <div className="font-semibold text-zinc-800 dark:text-zinc-200">Max Tailored Resumes</div>
                        <div className="text-[10px] text-zinc-400 font-normal">Full LaTeX ATS documents</div>
                      </td>
                      <td className="p-4 text-center font-bold text-zinc-900 dark:text-zinc-100">Up to 10 Resumes</td>
                      <td className="p-4 text-center font-bold text-zinc-900 dark:text-zinc-100">Up to 20 Resumes</td>
                      <td className="p-4 text-center font-bold text-purple-700 dark:text-purple-300 bg-purple-50/30 dark:bg-purple-950/20">Up to 40 Resumes</td>
                      <td className="p-4 text-center font-bold text-emerald-600 dark:text-emerald-400">Up to 100 Resumes</td>
                    </tr>

                    {/* Row 6: Max Jobs Scanned */}
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30">
                      <td className="p-4">
                        <div className="font-semibold text-zinc-800 dark:text-zinc-200">Max Off-Campus Jobs Scanned</div>
                        <div className="text-[10px] text-zinc-400 font-normal">Deep multi-portal scrapers</div>
                      </td>
                      <td className="p-4 text-center font-bold text-zinc-900 dark:text-zinc-100">Up to 25 Jobs</td>
                      <td className="p-4 text-center font-bold text-zinc-900 dark:text-zinc-100">Up to 55 Jobs</td>
                      <td className="p-4 text-center font-bold text-purple-700 dark:text-purple-300 bg-purple-50/30 dark:bg-purple-950/20">Up to 110 Jobs</td>
                      <td className="p-4 text-center font-bold text-emerald-600 dark:text-emerald-400">Up to 275 Jobs</td>
                    </tr>

                    {/* Row 7: Coverage Horizon */}
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30">
                      <td className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">Estimated Duration</td>
                      <td className="p-4 text-center text-zinc-600 dark:text-zinc-400">1–2 Weeks Refuel</td>
                      <td className="p-4 text-center text-zinc-600 dark:text-zinc-400">3–4 Weeks Drive Sprint</td>
                      <td className="p-4 text-center text-purple-700 dark:text-purple-300 bg-purple-50/30 dark:bg-purple-950/20 font-semibold">2–3 Months Season</td>
                      <td className="p-4 text-center text-zinc-900 dark:text-zinc-100 font-semibold">Full Academic Year</td>
                    </tr>

                    {/* Row 8: Action Checkout */}
                    <tr className="bg-zinc-50/70 dark:bg-zinc-950/40">
                      <td className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">Instant Checkout</td>
                      {creditPacks.map(p => (
                        <td 
                          key={p.id} 
                          className={`p-4 text-center ${
                            p.id === 'plan_pro' ? 'bg-purple-50/40 dark:bg-purple-950/30' : ''
                          }`}
                        >
                          <CheckoutButton
                            type="credit_topup"
                            planId={p.id}
                            credits={p.credits}
                            amount={p.price}
                            label={`Pay ₹${p.price}`}
                            userName={candidateName}
                            userEmail={userEmail}
                            icon="zap"
                            variant={p.highlight ? "default" : "outline"}
                            className={`w-full text-xs font-mono font-medium h-8 rounded-lg ${
                              p.highlight 
                                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs' 
                                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dual Ledger System: Credit Usage Log vs. Financial Transaction Ledger */}
      <div className="space-y-4 pt-4">
        
        {/* Ledger Segmented Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('credits')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                activeTab === 'credits'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-200/60 dark:border-zinc-700/60'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Credit Activity & Usage Log</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                {creditLedgers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                activeTab === 'payments'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-200/60 dark:border-zinc-700/60'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Financial Payment Ledger</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                {paymentRequests.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            {activeTab === 'credits' 
              ? 'Real-time deduction logs and credit grants'
              : 'Official tax invoices & payment gateway settlements'}
          </div>
        </div>

        {/* TAB 1: CREDIT ACTIVITY & USAGE LOG */}
        {activeTab === 'credits' && (
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 overflow-hidden shadow-xs space-y-0">
            
            {/* Filter & Search Bar */}
            <div className="p-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-950/30">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-zinc-500 flex items-center gap-1 mr-1">
                  <Filter className="w-3 h-3 stroke-[1.5]" /> Filter:
                </span>
                
                <button
                  onClick={() => { setCreditFilter('all'); setCreditPage(1); }}
                  className={`text-xs font-mono px-2.5 py-1 rounded-md border transition ${
                    creditFilter === 'all'
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white font-semibold'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  All Logs ({creditLedgers.length})
                </button>

                <button
                  onClick={() => { setCreditFilter('deductions'); setCreditPage(1); }}
                  className={`text-xs font-mono px-2.5 py-1 rounded-md border transition flex items-center gap-1 ${
                    creditFilter === 'deductions'
                      ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-semibold'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <ArrowDownRight className="w-3 h-3 text-rose-500" />
                  Deductions ({creditLedgers.filter(l => l.amount < 0).length})
                </button>

                <button
                  onClick={() => { setCreditFilter('additions'); setCreditPage(1); }}
                  className={`text-xs font-mono px-2.5 py-1 rounded-md border transition flex items-center gap-1 ${
                    creditFilter === 'additions'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-semibold'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  Added / Top-Up ({creditLedgers.filter(l => l.amount > 0).length})
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 stroke-[1.5]" />
                <input
                  type="text"
                  placeholder="Search activity description..."
                  value={creditSearch}
                  onChange={(e) => { setCreditSearch(e.target.value); setCreditPage(1); }}
                  className="w-full text-xs font-mono pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* List Entries */}
            {filteredCreditLedgers.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <p className="text-xs text-zinc-500 font-mono">No credit consumption or grant records match your filter.</p>
                <p className="text-[11px] text-zinc-400">
                  Every time you generate an ATS Resume, crawl off-campus roles, or purchase top-up credits, entries will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {paginatedCreditLedgers.map((log) => {
                  const isDeduction = log.amount < 0
                  const isResume = log.description?.toLowerCase().includes('resume')
                  const isSearch = log.description?.toLowerCase().includes('search') || log.description?.toLowerCase().includes('crawl')
                  const isTopup = log.description?.toLowerCase().includes('top-up') || log.description?.toLowerCase().includes('subscription')

                  return (
                    <div 
                      key={log.id} 
                      className="py-2.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 transition"
                    >
                      <div className="flex items-center gap-3">
                        {/* Icon based on action */}
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border ${
                          isDeduction
                            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400'
                            : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {isResume ? (
                            <FileText className="w-3.5 h-3.5 stroke-[1.5]" />
                          ) : isSearch ? (
                            <Search className="w-3.5 h-3.5 stroke-[1.5]" />
                          ) : isTopup ? (
                            <Sparkles className="w-3.5 h-3.5 stroke-[1.5]" />
                          ) : isDeduction ? (
                            <ArrowDownRight className="w-3.5 h-3.5 stroke-[1.5]" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 stroke-[1.5]" />
                          )}
                        </div>

                        {/* Title and details with timestamp including time */}
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                            {log.description || (isDeduction ? 'AI Feature Token Consumption' : 'Credits Added to Account')}
                          </span>
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono flex items-center gap-1.5" suppressHydrationWarning>
                            <Clock className="w-3 h-3 stroke-[1.5]" />
                            {formatTimestampWithTime(log.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Delta Chip */}
                      <div className="flex items-center gap-3 sm:self-center self-end shrink-0">
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                          isDeduction
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
                        }`}>
                          {isDeduction ? (
                            <>
                              <ArrowDownRight className="w-3 h-3" />
                              {log.amount} cr
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3" />
                              +{log.amount} cr
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {filteredCreditLedgers.length > 0 && (
              <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/60 dark:bg-zinc-950/40 text-xs font-mono">
                <span className="text-[11px] text-zinc-500">
                  Showing {(creditPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(creditPage * ITEMS_PER_PAGE, filteredCreditLedgers.length)} of {filteredCreditLedgers.length} records (20 per page)
                </span>

                {totalCreditPages > 1 && (
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => setCreditPage(p => Math.max(1, p - 1))}
                      disabled={creditPage === 1}
                      className="h-7 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-850 flex items-center gap-1 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <span className="text-[11px] text-zinc-700 dark:text-zinc-300 font-bold px-2">
                      Page {creditPage} of {totalCreditPages}
                    </span>

                    <button
                      onClick={() => setCreditPage(p => Math.min(totalCreditPages, p + 1))}
                      disabled={creditPage === totalCreditPages}
                      className="h-7 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-850 flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FINANCIAL PAYMENT LEDGER & INVOICES */}
        {activeTab === 'payments' && (
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 overflow-hidden shadow-xs space-y-0">
            
            {/* Filter Bar */}
            <div className="p-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-950/30">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-500 flex items-center gap-1 mr-1">
                  <Filter className="w-3 h-3 stroke-[1.5]" /> Status:
                </span>
                
                <button
                  onClick={() => { setPaymentFilter('all'); setPaymentPage(1); }}
                  className={`text-xs font-mono px-2.5 py-1 rounded-md border transition ${
                    paymentFilter === 'all'
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white font-semibold'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  All ({paymentRequests.length})
                </button>

                <button
                  onClick={() => { setPaymentFilter('paid'); setPaymentPage(1); }}
                  className={`text-xs font-mono px-2.5 py-1 rounded-md border transition ${
                    paymentFilter === 'paid'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-semibold'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  Paid & Settled ({paymentRequests.filter(p => p.status === 'paid').length})
                </button>

                <button
                  onClick={() => { setPaymentFilter('pending'); setPaymentPage(1); }}
                  className={`text-xs font-mono px-2.5 py-1 rounded-md border transition ${
                    paymentFilter === 'pending'
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-semibold'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  Pending / Failed ({paymentRequests.filter(p => p.status !== 'paid').length})
                </button>
              </div>

              <span className="text-[11px] font-mono text-zinc-500">
                GST Compliant Invoices
              </span>
            </div>

            {/* List Payment Records */}
            {filteredPayments.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="text-xs text-zinc-500 font-mono">No financial transactions recorded for this account.</p>
                <button
                  onClick={handlePreviewDemoInvoice}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  Click to Preview Standard Tax Invoice Format
                </button>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {paginatedPayments.map((tx) => {
                  const isPaid = tx.status === 'paid'
                  const isSub = tx.type === 'subscription'

                  return (
                    <div 
                      key={tx.id} 
                      className="py-2.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 transition"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                            {isSub ? '12 Months Placement Access Pass' : 'AI Intelligence Credit Top-Up'}
                          </span>
                          <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border font-semibold ${
                            isPaid
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400'
                              : tx.status === 'failed'
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400'
                              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400'
                          }`}>
                            {tx.status || 'pending'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-zinc-400 dark:text-zinc-500 font-mono" suppressHydrationWarning>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 stroke-[1.5]" />
                            {formatTimestampWithTime(tx.created_at)}
                          </span>
                          {tx.razorpay_payment_id && (
                            <span className="hidden sm:inline">
                              Ref: {tx.razorpay_payment_id}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:self-center self-end shrink-0">
                        <span className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100">
                          ₹{tx.amount}
                        </span>

                        {isPaid ? (
                          <button
                            onClick={() => handleOpenInvoice(tx)}
                            className="flex items-center gap-1.5 text-xs font-mono font-medium h-7 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                          >
                            <Download className="w-3 h-3 stroke-[1.5]" />
                            Download Invoice
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-400 italic">
                            Pending settlement
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {filteredPayments.length > 0 && (
              <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/60 dark:bg-zinc-950/40 text-xs font-mono">
                <span className="text-[11px] text-zinc-500">
                  Showing {(paymentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(paymentPage * ITEMS_PER_PAGE, filteredPayments.length)} of {filteredPayments.length} transactions (20 per page)
                </span>

                {totalPaymentPages > 1 && (
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => setPaymentPage(p => Math.max(1, p - 1))}
                      disabled={paymentPage === 1}
                      className="h-7 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-850 flex items-center gap-1 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <span className="text-[11px] text-zinc-700 dark:text-zinc-300 font-bold px-2">
                      Page {paymentPage} of {totalPaymentPages}
                    </span>

                    <button
                      onClick={() => setPaymentPage(p => Math.min(totalPaymentPages, p + 1))}
                      disabled={paymentPage === totalPaymentPages}
                      className="h-7 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-850 flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Tax Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  )
}

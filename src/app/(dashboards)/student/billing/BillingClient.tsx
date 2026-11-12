'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, 
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
  ChevronRight,
  ChevronLeft,
  CreditCard,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { RollingCounter } from '@/components/ui/tactile/RollingCounter'
import { CheckoutButton } from './CheckoutButton'
import { InvoiceModal, InvoiceData } from './InvoiceModal'

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

export interface CreditLedgerItem {
  id: string
  user_id: string
  amount: number
  description: string
  created_at: string
}

export interface PaymentRequestItem {
  id: string
  user_id: string
  college_id: string
  amount: number
  status: string
  type: string
  payload?: Record<string, unknown> | null
  razorpay_order_id?: string | null
  razorpay_payment_id?: string | null
  created_at: string
  updated_at?: string
}

export interface StudentBillingProfile {
  id: string
  college_id: string
  access_end_date: string | null
  credit_balance: number
  colleges?: {
    name: string
  } | null
  profile_data?: {
    first_name?: string
    last_name?: string
    full_name?: string
    [key: string]: unknown
  } | null
}

export interface BillingClientProps {
  student: StudentBillingProfile
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
  const candidateName = prof.first_name ? `${prof.first_name} ${prof.last_name || ''}`.trim() : (prof.full_name as string) || 'Candidate'
  const collegeName = student.colleges?.name || 'Placement Network'

  // Access state
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
      name: 'Basic Sprint',
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
      name: 'Pro Placement',
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
      name: 'Campus Maestro',
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

  // Pagination state (10 items per view)
  const ITEMS_PER_PAGE = 10
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
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full min-w-0">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-medium tracking-[-0.02em] text-[#1C1917] dark:text-[#EFECE6]">
              Billing &amp; AI Credit Central
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#12110F] text-[#57534E] dark:text-[#ACA59A] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
              Razorpay Secured
            </span>
          </div>
          <p className="text-xs text-[#78716C] dark:text-[#8A847A] mt-1">
            Manage your annual placement drive pass, AI synthesis token balance, audit logs, and downloadable tax invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePreviewDemoInvoice}
            className="flex items-center gap-1.5 text-xs font-mono text-[#78716C] dark:text-[#8A847A] hover:text-[#1C1917] dark:hover:text-[#EFECE6] px-3 py-1.5 rounded-lg border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] hover:bg-[#FAF8F5] dark:hover:bg-[#12110F] transition cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 stroke-[1.5]" />
            Preview Invoice Template
          </button>

          {isActive ? (
            <span className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-emerald-500/[0.08] dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />
              Placement Pass Active
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-rose-500/[0.08] dark:bg-rose-500/15 border border-rose-500/20 text-rose-700 dark:text-rose-400 font-medium">
              <AlertCircle className="w-3.5 h-3.5 stroke-[1.5]" />
              {isExpired ? 'Pass Expired' : 'Pass Required'}
            </span>
          )}
        </div>
      </div>

      {/* 2-Card Hero Row: Institutional Pass (65%) + Available Credits (35%) */}
      <div className="flex flex-col lg:flex-row gap-4 w-full items-stretch min-w-0">
        
        {/* Card 1: Institutional Placement Pass (~65% space) */}
        <div className="w-full lg:w-[65%] rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/[0.08] dark:bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                  <ShieldCheck className="w-4 h-4 stroke-[1.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium text-[#1C1917] dark:text-[#EFECE6]">
                      Institutional Placement Pass
                    </h2>
                    <span className="text-[11px] font-mono text-[#78716C] dark:text-[#8A847A] hidden sm:inline">· {collegeName}</span>
                  </div>
                  <p className="text-xs text-[#78716C] dark:text-[#8A847A] mt-0.5">
                    Annual clearance for on-campus company drives, 14-stage conveyor tracking, and verified DigiProfile seal.
                  </p>
                </div>
              </div>

              <span className={`text-[11px] font-mono px-2.5 py-1 rounded-md border shrink-0 font-medium ${
                isActive 
                  ? 'bg-emerald-500/[0.08] dark:bg-emerald-500/15 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-500/[0.08] dark:bg-rose-500/15 border-rose-500/20 text-rose-700 dark:text-rose-400'
              }`}>
                {isActive ? 'Active Season' : isExpired ? 'Pass Expired' : 'Pass Required'}
              </span>
            </div>

            {/* Compact Details & Validity Banner */}
            <div className="flex flex-wrap items-center justify-between text-xs font-mono pt-0.5 gap-2">
              <div className="flex items-center gap-2 text-[#78716C] dark:text-[#8A847A]">
                <span className="text-[11px]">Valid Until:</span>
                <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">{formattedExpiry}</span>
                <span className="text-[#1C1917]/[0.2] dark:text-[#EFECE6]/[0.2]">·</span>
                <span className="text-[11px]">Fee:</span>
                <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">₹500 / Year</span>
              </div>

              <div className="text-[11px] text-[#78716C] dark:text-[#8A847A]">
                Includes 150 starter credits
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-[#78716C] dark:text-[#8A847A] font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 stroke-[1.5]" />
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
                  className="bg-[#0F766E] hover:bg-[#0D655E] text-white dark:bg-[#14B8A6] dark:hover:bg-[#0F766E] dark:text-[#12110F] font-medium text-xs h-8 px-4 rounded-lg shadow-[0_1px_2px_rgba(15,118,110,0.2)]"
                />
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/[0.08] dark:bg-emerald-500/15 px-3 py-1 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />
                  Verified Active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Available Credits (~35% space) */}
        <div className="w-full lg:w-[35%] rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 border border-[#0F766E]/20 dark:border-[#14B8A6]/25 flex items-center justify-center text-[#0F766E] dark:text-[#14B8A6] shrink-0">
                  <Zap className="w-4 h-4 stroke-[1.5]" />
                </div>
                <div>
                  <h2 className="text-sm font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    Available Credits
                  </h2>
                  <span className="text-[10px] font-mono text-[#78716C] dark:text-[#8A847A] block">
                    AI Resume &amp; Job Search Fuel
                  </span>
                </div>
              </div>

              {/* Minimalistic Lifetime Stat */}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#12110F] text-[#57534E] dark:text-[#ACA59A] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                Used: {totalSpent} cr
              </span>
            </div>

            {/* Big Balanced Number */}
            <div className="flex items-baseline gap-2 pt-0.5">
              <RollingCounter 
                value={creditBalance} 
                className="text-3xl font-bold text-[#1C1917] dark:text-[#EFECE6]"
              />
              <span className="text-xs font-mono text-[#78716C] dark:text-[#8A847A] uppercase tracking-wider font-medium">Credits Left</span>
            </div>
          </div>

          {/* Actionable Buy CTA */}
          <div className="pt-3 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] mt-3">
            <button
              onClick={() => {
                const el = document.getElementById('topup-packs')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="group w-full h-8 px-3.5 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] text-white dark:bg-[#14B8A6] dark:hover:bg-[#0F766E] dark:text-[#12110F] font-mono text-xs font-medium flex items-center justify-between shadow-[0_1px_2px_rgba(15,118,110,0.2)] transition-all active:scale-[0.98] cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Top Up Credits</span>
              </span>
              <span className="flex items-center gap-1 text-[11px] font-normal transition">
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
            <h2 className="text-base font-medium text-[#1C1917] dark:text-[#EFECE6] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#0F766E] dark:text-[#14B8A6] stroke-[1.5]" />
              AI Credit Top-Up Packs
            </h2>
            <p className="text-xs text-[#78716C] dark:text-[#8A847A] mt-0.5">
              Refuel your account instantly with transparent unit economics and zero hidden platform fees.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#78716C] dark:text-[#8A847A]">
            Instant credit provisioning via Razorpay Webhook
          </span>
        </div>

        {/* 4 Main Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {creditPacks.map((pack) => (
            <div
              key={pack.id}
              className={`rounded-xl border p-5 flex flex-col justify-between transition-all relative ${
                pack.highlight 
                  ? 'border-[#0F766E]/40 dark:border-[#14B8A6]/40 bg-[#0F766E]/[0.03] dark:bg-[#14B8A6]/[0.05] ring-1 ring-[#0F766E]/20 shadow-[0_1px_2px_rgba(15,118,110,0.06)]'
                  : 'border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] hover:border-[#1C1917]/[0.15] dark:hover:border-[#EFECE6]/[0.15] shadow-[0_1px_2px_rgba(28,25,23,0.04)]'
              }`}
            >
              {/* Header: Title + Popular Pill + Discount Tag */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium font-mono text-[#1C1917] dark:text-[#EFECE6]">
                        {pack.name}
                      </span>
                      {pack.popularTag && (
                        <span className={`text-[9px] font-mono font-medium uppercase px-1.5 py-0.2 rounded border ${
                          pack.popularTag === 'Most Purchased'
                            ? 'bg-[#0F766E] text-white border-[#0F766E] dark:bg-[#14B8A6] dark:text-[#12110F] dark:border-[#14B8A6]'
                            : 'bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6] border-[#0F766E]/20'
                        }`}>
                          {pack.popularTag}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium border shrink-0 ${
                    pack.discountTag === 'Base Price'
                      ? 'bg-[#FAF8F5] dark:bg-[#12110F] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[#57534E] dark:text-[#ACA59A]'
                      : 'bg-emerald-500/[0.08] dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  }`}>
                    {pack.discountTag}
                  </span>
                </div>

                {/* Price & Credits Metric */}
                <div className="my-3 space-y-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-mono text-[#1C1917] dark:text-[#EFECE6]">
                      ₹{pack.price}
                    </span>
                    <span className="text-xs text-[#78716C] dark:text-[#8A847A] font-mono">
                      / {pack.credits} credits
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#78716C] dark:text-[#8A847A]">
                    <span>Rate:</span>
                    <strong className="text-[#0F766E] dark:text-[#14B8A6]">{pack.effectiveRate}</strong>
                    <span>({pack.rateSubtext}/cr)</span>
                  </div>
                </div>

                {/* Savings Subtext */}
                <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] leading-relaxed mb-4">
                  {pack.savings}
                </p>
              </div>

              {/* Checkout Action Button */}
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
                className={`w-full text-xs font-mono font-medium h-9 rounded-lg ${
                  pack.highlight 
                    ? 'bg-[#0F766E] hover:bg-[#0D655E] text-white dark:bg-[#14B8A6] dark:hover:bg-[#0F766E] dark:text-[#12110F] shadow-[0_1px_2px_rgba(15,118,110,0.2)]' 
                    : 'bg-white dark:bg-[#141312] border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] hover:bg-[#FAF8F5] dark:hover:bg-[#191816] text-[#1C1917] dark:text-[#EFECE6]'
                }`}
              />
            </div>
          ))}
        </div>

        {/* "Show Comparison" Accordion Trigger */}
        <div className="flex justify-center pt-1">
          <button
            onClick={() => setShowComparison(prev => !prev)}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] hover:bg-[#FAF8F5] dark:hover:bg-[#141312] text-xs font-mono font-medium text-[#1C1917] dark:text-[#EFECE6] shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-all active:scale-[0.98] cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#14B8A6] stroke-[1.5]" />
            <span>{showComparison ? 'Hide Plan Comparison' : 'Show Full Comparison & Maximum Capacities'}</span>
            {showComparison ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#78716C] stroke-[2]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[#78716C] stroke-[2]" />
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
              <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] overflow-x-auto shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
                <table className="w-full text-left text-xs font-mono border-collapse min-w-[680px]">
                  <thead>
                    <tr className="border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F]">
                      <th className="p-4 text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] w-[28%]">
                        Feature / Capacity
                      </th>
                      {creditPacks.map(p => (
                        <th 
                          key={p.id} 
                          className={`p-4 text-center font-medium text-xs ${
                            p.id === 'plan_pro' 
                              ? 'bg-[#0F766E]/[0.04] dark:bg-[#14B8A6]/[0.06] text-[#0F766E] dark:text-[#14B8A6]' 
                              : 'text-[#1C1917] dark:text-[#EFECE6]'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span>{p.name}</span>
                            {p.popularTag && (
                              <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-[#0F766E] text-white dark:bg-[#14B8A6] dark:text-[#12110F] uppercase">
                                {p.popularTag}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C1917]/[0.06] dark:divide-[#EFECE6]/[0.06] text-xs">
                    {/* Row 1: Credits */}
                    <tr className="hover:bg-[#FAF8F5]/50 dark:hover:bg-[#141312]/30">
                      <td className="p-4 font-medium text-[#78716C] dark:text-[#8A847A]">Credits Provided</td>
                      <td className="p-4 text-center text-[#1C1917] dark:text-[#EFECE6] font-medium">500 cr</td>
                      <td className="p-4 text-center text-[#1C1917] dark:text-[#EFECE6] font-medium">1,000 cr</td>
                      <td className="p-4 text-center font-medium text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/[0.03] dark:bg-[#14B8A6]/[0.05]">2,000 cr</td>
                      <td className="p-4 text-center text-[#1C1917] dark:text-[#EFECE6] font-medium">5,000 cr</td>
                    </tr>
                    
                    {/* Row 2: Price */}
                    <tr className="hover:bg-[#FAF8F5]/50 dark:hover:bg-[#141312]/30">
                      <td className="p-4 font-medium text-[#78716C] dark:text-[#8A847A]">Selling Price</td>
                      <td className="p-4 text-center font-medium text-[#1C1917] dark:text-[#EFECE6]">₹100</td>
                      <td className="p-4 text-center font-medium text-[#1C1917] dark:text-[#EFECE6]">₹190</td>
                      <td className="p-4 text-center font-medium text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/[0.03] dark:bg-[#14B8A6]/[0.05]">₹360</td>
                      <td className="p-4 text-center font-medium text-[#1C1917] dark:text-[#EFECE6]">₹800</td>
                    </tr>

                    {/* Row 3: Effective Rate */}
                    <tr className="hover:bg-[#FAF8F5]/50 dark:hover:bg-[#141312]/30">
                      <td className="p-4 font-medium text-[#78716C] dark:text-[#8A847A]">Effective Rate / Credit</td>
                      <td className="p-4 text-center text-[#78716C] dark:text-[#8A847A]">₹0.20 (20 paise)</td>
                      <td className="p-4 text-center text-[#78716C] dark:text-[#8A847A]">₹0.19 (19 paise)</td>
                      <td className="p-4 text-center text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/[0.03] dark:bg-[#14B8A6]/[0.05] font-medium">₹0.18 (18 paise)</td>
                      <td className="p-4 text-center text-emerald-700 dark:text-emerald-400 font-medium">₹0.16 (16 paise)</td>
                    </tr>

                    {/* Row 4: Student Savings */}
                    <tr className="hover:bg-[#FAF8F5]/50 dark:hover:bg-[#141312]/30">
                      <td className="p-4 font-medium text-[#78716C] dark:text-[#8A847A]">Direct Savings</td>
                      <td className="p-4 text-center text-[#78716C] dark:text-[#8A847A]">Base Price</td>
                      <td className="p-4 text-center text-emerald-700 dark:text-emerald-400 font-medium">Save ₹10 (5% OFF)</td>
                      <td className="p-4 text-center text-emerald-700 dark:text-emerald-400 font-medium bg-[#0F766E]/[0.03] dark:bg-[#14B8A6]/[0.05]">Save ₹40 (10% OFF)</td>
                      <td className="p-4 text-center text-emerald-700 dark:text-emerald-400 font-medium">Save ₹200 (20% OFF)</td>
                    </tr>

                    {/* Section Header: Capacities */}
                    <tr className="bg-[#FAF8F5] dark:bg-[#12110F]">
                      <td colSpan={5} className="py-2.5 px-4 text-[11px] font-medium uppercase tracking-wider text-[#78716C] dark:text-[#8A847A]">
                        Maximum Capacities (If Dedicated to That Tool)
                      </td>
                    </tr>

                    {/* Row 5: Max Resumes */}
                    <tr className="hover:bg-[#FAF8F5]/50 dark:hover:bg-[#141312]/30">
                      <td className="p-4">
                        <div className="font-medium text-[#1C1917] dark:text-[#EFECE6]">Max Tailored Resumes</div>
                        <div className="text-[10px] text-[#78716C] dark:text-[#8A847A] font-normal">Full LaTeX ATS documents</div>
                      </td>
                      <td className="p-4 text-center font-medium text-[#1C1917] dark:text-[#EFECE6]">Up to 10 Resumes</td>
                      <td className="p-4 text-center font-medium text-[#1C1917] dark:text-[#EFECE6]">Up to 20 Resumes</td>
                      <td className="p-4 text-center font-medium text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/[0.03] dark:bg-[#14B8A6]/[0.05]">Up to 40 Resumes</td>
                      <td className="p-4 text-center font-medium text-emerald-700 dark:text-emerald-400">Up to 100 Resumes</td>
                    </tr>

                    {/* Row 6: Max Jobs Scanned */}
                    <tr className="hover:bg-[#FAF8F5]/50 dark:hover:bg-[#141312]/30">
                      <td className="p-4">
                        <div className="font-medium text-[#1C1917] dark:text-[#EFECE6]">Max Off-Campus Jobs Scanned</div>
                        <div className="text-[10px] text-[#78716C] dark:text-[#8A847A] font-normal">Deep multi-portal scrapers</div>
                      </td>
                      <td className="p-4 text-center font-medium text-[#1C1917] dark:text-[#EFECE6]">Up to 25 Jobs</td>
                      <td className="p-4 text-center font-medium text-[#1C1917] dark:text-[#EFECE6]">Up to 55 Jobs</td>
                      <td className="p-4 text-center font-medium text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/[0.03] dark:bg-[#14B8A6]/[0.05]">Up to 110 Jobs</td>
                      <td className="p-4 text-center font-medium text-emerald-700 dark:text-emerald-400">Up to 275 Jobs</td>
                    </tr>

                    {/* Row 7: Coverage Horizon */}
                    <tr className="hover:bg-[#FAF8F5]/50 dark:hover:bg-[#141312]/30">
                      <td className="p-4 font-medium text-[#78716C] dark:text-[#8A847A]">Estimated Duration</td>
                      <td className="p-4 text-center text-[#78716C] dark:text-[#8A847A]">1–2 Weeks Refuel</td>
                      <td className="p-4 text-center text-[#78716C] dark:text-[#8A847A]">3–4 Weeks Drive Sprint</td>
                      <td className="p-4 text-center text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/[0.03] dark:bg-[#14B8A6]/[0.05] font-medium">2–3 Months Season</td>
                      <td className="p-4 text-center text-[#1C1917] dark:text-[#EFECE6] font-medium">Full Academic Year</td>
                    </tr>

                    {/* Row 8: Action Checkout */}
                    <tr className="bg-[#FAF8F5] dark:bg-[#12110F]">
                      <td className="p-4 font-medium text-[#78716C] dark:text-[#8A847A]">Instant Checkout</td>
                      {creditPacks.map(p => (
                        <td 
                          key={p.id} 
                          className={`p-4 text-center ${
                            p.id === 'plan_pro' ? 'bg-[#0F766E]/[0.04] dark:bg-[#14B8A6]/[0.06]' : ''
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
                                ? 'bg-[#0F766E] hover:bg-[#0D655E] text-white dark:bg-[#14B8A6] dark:hover:bg-[#0F766E] dark:text-[#12110F] shadow-[0_1px_2px_rgba(15,118,110,0.2)]' 
                                : 'bg-white dark:bg-[#141312] border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] hover:bg-[#FAF8F5] dark:hover:bg-[#191816]'
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

      {/* Dual Ledger System: Credit Usage Log vs. Previous Payments */}
      <div className="space-y-4 pt-4">
        
        {/* Ledger Segmented Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('credits')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium font-mono transition-all cursor-pointer ${
                activeTab === 'credits'
                  ? 'bg-white dark:bg-[#191816] text-[#0F766E] dark:text-[#14B8A6] shadow-[0_1px_2px_rgba(28,25,23,0.06)] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]'
                  : 'text-[#78716C] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Credit Activity &amp; Usage Log</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#1C1917]/[0.06] dark:bg-[#EFECE6]/[0.08] text-[#1C1917] dark:text-[#EFECE6]">
                {creditLedgers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium font-mono transition-all cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-white dark:bg-[#191816] text-[#0F766E] dark:text-[#14B8A6] shadow-[0_1px_2px_rgba(28,25,23,0.06)] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]'
                  : 'text-[#78716C] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Previous Payments</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#1C1917]/[0.06] dark:bg-[#EFECE6]/[0.08] text-[#1C1917] dark:text-[#EFECE6]">
                {paymentRequests.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-[#78716C] dark:text-[#8A847A] font-mono">
            {activeTab === 'credits' 
              ? 'Real-time deduction logs and credit grants'
              : 'Official tax invoices & payment gateway settlements'}
          </div>
        </div>

        {/* TAB 1: CREDIT ACTIVITY & USAGE LOG */}
        {activeTab === 'credits' && (
          <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] overflow-hidden shadow-[0_1px_2px_rgba(28,25,23,0.04)] space-y-0">
            
            {/* Filter & Search Bar */}
            <div className="p-3.5 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F5] dark:bg-[#12110F]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-[#78716C] dark:text-[#8A847A] flex items-center gap-1 mr-1">
                  <Filter className="w-3 h-3 stroke-[1.5]" /> Filter:
                </span>
                
                <button
                  onClick={() => { setCreditFilter('all'); setCreditPage(1); }}
                  className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    creditFilter === 'all'
                      ? 'bg-[#0F766E] text-white dark:bg-[#14B8A6] dark:text-[#12110F] border-[#0F766E] dark:border-[#14B8A6] font-medium'
                      : 'border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] text-[#78716C] dark:text-[#8A847A] hover:bg-[#FAF8F5] dark:hover:bg-[#141312]'
                  }`}
                >
                  All Logs ({creditLedgers.length})
                </button>

                <button
                  onClick={() => { setCreditFilter('deductions'); setCreditPage(1); }}
                  className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                    creditFilter === 'deductions'
                      ? 'bg-rose-500/[0.08] dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20 font-medium'
                      : 'border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] text-[#78716C] dark:text-[#8A847A] hover:bg-[#FAF8F5] dark:hover:bg-[#141312]'
                  }`}
                >
                  <ArrowDownRight className="w-3 h-3 text-rose-500" />
                  Deductions ({creditLedgers.filter(l => l.amount < 0).length})
                </button>

                <button
                  onClick={() => { setCreditFilter('additions'); setCreditPage(1); }}
                  className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                    creditFilter === 'additions'
                      ? 'bg-emerald-500/[0.08] dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-medium'
                      : 'border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] text-[#78716C] dark:text-[#8A847A] hover:bg-[#FAF8F5] dark:hover:bg-[#141312]'
                  }`}
                >
                  <ArrowUpRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Added / Top-Up ({creditLedgers.filter(l => l.amount > 0).length})
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#78716C] dark:text-[#8A847A] absolute left-2.5 top-1/2 -translate-y-1/2 stroke-[1.5]" />
                <input
                  type="text"
                  placeholder="Search activity description..."
                  value={creditSearch}
                  onChange={(e) => { setCreditSearch(e.target.value); setCreditPage(1); }}
                  className="w-full text-xs font-mono pl-8 pr-3 py-1.5 rounded-lg border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] bg-white dark:bg-[#141312] text-[#1C1917] dark:text-[#EFECE6] placeholder:text-[#78716C] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            {/* List Entries */}
            {filteredCreditLedgers.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <p className="text-xs text-[#78716C] dark:text-[#8A847A] font-mono">No credit consumption or grant records match your filter.</p>
                <p className="text-[11px] text-[#78716C]/70 dark:text-[#8A847A]/70">
                  Every time you generate an ATS Resume, crawl off-campus roles, or purchase top-up credits, entries will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#1C1917]/[0.06] dark:divide-[#EFECE6]/[0.06]">
                {paginatedCreditLedgers.map((log) => {
                  const isDeduction = log.amount < 0
                  const isResume = log.description?.toLowerCase().includes('resume')
                  const isSearch = log.description?.toLowerCase().includes('search') || log.description?.toLowerCase().includes('crawl')
                  const isTopup = log.description?.toLowerCase().includes('top-up') || log.description?.toLowerCase().includes('subscription')

                  return (
                    <div 
                      key={log.id} 
                      className="py-2.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[#FAF8F5]/60 dark:hover:bg-[#141312]/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        {/* Icon based on action */}
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                          isDeduction
                            ? 'bg-rose-500/[0.08] dark:bg-rose-500/15 border-rose-500/20 text-rose-700 dark:text-rose-400'
                            : 'bg-emerald-500/[0.08] dark:bg-emerald-500/15 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
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

                        {/* Title and details with timestamp */}
                        <div className="space-y-0.5">
                          <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] block">
                            {log.description || (isDeduction ? 'AI Feature Token Consumption' : 'Credits Added to Account')}
                          </span>
                          <span className="text-[11px] text-[#78716C] dark:text-[#8A847A] font-mono flex items-center gap-1.5" suppressHydrationWarning>
                            <Clock className="w-3 h-3 stroke-[1.5]" />
                            {formatTimestampWithTime(log.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Delta Chip */}
                      <div className="flex items-center gap-3 sm:self-center self-end shrink-0">
                        <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded border flex items-center gap-1 ${
                          isDeduction
                            ? 'bg-rose-500/[0.08] dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20'
                            : 'bg-emerald-500/[0.08] dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                        }`}>
                          {isDeduction ? (
                            <>
                              <ArrowDownRight className="w-3 h-3 stroke-[1.5]" />
                              {log.amount} cr
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3 stroke-[1.5]" />
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
              <div className="p-3 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F5] dark:bg-[#12110F] text-xs font-mono">
                <span className="text-[11px] text-[#78716C] dark:text-[#8A847A]">
                  Showing {(creditPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(creditPage * ITEMS_PER_PAGE, filteredCreditLedgers.length)} of {filteredCreditLedgers.length} records (10 per page)
                </span>

                {totalCreditPages > 1 && (
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => setCreditPage(p => Math.max(1, p - 1))}
                      disabled={creditPage === 1}
                      className="h-7 px-2.5 rounded-md border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] text-[#1C1917] dark:text-[#EFECE6] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF8F5] dark:hover:bg-[#141312] flex items-center gap-1 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>Previous</span>
                    </button>

                    <span className="text-[11px] text-[#1C1917] dark:text-[#EFECE6] font-medium px-2">
                      Page {creditPage} of {totalCreditPages}
                    </span>

                    <button
                      onClick={() => setCreditPage(p => Math.min(totalCreditPages, p + 1))}
                      disabled={creditPage === totalCreditPages}
                      className="h-7 px-2.5 rounded-md border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] text-[#1C1917] dark:text-[#EFECE6] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF8F5] dark:hover:bg-[#141312] flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5 stroke-[1.5]" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FINANCIAL PAYMENT LEDGER & INVOICES */}
        {activeTab === 'payments' && (
          <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] overflow-hidden shadow-[0_1px_2px_rgba(28,25,23,0.04)] space-y-0">
            
            {/* Filter Bar */}
            <div className="p-3.5 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] flex items-center justify-between gap-3 bg-[#FAF8F5] dark:bg-[#12110F]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#78716C] dark:text-[#8A847A] flex items-center gap-1 mr-1">
                  <Filter className="w-3 h-3 stroke-[1.5]" /> Status:
                </span>
                
                <button
                  onClick={() => { setPaymentFilter('all'); setPaymentPage(1); }}
                  className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    paymentFilter === 'all'
                      ? 'bg-[#0F766E] text-white dark:bg-[#14B8A6] dark:text-[#12110F] border-[#0F766E] dark:border-[#14B8A6] font-medium'
                      : 'border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] text-[#78716C] dark:text-[#8A847A] hover:bg-[#FAF8F5] dark:hover:bg-[#141312]'
                  }`}
                >
                  All ({paymentRequests.length})
                </button>

                <button
                  onClick={() => { setPaymentFilter('paid'); setPaymentPage(1); }}
                  className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    paymentFilter === 'paid'
                      ? 'bg-emerald-500/[0.08] dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-medium'
                      : 'border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] text-[#78716C] dark:text-[#8A847A] hover:bg-[#FAF8F5] dark:hover:bg-[#141312]'
                  }`}
                >
                  Paid &amp; Settled ({paymentRequests.filter(p => p.status === 'paid').length})
                </button>

                <button
                  onClick={() => { setPaymentFilter('pending'); setPaymentPage(1); }}
                  className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    paymentFilter === 'pending'
                      ? 'bg-amber-500/[0.08] dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20 font-medium'
                      : 'border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] text-[#78716C] dark:text-[#8A847A] hover:bg-[#FAF8F5] dark:hover:bg-[#141312]'
                  }`}
                >
                  Pending / Failed ({paymentRequests.filter(p => p.status !== 'paid').length})
                </button>
              </div>

              <span className="text-[11px] font-mono text-[#78716C] dark:text-[#8A847A]">
                GST Compliant Invoices
              </span>
            </div>

            {/* List Payment Records */}
            {filteredPayments.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="text-xs text-[#78716C] dark:text-[#8A847A] font-mono">No financial transactions recorded for this account.</p>
                <button
                  onClick={handlePreviewDemoInvoice}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-[#0F766E] dark:text-[#14B8A6] hover:underline cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5 stroke-[1.5]" />
                  Click to Preview Standard Tax Invoice Format
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#1C1917]/[0.06] dark:divide-[#EFECE6]/[0.06]">
                {paginatedPayments.map((tx) => {
                  const isPaid = tx.status === 'paid'
                  const isSub = tx.type === 'subscription'

                  return (
                    <div 
                      key={tx.id} 
                      className="py-2.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF8F5]/60 dark:hover:bg-[#141312]/40 transition"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs text-[#1C1917] dark:text-[#EFECE6]">
                            {isSub ? '12 Months Placement Access Pass' : 'AI Intelligence Credit Top-Up'}
                          </span>
                          <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border font-medium ${
                            isPaid
                              ? 'bg-emerald-500/[0.08] dark:bg-emerald-500/15 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                              : tx.status === 'failed'
                              ? 'bg-rose-500/[0.08] dark:bg-rose-500/15 border-rose-500/20 text-rose-700 dark:text-rose-400'
                              : 'bg-amber-500/[0.08] dark:bg-amber-500/15 border-amber-500/20 text-amber-700 dark:text-amber-400'
                          }`}>
                            {tx.status || 'pending'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-[#78716C] dark:text-[#8A847A] font-mono" suppressHydrationWarning>
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
                        <span className="font-mono font-medium text-xs text-[#1C1917] dark:text-[#EFECE6]">
                          ₹{tx.amount}
                        </span>

                        {isPaid ? (
                          <button
                            onClick={() => handleOpenInvoice(tx)}
                            className="flex items-center gap-1.5 text-xs font-mono font-medium h-7 px-2.5 rounded-md border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] text-[#1C1917] dark:text-[#EFECE6] hover:bg-[#FAF8F5] dark:hover:bg-[#141312] hover:border-[#0F766E]/40 transition cursor-pointer"
                          >
                            <Download className="w-3 h-3 stroke-[1.5]" />
                            Download Invoice
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-[#78716C] italic">
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
              <div className="p-3 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F5] dark:bg-[#12110F] text-xs font-mono">
                <span className="text-[11px] text-[#78716C] dark:text-[#8A847A]">
                  Showing {(paymentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(paymentPage * ITEMS_PER_PAGE, filteredPayments.length)} of {filteredPayments.length} transactions (10 per page)
                </span>

                {totalPaymentPages > 1 && (
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => setPaymentPage(p => Math.max(1, p - 1))}
                      disabled={paymentPage === 1}
                      className="h-7 px-2.5 rounded-md border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] text-[#1C1917] dark:text-[#EFECE6] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF8F5] dark:hover:bg-[#141312] flex items-center gap-1 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>Previous</span>
                    </button>

                    <span className="text-[11px] text-[#1C1917] dark:text-[#EFECE6] font-medium px-2">
                      Page {paymentPage} of {totalPaymentPages}
                    </span>

                    <button
                      onClick={() => setPaymentPage(p => Math.min(totalPaymentPages, p + 1))}
                      disabled={paymentPage === totalPaymentPages}
                      className="h-7 px-2.5 rounded-md border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] text-[#1C1917] dark:text-[#EFECE6] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF8F5] dark:hover:bg-[#141312] flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5 stroke-[1.5]" />
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

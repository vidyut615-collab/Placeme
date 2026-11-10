'use client'

import React, { useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { 
  Printer, 
  Download, 
  ShieldCheck, 
  Building2, 
  User, 
  Calendar, 
  Receipt, 
  CheckCircle2, 
  Hash, 
  CreditCard,
  QrCode,
  FileCheck
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export interface InvoiceData {
  id: string
  invoiceNumber: string
  date: string
  type: 'subscription' | 'credit_topup' | string
  amount: number // in INR
  status: string
  razorpayOrderId?: string | null
  razorpayPaymentId?: string | null
  candidateName: string
  candidateEmail: string
  collegeName: string
  payload?: any
}

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: InvoiceData | null
}

export function InvoiceModal({ isOpen, onClose, invoice }: InvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!invoice) return null

  // Calculate GST Breakdown (18% GST inclusive standard for IT/EdTech SaaS in India)
  // Base = Amount / 1.18
  // Total Tax = Amount - Base
  // CGST (9%) = Total Tax / 2
  // SGST (9%) = Total Tax / 2
  const grossAmount = invoice.amount || 0
  const baseAmount = Math.round((grossAmount / 1.18) * 100) / 100
  const totalTax = Math.round((grossAmount - baseAmount) * 100) / 100
  const cgst = Math.round((totalTax / 2) * 100) / 100
  const sgst = Math.round((totalTax - cgst) * 100) / 100

  const isSubscription = invoice.type === 'subscription'
  const itemName = isSubscription 
    ? 'Annual Campus Placement Access Pass (12 Months Institutional Access)'
    : `AI Intelligence Credit Top-Up Pack (${invoice.payload?.credits_included || 'Pack'} Credits)`

  const itemDescription = isSubscription
    ? 'Access to campus recruitment drives, verified application conveyor, DigiProfile authorization seal, and 150 starter AI synthesis tokens.'
    : 'On-demand AI tokens for LaTeX Resume generation, deep web company scrapers, and outreach automation.'

  const handlePrint = () => {
    window.print()
  }

  // Format short hash for digital verification
  const verificationHash = (invoice.razorpayPaymentId || invoice.id).replace(/[^a-zA-Z0-9]/g, '').slice(-12).toUpperCase()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl rounded-2xl print:shadow-none print:border-none print:max-w-none print:p-0">
        
        {/* Modal Top Control Bar (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/50 print:hidden sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-zinc-600 dark:text-zinc-400 stroke-[1.5]" />
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
              Tax Invoice & Payment Receipt
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 font-medium">
              Verified
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs font-mono font-medium border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 stroke-[1.5]" />
              Print / Save PDF
            </Button>
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Close
            </Button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div ref={printRef} className="p-8 sm:p-10 space-y-8 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans print:p-6 print:text-black print:bg-white">
          
          {/* Header & Company Details */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-zinc-200/80 dark:border-zinc-800/80">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center font-black font-mono text-sm shadow-xs">
                  P
                </div>
                <div>
                  <h1 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
                    Placeme Technologies Private Limited
                  </h1>
                  <span className="text-[10px] text-zinc-500 font-mono block">
                    Campus Placement Automation & Student Intelligence Network
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono space-y-0.5 pt-2">
                <p>Cyber Gateway, Phase II, Hitech City</p>
                <p>Hyderabad, Telangana, 500081, India</p>
                <p><span className="font-semibold text-zinc-700 dark:text-zinc-300">GSTIN:</span> 36AAPCP9872F1ZV &nbsp;|&nbsp; <span className="font-semibold text-zinc-700 dark:text-zinc-300">PAN:</span> AAPCP9872F</p>
                <p><span className="font-semibold text-zinc-700 dark:text-zinc-300">CIN:</span> U72900TG2024PTC189021 &nbsp;|&nbsp; State Code: 36 (Telangana)</p>
              </div>
            </div>

            <div className="sm:text-right space-y-2">
              <div className="inline-block px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80">
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">TAX INVOICE</span>
                <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  {invoice.invoiceNumber}
                </span>
              </div>

              <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 space-y-0.5">
                <p><span className="text-zinc-400 dark:text-zinc-500">Date:</span> {formatDate(invoice.date)}</p>
                <p><span className="text-zinc-400 dark:text-zinc-500">Place of Supply:</span> Telangana (36)</p>
                <p className="flex items-center sm:justify-end gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3 stroke-[1.5]" />
                  <span>Payment Captured</span>
                </p>
              </div>
            </div>
          </div>

          {/* Billed To Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                Billed To (Candidate)
              </span>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {invoice.candidateName || 'Enrolled Student Candidate'}
              </p>
              <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                {invoice.candidateEmail}
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 pt-0.5">
                <Building2 className="w-3 h-3 text-zinc-400 stroke-[1.5]" />
                <span>{invoice.collegeName}</span>
              </p>
            </div>

            <div className="space-y-1 sm:border-l sm:border-zinc-200/80 dark:sm:border-zinc-800 sm:pl-6">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                Payment & Gateway Settlement
              </span>
              <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 space-y-1">
                <div>
                  <span className="text-zinc-400 dark:text-zinc-500">Gateway:</span> Razorpay Payments India Ltd.
                </div>
                <div>
                  <span className="text-zinc-400 dark:text-zinc-500">Payment ID:</span>{' '}
                  <span className="text-zinc-800 dark:text-zinc-200 font-semibold">
                    {invoice.razorpayPaymentId || 'pay_online_settled'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 dark:text-zinc-500">Order ID:</span>{' '}
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {invoice.razorpayOrderId || 'ord_' + invoice.id.slice(0, 8)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100/80 dark:bg-zinc-900/80 border-b border-zinc-200/80 dark:border-zinc-800/80 text-[10px] font-mono uppercase text-zinc-500">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">#</th>
                  <th className="py-2.5 px-4 font-semibold">Description of Service</th>
                  <th className="py-2.5 px-4 font-semibold">SAC Code</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Qty</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Unit Rate (INR)</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Taxable Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 font-mono text-[11px]">
                <tr>
                  <td className="py-3 px-4 text-zinc-400">01</td>
                  <td className="py-3 px-4 font-sans">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{itemName}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal mt-0.5">{itemDescription}</p>
                  </td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">998314</td>
                  <td className="py-3 px-4 text-right text-zinc-700 dark:text-zinc-300">1</td>
                  <td className="py-3 px-4 text-right text-zinc-700 dark:text-zinc-300">₹{baseAmount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-zinc-900 dark:text-zinc-100">₹{baseAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
            <div className="space-y-2 max-w-sm">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                Applicable Tax Notes
              </span>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">
                Electronic software services classified under SAC 998314. Central GST (CGST) @ 9% and State GST (SGST) @ 9% applied pursuant to Chapter V of the Finance Act.
              </p>
              
              <div className="flex items-center gap-2 pt-2">
                <div className="w-10 h-10 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-zinc-400 dark:text-zinc-500 stroke-[1.2]" />
                </div>
                <div className="text-[10px] font-mono text-zinc-400">
                  <p>IRN & Digital Auth</p>
                  <p className="text-zinc-600 dark:text-zinc-300 font-semibold">{verificationHash}</p>
                </div>
              </div>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400">
                <span>Taxable Amount</span>
                <span>₹{baseAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400">
                <span>CGST (9.0%)</span>
                <span>₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400">
                <span>SGST (9.0%)</span>
                <span>₹{sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b-2 border-zinc-900 dark:border-zinc-100 font-bold text-sm text-zinc-900 dark:text-zinc-50">
                <span>Total Amount Paid</span>
                <span>₹{grossAmount.toFixed(2)}</span>
              </div>
              <span className="text-[10px] text-zinc-400 block text-right font-normal">
                Inclusive of all taxes
              </span>
            </div>
          </div>

          {/* Footer & Digital Authorization Stamp */}
          <div className="pt-6 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[1.5]" />
              <span>Computer generated tax receipt. Authenticated via Placeme Digital Gateway.</span>
            </div>

            <div className="text-right text-[10px] font-mono text-zinc-400">
              Page 1 of 1 &nbsp;|&nbsp; Support: support@placeme.in
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}

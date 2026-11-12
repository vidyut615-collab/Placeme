'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard, Sparkles, Zap } from 'lucide-react'
import { createSubscriptionOrder, createCreditTopupOrder } from './actions'
import { toast } from 'sonner'

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayOptions {
  key?: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpaySuccessResponse) => void
  prefill: {
    name: string
    email: string
    contact: string
  }
  theme: {
    color: string
  }
  modal: {
    ondismiss: () => void
  }
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void
    }
  }
}

interface CheckoutButtonProps {
  type: 'subscription' | 'credit_topup'
  amount?: number // INR
  planId?: string
  credits?: number
  label?: string
  variant?: 'default' | 'outline' | 'secondary'
  className?: string
  disabled?: boolean
  userName?: string
  userEmail?: string
  icon?: 'card' | 'zap' | 'sparkles'
}

export function CheckoutButton({ 
  type, 
  amount, 
  planId, 
  credits, 
  label = "Pay Now", 
  variant = "default",
  className,
  disabled,
  userName,
  userEmail,
  icon = 'card'
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePayment = async () => {
    setIsLoading(true)

    try {
      const res = await loadRazorpayScript()
      if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?')
        setIsLoading(false)
        return
      }

      // 1. Create Order on our Secure Server
      let orderResponse: { orderId?: string; amount?: number; error?: string }
      if (type === 'subscription') {
        orderResponse = await createSubscriptionOrder()
      } else {
        if (!planId || !amount || !credits) {
          throw new Error("Missing plan details")
        }
        orderResponse = await createCreditTopupOrder(planId, amount, credits)
      }

      if (orderResponse.error || !orderResponse.orderId || !orderResponse.amount) {
        toast.error(orderResponse.error || 'Failed to initialize payment')
        setIsLoading(false)
        return
      }

      // 2. Open Razorpay Checkout Modal
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderResponse.amount, 
        currency: "INR",
        name: "Placeme",
        description: type === 'subscription' ? "12 Months Placement Access Pass" : `AI Intelligence Top-up (${credits} Credits)`,
        order_id: orderResponse.orderId,
        handler: function () {
          toast.success('Payment captured successfully!', {
            description: 'Your balance and access pass are updated. Reloading ledger...'
          })
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        },
        prefill: {
          name: userName || "Student Candidate",
          email: userEmail || "",
          contact: ""
        },
        theme: {
          color: "#0F766E"
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false)
          }
        }
      }

      if (!window.Razorpay) {
        toast.error('Razorpay SDK not found.')
        setIsLoading(false)
        return
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Checkout initiation failed'
      toast.error(message)
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading || disabled}
      variant={variant}
      className={`relative inline-flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer ${className || ''}`}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : icon === 'zap' ? (
        <Zap className="w-3.5 h-3.5 stroke-[1.5]" />
      ) : icon === 'sparkles' ? (
        <Sparkles className="w-3.5 h-3.5 stroke-[1.5]" />
      ) : (
        <CreditCard className="w-3.5 h-3.5 stroke-[1.5]" />
      )}
      <span>{isLoading ? 'Processing...' : label}</span>
    </Button>
  )
}

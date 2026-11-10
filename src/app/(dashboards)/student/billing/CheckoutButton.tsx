'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard, Sparkles, Zap } from 'lucide-react'
import { createSubscriptionOrder, createCreditTopupOrder } from './actions'
import { toast } from 'sonner'

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
      let orderResponse
      if (type === 'subscription') {
        orderResponse = await createSubscriptionOrder()
      } else {
        if (!planId || !amount || !credits) {
          throw new Error("Missing plan details")
        }
        orderResponse = await createCreditTopupOrder(planId, amount, credits)
      }

      if (orderResponse.error) {
        toast.error(orderResponse.error)
        setIsLoading(false)
        return
      }

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderResponse.amount, 
        currency: "INR",
        name: "Placeme",
        description: type === 'subscription' ? "12 Months Placement Access Pass" : `AI Intelligence Top-up (${credits} Credits)`,
        order_id: orderResponse.orderId,
        handler: function (response: any) {
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
          color: "#09090b"
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false)
          }
        }
      }

      const rzp = new (window as any).Razorpay(options)
      
      rzp.on('payment.failed', function (response: any) {
        toast.error('Payment failed or cancelled', {
          description: response.error?.description || 'Transaction could not be completed.'
        })
        setIsLoading(false)
      })

      rzp.open()
      
    } catch (error: any) {
      console.error(error)
      toast.error('An error occurred during payment initiation.')
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handlePayment} 
      disabled={isLoading || disabled} 
      variant={variant}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
      ) : icon === 'zap' ? (
        <Zap className="mr-2 h-3.5 w-3.5 stroke-[1.5]" />
      ) : icon === 'sparkles' ? (
        <Sparkles className="mr-2 h-3.5 w-3.5 stroke-[1.5]" />
      ) : (
        <CreditCard className="mr-2 h-3.5 w-3.5 stroke-[1.5]" />
      )}
      {isLoading ? 'Connecting...' : label}
    </Button>
  )
}

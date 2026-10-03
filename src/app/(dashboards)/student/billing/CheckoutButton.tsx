'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard } from 'lucide-react'
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
}

export function CheckoutButton({ 
  type, 
  amount, 
  planId, 
  credits, 
  label = "Pay Now", 
  variant = "default",
  className,
  disabled
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
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Use test key
        amount: orderResponse.amount, 
        currency: "INR",
        name: "Placeme",
        description: type === 'subscription' ? "12 Months Placement Access" : "AI Credit Top-up",
        order_id: orderResponse.orderId,
        handler: function (response: any) {
          toast.success('Payment successful!', {
            description: 'Your account is being updated. Refreshing in a moment...'
          })
          setTimeout(() => {
            window.location.reload()
          }, 2500)
        },
        prefill: {
          name: "Student", // We could prefill actual names if passed down
          email: "",
          contact: ""
        },
        theme: {
          color: "#2563eb" // blue-600
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false)
          }
        }
      }

      const rzp = new (window as any).Razorpay(options)
      
      rzp.on('payment.failed', function (response: any) {
        toast.error('Payment failed', {
          description: response.error.description
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
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="mr-2 h-4 w-4" />
      )}
      {isLoading ? 'Processing...' : label}
    </Button>
  )
}

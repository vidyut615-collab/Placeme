'use server'

import Razorpay from 'razorpay'
import { createClient } from '@/utils/supabase/server'

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
})

export async function createSubscriptionOrder() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    // 1. Fetch the student's college to get the college-specific subscription fee
    const { data: student } = await supabase
      .from('students')
      .select('college_id, colleges(name)')
      .eq('user_id', user.id)
      .single()
      
    if (!student) throw new Error('Student profile not found')
    
    const college = student.colleges as any
    // Fallback to 500 INR if college hasn't set a fee
    const feeAmountINR = 500
    
    // 2. Create order on Razorpay
    const options = {
      amount: feeAmountINR * 100, // Razorpay works in paise (1 INR = 100 paise)
      currency: "INR",
      receipt: `rcpt_sub_${user.id.substring(0, 8)}_${Date.now()}`,
    }

    const order = await razorpay.orders.create(options)

    // 3. Save the pending order in our database
    await supabase.from('payment_requests').insert({
      user_id: user.id,
      college_id: student.college_id,
      razorpay_order_id: order.id,
      amount: feeAmountINR,
      type: 'subscription',
      status: 'pending',
      payload: {
        extension_months: 12, // Grant 1 year of access
        credits_included: 50 // Give 50 AI credits as a welcome bonus
      }
    })

    return { orderId: order.id, amount: options.amount }

  } catch (error: any) {
    console.error("Order creation failed:", error)
    return { error: error.message || 'Failed to create order' }
  }
}

export async function createCreditTopupOrder(planId: string, amountInr: number, credits: number) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: student } = await supabase
      .from('students')
      .select('college_id')
      .eq('user_id', user.id)
      .single()

    if (!student) throw new Error('Student not found')

    const options = {
      amount: amountInr * 100,
      currency: "INR",
      receipt: `rcpt_crd_${user.id.substring(0, 8)}_${Date.now()}`,
    }

    const order = await razorpay.orders.create(options)

    await supabase.from('payment_requests').insert({
      user_id: user.id,
      college_id: student.college_id,
      razorpay_order_id: order.id,
      amount: amountInr,
      type: 'credit_topup',
      status: 'pending',
      payload: {
        credits_included: credits
      }
    })

    return { orderId: order.id, amount: options.amount }

  } catch (error: any) {
    console.error("Credit order creation failed:", error)
    return { error: error.message || 'Failed to create credit topup order' }
  }
}

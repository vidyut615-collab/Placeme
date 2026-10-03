import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!secret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not set')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(rawBody)
    const { event: eventName, payload } = event

    // Connect to Supabase using Service Role to bypass RLS for webhook updates
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (eventName === 'payment.captured') {
      const paymentEntity = payload.payment.entity
      const orderId = paymentEntity.order_id

      if (!orderId) {
        return NextResponse.json({ error: 'No order ID in payload' }, { status: 400 })
      }

      // 1. Fetch the payment request
      const { data: request, error: reqError } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('razorpay_order_id', orderId)
        .single()

      if (reqError || !request) {
        return NextResponse.json({ error: 'Payment request not found' }, { status: 404 })
      }

      // Idempotency check: if already paid, ignore
      if (request.status === 'paid') {
        return NextResponse.json({ status: 'already processed' })
      }

      // 2. Update payment request status
      await supabase
        .from('payment_requests')
        .update({ 
          status: 'paid', 
          razorpay_payment_id: paymentEntity.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id)

      // 3. Process the payload (grant access and credits)
      const actionPayload = request.payload || {}
      
      const { data: student } = await supabase
        .from('students')
        .select('access_end_date, credit_balance')
        .eq('user_id', request.user_id)
        .single()

      if (student) {
        const updateData: any = {}
        
        // Handle Expiry Extension
        if (actionPayload.extension_months) {
          const currentExpiry = student.access_end_date ? new Date(student.access_end_date) : new Date()
          // Start from today if expired
          const baseDate = currentExpiry < new Date() ? new Date() : currentExpiry
          baseDate.setMonth(baseDate.getMonth() + actionPayload.extension_months)
          updateData.access_end_date = baseDate.toISOString()
        } else if (actionPayload.fixed_expiry) {
          updateData.access_end_date = actionPayload.fixed_expiry
        }

        // Handle Credits
        if (actionPayload.credits_included) {
          updateData.credit_balance = (student.credit_balance || 0) + actionPayload.credits_included
          
          // Audit log for credits
          await supabase.from('credit_ledgers').insert({
            user_id: request.user_id,
            amount: actionPayload.credits_included,
            description: request.type === 'credit_topup' ? 'Purchased Credit Top-up' : 'Credits from Subscription Plan'
          })
        }

        if (Object.keys(updateData).length > 0) {
          await supabase
            .from('students')
            .update(updateData)
            .eq('user_id', request.user_id)
        }
      }

      return NextResponse.json({ status: 'ok' })

    } else if (eventName === 'payment.failed') {
      const paymentEntity = payload.payment.entity
      const orderId = paymentEntity.order_id

      if (orderId) {
        await supabase
          .from('payment_requests')
          .update({ 
            status: 'failed', 
            updated_at: new Date().toISOString() 
          })
          .eq('razorpay_order_id', orderId)
      }
      return NextResponse.json({ status: 'ok' })
    }

    // Unhandled events
    return NextResponse.json({ status: 'ignored' })

  } catch (error: any) {
    console.error('Webhook Error:', error.message)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

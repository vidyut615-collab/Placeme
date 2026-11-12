import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { BillingClient, StudentBillingProfile, CreditLedgerItem, PaymentRequestItem } from './BillingClient'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'student') {
    redirect('/login')
  }

  // Fetch student profile, college, and credit balances
  const { data: student } = await supabase
    .from('students')
    .select(`
      id,
      college_id,
      access_end_date,
      credit_balance,
      profile_data,
      colleges (
        name
      )
    `)
    .eq('user_id', user.id)
    .single()

  if (!student) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-[#78716C] dark:text-[#8A847A] font-mono text-xs border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] rounded-xl p-6 bg-white dark:bg-[#191816]">
          Unable to locate student billing profile. Please contact placement cell support.
        </div>
      </div>
    )
  }

  // Fetch financial payments (real INR transactions)
  const { data: paymentHistory } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch credit ledger audit trail (deductions & credit additions)
  const { data: creditLedgers } = await supabase
    .from('credit_ledgers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <BillingClient
      student={student as unknown as StudentBillingProfile}
      userEmail={user.email || ''}
      creditLedgers={(creditLedgers || []) as CreditLedgerItem[]}
      paymentRequests={(paymentHistory || []) as PaymentRequestItem[]}
    />
  )
}

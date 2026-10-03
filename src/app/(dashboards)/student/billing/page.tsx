import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle, Clock, Zap, Coins } from 'lucide-react'
import { CheckoutButton } from './CheckoutButton'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'student') {
    redirect('/login')
  }

  // Fetch student profile, college, and payment history
  const { data: student } = await supabase
    .from('students')
    .select(`
      id,
      college_id,
      access_end_date,
      credit_balance,
      colleges (
        name
      )
    `)
    .eq('user_id', user.id)
    .single()

  if (!student) {
    return <div>Error loading profile.</div>
  }

  const { data: paymentHistory } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const college = student.colleges as any
  const subscriptionFee = 500 // Will be made dynamic in Phase 5

  // Calculate access state
  const isNeverPaid = !student.access_end_date
  const isExpired = student.access_end_date && new Date(student.access_end_date) < new Date()
  const isActive = student.access_end_date && new Date(student.access_end_date) >= new Date()

  // Format date safely
  const formattedExpiry = student.access_end_date 
    ? new Date(student.access_end_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Not Active'

  // Mocking credit plans for now (Phase 5 will make these DB-driven globally)
  const creditPlans = [
    { id: 'plan_small', name: 'Starter Pack', credits: 20, price: 99 },
    { id: 'plan_medium', name: 'Pro Pack', credits: 50, price: 199 },
    { id: 'plan_large', name: 'Power Pack', credits: 150, price: 499 },
  ]

  return (
    <div className="flex flex-1 flex-col p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Plans</h1>
        <p className="text-zinc-500 mt-2">
          Manage your placement portal access, view your AI credit balance, and download past invoices.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Subscription Status Card */}
        <Card className={isActive ? 'border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20' : 'border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/20'}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">Platform Access</CardTitle>
                <CardDescription className="mt-1">Annual Subscription for Placement Drives</CardDescription>
              </div>
              {isActive ? (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {isExpired ? 'Expired' : 'Unpaid'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-zinc-500">Valid Until</span>
              <span className={`text-2xl font-bold ${isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-600 dark:text-red-400'}`}>
                {formattedExpiry}
              </span>
            </div>
            {!isActive && (
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-md border text-sm">
                Unlock full access to apply for campus jobs, build your DigiProfile, and use AI tools.
                <div className="mt-3 font-semibold text-lg">₹{subscriptionFee} / year</div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            {!isActive ? (
              <CheckoutButton 
                type="subscription" 
                label={`Pay ₹${subscriptionFee} to Unlock`}
                className="w-full bg-blue-600 hover:bg-blue-700"
              />
            ) : (
              <Button variant="outline" className="w-full" disabled>
                Subscription Active
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* AI Credits Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">AI Credit Balance</CardTitle>
                <CardDescription className="mt-1">Used for AI Resume Maker & Mock Interviews</CardDescription>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-full text-purple-600 dark:text-purple-400">
                <Zap className="w-5 h-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                {student.credit_balance || 0}
              </span>
              <span className="text-zinc-500 font-medium mb-1">credits remaining</span>
            </div>
          </CardContent>
          <CardFooter className="bg-zinc-50 dark:bg-zinc-900/50 border-t flex-col items-start gap-4 p-6">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Coins className="w-4 h-4" /> Top up Credits
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              {creditPlans.map(plan => (
                <div key={plan.id} className="border bg-white dark:bg-zinc-950 p-3 rounded-lg flex flex-col items-center justify-between text-center gap-3">
                  <div>
                    <div className="font-bold text-sm">{plan.credits} Credits</div>
                    <div className="text-xs text-zinc-500">{plan.name}</div>
                  </div>
                  <CheckoutButton 
                    type="credit_topup"
                    planId={plan.id}
                    credits={plan.credits}
                    amount={plan.price}
                    label={`₹${plan.price}`}
                    variant="outline"
                    className="w-full h-8 text-xs font-semibold hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
                  />
                </div>
              ))}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Payment History */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Payment History</h3>
        <Card>
          {(!paymentHistory || paymentHistory.length === 0) ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No previous transactions found.
            </div>
          ) : (
            <div className="divide-y">
              {paymentHistory.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {tx.type === 'subscription' ? '12 Months Placement Access' : 'AI Credit Top-up'}
                    </span>
                    <span className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(tx.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-sm">₹{tx.amount}</span>
                    <Badge variant={tx.status === 'paid' ? 'default' : tx.status === 'failed' ? 'destructive' : 'secondary'} className={tx.status === 'paid' ? 'bg-emerald-500' : ''}>
                      {tx.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setupPassword, completeOnboarding } from './actions'
import { Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [onboardingFields, setOnboardingFields] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      if (user.app_metadata?.onboarding_complete) {
        router.push('/')
        return
      }

      setRole(user.app_metadata?.role || null)
      setEmail(user.email || '')
      
      if (user.app_metadata?.role === 'student' && user.app_metadata?.college_id) {
        const { data: college } = await supabase
          .from('colleges')
          .select('onboarding_fields')
          .eq('id', user.app_metadata.college_id)
          .single()
          
        if (college?.onboarding_fields) {
          setOnboardingFields(college.onboarding_fields)
        }
      }
      
      setLoading(false)
    }
    getUser()
  }, [supabase, router])

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    const res = await setupPassword(formData)
    if (res.error) {
      setError(res.error)
    } else {
      setStep(2)
    }
    setSubmitting(false)
  }

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    const res = await completeOnboarding(formData)
    if (res.error) {
      setError(res.error)
      setSubmitting(false)
    } else {
      // Reload the page so middleware picks up the new app_metadata and routes properly
      window.location.href = '/'
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg border border-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
        
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {step === 1 ? 'Set Your Password' : 'Complete Your Profile'}
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            {step === 1 
              ? 'Welcome to Placeme. Please set a secure password for your account.' 
              : 'Just a few more details before we set up your dashboard.'}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-6 mt-6">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} disabled className="mt-1 bg-zinc-100 text-zinc-500" />
            </div>
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input id="password" name="password" type="password" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required className="mt-1" />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Password
            </Button>
          </form>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-6 mt-6">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" name="fullName" required className="mt-1" placeholder="John Doe" />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input id="phone" name="phone" type="tel" className="mt-1" placeholder="+1 (555) 000-0000" />
            </div>

            {role === 'student' && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="gpa">Current GPA (Optional)</Label>
                  <Input id="gpa" name="gpa" type="number" step="0.01" min="0" max="10" className="mt-1" placeholder="3.8" />
                </div>
                
                {onboardingFields?.years && onboardingFields.years.length > 0 && (
                  <div>
                    <Label htmlFor="year">Graduation Year</Label>
                    <select id="year" name="year" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors mt-1">
                      <option value="">Select Year...</option>
                      {onboardingFields.years.map((y: string) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                )}

                {onboardingFields?.types && onboardingFields.types.length > 0 && (
                  <div>
                    <Label htmlFor="type">Degree Type</Label>
                    <select id="type" name="type" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors mt-1">
                      <option value="">Select Type...</option>
                      {onboardingFields.types.map((t: string) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}

                {onboardingFields?.departments && onboardingFields.departments.length > 0 && (
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <select id="department" name="department" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors mt-1">
                      <option value="">Select Department...</option>
                      {onboardingFields.departments.map((d: string) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
                
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-md font-medium mb-4">Academic Details (Optional for now)</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2 mb-4">
                    <div>
                      <Label htmlFor="academic_10th">10th Percentage</Label>
                      <Input id="academic_10th" name="academic_10th" type="number" step="0.01" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="academic_12th">12th Percentage</Label>
                      <Input id="academic_12th" name="academic_12th" type="number" step="0.01" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="diploma_percentage">Diploma % (if any)</Label>
                      <Input id="diploma_percentage" name="diploma_percentage" type="number" step="0.01" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="graduation_percentage">Graduation %</Label>
                      <Input id="graduation_percentage" name="graduation_percentage" type="number" step="0.01" className="mt-1" />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="active_backlogs">Active Backlogs</Label>
                      <Input id="active_backlogs" name="active_backlogs" type="number" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="historical_backlogs">Historical Backlogs</Label>
                      <Input id="historical_backlogs" name="historical_backlogs" type="number" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="academic_gap_years">Academic Gap (Yrs)</Label>
                      <Input id="academic_gap_years" name="academic_gap_years" type="number" className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Complete Onboarding
            </Button>
          </form>
        )}

      </div>
    </div>
  )
}

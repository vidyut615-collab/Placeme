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
            <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm mb-4">
              Please enter your current legal name as it appears on official documents.
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                <Input id="firstName" name="firstName" required className="mt-1" placeholder="John" />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                <Input id="lastName" name="lastName" required className="mt-1" placeholder="Doe" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="middleName">Middle Name (Optional)</Label>
                <Input id="middleName" name="middleName" className="mt-1" placeholder="Michael" />
              </div>
            </div>

            {role === 'student' && (
              <div className="space-y-6 pt-2">
                {onboardingFields?.years && onboardingFields.years.length > 0 && (
                  <div>
                    <Label htmlFor="year">Graduation Year <span className="text-red-500">*</span></Label>
                    <select id="year" name="year" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors mt-1">
                      <option value="">Select Year...</option>
                      {onboardingFields.years.map((y: string) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                )}

                {onboardingFields?.types && onboardingFields.types.length > 0 && (
                  <div>
                    <Label htmlFor="type">Degree Type <span className="text-red-500">*</span></Label>
                    <select id="type" name="type" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors mt-1">
                      <option value="">Select Type...</option>
                      {onboardingFields.types.map((t: string) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}

                {onboardingFields?.departments && onboardingFields.departments.length > 0 && (
                  <div>
                    <Label htmlFor="department">Department <span className="text-red-500">*</span></Label>
                    <select id="department" name="department" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors mt-1">
                      <option value="">Select Department...</option>
                      {onboardingFields.departments.map((d: string) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
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

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { setupPassword, completeOnboarding } from './actions'
import { Loader2, Building2, Shield, User } from 'lucide-react'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [collegeName, setCollegeName] = useState<string | null>(null)
  const [onboardingFields, setOnboardingFields] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      if (user.app_metadata?.onboarding_complete) {
        router.push('/')
        return
      }

      const userRole = user.app_metadata?.role || null
      setRole(userRole)
      setEmail(user.email || '')

      const collegeId = user.app_metadata?.college_id
      if (collegeId) {
        const { data: college } = await supabase
          .from('colleges')
          .select('name, onboarding_fields')
          .eq('id', collegeId)
          .maybeSingle()

        if (college) {
          setCollegeName(college.name)
          if (college.onboarding_fields) {
            setOnboardingFields(college.onboarding_fields)
          }
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

  const roleTitle =
    role === 'college_admin'
      ? 'College Administrator'
      : role === 'college_staff'
      ? 'College Placement Staff'
      : role === 'student'
      ? 'Student'
      : 'User'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-8">
      <div className="w-full max-w-lg space-y-6 rounded-xl bg-white p-6 sm:p-8 shadow-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-center space-y-1.5">
          <div className="flex justify-center mb-1">
            <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-medium">
              {roleTitle} Onboarding
            </Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {step === 1 ? 'Set Your Password' : 'Complete Your Profile'}
          </h2>
          <p className="text-sm text-zinc-500">
            {step === 1
              ? 'Welcome to Placeme. Please create a secure password for your account.'
              : 'Provide your official information to finalize your institutional access.'}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3.5 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-2">
            <div>
              <Label htmlFor="email" className="text-xs font-semibold">
                Account Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="mt-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-not-allowed"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs font-semibold">
                New Password <span className="text-red-500">*</span>
              </Label>
              <Input id="password" name="password" type="password" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required className="mt-1" />
            </div>
            <Button type="submit" className="w-full mt-2" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Password & Continue
            </Button>
          </form>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-4 pt-2">
            <div className="bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 p-3 rounded-lg text-xs border border-blue-200 dark:border-blue-900">
              Please enter your official legal name as registered with your educational institution.
            </div>

            {/* Institution Badge if available */}
            {collegeName && (
              <div>
                <Label className="text-xs font-semibold">Associated Institution</Label>
                <div className="flex items-center gap-2 p-2.5 rounded-md border bg-zinc-50 dark:bg-zinc-800 text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                  <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>{collegeName}</span>
                </div>
              </div>
            )}

            {/* Name Fields */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName" className="text-xs font-semibold">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input id="firstName" name="firstName" required className="mt-1" placeholder="e.g. Rahul" />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-xs font-semibold">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input id="lastName" name="lastName" required className="mt-1" placeholder="e.g. Sharma" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="middleName" className="text-xs font-semibold">
                  Middle Name <span className="text-zinc-400 font-normal">(Optional)</span>
                </Label>
                <Input id="middleName" name="middleName" className="mt-1" placeholder="e.g. Kumar" />
              </div>
            </div>

            {/* College Admin & Staff specific fields */}
            {(role === 'college_admin' || role === 'college_staff') && (
              <div className="space-y-3 pt-1">
                <div>
                  <Label htmlFor="phone" className="text-xs font-semibold">
                    Contact Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    className="mt-1"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Used for placement cell coordination and recruiter outreach.
                  </p>
                </div>

                <div>
                  <Label htmlFor="department" className="text-xs font-semibold">
                    Department / Placement Role <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="department"
                    name="department"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors mt-1"
                  >
                    <option value="">Select Department or Role...</option>
                    <optgroup label="Placement Cell Leadership">
                      <option value="Training & Placement Officer (TPO)">
                        Training & Placement Officer (TPO)
                      </option>
                      <option value="Placement Cell / Administration">
                        Placement Cell / Administration
                      </option>
                      <option value="Department Placement Coordinator">
                        Department Placement Coordinator
                      </option>
                      <option value="Dean / Academic Head">Dean / Academic Head</option>
                    </optgroup>
                    {onboardingFields?.departments && onboardingFields.departments.length > 0 && (
                      <optgroup label="Academic Departments">
                        {onboardingFields.departments.map((d: string) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>
            )}

            {/* Student specific fields */}
            {role === 'student' && (
              <div className="space-y-3 pt-1">
                {onboardingFields?.years && onboardingFields.years.length > 0 && (
                  <div>
                    <Label htmlFor="year" className="text-xs font-semibold">
                      Graduation Year <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="year"
                      name="year"
                      required
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors mt-1"
                    >
                      <option value="">Select Year...</option>
                      {onboardingFields.years.map((y: string) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {onboardingFields?.types && onboardingFields.types.length > 0 && (
                  <div>
                    <Label htmlFor="type" className="text-xs font-semibold">
                      Degree Type <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="type"
                      name="type"
                      required
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors mt-1"
                    >
                      <option value="">Select Type...</option>
                      {onboardingFields.types.map((t: string) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {onboardingFields?.departments && onboardingFields.departments.length > 0 && (
                  <div>
                    <Label htmlFor="department" className="text-xs font-semibold">
                      Department <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="department"
                      name="department"
                      required
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors mt-1"
                    >
                      <option value="">Select Department...</option>
                      {onboardingFields.departments.map((d: string) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <Button type="submit" className="w-full mt-4" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Complete Onboarding & Access Portal
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

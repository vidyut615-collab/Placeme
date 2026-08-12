'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateCollegeOnboardingFields } from '@/app/(dashboards)/agency/actions'
import { Loader2 } from 'lucide-react'

export function OnboardingFieldsEditor({ 
  collegeId, 
  initialFields 
}: { 
  collegeId: string, 
  initialFields: any 
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  const [years, setYears] = useState(initialFields?.years?.join(', ') || '')
  const [types, setTypes] = useState(initialFields?.types?.join(', ') || '')
  const [depts, setDepts] = useState(initialFields?.departments?.join(', ') || '')

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    setSuccess(null)
    formData.append('collegeId', collegeId)
    // Make sure we use the state values if formData didn't get them properly
    formData.set('years', years)
    formData.set('types', types)
    formData.set('departments', depts)
    
    startTransition(async () => {
      const res = await updateCollegeOnboardingFields(formData)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(res.success || 'Updated successfully')
        router.refresh()
      }
    })
  }

  return (
    <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm p-6">
      <div className="mb-4">
        <h2 className="text-lg font-medium">Configure Onboarding Fields</h2>
        <p className="text-sm text-zinc-500">
          Set the options students can choose from during their onboarding. Use comma-separated values.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
        {success && <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{success}</div>}
        
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="years">Years (e.g. 2026, 2027)</Label>
            <Input id="years" name="years" value={years} onChange={e => setYears(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="types">Degree Types (e.g. B.Tech, MCA)</Label>
            <Input id="types" name="types" value={types} onChange={e => setTypes(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="departments">Departments (e.g. CS, Mech)</Label>
            <Input id="departments" name="departments" value={depts} onChange={e => setDepts(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Fields
          </Button>
        </div>
      </form>
    </div>
  )
}

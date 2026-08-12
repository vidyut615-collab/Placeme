'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateCollegeProfile } from '@/app/(dashboards)/college/actions'

interface CollegeDetailsFormProps {
  initialData: {
    name: string
    website: string | null
    location: string | null
    description: string | null
    contact_email: string | null
    contact_phone: string | null
  }
}

export function CollegeDetailsForm({ initialData }: CollegeDetailsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setMessage(null)
    startTransition(async () => {
      const result = await updateCollegeProfile(formData)
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else if (result.success) {
        setMessage({ type: 'success', text: result.success })
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-2xl bg-white dark:bg-zinc-900 p-6 rounded-lg border shadow-sm">
      {message && (
        <div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 col-span-1 md:col-span-2">
          <Label htmlFor="name">College Name <span className="text-red-500">*</span></Label>
          <Input id="name" name="name" defaultValue={initialData.name} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website URL</Label>
          <Input id="website" name="website" type="url" placeholder="https://www.example.edu" defaultValue={initialData.website || ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location / City</Label>
          <Input id="location" name="location" placeholder="e.g., Mumbai, Maharashtra" defaultValue={initialData.location || ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_email">Public Contact Email</Label>
          <Input id="contact_email" name="contact_email" type="email" placeholder="placement@college.edu" defaultValue={initialData.contact_email || ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_phone">Contact Phone</Label>
          <Input id="contact_phone" name="contact_phone" type="tel" placeholder="+91 98765 43210" defaultValue={initialData.contact_phone || ''} />
        </div>

        <div className="space-y-2 col-span-1 md:col-span-2">
          <Label htmlFor="description">About the College</Label>
          <Textarea 
            id="description" 
            name="description" 
            placeholder="Provide a brief description of the college, placement highlights, etc." 
            className="min-h-[120px]"
            defaultValue={initialData.description || ''} 
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving Changes...' : 'Save Profile Details'}
        </Button>
      </div>
    </form>
  )
}

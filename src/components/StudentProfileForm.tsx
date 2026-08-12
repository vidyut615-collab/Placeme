'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateStudentProfile } from '@/app/(dashboards)/student/profile/actions'
import { CheckCircle2, Loader2 } from 'lucide-react'

type OnboardingFields = {
  years: string[]
  types: string[]
  departments: string[]
}

type StudentProfileFormProps = {
  profile: Record<string, any>
  onboardingFields: OnboardingFields
}

export function StudentProfileForm({ profile, onboardingFields }: StudentProfileFormProps) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formState, setFormState] = useState({
    full_name: profile.full_name || '',
    phone: profile.phone || '',
    gpa: profile.gpa || '',
    year: profile.year || '',
    type: profile.type || '',
    department: profile.department || '',
    academic_10th: profile.academic_10th || '',
    academic_12th: profile.academic_12th || '',
    diploma_percentage: profile.diploma_percentage || '',
    graduation_percentage: profile.graduation_percentage || '',
    active_backlogs: profile.active_backlogs || '',
    historical_backlogs: profile.historical_backlogs || '',
    academic_gap_years: profile.academic_gap_years || '',
  })

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormState(s => ({ ...s, [field]: e.target.value }))

  const handleSelect = (field: string) => (value: string) =>
    setFormState(s => ({ ...s, [field]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)
    setError('')
    const fd = new FormData()
    Object.entries(formState).forEach(([k, v]) => fd.append(k, v))
    startTransition(async () => {
      const res = await updateStudentProfile(fd)
      if (res.error) setError(res.error)
      else setSuccess(true)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            value={formState.full_name}
            onChange={handleChange('full_name')}
            placeholder="John Doe"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={formState.phone}
            onChange={handleChange('phone')}
            placeholder="+91 XXXXX XXXXX"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="gpa">GPA / CGPA</Label>
          <Input
            id="gpa"
            value={formState.gpa}
            onChange={handleChange('gpa')}
            placeholder="e.g. 8.5"
          />
        </div>

        <div className="space-y-2">
          <Label>Year</Label>
          {onboardingFields.years.length > 0 ? (
            <Select value={formState.year} onValueChange={handleSelect('year')}>
              <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
              <SelectContent>
                {onboardingFields.years.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={formState.year}
              onChange={handleChange('year')}
              placeholder="e.g. 3rd Year"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label>Degree Type</Label>
          {onboardingFields.types.length > 0 ? (
            <Select value={formState.type} onValueChange={handleSelect('type')}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {onboardingFields.types.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={formState.type}
              onChange={handleChange('type')}
              placeholder="e.g. B.Tech"
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Department</Label>
        {onboardingFields.departments.length > 0 ? (
          <Select value={formState.department} onValueChange={handleSelect('department')}>
            <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
            <SelectContent>
              {onboardingFields.departments.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={formState.department}
            onChange={handleChange('department')}
            placeholder="e.g. Computer Science"
          />
        )}
      </div>

      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-medium mb-4">Academic Details</h3>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="academic_10th">10th Percentage</Label>
            <Input id="academic_10th" type="number" step="0.01" value={formState.academic_10th} onChange={handleChange('academic_10th')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="academic_12th">12th Percentage</Label>
            <Input id="academic_12th" type="number" step="0.01" value={formState.academic_12th} onChange={handleChange('academic_12th')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="diploma_percentage">Diploma % (if any)</Label>
            <Input id="diploma_percentage" type="number" step="0.01" value={formState.diploma_percentage} onChange={handleChange('diploma_percentage')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="graduation_percentage">Graduation %</Label>
            <Input id="graduation_percentage" type="number" step="0.01" value={formState.graduation_percentage} onChange={handleChange('graduation_percentage')} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="active_backlogs">Active Backlogs</Label>
            <Input id="active_backlogs" type="number" value={formState.active_backlogs} onChange={handleChange('active_backlogs')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="historical_backlogs">Historical Backlogs</Label>
            <Input id="historical_backlogs" type="number" value={formState.historical_backlogs} onChange={handleChange('historical_backlogs')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="academic_gap_years">Academic Gap (Years)</Label>
            <Input id="academic_gap_years" type="number" value={formState.academic_gap_years} onChange={handleChange('academic_gap_years')} />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          Profile updated successfully!
        </div>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending
          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
          : 'Save Changes'}
      </Button>
    </form>
  )
}

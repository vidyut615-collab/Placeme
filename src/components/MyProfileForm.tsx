'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Loader2,
  Lock,
  Briefcase,
  CheckCircle2,
} from 'lucide-react'
import { updateCollegeUserProfile } from '@/app/(dashboards)/college/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface MyProfileFormProps {
  initialProfile: {
    firstName: string
    lastName: string
    email: string
    phone: string
    department: string
    role: string
    collegeName: string
  }
  academicDepartments?: string[]
}

export function MyProfileForm({
  initialProfile,
  academicDepartments = [],
}: MyProfileFormProps) {
  const router = useRouter()
  const [firstName, setFirstName] = useState(initialProfile.firstName || '')
  const [lastName, setLastName] = useState(initialProfile.lastName || '')
  const [phone, setPhone] = useState(initialProfile.phone || '')
  const [department, setDepartment] = useState(initialProfile.department || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAdmin = initialProfile.role === 'college_admin'
  const displayName =
    [firstName, lastName].filter(Boolean).join(' ') ||
    (isAdmin ? 'College Admin' : 'College Staff')

  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || (isAdmin ? 'CA' : 'CS')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !department) {
      toast.error('First name, last name, phone, and department are required.')
      return
    }

    setIsSubmitting(true)
    const res = await updateCollegeUserProfile({
      firstName,
      lastName,
      phone,
      department,
    })
    setIsSubmitting(false)

    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success(res?.success || 'Your profile has been updated successfully!')
      router.refresh()
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Hero Banner */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-6 md:p-8 text-white relative">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 relative z-10">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-2xl font-bold text-2xl shrink-0 shadow-md ${
                isAdmin
                  ? 'bg-purple-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              <span>{initials}</span>
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {displayName}
                </h2>
                <Badge
                  className={
                    isAdmin
                      ? 'bg-purple-500/20 text-purple-200 border-purple-400/30'
                      : 'bg-blue-500/20 text-blue-200 border-blue-400/30'
                  }
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {isAdmin ? 'College Administrator' : 'Placement Staff'}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>{initialProfile.collegeName || 'Institution'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>{initialProfile.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Read-Only Identity Strip */}
        <div className="p-4 sm:p-6 bg-zinc-50/70 dark:bg-zinc-900/40 border-t border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Institutional Credentials &amp; Role
            </span>
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Managed by Platform
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <Label className="text-[11px] text-zinc-500">Login Email</Label>
              <div className="font-mono bg-white dark:bg-zinc-900 border rounded-md px-3 py-2 text-zinc-700 dark:text-zinc-300 truncate">
                {initialProfile.email}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-zinc-500">Affiliated College</Label>
              <div className="bg-white dark:bg-zinc-900 border rounded-md px-3 py-2 text-zinc-700 dark:text-zinc-300 truncate">
                {initialProfile.collegeName || 'Institution'}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-zinc-500">Portal Access Level</Label>
              <div className="bg-white dark:bg-zinc-900 border rounded-md px-3 py-2 text-zinc-700 dark:text-zinc-300 truncate">
                {isAdmin ? 'College Admin (Full Access)' : 'Placement Staff (Operations)'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editable Form Card */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Personal &amp; Contact Information
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Update your name, contact phone number, and placement wing affiliation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="my_first_name" className="text-xs font-semibold flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-zinc-400" />
              First Name *
            </Label>
            <Input
              id="my_first_name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Ramesh"
              required
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="my_last_name" className="text-xs font-semibold">
              Last Name *
            </Label>
            <Input
              id="my_last_name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Kumar"
              required
              className="text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="my_phone" className="text-xs font-semibold flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-zinc-400" />
              Official Phone Number *
            </Label>
            <Input
              id="my_phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              required
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="my_department" className="text-xs font-semibold flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-zinc-400" />
              Department / Placement Wing *
            </Label>
            <select
              id="my_department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select Department / Role...</option>
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
              {academicDepartments.length > 0 && (
                <optgroup label="Academic Departments">
                  {academicDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Save Profile
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

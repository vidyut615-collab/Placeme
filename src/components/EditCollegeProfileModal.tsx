'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

interface EditCollegeProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function EditCollegeProfileModal({
  open,
  onOpenChange,
  initialProfile,
  academicDepartments = [],
}: EditCollegeProfileModalProps) {
  const router = useRouter()
  const [firstName, setFirstName] = useState(initialProfile.firstName || '')
  const [lastName, setLastName] = useState(initialProfile.lastName || '')
  const [phone, setPhone] = useState(initialProfile.phone || '')
  const [department, setDepartment] = useState(initialProfile.department || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync state if initialProfile changes
  useEffect(() => {
    setFirstName(initialProfile.firstName || '')
    setLastName(initialProfile.lastName || '')
    setPhone(initialProfile.phone || '')
    setDepartment(initialProfile.department || '')
  }, [initialProfile, open])

  const isAdmin = initialProfile.role === 'college_admin'
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || (isAdmin ? 'College Admin' : 'College Staff')
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
      toast.error('All fields are required.')
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
      toast.success(res?.success || 'Profile updated successfully!')
      onOpenChange(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl">
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Building2 className="w-32 h-32" />
          </div>

          <div className="relative z-10 flex items-start gap-4">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl font-bold text-xl shrink-0 shadow-md ${
                isAdmin
                  ? 'bg-purple-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              <span>{initials}</span>
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-xl font-bold text-white tracking-tight">
                  {displayName}
                </DialogTitle>
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

              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <span className="truncate">{initialProfile.collegeName || 'Institution'}</span>
              </div>
              <DialogDescription className="text-xs text-zinc-400">
                View and manage your personal details and placement cell wing.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white dark:bg-zinc-950">
          {/* Read-Only System Identity Section */}
          <div className="p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Institutional Identity
              </span>
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Lock className="h-3 w-3" /> Managed by Platform
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <Label className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Official Email
                </Label>
                <div className="font-mono bg-white dark:bg-zinc-900 border rounded px-2.5 py-1.5 text-zinc-700 dark:text-zinc-300 truncate">
                  {initialProfile.email || '—'}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> College Affiliation
                </Label>
                <div className="bg-white dark:bg-zinc-900 border rounded px-2.5 py-1.5 text-zinc-700 dark:text-zinc-300 truncate">
                  {initialProfile.collegeName || 'Institution'}
                </div>
              </div>
            </div>
          </div>

          {/* Editable Personal Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="prof_first_name" className="text-xs font-semibold flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                  First Name *
                </Label>
                <Input
                  id="prof_first_name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Ramesh"
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prof_last_name" className="text-xs font-semibold">
                  Last Name *
                </Label>
                <Input
                  id="prof_last_name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Kumar"
                  required
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="prof_phone" className="text-xs font-semibold flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-zinc-400" />
                  Official Phone Number *
                </Label>
                <Input
                  id="prof_phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prof_dept" className="text-xs font-semibold flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-zinc-400" />
                  Department / Wing *
                </Label>
                <select
                  id="prof_dept"
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
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
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
      </DialogContent>
    </Dialog>
  )
}

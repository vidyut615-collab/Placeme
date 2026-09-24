'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Loader2, ShieldCheck, Users, Mail, Phone, Building2 } from 'lucide-react'
import { inviteCollegeMember } from '@/app/(dashboards)/college/roles/actions'
import { toast } from 'sonner'

export function InviteCollegeMemberModal({
  collegeName,
  academicDepartments = [],
}: {
  collegeName: string
  academicDepartments?: string[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [role, setRole] = useState<'college_staff' | 'college_admin'>('college_staff')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [department, setDepartment] = useState('')

  const handleReset = () => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setDepartment('')
    setRole('college_staff')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !department) {
      toast.error('All fields are required to invite a team member.')
      return
    }

    setIsPending(true)
    const res = await inviteCollegeMember({
      firstName,
      lastName,
      email,
      phone,
      department,
      role,
    })
    setIsPending(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success || 'Invitation sent successfully!')
      handleReset()
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="h-9 gap-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <UserPlus className="h-4 w-4" />
            Invite Team Member
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[560px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-blue-600" />
            Invite Member to {collegeName}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Send an onboarding invitation link with predefined institutional credentials and role permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {/* Role Selection Cards */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Select Institutional Role *</Label>
            <div className="grid grid-cols-2 gap-3">
              {/* College Staff Card */}
              <div
                onClick={() => setRole('college_staff')}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                  role === 'college_staff'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-600'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-blue-600" />
                      College Staff
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      Standard
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                    Manage jobs, drives, pipeline, and approvals. Cannot edit policies or manage team roles.
                  </p>
                </div>
              </div>

              {/* College Admin Card */}
              <div
                onClick={() => setRole('college_admin')}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                  role === 'college_admin'
                    ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 ring-1 ring-purple-600'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                      College Admin
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-300 text-purple-700">
                      Full Access
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                    Complete administrative authority over operations, placement policies, and team roles.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="first_name" className="text-xs font-semibold">
                First Name *
              </Label>
              <Input
                id="first_name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Ramesh"
                required
                className="text-xs mt-1"
              />
            </div>
            <div>
              <Label htmlFor="last_name" className="text-xs font-semibold">
                Last Name *
              </Label>
              <Input
                id="last_name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Patil"
                required
                className="text-xs mt-1"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="invite_email" className="text-xs font-semibold flex items-center gap-1">
              <Mail className="h-3 w-3 text-zinc-400" />
              Institutional Email Address *
            </Label>
            <Input
              id="invite_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ramesh.patil@college.edu"
              required
              className="text-xs mt-1"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              A secure activation link will be dispatched to this address via ZeptoMail.
            </p>
          </div>

          {/* Phone & Department */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="invite_phone" className="text-xs font-semibold flex items-center gap-1">
                <Phone className="h-3 w-3 text-zinc-400" />
                Phone Number *
              </Label>
              <Input
                id="invite_phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="text-xs mt-1"
              />
            </div>

            <div>
              <Label htmlFor="invite_dept" className="text-xs font-semibold">
                Department / Role *
              </Label>
              <select
                id="invite_dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors mt-1"
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

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                handleReset()
                setOpen(false)
              }}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              Send Invitation Link
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

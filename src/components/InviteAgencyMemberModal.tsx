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
import { inviteAgencyMember } from '@/app/(dashboards)/agency/roles/actions'
import { toast } from 'sonner'

export function InviteAgencyMemberModal() {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [role, setRole] = useState<'agency_staff' | 'agency_admin'>('agency_staff')
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
    setRole('agency_staff')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !department.trim()) {
      toast.error('All fields are required to invite a team member.')
      return
    }

    setIsPending(true)
    const res = await inviteAgencyMember({
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
      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-primary-foreground hover:bg-blue-700 h-9 px-4 py-2 text-white gap-2 shadow-sm">
        <UserPlus className="h-4 w-4" />
        Invite Team Member
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white dark:bg-zinc-950">
        <DialogHeader className="p-6 border-b bg-zinc-50/50 dark:bg-zinc-900/50">
          <DialogTitle className="text-xl">Invite to Agency Team</DialogTitle>
          <DialogDescription>
            Add a new admin or staff member to manage the placement platform.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Role Selection */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Select Access Level</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setRole('agency_staff')}
                  className={`relative flex cursor-pointer rounded-xl border p-4 shadow-xs transition-all ${
                    role === 'agency_staff'
                      ? 'border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/20'
                      : 'border-zinc-200 hover:border-blue-300 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex w-full flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users
                          className={`h-4 w-4 ${role === 'agency_staff' ? 'text-blue-600' : 'text-zinc-500'}`}
                        />
                        <span
                          className={`text-sm font-bold ${
                            role === 'agency_staff' ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          Staff
                        </span>
                      </div>
                      <div
                        className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                          role === 'agency_staff' ? 'border-blue-600 bg-blue-600' : 'border-zinc-300'
                        }`}
                      >
                        {role === 'agency_staff' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Base level access for day-to-day operations and support.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setRole('agency_admin')}
                  className={`relative flex cursor-pointer rounded-xl border p-4 shadow-xs transition-all ${
                    role === 'agency_admin'
                      ? 'border-purple-600 bg-purple-50/50 dark:border-purple-500 dark:bg-purple-950/20'
                      : 'border-zinc-200 hover:border-purple-300 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex w-full flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck
                          className={`h-4 w-4 ${role === 'agency_admin' ? 'text-purple-600' : 'text-zinc-500'}`}
                        />
                        <span
                          className={`text-sm font-bold ${
                            role === 'agency_admin'
                              ? 'text-purple-700 dark:text-purple-400'
                              : 'text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          Admin
                        </span>
                      </div>
                      <div
                        className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                          role === 'agency_admin' ? 'border-purple-600 bg-purple-600' : 'border-zinc-300'
                        }`}
                      >
                        {role === 'agency_admin' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Manager level access. Can manage colleges and jobs.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="e.g. Rahul"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-9 text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="e.g. Vaidya"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-9 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-9 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  id="phone"
                  placeholder="e.g. +91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9 h-9 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="department" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Department / Title <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  id="department"
                  placeholder="e.g. Support, Operations, Customer Success"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="pl-9 h-9 text-sm"
                  required
                />
              </div>
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
              className={`text-xs text-white gap-2 shadow-xs ${
                role === 'agency_admin' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Mail className="h-3.5 w-3.5" />
              )}
              {isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

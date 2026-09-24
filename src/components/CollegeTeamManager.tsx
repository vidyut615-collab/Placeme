'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  ShieldCheck,
  UserCheck,
  Mail,
  Phone,
  RotateCw,
  Trash2,
  Search,
  MoreVertical,
  CheckCircle2,
  Clock,
  Loader2,
  Shield,
  Ban,
  Building2,
} from 'lucide-react'
import {
  resendCollegeMemberInvite,
  revokeCollegeMemberInvite,
  updateCollegeMemberRole,
  toggleCollegeMemberStatus,
} from '@/app/(dashboards)/college/roles/actions'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

export type CollegeMember = {
  id: string
  email: string
  role: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  department: string | null
  is_active: boolean
  created_at: string
}

export type CollegeInvitation = {
  id: string
  email: string
  role: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  department: string | null
  status: string
  created_at: string
}

export function CollegeTeamManager({
  currentUserId,
  members,
  invitations,
}: {
  currentUserId: string
  members: CollegeMember[]
  invitations: CollegeInvitation[]
}) {
  const [activeTab, setActiveTab] = useState('members')
  const [searchQuery, setSearchQuery] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const adminCount = members.filter((m) => m.role === 'college_admin' && m.is_active).length
  const staffCount = members.filter((m) => m.role === 'college_staff' && m.is_active).length
  const pendingCount = invitations.length

  const filteredMembers = members.filter((m) => {
    const query = searchQuery.toLowerCase()
    const name = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase()
    const email = (m.email || '').toLowerCase()
    const dept = (m.department || '').toLowerCase()
    return name.includes(query) || email.includes(query) || dept.includes(query)
  })

  const filteredInvitations = invitations.filter((inv) => {
    const query = searchQuery.toLowerCase()
    const name = `${inv.first_name || ''} ${inv.last_name || ''}`.toLowerCase()
    const email = (inv.email || '').toLowerCase()
    const dept = (inv.department || '').toLowerCase()
    return name.includes(query) || email.includes(query) || dept.includes(query)
  })

  const handleResend = async (invitationId: string) => {
    setProcessingId(invitationId)
    const res = await resendCollegeMemberInvite(invitationId)
    setProcessingId(null)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success)
    }
  }

  const handleRevoke = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this pending invitation?')) return
    setProcessingId(invitationId)
    const res = await revokeCollegeMemberInvite(invitationId)
    setProcessingId(null)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success)
    }
  }

  const handleRoleToggle = async (member: CollegeMember) => {
    const newRole = member.role === 'college_admin' ? 'college_staff' : 'college_admin'
    const newRoleLabel = newRole === 'college_admin' ? 'College Administrator' : 'College Staff'

    if (!confirm(`Change role of ${member.first_name || member.email} to ${newRoleLabel}?`)) return

    setProcessingId(member.id)
    const res = await updateCollegeMemberRole({
      targetUserId: member.id,
      newRole,
    })
    setProcessingId(null)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success)
    }
  }

  const handleStatusToggle = async (member: CollegeMember) => {
    const newStatus = !member.is_active
    const actionLabel = newStatus ? 'reactivate' : 'deactivate'

    if (!confirm(`Are you sure you want to ${actionLabel} ${member.first_name || member.email}?`)) return

    setProcessingId(member.id)
    const res = await toggleCollegeMemberStatus({
      targetUserId: member.id,
      isActive: newStatus,
    })
    setProcessingId(null)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success)
    }
  }

  return (
    <div className="space-y-6">
      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-medium">Total Team Members</p>
              <h3 className="text-2xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">
                {members.length}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-medium">College Administrators</p>
              <h3 className="text-2xl font-bold mt-1 text-purple-700 dark:text-purple-300">
                {adminCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-medium">Placement Staff</p>
              <h3 className="text-2xl font-bold mt-1 text-blue-700 dark:text-blue-300">
                {staffCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-medium">Pending Invites</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                {pendingCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs & Search Filter */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <TabsList className="grid grid-cols-2 max-w-xs">
            <TabsTrigger value="members" className="text-xs">
              Active Members ({members.length})
            </TabsTrigger>
            <TabsTrigger value="invitations" className="text-xs">
              Pending Invites ({invitations.length})
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search by name, email, dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-8 h-9"
            />
          </div>
        </div>

        {/* TAB 1: ACTIVE MEMBERS */}
        <TabsContent value="members" className="mt-2">
          <Card className="shadow-xs overflow-hidden border">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50 dark:bg-zinc-900/50">
                  <TableHead className="text-xs font-semibold">Team Member</TableHead>
                  <TableHead className="text-xs font-semibold">Institutional Role</TableHead>
                  <TableHead className="text-xs font-semibold">Department / Role</TableHead>
                  <TableHead className="text-xs font-semibold">Contact Phone</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-zinc-500 text-xs">
                      No matching team members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => {
                    const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Team Member'
                    const initials =
                      fullName
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((p) => p[0]?.toUpperCase())
                        .join('') || 'TM'
                    const isSelf = member.id === currentUserId
                    const isAdmin = member.role === 'college_admin'

                    return (
                      <TableRow key={member.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                        {/* Member Identity */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-9 w-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border ${
                                isAdmin
                                  ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300'
                                  : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                              }`}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                                  {fullName}
                                </span>
                                {isSelf && (
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0 font-normal">
                                    You
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[11px] text-zinc-500 block truncate">{member.email}</span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Role Badge */}
                        <TableCell>
                          {isAdmin ? (
                            <Badge className="bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 text-[10px] font-semibold gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              College Admin
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 text-[10px] font-semibold gap-1">
                              <Users className="h-3 w-3" />
                              College Staff
                            </Badge>
                          )}
                        </TableCell>

                        {/* Department */}
                        <TableCell>
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            {member.department || 'Not Assigned'}
                          </span>
                        </TableCell>

                        {/* Phone */}
                        <TableCell>
                          <span className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                            {member.phone || '—'}
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {member.is_active ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
                              <Ban className="h-3 w-3" />
                              Deactivated
                            </span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isSelf && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRoleToggle(member)}
                                  disabled={processingId === member.id}
                                  className="h-7 text-[11px] px-2"
                                  title={isAdmin ? 'Demote to Staff' : 'Promote to Admin'}
                                >
                                  {processingId === member.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <span>{isAdmin ? 'Make Staff' : 'Make Admin'}</span>
                                  )}
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStatusToggle(member)}
                                  disabled={processingId === member.id}
                                  className={`h-7 text-[11px] px-2 ${
                                    member.is_active
                                      ? 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40'
                                      : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                  }`}
                                >
                                  {member.is_active ? 'Deactivate' : 'Reactivate'}
                                </Button>
                              </>
                            )}
                            {isSelf && (
                              <span className="text-[11px] text-zinc-400 italic pr-2">Active Admin</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* TAB 2: PENDING INVITATIONS */}
        <TabsContent value="invitations" className="mt-2">
          <Card className="shadow-xs overflow-hidden border">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50 dark:bg-zinc-900/50">
                  <TableHead className="text-xs font-semibold">Invited Contact</TableHead>
                  <TableHead className="text-xs font-semibold">Assigned Role</TableHead>
                  <TableHead className="text-xs font-semibold">Department</TableHead>
                  <TableHead className="text-xs font-semibold">Invited On</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-zinc-500 text-xs">
                      No pending invitations at this time.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvitations.map((inv) => {
                    const fullName = `${inv.first_name || ''} ${inv.last_name || ''}`.trim() || 'Invited User'
                    const isAdmin = inv.role === 'college_admin'

                    return (
                      <TableRow key={inv.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                        <TableCell>
                          <div>
                            <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 block">
                              {fullName}
                            </span>
                            <span className="text-[11px] text-zinc-500 font-mono">{inv.email}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          {isAdmin ? (
                            <Badge className="bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 text-[10px] font-semibold gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              College Admin
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 text-[10px] font-semibold gap-1">
                              <Users className="h-3 w-3" />
                              College Staff
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            {inv.department || 'Not Assigned'}
                          </span>
                        </TableCell>

                        <TableCell suppressHydrationWarning>
                          <span className="text-xs text-zinc-500">
                            {formatDate(inv.created_at)}
                          </span>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 gap-1">
                            <Clock className="h-3 w-3" />
                            Pending Activation
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResend(inv.id)}
                              disabled={processingId === inv.id}
                              className="h-7 text-[11px] gap-1 px-2.5"
                            >
                              {processingId === inv.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RotateCw className="h-3 w-3" />
                              )}
                              Resend Invite
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevoke(inv.id)}
                              disabled={processingId === inv.id}
                              className="h-7 text-[11px] px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                              title="Revoke invitation"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

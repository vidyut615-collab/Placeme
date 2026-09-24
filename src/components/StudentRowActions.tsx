'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MoreHorizontal, RotateCw, Trash2, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { resendStudentInvite, deleteStudentAccount } from '@/app/(dashboards)/agency/actions'

interface StudentRowActionsProps {
  studentId?: string | null
  invitationId?: string | null
  email: string
  name?: string
  collegeId: string
  isInvite: boolean
  viewProfileHref?: string
  canDelete?: boolean
}

export function StudentRowActions({
  studentId,
  invitationId,
  email,
  name,
  collegeId,
  isInvite,
  viewProfileHref,
  canDelete = false,
}: StudentRowActionsProps) {
  const router = useRouter()
  const [resendModalOpen, setResendModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [resendEmail, setResendEmail] = useState(email)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleOpenResend = () => {
    setResendEmail(email)
    setError(null)
    setResendModalOpen(true)
  }

  const handleOpenDelete = () => {
    setError(null)
    setDeleteModalOpen(true)
  }

  const handleResend = () => {
    setError(null)
    const trimmedNew = resendEmail.trim().toLowerCase()
    if (!trimmedNew) {
      setError('Please provide a valid email address.')
      return
    }

    startTransition(async () => {
      const res = await resendStudentInvite({
        collegeId,
        oldEmail: email,
        newEmail: trimmedNew,
        invitationId,
      })

      if (res?.error) {
        setError(res.error)
        toast.error(res.error)
      } else {
        toast.success(res?.success || 'Invitation link sent successfully!')
        setResendModalOpen(false)
        router.refresh()
      }
    })
  }

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      const res = await deleteStudentAccount({
        studentId,
        invitationId,
        email,
        collegeId,
      })

      if (res?.error) {
        setError(res.error)
        toast.error(res.error)
      } else {
        toast.success(res?.success || 'Student deleted successfully.')
        setDeleteModalOpen(false)
        router.refresh()
      }
    })
  }

  const isEmailModified = resendEmail.trim().toLowerCase() !== email.trim().toLowerCase()

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {/* If Active: show View Profile link */}
        {!isInvite && viewProfileHref && (
          <Link
            href={viewProfileHref}
            className="text-xs text-blue-600 hover:underline dark:text-blue-400 font-medium"
          >
            View Profile
          </Link>
        )}

        {/* If Pending: show Resend button */}
        {isInvite && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenResend}
            className="h-7 text-xs px-2.5 flex items-center gap-1.5 font-medium border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            <RotateCw className="h-3 w-3 text-zinc-500" />
            Resend
          </Button>
        )}

        {/* Three-dot (kebab) menu: Admin only */}
        {canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 h-7 w-7 p-0 text-zinc-500">
              <span className="sr-only">Open options</span>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                onClick={handleOpenDelete}
                className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* RESEND INVITATION MODAL */}
      <Dialog open={resendModalOpen} onOpenChange={setResendModalOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <RotateCw className="h-4 w-4 text-blue-600" />
              Resend Student Invitation
            </DialogTitle>
            <DialogDescription className="pt-1 text-xs text-zinc-500">
              Confirm or correct the student&apos;s email address below before resending their onboarding invitation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {error && (
              <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="resend-email-input" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Student Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  id="resend-email-input"
                  type="email"
                  value={resendEmail}
                  onChange={e => setResendEmail(e.target.value)}
                  placeholder="student@example.com"
                  disabled={isPending}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              {isEmailModified ? (
                <div className="p-2.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 mt-2 text-xs text-amber-800 dark:text-amber-300">
                  <p className="font-semibold flex items-center gap-1.5 mb-0.5">
                    Email address updated
                  </p>
                  <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                    The student&apos;s invitation and login account will be changed from <span className="font-mono underline">{email}</span> to <span className="font-mono font-medium underline">{resendEmail.trim().toLowerCase()}</span>.
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-zinc-500 mt-1">
                  A fresh onboarding invitation link will be sent to <span className="font-medium text-zinc-700 dark:text-zinc-300">{email}</span> via ZeptoMail.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setResendModalOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleResend}
              disabled={isPending || !resendEmail.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Sending...
                </>
              ) : isEmailModified ? (
                'Update & Resend Invite'
              ) : (
                'Resend Invite'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-500 text-base">
              <Trash2 className="h-4 w-4" />
              {isInvite ? 'Cancel Invitation & Delete' : 'Delete Student Account'}
            </DialogTitle>
            <DialogDescription className="pt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              {isInvite ? (
                <>
                  Are you sure you want to cancel the invitation and delete <span className="font-semibold text-zinc-900 dark:text-zinc-100">{email}</span>? This pending record will be permanently removed.
                </>
              ) : (
                <>
                  Are you sure you want to permanently delete <span className="font-semibold text-zinc-900 dark:text-zinc-100">{name && name !== '—' ? `${name} (${email})` : email}</span>? All academic records, profile details, and job applications will be permanently deleted.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Deleting...
                </>
              ) : (
                'Confirm Delete'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { MoreHorizontal, ShieldBan, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { blacklistStudent, removeBlacklist } from '@/app/(dashboards)/college/actions'

interface StudentActionsDropdownProps {
  studentId: string
  isBlacklisted: boolean
}

export function StudentActionsDropdown({ studentId, isBlacklisted }: StudentActionsDropdownProps) {
  const [blacklistModalOpen, setBlacklistModalOpen] = useState(false)
  const [removeModalOpen, setRemoveModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleBlacklist = (formData: FormData) => {
    formData.append('studentId', studentId)
    setErrorMsg(null)
    startTransition(async () => {
      const res = await blacklistStudent(formData)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setBlacklistModalOpen(false)
      }
    })
  }

  const handleRemoveBlacklist = (formData: FormData) => {
    formData.append('studentId', studentId)
    setErrorMsg(null)
    startTransition(async () => {
      const res = await removeBlacklist(formData)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setRemoveModalOpen(false)
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem className="cursor-pointer">
            View Profile
          </DropdownMenuItem>

          {isBlacklisted ? (
            <DropdownMenuItem 
              className="cursor-pointer text-green-600"
              onClick={() => setRemoveModalOpen(true)}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Remove Blacklist
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem 
              className="cursor-pointer text-red-600"
              onClick={() => setBlacklistModalOpen(true)}
            >
              <ShieldBan className="mr-2 h-4 w-4" />
              Blacklist Student
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={blacklistModalOpen} onOpenChange={setBlacklistModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Blacklist Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to blacklist this student? They will be blocked from applying to any future jobs.
            </DialogDescription>
          </DialogHeader>
          <form action={handleBlacklist} className="space-y-4">
            {errorMsg && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {errorMsg}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Blacklisting</Label>
              <Textarea 
                id="reason" 
                name="reason" 
                placeholder="e.g. Disciplinary action, Policy violation..." 
                required 
              />
            </div>
            <div className="flex justify-end pt-4 space-x-2">
              <Button type="button" variant="outline" onClick={() => setBlacklistModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? 'Processing...' : 'Confirm Blacklist'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={removeModalOpen} onOpenChange={setRemoveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Blacklist</DialogTitle>
            <DialogDescription>
              This will reinstate the student and allow them to apply to jobs again.
            </DialogDescription>
          </DialogHeader>
          <form action={handleRemoveBlacklist} className="space-y-4">
            {errorMsg && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {errorMsg}
              </div>
            )}
            <div className="flex justify-end pt-4 space-x-2">
              <Button type="button" variant="outline" onClick={() => setRemoveModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="default" disabled={isPending}>
                {isPending ? 'Processing...' : 'Confirm Removal'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

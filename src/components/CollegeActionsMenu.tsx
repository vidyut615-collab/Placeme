'use client'

import { useState, useTransition } from 'react'
import { MoreHorizontal, Edit, UserPlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { updateCollege, addCollegeAdmin, deleteCollege } from '@/app/(dashboards)/agency/actions'

interface CollegeActionsMenuProps {
  collegeId: string
  collegeName: string
}

export function CollegeActionsMenu({ collegeId, collegeName }: CollegeActionsMenuProps) {
  const [activeModal, setActiveModal] = useState<'edit' | 'admin' | 'delete' | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleAction = async (actionFn: (formData: FormData) => Promise<any>, formData: FormData) => {
    setError(null)
    formData.append('collegeId', collegeId)
    startTransition(async () => {
      const result = await actionFn(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setActiveModal(null)
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setActiveModal('edit')}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Name
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveModal('admin')}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Admin
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setActiveModal('delete')}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete College
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Modal */}
      <Dialog open={activeModal === 'edit'} onOpenChange={(open) => setActiveModal(open ? 'edit' : null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit College Name</DialogTitle>
          </DialogHeader>
          <form action={(fd) => { fd.append('id', collegeId); handleAction(updateCollege, fd) }} className="space-y-4 pt-4">
            {error && <div className="text-sm text-red-500">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="name">College Name</Label>
              <Input id="name" name="name" defaultValue={collegeName} required />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => setActiveModal(null)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Admin Modal */}
      <Dialog open={activeModal === 'admin'} onOpenChange={(open) => setActiveModal(open ? 'admin' : null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add College Admin</DialogTitle>
            <DialogDescription>
              Invite a new admin to {collegeName}. They will receive a password reset link.
            </DialogDescription>
          </DialogHeader>
          <form action={(fd) => handleAction(addCollegeAdmin, fd)} className="space-y-4 pt-4">
            {error && <div className="text-sm text-red-500">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input id="adminEmail" name="adminEmail" type="email" placeholder="admin@college.edu" required />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => setActiveModal(null)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Inviting...' : 'Invite Admin'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={activeModal === 'delete'} onOpenChange={(open) => setActiveModal(open ? 'delete' : null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Danger Zone: Delete College</DialogTitle>
            <DialogDescription>
              This will permanently delete {collegeName} and all associated jobs, students, and applications.
              To confirm, please enter your SuperAdmin password.
            </DialogDescription>
          </DialogHeader>
          <form action={(fd) => handleAction(deleteCollege, fd)} className="space-y-4 pt-4">
            {error && <div className="text-sm text-red-500">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="password">Your Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => setActiveModal(null)}>Cancel</Button>
              <Button variant="destructive" type="submit" disabled={isPending}>{isPending ? 'Deleting...' : 'Delete College'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

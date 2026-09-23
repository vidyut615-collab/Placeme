'use client'

import { useState, useTransition } from 'react'
import { MoreHorizontal, Edit, UserPlus, Trash2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { toast } from 'sonner'

export interface CollegeDetails {
  name: string
  website?: string | null
  location?: string | null
  description?: string | null
  contact_email?: string | null
  contact_phone?: string | null
}

interface CollegeActionsMenuProps {
  collegeId: string
  collegeName: string
  collegeDetails?: CollegeDetails
}

export function CollegeActionsMenu({ collegeId, collegeName, collegeDetails }: CollegeActionsMenuProps) {
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
        toast.error(result.error)
      } else {
        toast.success(result?.success || 'Action completed successfully!')
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
            Edit College Details
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

      {/* Edit Details Modal */}
      <Dialog open={activeModal === 'edit'} onOpenChange={(open) => setActiveModal(open ? 'edit' : null)}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Edit College Details
            </DialogTitle>
            <DialogDescription>
              Update information for {collegeName}. Changes are reflected across student and recruiter dashboards.
            </DialogDescription>
          </DialogHeader>
          <form action={(fd) => { fd.append('id', collegeId); handleAction(updateCollege, fd) }} className="space-y-4 pt-2">
            {error && <div className="text-sm text-red-500 bg-red-50 p-2.5 rounded-md border border-red-200">{error}</div>}
            
            <div className="space-y-2">
              <Label htmlFor="edit-name">College Name <span className="text-red-500">*</span></Label>
              <Input id="edit-name" name="name" defaultValue={collegeDetails?.name || collegeName} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-website">Website URL</Label>
                <Input id="edit-website" name="website" type="url" placeholder="https://college.edu" defaultValue={collegeDetails?.website || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location / City</Label>
                <Input id="edit-location" name="location" placeholder="e.g. Mumbai, MH" defaultValue={collegeDetails?.location || ''} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Public Contact Email</Label>
                <Input id="edit-email" name="contact_email" type="email" placeholder="placements@college.edu" defaultValue={collegeDetails?.contact_email || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Contact Phone</Label>
                <Input id="edit-phone" name="contact_phone" type="tel" placeholder="+91 98765 43210" defaultValue={collegeDetails?.contact_phone || ''} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-desc">About / Description</Label>
              <Textarea 
                id="edit-desc" 
                name="description" 
                placeholder="Institutional description, accreditations, ranking highlights..." 
                className="min-h-[80px]"
                defaultValue={collegeDetails?.description || ''} 
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
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
              Invite a new admin to {collegeName}. They will receive an email to set up their password.
            </DialogDescription>
          </DialogHeader>
          <form action={(fd) => handleAction(addCollegeAdmin, fd)} className="space-y-4 pt-4">
            {error && <div className="text-sm text-red-500 bg-red-50 p-2.5 rounded-md border border-red-200">{error}</div>}
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
            {error && <div className="text-sm text-red-500 bg-red-50 p-2.5 rounded-md border border-red-200">{error}</div>}
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

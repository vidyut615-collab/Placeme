'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import { Textarea } from '@/components/ui/textarea'
import { updateCollege } from '@/app/(dashboards)/agency/actions'
import { Edit2, Building2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface EditCollegeDetailsModalProps {
  college: {
    id: string
    name: string
    website?: string | null
    location?: string | null
    description?: string | null
    contact_email?: string | null
    contact_phone?: string | null
  }
}

export function EditCollegeDetailsModal({ college }: EditCollegeDetailsModalProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    formData.append('id', college.id)
    
    startTransition(async () => {
      const res = await updateCollege(formData)
      if (res?.error) {
        setError(res.error)
        toast.error(res.error)
      } else {
        toast.success(res?.success || 'College details updated successfully!')
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="flex items-center gap-2"><Edit2 className="h-4 w-4" /> Edit Details</Button>} />
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Edit College Details
          </DialogTitle>
          <DialogDescription>
            Update profile and contact information for {college.name}.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="modal-col-name">College Name <span className="text-red-500">*</span></Label>
            <Input 
              id="modal-col-name" 
              name="name" 
              defaultValue={college.name} 
              required 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="modal-col-website">Website URL</Label>
              <Input 
                id="modal-col-website" 
                name="website" 
                type="url" 
                placeholder="https://college.edu" 
                defaultValue={college.website || ''} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-col-location">Location / City</Label>
              <Input 
                id="modal-col-location" 
                name="location" 
                placeholder="e.g. Mumbai, MH" 
                defaultValue={college.location || ''} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="modal-col-email">Public Contact Email</Label>
              <Input 
                id="modal-col-email" 
                name="contact_email" 
                type="email" 
                placeholder="placements@college.edu" 
                defaultValue={college.contact_email || ''} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-col-phone">Contact Phone</Label>
              <Input 
                id="modal-col-phone" 
                name="contact_phone" 
                type="tel" 
                placeholder="+91 98765 43210" 
                defaultValue={college.contact_phone || ''} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-col-desc">About / Description</Label>
            <Textarea 
              id="modal-col-desc" 
              name="description" 
              placeholder="Institutional highlights, accreditation, placement track record..." 
              className="min-h-[85px]"
              defaultValue={college.description || ''} 
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

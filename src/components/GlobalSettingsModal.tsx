'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updateGlobalApplicationLimit } from '@/app/(dashboards)/agency/actions'
import { Settings } from 'lucide-react'

type GlobalSettingsModalProps = {
  currentLimit: number
}

export function GlobalSettingsModal({ currentLimit }: GlobalSettingsModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [limit, setLimit] = useState(currentLimit.toString())

  const handleUpdate = async () => {
    const val = parseInt(limit)
    if (isNaN(val) || val < 1) {
      toast.error('Please enter a valid number greater than 0.')
      return
    }

    setLoading(true)
    const result = await updateGlobalApplicationLimit(val)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(result.success)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Update Global Limit
        </Button>
      } />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Global Application Limit</DialogTitle>
          <DialogDescription>
            Set the maximum number of global agency jobs a student can apply to across the platform. This does not affect their local college quotas.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="limit">Max Global Applications per Student</Label>
            <Input
              id="limit"
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              min="1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={loading}>
            {loading ? 'Updating...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

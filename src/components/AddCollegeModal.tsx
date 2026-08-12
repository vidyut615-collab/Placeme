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
import { addCollege } from '@/app/(dashboards)/agency/actions'

export function AddCollegeModal() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    startTransition(async () => {
      const result = await addCollege(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Add New College</Button>} />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Register New College</DialogTitle>
          <DialogDescription>
            Enter the college details and the primary admin&apos;s email address. They will receive an email to set their password.
          </DialogDescription>
        </DialogHeader>
        
        <form action={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/50 dark:text-red-200">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">College Name</Label>
            <Input 
              id="name" 
              name="name" 
              placeholder="e.g. Stanford University" 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminEmail">College Admin Email</Label>
            <Input 
              id="adminEmail" 
              name="adminEmail" 
              type="email" 
              placeholder="admin@college.edu" 
              required 
            />
          </div>
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-sm font-medium">Initial Onboarding Lists (Optional)</h4>
            <p className="text-xs text-zinc-500">Comma-separated values for students to select from.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="years">Years</Label>
            <Input id="years" name="years" placeholder="e.g. 2026, 2027, 2028" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="types">Degree Types</Label>
            <Input id="types" name="types" placeholder="e.g. B.Tech, MCA, MBA" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="departments">Departments</Label>
            <Input id="departments" name="departments" placeholder="e.g. Computer Science, Mechanical" />
          </div>
          <div className="pt-4 flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Registering...' : 'Register College'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

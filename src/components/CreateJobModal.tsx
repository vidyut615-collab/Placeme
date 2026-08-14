'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'

interface CreateJobModalProps {
  action: (formData: FormData) => Promise<{ error?: string; success?: string }>
  title: string
  description: string
}

export function CreateJobModal({ action, title, description }: CreateJobModalProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = (formData: FormData) => {
    setErrorMsg(null)
    startTransition(async () => {
      const res = await action(formData)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="gap-2">
          <Plus className="h-4 w-4" />{title}
        </Button>
      } />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-1 py-2">
          {errorMsg && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {errorMsg}
            </div>
          )}

          <form id="create-job-form" action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="title">Job Title</Label>
                <Input id="title" name="title" placeholder="e.g., Software Engineer Intern" required />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input id="company_name" name="company_name" placeholder="e.g., Google" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue="active">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Visible)</SelectItem>
                    <SelectItem value="paused">Paused (Hidden)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="application_deadline">Application Deadline</Label>
                <Input id="application_deadline" name="application_deadline" type="datetime-local" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="compensation_ctc">CTC (LPA)</Label>
                <Input id="compensation_ctc" name="compensation_ctc" type="number" step="0.01" placeholder="e.g. 10.5" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compensation_fixed">Fixed (LPA)</Label>
                <Input id="compensation_fixed" name="compensation_fixed" type="number" step="0.01" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compensation_variable">Variable (LPA)</Label>
                <Input id="compensation_variable" name="compensation_variable" type="number" step="0.01" />
              </div>
            </div>

            <div className="space-y-2 border-t pt-4 mt-4">
              <Label htmlFor="description">Job Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Describe the role, responsibilities, and requirements..." 
                required 
                className="min-h-[150px]"
              />
            </div>

            <div className="border-t pt-4 mt-4 space-y-4">
              <h3 className="font-semibold text-sm">Eligibility Criteria (Optional)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eligibility_min_cgpa">Min CGPA</Label>
                  <Input id="eligibility_min_cgpa" name="eligibility_min_cgpa" type="number" step="0.01" placeholder="e.g. 7.5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eligibility_min_10th">Min 10th %</Label>
                  <Input id="eligibility_min_10th" name="eligibility_min_10th" type="number" step="0.1" placeholder="e.g. 70" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eligibility_min_12th">Min 12th %</Label>
                  <Input id="eligibility_min_12th" name="eligibility_min_12th" type="number" step="0.1" placeholder="e.g. 70" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eligibility_max_active_backlogs">Max Active Backlogs</Label>
                  <Input id="eligibility_max_active_backlogs" name="eligibility_max_active_backlogs" type="number" placeholder="e.g. 0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eligibility_max_historical_backlogs">Max Historical Backlogs</Label>
                  <Input id="eligibility_max_historical_backlogs" name="eligibility_max_historical_backlogs" type="number" placeholder="e.g. 2" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eligibility_allowed_departments">Allowed Departments (Comma separated)</Label>
                <Input id="eligibility_allowed_departments" name="eligibility_allowed_departments" placeholder="e.g. Computer Science, Information Technology" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eligibility_allowed_genders">Allowed Genders</Label>
                <Select name="eligibility_allowed_genders" defaultValue="any">
                  <SelectTrigger>
                    <SelectValue placeholder="Any Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Gender</SelectItem>
                    <SelectItem value="male">Male Only</SelectItem>
                    <SelectItem value="female">Female Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button type="button" variant="outline" className="mr-2" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="create-job-form" disabled={isPending}>
            {isPending ? 'Posting...' : 'Post Job'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

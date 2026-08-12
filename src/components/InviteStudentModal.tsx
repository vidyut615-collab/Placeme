'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inviteStudent } from '@/app/(dashboards)/agency/actions'
import { Loader2 } from 'lucide-react'

export function InviteStudentModal({ collegeId }: { collegeId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    formData.append('collegeId', collegeId)
    
    const res = await inviteStudent(formData)
    
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess(res.success || 'Student invited successfully!')
      setTimeout(() => {
        setOpen(false)
        setSuccess(null)
      }, 2000)
    }
    
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        Invite Student
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
          {success && <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{success}</div>}
          
          <div className="space-y-2">
            <Label htmlFor="studentEmail">Student Email</Label>
            <Input id="studentEmail" name="studentEmail" type="email" required placeholder="student@university.edu" />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send Invite
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

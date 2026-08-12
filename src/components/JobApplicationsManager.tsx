'use client'

import { useState, useTransition } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateApplicationStatus } from '@/app/actions/application'

type ApplicationRow = {
  id: string
  status: string
  created_at: string
  students: {
    id: string
    user_id: string
    profile_data: any
  } | null
}

interface JobApplicationsManagerProps {
  applications: ApplicationRow[]
}

const statusOptions = [
  { value: 'applied', label: 'Applied' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'selected', label: 'Selected' },
  { value: 'offered', label: 'Offered' },
  { value: 'offer_accepted', label: 'Offer Accepted' },
  { value: 'offer_declined', label: 'Offer Declined' },
  { value: 'hired', label: 'Hired' },
  { value: 'joined', label: 'Joined' },
  { value: 'not_joined', label: 'Not Joined' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'rejected', label: 'Rejected' },
]

export function JobApplicationsManager({ applications }: JobApplicationsManagerProps) {
  const [isPending, startTransition] = useTransition()

  const handleStatusChange = (applicationId: string, newStatus: string) => {
    startTransition(async () => {
      const res = await updateApplicationStatus(applicationId, newStatus)
      if (res.error) {
        alert(res.error)
      }
    })
  }

  return (
    <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm relative">
      {isPending && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center">
          <span className="text-sm font-medium animate-pulse">Updating...</span>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Applicant Name</TableHead>
            <TableHead>Academic Info</TableHead>
            <TableHead>GPA</TableHead>
            <TableHead>Date Applied</TableHead>
            <TableHead className="w-[180px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!applications || applications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                No students have applied to this job yet.
              </TableCell>
            </TableRow>
          ) : (
            applications.map((app) => {
              const profile = app.students?.profile_data || {}
              return (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{profile.full_name || 'Unknown Student'}</span>
                      {profile.phone && <span className="text-xs text-zinc-500">{profile.phone}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{profile.type || 'N/A'} - {profile.year || 'N/A'}</span>
                      <span className="text-xs text-zinc-500">{profile.department || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{profile.gpa || 'N/A'}</TableCell>
                  <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Select
                      value={app.status}
                      onValueChange={(val) => handleStatusChange(app.id, val)}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-[150px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}

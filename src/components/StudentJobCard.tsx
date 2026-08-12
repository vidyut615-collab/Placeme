'use client'

import { useTransition } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { applyForJob } from '@/app/(dashboards)/student/actions'
import { Building2, Globe2, Loader2, CheckCircle2 } from 'lucide-react'

type Job = {
  id: string
  title: string
  description: string
  college_id: string | null
  created_at: string
}

export function StudentJobCard({ job, hasApplied }: { job: Job; hasApplied: boolean }) {
  const [isPending, startTransition] = useTransition()

  const handleApply = () => {
    startTransition(async () => {
      const res = await applyForJob(job.id)
      if (res.error) {
        alert(res.error)
      }
    })
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl">{job.title}</CardTitle>
            <div className="flex items-center text-sm text-zinc-500 gap-2">
              {job.college_id ? (
                <>
                  <Building2 className="h-4 w-4" />
                  <span>College Exclusive</span>
                </>
              ) : (
                <>
                  <Globe2 className="h-4 w-4" />
                  <span>Global Placement</span>
                </>
              )}
            </div>
          </div>
          {hasApplied && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 border-transparent dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Applied
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-4 whitespace-pre-wrap">
          {job.description}
        </p>
      </CardContent>
      <CardFooter className="pt-4 border-t">
        <Button 
          className="w-full" 
          disabled={hasApplied || isPending}
          onClick={handleApply}
          variant={hasApplied ? "outline" : "default"}
        >
          {isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Applying...</>
          ) : hasApplied ? (
            'Already Applied'
          ) : (
            'Apply Now'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

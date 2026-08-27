'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { processApprovalRequest } from './actions'
import { toast } from 'sonner'

type RequestItem = {
  id: string
  proposed_profile_data: any
  created_at: string
  status: string
  students: {
    id: string
    profile_data: any
    users: { email: string } | { email: string }[]
  }
}

export function ApprovalsList({ requests }: { requests: RequestItem[] }) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id)
    const res = await processApprovalRequest(id, action)
    setProcessingId(null)
    
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success)
    }
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-24 bg-zinc-50 border rounded-lg dark:bg-zinc-900 border-dashed">
        <CheckCircle2 className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">All caught up!</h3>
        <p className="text-zinc-500 mt-1">There are no pending profile update requests.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map(req => {
        const studentData = Array.isArray(req.students) ? req.students[0] : req.students
        const oldData = studentData?.profile_data || {}
        const newData = req.proposed_profile_data || {}
        const isExpanded = expandedId === req.id
        
        const email = Array.isArray(studentData?.users) ? studentData?.users[0]?.email : studentData?.users?.email

        return (
          <Card key={req.id} className="overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950">
              <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setExpandedId(isExpanded ? null : req.id)}>
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-600">
                  {newData.full_name?.[0] || 'S'}
                </div>
                <div>
                  <h3 className="font-semibold">{newData.full_name || 'Unknown Student'}</h3>
                  <div className="text-sm text-zinc-500">{email} &bull; Submitted {new Date(req.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                  {isExpanded ? 'Hide Diff' : 'View Changes'}
                </Button>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700" 
                  disabled={processingId === req.id}
                  onClick={() => handleAction(req.id, 'approve')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  disabled={processingId === req.id}
                  onClick={() => handleAction(req.id, 'reject')}
                >
                  <XCircle className="h-4 w-4 mr-2" /> Reject
                </Button>
              </div>
            </div>

            {isExpanded && (
              <CardContent className="border-t p-0 bg-zinc-50 dark:bg-zinc-900/30">
                <div className="grid grid-cols-2 divide-x">
                  <div className="p-4">
                    <h4 className="font-semibold text-sm text-red-600 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div> Current Live Profile
                    </h4>
                    <pre className="text-xs bg-white dark:bg-zinc-950 p-4 rounded border overflow-auto max-h-[500px]">
                      {JSON.stringify(oldData, null, 2)}
                    </pre>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-sm text-green-600 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div> Proposed Changes
                    </h4>
                    <pre className="text-xs bg-white dark:bg-zinc-950 p-4 rounded border overflow-auto max-h-[500px]">
                      {JSON.stringify(newData, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}

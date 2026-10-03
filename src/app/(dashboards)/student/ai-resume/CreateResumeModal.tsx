'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Loader2, AlertCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createAIResume } from './actions'

interface Props {
  creditBalance: number
  isActive: boolean
  hasProfileData: boolean
}

// Will be dynamic in Phase 5
const AI_RESUME_CREDIT_COST = 5 

export function CreateResumeModal({ creditBalance, isActive, hasProfileData }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    employer: '',
    role: '',
    jd: ''
  })

  const wordCount = formData.jd.trim().split(/\s+/).filter(w => w.length > 0).length
  const isOverLimit = wordCount > 750

  const handleOpenClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isActive) {
      toast.error('Access Locked', { description: 'Please purchase a subscription to use AI tools.' })
      return
    }
    if (creditBalance < AI_RESUME_CREDIT_COST) {
      toast.error('Insufficient Credits', { description: `You need ${AI_RESUME_CREDIT_COST} credits to generate an AI Resume. Please top up in the Billing tab.` })
      return
    }
    setOpen(true)
  }

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isOverLimit) {
      toast.error('Job Description is too long. Please reduce it to under 750 words.')
      return
    }
    setShowConfirm(true)
  }

  const handleFinalSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const result = await createAIResume(formData)
      
      if (result.error) {
        toast.error('Failed to create resume', { description: result.error })
        setIsSubmitting(false)
        setShowConfirm(false)
        return
      }

      toast.success('AI Resume Generation Started!')
      setOpen(false)
      setShowConfirm(false)
      // Redirect to full-screen builder
      router.push(`/builder/${result.resumeId}`)
      
    } catch (error: any) {
      toast.error('An unexpected error occurred')
      setIsSubmitting(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <Button onClick={handleOpenClick} className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm">
        <Plus className="w-4 h-4 mr-2" />
        Create New Resume
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
        {!showConfirm ? (
          <form onSubmit={handlePreSubmit}>
            <DialogHeader>
              <DialogTitle>Tailor New AI Resume</DialogTitle>
              <DialogDescription>
                Provide the target job details. Our AI will align your profile to match the employer's exact needs.
              </DialogDescription>
            </DialogHeader>

            {!hasProfileData && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800 leading-relaxed">
                  <span className="font-semibold block mb-1">Warning: Empty Profile</span>
                  You have 0 Jobs, 0 Projects, and 0 Activities. If you proceed, the AI will generate a "Fresher" resume based solely on your Education and Skills.
                </div>
              </div>
            )}
            
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Resume Name (For your reference)</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Google SDE Resume" 
                  required 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="employer">Target Employer</Label>
                  <Input 
                    id="employer" 
                    placeholder="e.g. Google" 
                    required 
                    value={formData.employer}
                    onChange={e => setFormData({...formData, employer: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Target Role</Label>
                  <Input 
                    id="role" 
                    placeholder="e.g. Software Engineer II" 
                    required 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="jd">Job Description</Label>
                  <span className={`text-xs font-medium ${isOverLimit ? 'text-red-500' : 'text-zinc-500'}`}>
                    {wordCount} / 750 words
                  </span>
                </div>
                <Textarea 
                  id="jd" 
                  placeholder="Paste the full job description here..." 
                  className={`h-40 resize-none ${isOverLimit ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  required 
                  value={formData.jd}
                  onChange={e => setFormData({...formData, jd: e.target.value})}
                />
                {isOverLimit && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" /> Job description exceeds the maximum word limit.
                  </p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                <Sparkles className="w-4 h-4 mr-2" /> Continue
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Confirm AI Generation</h3>
              <p className="text-zinc-500 mt-2 max-w-sm mx-auto">
                This will deduct <strong className="text-zinc-900">{AI_RESUME_CREDIT_COST} AI Credits</strong> from your balance and begin tailoring your resume.
              </p>
            </div>
            <div className="flex gap-4 w-full px-8 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowConfirm(false)} disabled={isSubmitting}>
                Back
              </Button>
              <Button type="button" className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={handleFinalSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {isSubmitting ? 'Generating...' : 'Confirm & Generate'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
      </Dialog>
    </>
  )
}

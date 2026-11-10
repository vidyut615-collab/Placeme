'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TactileButton } from '@/components/ui/tactile/TactileButton'
import { createClient } from '@/utils/supabase/client'

export function DeleteResumeButton({ resumeId }: { resumeId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('ai_resumes')
        .delete()
        .eq('id', resumeId)

      if (error) throw error

      toast.success('Resume deleted successfully')
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error('Failed to delete resume', { description: error.message })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button 
        type="button"
        className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 border border-zinc-800 hover:border-rose-900/40 transition shrink-0"
        onClick={() => setOpen(true)}
        title="Delete Resume"
      >
        <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px] bg-zinc-950 border border-zinc-800 text-zinc-100 p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400 text-base">
              <AlertTriangle className="w-4 h-4 stroke-[1.5]" />
              Delete AI Resume
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 pt-1">
              Are you sure you want to permanently delete this resume version? Previously spent AI generation credits will not be refunded.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-zinc-800">
            <TactileButton variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={isDeleting} className="text-xs">
              Cancel
            </TactileButton>
            <TactileButton 
              variant="destructive" 
              size="sm" 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="text-xs"
              icon={isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </TactileButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

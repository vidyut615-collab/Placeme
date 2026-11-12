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
} from '@/components/ui/dialog'
import { deleteAIResumeAction } from './actions'

export function DeleteResumeButton({
  resumeId,
  resumeTitle,
}: {
  resumeId: string
  resumeTitle?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await deleteAIResumeAction(resumeId)
      if (!res.success) {
        throw new Error(res.error || 'Failed to delete resume')
      }

      toast.success('Resume deleted')
      setOpen(false)
      router.refresh()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unable to delete resume'
      toast.error('Failed to delete resume', { description: msg })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-[#78716C] dark:text-[#8A847A] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-950/30 bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] hover:border-rose-300 dark:hover:border-rose-800/60 transition-colors duration-150 shrink-0 cursor-pointer"
        onClick={() => setOpen(true)}
        title="Delete resume"
        aria-label={`Delete ${resumeTitle || 'resume'}`}
      >
        <Trash2 className="w-4 h-4 stroke-[1.5]" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px] bg-white dark:bg-[#191816] border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-[#1C1917] dark:text-[#EFECE6] p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-[16px] font-medium">
              <AlertTriangle className="w-4 h-4 stroke-[1.5]" />
              <span>Delete tailored resume</span>
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#57534E] dark:text-[#ACA59A] pt-1 leading-relaxed">
              Are you sure you want to permanently remove{' '}
              <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
                {resumeTitle || 'this resume'}
              </span>
              ? Credits used during generation cannot be refunded.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
              className="h-9 px-4 rounded-lg border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] bg-white dark:bg-[#191816] hover:bg-[#FAF8F5] dark:hover:bg-[#24221F] text-[13px] font-medium text-[#1C1917] dark:text-[#EFECE6] transition-colors duration-150 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-medium transition-colors duration-150 cursor-pointer disabled:opacity-60"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 stroke-[1.5] animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 stroke-[1.5]" />
              )}
              <span>{isDeleting ? 'Deleting...' : 'Delete permanently'}</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

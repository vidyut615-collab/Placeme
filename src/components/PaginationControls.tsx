'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize?: number
  onPageChange: (page: number) => void
  itemLabel?: string
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 25,
  onPageChange,
  itemLabel = 'students'
}: PaginationControlsProps) {
  if (totalItems === 0) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      if (currentPage <= 3) {
        end = 4
      }
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3
      }

      if (start > 2) pages.push('...')
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-white dark:bg-zinc-950 text-sm">
      <div className="text-xs text-zinc-500 order-2 sm:order-1">
        Showing <span className="font-semibold text-zinc-800 dark:text-zinc-200">{startItem}</span> to{' '}
        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{endItem}</span> of{' '}
        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{totalItems}</span> {itemLabel}
      </div>

      <div className="flex items-center gap-1 order-1 sm:order-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">First page</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>

        <div className="flex items-center gap-1 px-1">
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-zinc-400">
                  ...
                </span>
              )
            }

            const pageNum = Number(page)
            const isActive = pageNum === currentPage

            return (
              <Button
                key={`page-${pageNum}`}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className={`h-8 w-8 p-0 text-xs ${
                  isActive ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-zinc-700 dark:text-zinc-300'
                }`}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          title="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Last page</span>
        </Button>
      </div>
    </div>
  )
}

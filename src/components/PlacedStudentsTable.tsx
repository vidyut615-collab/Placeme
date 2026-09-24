'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, Download, Eye, FileText, Award, Building2, ExternalLink } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

export interface PlacedStudentOffer {
  id: string
  company_name: string
  job_role: string
  compensation_ctc: number
  offer_type: string
  offer_letter_url: string | null
  reviewed_at: string | null
  student_confirmed_at: string
  students: {
    id: string
    user_id: string
    profile_data: any
    user_email?: string
  } | null
}

interface PlacedStudentsTableProps {
  offers: PlacedStudentOffer[]
  dreamMin?: number
  superDreamMin?: number
}

export function PlacedStudentsTable({
  offers,
  dreamMin = 8,
  superDreamMin = 15,
}: PlacedStudentsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewingOffer, setViewingOffer] = useState<PlacedStudentOffer | null>(null)

  const filteredOffers = useMemo(() => {
    if (!searchQuery.trim()) return offers

    const q = searchQuery.toLowerCase().trim()
    return offers.filter(o => {
      const student = o.students
      const profile = student?.profile_data || {}
      const personal = profile.personal || {}
      const academic = profile.academic || {}

      const name = (personal.full_name || profile.name || '').toLowerCase()
      const roll = (personal.roll_number || profile.roll_number || academic.roll_no || '').toLowerCase()
      const email = (student?.user_email || personal.email || profile.email || '').toLowerCase()
      const dept = (academic.department || profile.department || '').toLowerCase()
      const company = o.company_name.toLowerCase()
      const role = o.job_role.toLowerCase()

      return name.includes(q) || roll.includes(q) || email.includes(q) || dept.includes(q) || company.includes(q) || role.includes(q)
    })
  }, [offers, searchQuery])

  const handleExportExcel = () => {
    if (filteredOffers.length === 0) {
      toast.error('No placed student records to export.')
      return
    }

    const rows = filteredOffers.map((o, idx) => {
      const student = o.students
      const profile = student?.profile_data || {}
      const personal = profile.personal || {}
      const academic = profile.academic || {}

      return {
        '#': idx + 1,
        'Student Name': personal.full_name || profile.name || 'N/A',
        'Email': student?.user_email || personal.email || profile.email || 'N/A',
        'Department': academic.department || profile.department || 'N/A',
        'Degree': academic.degree || academic.type || profile.degree || 'N/A',
        'Batch': academic.batch || academic.year || profile.batch || 'N/A',
        'CGPA': academic.cgpa || profile.cgpa || 'N/A',
        'Company Name': o.company_name,
        'Job Role': o.job_role,
        'Compensation (CTC LPA)': o.compensation_ctc,
        'Channel': o.offer_type === 'on_campus' ? 'On-Campus' : 'Off-Campus',
        'Approval Date': o.reviewed_at ? new Date(o.reviewed_at).toLocaleDateString() : 'N/A'
      }
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Placed Students')
    XLSX.writeFile(wb, `Master_Placed_Students_${new Date().toISOString().slice(0, 10)}.xlsx`)
    toast.success(`Exported ${filteredOffers.length} placed student(s) to Excel!`)
  }

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search by student, company, roll no, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          className="gap-1.5 text-xs h-9 border-zinc-300 dark:border-zinc-700"
        >
          <Download className="h-3.5 w-3.5 text-emerald-600" />
          Export Placed Students (.xlsx)
        </Button>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
            <TableRow>
              <TableHead className="text-xs font-semibold">Student</TableHead>
              <TableHead className="text-xs font-semibold">Department</TableHead>
              <TableHead className="text-xs font-semibold">Company & Role</TableHead>
              <TableHead className="text-xs font-semibold">CTC (LPA)</TableHead>
              <TableHead className="text-xs font-semibold">Channel</TableHead>
              <TableHead className="text-xs font-semibold">Approved Date</TableHead>
              <TableHead className="text-xs font-semibold text-right pr-4">Offer Letter</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOffers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center text-zinc-400">
                    <Award className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      No placed students found
                    </p>
                    {searchQuery && (
                      <p className="text-xs text-zinc-400 mt-1">
                        Try clearing your search query &ldquo;{searchQuery}&rdquo;
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredOffers.map((offer) => {
                const student = offer.students
                const profile = student?.profile_data || {}
                const personal = profile.personal || {}
                const academic = profile.academic || {}

                const name = personal.full_name || profile.name || 'Candidate'
                const email = student?.user_email || personal.email || profile.email || '—'
                const dept = academic.department || profile.department || '—'

                const isSuperDream = offer.compensation_ctc >= superDreamMin
                const isDream = !isSuperDream && offer.compensation_ctc >= dreamMin

                return (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{name}</div>
                      <div className="text-[11px] text-zinc-500">{email}</div>
                    </TableCell>

                    <TableCell className="text-xs text-zinc-800 dark:text-zinc-200">
                      {dept}
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                        {offer.company_name}
                      </div>
                      <div className="text-[11px] text-zinc-500">{offer.job_role}</div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{offer.compensation_ctc} LPA
                      </div>
                      {isSuperDream && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded">
                          ⭐ Super Dream
                        </span>
                      )}
                      {isDream && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                          🌟 Dream
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {offer.offer_type === 'on_campus' ? (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] dark:bg-blue-950/40 dark:text-blue-300">
                          On-Campus
                        </Badge>
                      ) : (
                        <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] dark:bg-purple-950/40 dark:text-purple-300">
                          Off-Campus
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-zinc-500" suppressHydrationWarning>
                      {formatDate(offer.reviewed_at)}
                    </TableCell>

                    <TableCell className="text-right pr-4">
                      {offer.offer_letter_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingOffer(offer)}
                          className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      ) : (
                        <span className="text-[11px] text-zinc-400">None</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Offer Letter Viewer Dialog */}
      <Dialog open={!!viewingOffer} onOpenChange={(open) => !open && setViewingOffer(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-6">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Verified Offer Letter: {viewingOffer?.company_name}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Role: {viewingOffer?.job_role} &bull; Package: ₹{viewingOffer?.compensation_ctc} LPA
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 flex items-center justify-center min-h-[300px] bg-zinc-50 dark:bg-zinc-900 rounded-lg border">
            {viewingOffer?.offer_letter_url ? (
              viewingOffer.offer_letter_url.startsWith('data:application/pdf') ? (
                <iframe
                  src={viewingOffer.offer_letter_url}
                  className="w-full h-[500px] rounded border"
                  title="Offer Letter PDF"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={viewingOffer.offer_letter_url}
                  alt="Offer Letter"
                  className="max-h-[500px] object-contain rounded"
                />
              )
            ) : (
              <p className="text-xs text-zinc-400">No document attached.</p>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t">
            <Button size="sm" variant="outline" onClick={() => setViewingOffer(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  createPlacementCycle,
  updatePlacementCycle,
  togglePlacementCycleActive,
  deletePlacementCycle,
} from '@/app/(dashboards)/college/actions'
import { toast } from 'sonner'
import { Calendar, Plus, Clock, Trash2, Briefcase, Loader2, ShieldAlert, Lock, Pencil } from 'lucide-react'

export interface PlacementCycleItem {
  id: string
  name: string
  description?: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  created_at: string
  jobs?: { id: string }[] | null
}

interface PlacementCyclesManagerProps {
  initialCycles: PlacementCycleItem[]
  isAdmin?: boolean
}

export function PlacementCyclesManager({
  initialCycles = [],
  isAdmin = true,
}: PlacementCyclesManagerProps) {
  const [cycles, setCycles] = useState<PlacementCycleItem[]>(initialCycles)
  const [openCreate, setOpenCreate] = useState(false)
  const [editingCycle, setEditingCycle] = useState<PlacementCycleItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Create Form Fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Edit Form Fields
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Please enter a cycle name.')
      return
    }

    if (!description.trim()) {
      toast.error('Please enter a cycle description.')
      return
    }

    setIsSubmitting(true)
    const res = await createPlacementCycle({
      name: name.trim(),
      description: description.trim(),
      startDate: startDate || null,
      endDate: endDate || null,
      isActive,
    })
    setIsSubmitting(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success || 'Cycle created successfully!')
      if (res.cycle) {
        // Multiple cycles can be active concurrently
        setCycles(prev => [{ ...res.cycle, jobs: [] }, ...prev])
      }
      setOpenCreate(false)
      setName('')
      setDescription('')
      setStartDate('')
      setEndDate('')
      setIsActive(true)
    }
  }

  const handleOpenEdit = (cycle: PlacementCycleItem) => {
    setEditingCycle(cycle)
    setEditName(cycle.name)
    setEditDescription(cycle.description || '')
    setEditStartDate(cycle.start_date || '')
    setEditEndDate(cycle.end_date || '')
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCycle) return

    if (!editName.trim()) {
      toast.error('Please enter a cycle name.')
      return
    }

    if (!editDescription.trim()) {
      toast.error('Please enter a cycle description.')
      return
    }

    setIsSubmitting(true)
    const res = await updatePlacementCycle({
      cycleId: editingCycle.id,
      name: editName.trim(),
      description: editDescription.trim(),
      startDate: editStartDate || null,
      endDate: editEndDate || null,
    })
    setIsSubmitting(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success || 'Cycle updated successfully!')
      if (res.cycle) {
        setCycles(prev =>
          prev.map(c => (c.id === editingCycle.id ? { ...c, ...res.cycle } : c))
        )
      }
      setEditingCycle(null)
    }
  }

  const handleToggleActive = async (cycleId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus

    // Optimistic update: Only update the targeted cycle so multiple active cycles remain active
    setCycles(prev =>
      prev.map(c => {
        if (c.id === cycleId) {
          return { ...c, is_active: newStatus }
        }
        return c
      })
    )

    const res = await togglePlacementCycleActive(cycleId, newStatus)
    if (res.error) {
      toast.error(res.error)
      // Rollback
      setCycles(initialCycles)
    } else {
      toast.success(res.success || (newStatus ? 'Cycle marked as active.' : 'Cycle marked as inactive.'))
    }
  }

  const handleDelete = async (cycleId: string, cycleName: string) => {
    if (!confirm(`Are you sure you want to delete "${cycleName}"? Any jobs linked to this cycle will have their cycle unlinked.`)) {
      return
    }

    setDeletingId(cycleId)
    const res = await deletePlacementCycle(cycleId)
    setDeletingId(null)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success || 'Cycle deleted.')
      setCycles(prev => prev.filter(c => c.id !== cycleId))
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const activeCount = cycles.filter(c => c.is_active).length

  return (
    <div className="space-y-4">
      {!isAdmin && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-800/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-center gap-3 shadow-xs">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <span className="font-bold block">Placement Cycles View</span>
            <span className="text-xs text-amber-800/90 dark:text-amber-300/90">
              You are viewing placement cycles in read-only mode. Creating cycles, editing details, and modifying active status is restricted to College Administrators.
            </span>
          </div>
        </div>
      )}

      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Placement Seasons &amp; Cycles</CardTitle>
              {activeCount > 0 && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[11px] font-medium">
                  {activeCount} Active {activeCount === 1 ? 'Cycle' : 'Cycles'}
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1 text-xs text-zinc-500">
              Manage placement seasons for your college. Multiple placement cycles can be active simultaneously (e.g. Final Placements and Summer Internships).
            </CardDescription>
          </div>

          {isAdmin ? (
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger render={
                <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                  <Plus className="h-4 w-4" />
                  New Placement Cycle
                </Button>
              } />

              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Create Placement Season / Cycle
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-500">
                    A placement cycle groups your campus drives for a specific graduating batch or recruitment window. Multiple cycles can be active concurrently.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="cycle-name" className="text-xs font-semibold">
                      Cycle / Season Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cycle-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. 2025-2026 Campus Placement Season"
                      required
                      className="h-9 text-xs"
                    />
                    {/* Fast Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[11px] text-zinc-400">Suggestions:</span>
                      {[
                        '2025-2026 Campus Placements',
                        '2024-2025 Final Season',
                        'Summer Internship Drive 2025',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setName(preset)}
                          className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cycle-description" className="text-xs font-semibold">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="cycle-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Official campus recruitment drive for final year B.Tech, M.Tech, and MCA students across all engineering branches."
                      required
                      rows={3}
                      className="text-xs resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="start-date" className="text-xs font-semibold">Start Date (Optional)</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="end-date" className="text-xs font-semibold">End Date (Optional)</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="space-y-0.5">
                      <Label htmlFor="is-active" className="text-xs font-semibold">Set as Active Cycle</Label>
                      <p className="text-[11px] text-zinc-500">
                        Active cycles will be available in job posting dropdowns. Multiple cycles can remain active.
                      </p>
                    </div>
                    <Switch
                      id="is-active"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenCreate(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                    >
                      {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Create Cycle
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              disabled
              size="sm"
              variant="outline"
              className="gap-2 cursor-not-allowed opacity-70 border-zinc-300 dark:border-zinc-700 shrink-0"
            >
              <Lock className="h-4 w-4 text-zinc-400" />
              Admin Only (Locked)
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {cycles.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">No Placement Cycles Created Yet</h4>
                <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                  Create a cycle (such as &quot;2025-2026 Campus Drive&quot;) to organize jobs and manage recruitment seasons.
                </p>
              </div>
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => setOpenCreate(true)}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                >
                  <Plus className="h-4 w-4" />
                  Create First Placement Cycle
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[280px]">Cycle / Season Details</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Linked Jobs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cycles.map((cycle) => {
                    const jobCount = Array.isArray(cycle.jobs) ? cycle.jobs.length : 0

                    return (
                      <TableRow key={cycle.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col gap-1 max-w-md">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {cycle.name}
                              </span>
                              {cycle.is_active && (
                                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] px-1.5 py-0.5">
                                  Active Season
                                </Badge>
                              )}
                            </div>
                            {cycle.description ? (
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                                {cycle.description}
                              </p>
                            ) : (
                              <p className="text-xs text-zinc-400 italic">No description provided</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                          {cycle.start_date || cycle.end_date ? (
                            <span>
                              {formatDate(cycle.start_date)} - {formatDate(cycle.end_date)}
                            </span>
                          ) : (
                            <span className="text-zinc-400">Full Academic Year</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                            <Briefcase className="h-3.5 w-3.5 text-zinc-400" />
                            <span>{jobCount} {jobCount === 1 ? 'Job' : 'Jobs'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <Switch
                              disabled={!isAdmin}
                              checked={cycle.is_active}
                              onCheckedChange={() => handleToggleActive(cycle.id, cycle.is_active)}
                              aria-label="Toggle active status"
                            />
                            <span className={`text-xs font-medium ${cycle.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`}>
                              {cycle.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {isAdmin ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(cycle)}
                                className="h-8 w-8 p-0 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                title="Edit cycle"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={deletingId === cycle.id}
                                onClick={() => handleDelete(cycle.id, cycle.name)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                title="Delete cycle"
                              >
                                {deletingId === cycle.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Placement Cycle Dialog */}
      {isAdmin && (
        <Dialog open={editingCycle !== null} onOpenChange={(open) => !open && setEditingCycle(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Pencil className="h-4 w-4 text-blue-600" />
                Edit Placement Season / Cycle
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Update the name, description, or date range for this placement cycle. Changes apply across linked jobs.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEdit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-cycle-name" className="text-xs font-semibold">
                  Cycle / Season Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-cycle-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. 2025-2026 Campus Placement Season"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-cycle-description" className="text-xs font-semibold">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="edit-cycle-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="e.g. Annual campus recruitment and internship drive for final-year students."
                  required
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-start-date" className="text-xs font-semibold">Start Date (Optional)</Label>
                  <Input
                    id="edit-start-date"
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-end-date" className="text-xs font-semibold">End Date (Optional)</Label>
                  <Input
                    id="edit-end-date"
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingCycle(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

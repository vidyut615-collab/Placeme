'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Edit2, Trash2, Calendar, Award, Building2, Loader2, Save, Undo2, CheckCircle2 } from 'lucide-react'
import { updateCollegeOnboardingFields } from '@/app/(dashboards)/agency/actions'
import { updateCollegeAcademicConfig } from '@/app/(dashboards)/college/actions'
import { toast } from 'sonner'

export type AcademicConfig = {
  years: string[]
  types: string[]
  departments: string[]
}

interface AcademicConfigManagerProps {
  collegeId?: string
  initialFields?: Partial<AcademicConfig> | null
  role?: 'agency' | 'college'
}

type CategoryKey = 'years' | 'types' | 'departments'

interface ModalState {
  isOpen: boolean
  mode: 'add' | 'edit'
  category: CategoryKey
  initialValue: string
  editIndex: number | null
}

const CATEGORY_META: Record<CategoryKey, {
  label: string
  singular: string
  icon: any
  placeholder: string
  example: string
  description: string
}> = {
  years: {
    label: 'Graduation Batches',
    singular: 'Graduation Year',
    icon: Calendar,
    placeholder: 'e.g. 2026',
    example: 'Enter passing out batch year (e.g. 2025, 2026, 2027)',
    description: 'Years students graduate in. Used for batch-wise filtering and eligibility checks.'
  },
  types: {
    label: 'Degree Programs / Types',
    singular: 'Degree Type',
    icon: Award,
    placeholder: 'e.g. B.Tech or M.Tech or MCA',
    example: 'Enter degree name or abbreviation (e.g. B.Tech, M.Tech, MBA, MCA, B.Sc)',
    description: 'Degree types offered by your institution for undergraduate and postgraduate programs.'
  },
  departments: {
    label: 'Academic Departments',
    singular: 'Department',
    icon: Building2,
    placeholder: 'e.g. Computer Science & Engineering',
    example: 'Enter department name (e.g. Computer Science, Mechanical Engineering, IT)',
    description: 'Academic departments / branches students belong to. Companies filter candidates by department.'
  }
}

export function AcademicConfigManager({ 
  collegeId, 
  initialFields, 
  role = collegeId ? 'agency' : 'college' 
}: AcademicConfigManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Saved baseline for detecting changes
  const [savedConfig, setSavedConfig] = useState<AcademicConfig>({
    years: initialFields?.years || [],
    types: initialFields?.types || [],
    departments: initialFields?.departments || []
  })

  // Working state
  const [config, setConfig] = useState<AcademicConfig>({
    years: initialFields?.years || [],
    types: initialFields?.types || [],
    departments: initialFields?.departments || []
  })

  const [activeTab, setActiveTab] = useState<CategoryKey>('departments')

  // Modal State
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    mode: 'add',
    category: 'departments',
    initialValue: '',
    editIndex: null
  })

  const [modalInputValue, setModalInputValue] = useState('')
  const [modalError, setModalError] = useState<string | null>(null)
  const [pendingRenames, setPendingRenames] = useState<Array<{ category: CategoryKey, oldValue: string, newValue: string }>>([])

  const hasUnsavedChanges = JSON.stringify(config) !== JSON.stringify(savedConfig)

  const openAddModal = (category: CategoryKey) => {
    setModalState({
      isOpen: true,
      mode: 'add',
      category,
      initialValue: '',
      editIndex: null
    })
    setModalInputValue('')
    setModalError(null)
  }

  const openEditModal = (category: CategoryKey, index: number, value: string) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      category,
      initialValue: value,
      editIndex: index
    })
    setModalInputValue(value)
    setModalError(null)
  }

  const handleModalSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = modalInputValue.trim()
    if (!trimmed) {
      setModalError('Value cannot be empty.')
      return
    }

    const currentList = config[modalState.category]
    const isDuplicate = currentList.some((item, idx) => 
      item.toLowerCase() === trimmed.toLowerCase() && 
      (modalState.mode === 'add' || idx !== modalState.editIndex)
    )

    if (isDuplicate) {
      setModalError(`"${trimmed}" is already in this list.`)
      return
    }

    if (modalState.mode === 'add') {
      setConfig(prev => ({
        ...prev,
        [modalState.category]: [...prev[modalState.category], trimmed]
      }))
      toast.success(`Added "${trimmed}" to ${CATEGORY_META[modalState.category].label}`)
    } else if (modalState.mode === 'edit' && modalState.editIndex !== null) {
      const oldValue = modalState.initialValue
      const updatedList = [...currentList]
      updatedList[modalState.editIndex] = trimmed
      setConfig(prev => ({
        ...prev,
        [modalState.category]: updatedList
      }))

      if (oldValue && oldValue !== trimmed) {
        setPendingRenames(prev => {
          // If oldValue was itself previously renamed from something else (e.g. A -> B, now B -> C), merge as A -> C
          const existingIndex = prev.findIndex(r => r.category === modalState.category && r.newValue === oldValue)
          if (existingIndex !== -1) {
            const updated = [...prev]
            updated[existingIndex] = { ...updated[existingIndex], newValue: trimmed }
            return updated
          }
          return [...prev, { category: modalState.category, oldValue, newValue: trimmed }]
        })
      }
      toast.success(`Updated "${oldValue}" to "${trimmed}"`)
    }

    setModalState(prev => ({ ...prev, isOpen: false }))
  }

  const handleDeleteItem = (category: CategoryKey, index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }))
    // Also remove from pending renames if deleted before save
    setPendingRenames(prev => prev.filter(r => !(r.category === category && (r.oldValue === value || r.newValue === value))))
    toast.info(`Removed "${value}"`)
  }

  const handleReset = () => {
    setConfig(savedConfig)
    setPendingRenames([])
    toast.info('Reset changes to saved configuration')
  }

  const handleSaveToDatabase = () => {
    startTransition(async () => {
      const fd = new FormData()
      if (collegeId) {
        fd.append('collegeId', collegeId)
      }
      fd.append('onboarding_fields_json', JSON.stringify(config))
      if (pendingRenames.length > 0) {
        fd.append('renames_json', JSON.stringify(pendingRenames))
      }

      const res = role === 'agency' && collegeId 
        ? await updateCollegeOnboardingFields(fd)
        : await updateCollegeAcademicConfig(fd)

      if (res?.error) {
        toast.error(res.error)
      } else {
        setSavedConfig(config)
        setPendingRenames([])
        toast.success(res?.success || 'Configuration saved successfully!')
        router.refresh()
      }
    })
  }

  return (
    <Card className="shadow-sm border">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Academic Lists Configuration
          </CardTitle>
          <CardDescription className="mt-1">
            Configure graduation batches, degree programs, and departments. Students choose from these verified options during onboarding and profile setup.
          </CardDescription>
        </div>

        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset} 
              disabled={isPending}
            >
              <Undo2 className="h-4 w-4 mr-1.5" />
              Reset
            </Button>
            <Button 
              size="sm" 
              onClick={handleSaveToDatabase} 
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Save Changes
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as CategoryKey)} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            {(Object.keys(CATEGORY_META) as CategoryKey[]).map((key) => {
              const meta = CATEGORY_META[key]
              const Icon = meta.icon
              const count = config[key].length
              return (
                <TabsTrigger key={key} value={key} className="flex items-center gap-2 py-2.5">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{meta.label}</span>
                  <span className="sm:hidden">{meta.singular}</span>
                  <span className="ml-1 rounded-full bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 text-xs font-semibold">
                    {count}
                  </span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {(Object.keys(CATEGORY_META) as CategoryKey[]).map((key) => {
            const meta = CATEGORY_META[key]
            const items = config[key]
            const Icon = meta.icon

            return (
              <TabsContent key={key} value={key} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border">
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Icon className="h-4 w-4 text-blue-600" />
                      {meta.label} ({items.length})
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{meta.description}</p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => openAddModal(key)}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add {meta.singular}
                  </Button>
                </div>

                {items.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {items.map((item, index) => (
                      <div 
                        key={`${item}-${index}`}
                        className="group flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-zinc-950 hover:border-blue-400 dark:hover:border-blue-700 transition-colors shadow-2xs"
                      >
                        <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate pr-2" title={item}>
                          {item}
                        </div>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950" 
                            onClick={() => openEditModal(key, index, item)}
                            title={`Edit ${item}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" 
                            onClick={() => handleDeleteItem(key, index, item)}
                            title={`Delete ${item}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 px-4 rounded-lg border border-dashed bg-zinc-50/50 dark:bg-zinc-900/50">
                    <Icon className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-3" />
                    <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No {meta.label.toLowerCase()} added yet</h4>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                      Click below to add the first {meta.singular.toLowerCase()} to allow students to select it during registration.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4" 
                      onClick={() => openAddModal(key)}
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add First {meta.singular}
                    </Button>
                  </div>
                )}
              </TabsContent>
            )
          })}
        </Tabs>

        {/* Global Save Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
          <div className="text-xs text-zinc-500 flex items-center gap-1.5">
            {hasUnsavedChanges ? (
              <div className="space-y-0.5">
                <span className="text-amber-600 dark:text-amber-400 font-medium block">
                  ● You have unsaved changes in academic lists.
                </span>
                {pendingRenames.length > 0 && (
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 block font-normal">
                    ⚡ Saving will automatically update existing students, jobs, and audit records matching: {pendingRenames.map(r => `"${r.oldValue}" → "${r.newValue}"`).join(', ')}.
                  </span>
                )}
              </div>
            ) : (
              <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> All lists are saved.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {hasUnsavedChanges && (
              <Button 
                variant="outline" 
                onClick={handleReset} 
                disabled={isPending}
                className="flex-1 sm:flex-none"
              >
                Reset
              </Button>
            )}
            <Button 
              onClick={handleSaveToDatabase} 
              disabled={isPending || !hasUnsavedChanges}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Academic Lists
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Add / Edit Item Modal */}
      <Dialog 
        open={modalState.isOpen} 
        onOpenChange={(open) => setModalState(prev => ({ ...prev, isOpen: open }))}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {modalState.mode === 'add' ? `Add ${CATEGORY_META[modalState.category].singular}` : `Edit ${CATEGORY_META[modalState.category].singular}`}
            </DialogTitle>
            <DialogDescription>
              {CATEGORY_META[modalState.category].example}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleModalSave} className="space-y-4 pt-2">
            {modalError && (
              <div className="p-2.5 rounded-md bg-red-50 text-red-600 text-xs border border-red-200">
                {modalError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="itemValue">
                {CATEGORY_META[modalState.category].singular} Name / Value
              </Label>
              <Input
                id="itemValue"
                value={modalInputValue}
                onChange={(e) => {
                  setModalInputValue(e.target.value)
                  if (modalError) setModalError(null)
                }}
                placeholder={CATEGORY_META[modalState.category].placeholder}
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </Button>
              <Button type="submit">
                {modalState.mode === 'add' ? 'Add to List' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

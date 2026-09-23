'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { addCollege } from '@/app/(dashboards)/agency/actions'
import { Plus, X, Building2, GraduationCap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function AddCollegeModal() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Academic Configuration state
  const [years, setYears] = useState<string[]>(['2025', '2026', '2027', '2028'])
  const [types, setTypes] = useState<string[]>(['B.Tech', 'M.Tech', 'MCA', 'MBA'])
  const [departments, setDepartments] = useState<string[]>([
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering'
  ])

  // New item inputs
  const [newYear, setNewYear] = useState('')
  const [newType, setNewType] = useState('')
  const [newDept, setNewDept] = useState('')

  const handleAddYear = () => {
    const val = newYear.trim()
    if (val && !years.includes(val)) {
      setYears([...years, val])
      setNewYear('')
    }
  }

  const handleAddType = () => {
    const val = newType.trim()
    if (val && !types.includes(val)) {
      setTypes([...types, val])
      setNewType('')
    }
  }

  const handleAddDept = () => {
    const val = newDept.trim()
    if (val && !departments.includes(val)) {
      setDepartments([...departments, val])
      setNewDept('')
    }
  }

  const handleRemoveItem = (list: string[], setList: (l: string[]) => void, itemToRemove: string) => {
    setList(list.filter(item => item !== itemToRemove))
  }

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    formData.append('onboarding_fields_json', JSON.stringify({
      years,
      types,
      departments
    }))

    startTransition(async () => {
      const result = await addCollege(formData)
      if (result?.error) {
        setError(result.error)
        toast.error(result.error)
      } else {
        toast.success(result?.success || 'College created successfully!')
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add New College</Button>} />
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Register New Partner College
          </DialogTitle>
          <DialogDescription>
            Enter the college details, contact information, and initial academic lists. The admin will receive an invitation to set up their account.
          </DialogDescription>
        </DialogHeader>
        
        <form action={handleSubmit} className="space-y-6 pt-2">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/50 dark:text-red-200 border border-red-200">
              {error}
            </div>
          )}

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                College Profile Details
              </TabsTrigger>
              <TabsTrigger value="academic" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Academic Lists Setup
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Profile Details */}
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">College Name <span className="text-red-500">*</span></Label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="e.g. Indian Institute of Technology Bombay" 
                    required 
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="adminEmail">Primary College Admin Email <span className="text-red-500">*</span></Label>
                  <Input 
                    id="adminEmail" 
                    name="adminEmail" 
                    type="email" 
                    placeholder="placement.officer@college.edu" 
                    required 
                  />
                  <p className="text-xs text-zinc-500">An invitation email with access credentials will be dispatched to this address.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Official Website URL</Label>
                  <Input 
                    id="website" 
                    name="website" 
                    type="url" 
                    placeholder="https://www.college.edu" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location / City & State</Label>
                  <Input 
                    id="location" 
                    name="location" 
                    placeholder="e.g. Mumbai, Maharashtra" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">Public Contact Email</Label>
                  <Input 
                    id="contact_email" 
                    name="contact_email" 
                    type="email" 
                    placeholder="placements@college.edu" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input 
                    id="contact_phone" 
                    name="contact_phone" 
                    type="tel" 
                    placeholder="+91 98765 43210" 
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">About the College / Placement Cell</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Brief description of the institution, university affiliation, accreditation, etc." 
                    className="min-h-[90px]"
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Academic Lists Setup */}
            <TabsContent value="academic" className="space-y-5">
              <div className="rounded-md bg-blue-50/60 dark:bg-blue-950/30 p-3 text-xs text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                Configure initial academic options. You can easily add, edit, or delete items later from the college details page.
              </div>

              {/* Batches */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Graduation Batches / Years</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g. 2029" 
                    value={newYear} 
                    onChange={e => setNewYear(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddYear() } }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddYear}>Add Year</Button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {years.map(y => (
                    <span key={y} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 border">
                      {y}
                      <button type="button" onClick={() => handleRemoveItem(years, setYears, y)} className="text-zinc-400 hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Degrees */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Degree Types / Programs</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g. B.Sc or Ph.D" 
                    value={newType} 
                    onChange={e => setNewType(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddType() } }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddType}>Add Degree</Button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {types.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 border">
                      {t}
                      <button type="button" onClick={() => handleRemoveItem(types, setTypes, t)} className="text-zinc-400 hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Departments */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Academic Departments / Branches</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g. Civil Engineering" 
                    value={newDept} 
                    onChange={e => setNewDept(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddDept() } }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddDept}>Add Dept</Button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {departments.map(d => (
                    <span key={d} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 border">
                      {d}
                      <button type="button" onClick={() => handleRemoveItem(departments, setDepartments, d)} className="text-zinc-400 hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="pt-4 border-t flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register College'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

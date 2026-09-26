'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { MapPin, Briefcase, Award, Building2, UserX, AlertCircle, Plus, Loader2 } from 'lucide-react'
import { addMasterListItem, toggleMasterListItem } from './actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export type MasterListItem = {
  id: string
  category: string
  value: string
  is_active: boolean
  created_at: string
}

const CATEGORIES = [
  { id: 'city', label: 'Cities / Hubs', icon: MapPin, description: 'Location hubs for colleges and jobs.' },
  { id: 'degree', label: 'Degree Types', icon: Award, description: 'Standard degree programs.' },
  { id: 'workplace_mode', label: 'Workplace Modes', icon: Building2, description: 'On-site, Hybrid, Remote, etc.' },
  { id: 'employment_type', label: 'Employment Types', icon: Briefcase, description: 'Full-time, Internship, etc.' },
  { id: 'drive_mode', label: 'Drive Modes', icon: Building2, description: 'On-Campus, Off-Campus, Pooled.' },
  { id: 'withdrawal_reason', label: 'Withdrawal Reasons', icon: UserX, description: 'Reasons for students dropping out.' },
  { id: 'no_show_reason', label: 'No-Show Reasons', icon: AlertCircle, description: 'Valid reasons for missing a drive.' },
]

export function ManageListsClient({ initialData }: { initialData: MasterListItem[] }) {
  const [activeTab, setActiveTab] = useState<string>('city')
  const [newItemValue, setNewItemValue] = useState('')
  const [isPending, startTransition] = useTransition()
  
  // Optimistic UI state
  const [data, setData] = useState(initialData)

  const currentItems = data.filter(item => item.category === activeTab)
  const activeCount = currentItems.filter(item => item.is_active).length

  const handleAdd = () => {
    if (!newItemValue.trim()) return

    const valueToAdd = newItemValue.trim()
    
    // Prevent duplicate submission in UI
    if (currentItems.some(i => i.value.toLowerCase() === valueToAdd.toLowerCase())) {
      toast.error(`"${valueToAdd}" already exists in this list.`)
      return
    }

    startTransition(async () => {
      // Optimistic update
      const tempId = `temp-${Date.now()}`
      setData(prev => [...prev, {
        id: tempId,
        category: activeTab,
        value: valueToAdd,
        is_active: true,
        created_at: new Date().toISOString()
      }])
      setNewItemValue('')

      const res = await addMasterListItem(activeTab, valueToAdd)
      
      if (res?.error) {
        toast.error(res.error)
        // Revert optimistic update
        setData(prev => prev.filter(i => i.id !== tempId))
      } else {
        toast.success('Added successfully!')
        // We rely on server revalidation to refresh actual data from DB,
        // but since we updated state optimistically, the UI already reflects the addition.
        // Revalidation will overwrite our tempId with the real UUID shortly.
      }
    })
  }

  const handleToggle = (item: MasterListItem) => {
    const newStatus = !item.is_active
    startTransition(async () => {
      // Optimistic update
      setData(prev => prev.map(i => i.id === item.id ? { ...i, is_active: newStatus } : i))
      
      const res = await toggleMasterListItem(item.id, newStatus)
      if (res?.error) {
        toast.error(res.error)
        // Revert
        setData(prev => prev.map(i => i.id === item.id ? { ...i, is_active: item.is_active } : i))
      }
    })
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 h-auto p-1 gap-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const count = data.filter(d => d.category === cat.id && d.is_active).length
              return (
                <TabsTrigger 
                  key={cat.id} 
                  value={cat.id} 
                  className="flex flex-col items-center gap-1.5 py-2.5 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900"
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline">{cat.label}</span>
                  </div>
                  <span className="lg:hidden">{cat.label}</span>
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full mt-0.5", 
                    count > 0 ? "bg-green-500" : "bg-zinc-300"
                  )} />
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        {CATEGORIES.map((cat) => (
          <Tabs key={cat.id} value={activeTab} className="w-full">
            <TabsContent value={cat.id} className="mt-0 outline-none">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <cat.icon className="h-5 w-5 text-blue-600" />
                    {cat.label}
                  </h3>
                  <p className="text-sm text-zinc-500">{cat.description}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-xs text-zinc-500 mr-2">
                    {activeCount} Active Options
                  </div>
                  <Input 
                    placeholder={`Add new ${cat.label.toLowerCase()}...`}
                    className="w-full sm:w-64"
                    value={newItemValue}
                    onChange={(e) => setNewItemValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    disabled={isPending}
                  />
                  <Button size="sm" onClick={handleAdd} disabled={isPending || !newItemValue.trim()}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                    Add
                  </Button>
                </div>
              </div>

              {currentItems.length > 0 ? (
                <div className="border rounded-md overflow-hidden bg-white dark:bg-zinc-950">
                  <div className="grid grid-cols-12 bg-zinc-50 dark:bg-zinc-900 border-b px-4 py-3 text-xs font-semibold text-zinc-500">
                    <div className="col-span-8 sm:col-span-10">Value</div>
                    <div className="col-span-4 sm:col-span-2 text-right">Status</div>
                  </div>
                  <div className="divide-y max-h-[500px] overflow-y-auto">
                    {currentItems.map((item) => (
                      <div key={item.id} className={cn(
                        "grid grid-cols-12 px-4 py-3 items-center transition-colors",
                        !item.is_active && "bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-400"
                      )}>
                        <div className="col-span-8 sm:col-span-10 font-medium text-sm">
                          {item.value}
                          {!item.is_active && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              <AlertCircle className="h-3 w-3" /> Archived
                            </span>
                          )}
                        </div>
                        <div className="col-span-4 sm:col-span-2 flex justify-end">
                          <Switch 
                            checked={item.is_active}
                            onCheckedChange={() => handleToggle(item)}
                            disabled={isPending}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 px-4 rounded-lg border border-dashed bg-zinc-50/50 dark:bg-zinc-900/50">
                  <cat.icon className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-3" />
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No {cat.label} configured</h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    Add standard options above to populate dropdowns across the platform.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ))}
      </CardContent>
    </Card>
  )
}

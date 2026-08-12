'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

export type ApplicationLimitPolicyData = {
  enabled: boolean;
  max_total: number | null;
  max_active: number | null;
  max_per_cycle: number | null;
  max_per_level: number | null;
  max_per_category: number | null;
  max_per_job_type: number | null;
  max_per_day: number | null;
  max_per_week: number | null;
}

type Props = {
  data: ApplicationLimitPolicyData
  onChange: (data: ApplicationLimitPolicyData) => void
}

export function ApplicationLimitPolicy({ data, onChange }: Props) {
  const update = (partial: Partial<ApplicationLimitPolicyData>) => onChange({ ...data, ...partial })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base">Enable Application Limit Policy</Label>
        <Switch checked={data.enabled} onCheckedChange={(enabled) => update({ enabled })} />
      </div>

      <div className={`grid gap-4 md:grid-cols-2 ${!data.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="space-y-2">
          <Label>Max Total</Label>
          <Input type="number" value={data.max_total ?? ''} onChange={(e) => update({ max_total: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Max Active</Label>
          <Input type="number" value={data.max_active ?? ''} onChange={(e) => update({ max_active: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Max Per Cycle</Label>
          <Input type="number" value={data.max_per_cycle ?? ''} onChange={(e) => update({ max_per_cycle: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Max Per Level</Label>
          <Input type="number" value={data.max_per_level ?? ''} onChange={(e) => update({ max_per_level: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Max Per Category</Label>
          <Input type="number" value={data.max_per_category ?? ''} onChange={(e) => update({ max_per_category: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Max Per Job Type</Label>
          <Input type="number" value={data.max_per_job_type ?? ''} onChange={(e) => update({ max_per_job_type: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Max Per Day</Label>
          <Input type="number" value={data.max_per_day ?? ''} onChange={(e) => update({ max_per_day: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Max Per Week</Label>
          <Input type="number" value={data.max_per_week ?? ''} onChange={(e) => update({ max_per_week: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
      </div>
    </div>
  )
}

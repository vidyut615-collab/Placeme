'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export type JobTypePolicyData = {
  enabled: boolean;
  cross_type_application_allowed: boolean;
  cross_type_movement_requires_approval: boolean;
}

type Props = {
  data: JobTypePolicyData
  onChange: (data: JobTypePolicyData) => void
}

export function JobTypePolicy({ data, onChange }: Props) {
  const update = (partial: Partial<JobTypePolicyData>) => onChange({ ...data, ...partial })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base">Enable Job Type Policy</Label>
        <Switch checked={data.enabled} onCheckedChange={(enabled) => update({ enabled })} />
      </div>

      <div className={`grid gap-4 md:grid-cols-2 ${!data.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        
        <div className="flex items-center space-x-2 pt-2">
          <Switch checked={data.cross_type_application_allowed} onCheckedChange={(val) => update({ cross_type_application_allowed: val })} />
          <Label>Cross Type Application Allowed</Label>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Switch checked={data.cross_type_movement_requires_approval} onCheckedChange={(val) => update({ cross_type_movement_requires_approval: val })} />
          <Label>Cross Type Movement Requires Approval</Label>
        </div>

      </div>
    </div>
  )
}

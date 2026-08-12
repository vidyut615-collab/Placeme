'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type LevelMovementRule = {
  from_level: string
  to_level: string
  rule: 'allowed' | 'not_allowed' | 'approval_required'
}

type PolicyData = {
  enabled: boolean
  movement_rules?: LevelMovementRule[]
  requires_higher_package: boolean
  requires_approval: boolean
}

type Props = {
  data: PolicyData
  onChange: (data: PolicyData) => void
}

export function LevelMovementPolicy({ data, onChange }: Props) {
  const update = (partial: Partial<PolicyData>) => onChange({ ...data, ...partial })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Enable Level Movement Policy</Label>
        <Switch
          checked={data.enabled}
          onCheckedChange={(checked) => update({ enabled: checked })}
        />
      </div>

      <div className={`space-y-6 ${!data.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <p className="text-sm text-muted-foreground">
          Movement rules are configured per-level pair. Enable to enforce level movement restrictions.
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between border p-3 rounded-md">
            <Label>Requires Higher Package</Label>
            <Switch
              checked={data.requires_higher_package}
              onCheckedChange={(checked) => update({ requires_higher_package: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between border p-3 rounded-md">
            <Label>Requires Approval</Label>
            <Switch
              checked={data.requires_approval}
              onCheckedChange={(checked) => update({ requires_approval: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

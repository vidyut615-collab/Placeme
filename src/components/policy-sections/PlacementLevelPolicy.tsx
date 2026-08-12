'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export type PlacementLevelPolicyData = {
  enabled: boolean;
}

type Props = {
  data: PlacementLevelPolicyData
  onChange: (data: PlacementLevelPolicyData) => void
}

export function PlacementLevelPolicy({ data, onChange }: Props) {
  const update = (partial: Partial<PlacementLevelPolicyData>) => onChange({ ...data, ...partial })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base">Enable Placement Level Policy</Label>
        <Switch checked={data.enabled} onCheckedChange={(enabled) => update({ enabled })} />
      </div>

      <div className={`text-sm text-muted-foreground ${!data.enabled ? 'opacity-50' : ''}`}>
        Placement levels are managed from the Levels table. Enable this policy to enforce level-based rules.
      </div>
    </div>
  )
}

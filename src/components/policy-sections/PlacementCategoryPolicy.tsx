'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export type PlacementCategoryPolicyData = {
  enabled: boolean;
}

type Props = {
  data: PlacementCategoryPolicyData
  onChange: (data: PlacementCategoryPolicyData) => void
}

export function PlacementCategoryPolicy({ data, onChange }: Props) {
  const update = (partial: Partial<PlacementCategoryPolicyData>) => onChange({ ...data, ...partial })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base">Enable Placement Category Policy</Label>
        <Switch checked={data.enabled} onCheckedChange={(enabled) => update({ enabled })} />
      </div>

      <div className={`text-sm text-muted-foreground ${!data.enabled ? 'opacity-50' : ''}`}>
        Placement categories are managed within levels. Enable this policy to enforce category-based rules.
      </div>
    </div>
  )
}

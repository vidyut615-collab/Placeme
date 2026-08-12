'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type PolicyData = {
  enabled: boolean
  exceptions: any[]
}

type Props = {
  data: PolicyData
  onChange: (data: PolicyData) => void
}

export function SpecialExceptionPolicy({ data, onChange }: Props) {
  const update = (partial: Partial<PolicyData>) => onChange({ ...data, ...partial })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Enable Special Exceptions</Label>
        <Switch
          checked={data.enabled}
          onCheckedChange={(checked) => update({ enabled: checked })}
        />
      </div>

      <div className={`space-y-4 ${!data.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <p className="text-sm text-muted-foreground">
          Exception rules can be added to handle special cases like Core vs Non-Core, International opportunities, PPOs, etc. Each exception defines a trigger condition and an override action.
        </p>
      </div>
    </div>
  )
}

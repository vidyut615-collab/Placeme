'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type PolicyData = {
  enabled: boolean
  dual_approval_required: boolean
  reason_mandatory: boolean
  document_required: boolean
}

type Props = {
  data: PolicyData
  onChange: (data: PolicyData) => void
}

export function OverrideManagementPolicy({ data, onChange }: Props) {
  const update = (partial: Partial<PolicyData>) => onChange({ ...data, ...partial })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Enable Override Management Policy</Label>
        <Switch
          checked={data.enabled}
          onCheckedChange={(checked) => update({ enabled: checked })}
        />
      </div>

      <div className={`space-y-6 ${!data.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <p className="text-sm text-muted-foreground">
          When enabled, T&P officers can grant policy overrides for individual students. This ensures accountability with full audit trails.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between border p-3 rounded-md">
            <Label>Dual Approval Required</Label>
            <Switch
              checked={data.dual_approval_required}
              onCheckedChange={(checked) => update({ dual_approval_required: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between border p-3 rounded-md">
            <Label>Reason Mandatory</Label>
            <Switch
              checked={data.reason_mandatory}
              onCheckedChange={(checked) => update({ reason_mandatory: checked })}
            />
          </div>

          <div className="flex items-center justify-between border p-3 rounded-md">
            <Label>Document Required</Label>
            <Switch
              checked={data.document_required}
              onCheckedChange={(checked) => update({ document_required: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

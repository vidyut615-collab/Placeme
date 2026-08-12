'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

type PolicyData = {
  enabled: boolean
  all_modules_required: boolean
  min_score: number | null
  override_allowed: boolean
}

type Props = {
  data: PolicyData
  onChange: (data: PolicyData) => void
}

export function TrainingReadinessPolicy({ data, onChange }: Props) {
  const update = (partial: Partial<PolicyData>) => onChange({ ...data, ...partial })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Enable Training Readiness Policy</Label>
        <Switch
          checked={data.enabled}
          onCheckedChange={(checked) => update({ enabled: checked })}
        />
      </div>

      <div className={`space-y-6 ${!data.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <p className="text-sm text-muted-foreground">
          Training modules are managed separately. This policy enforces module completion as a prerequisite for placement applications.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between border p-3 rounded-md">
            <Label>All Modules Required</Label>
            <Switch
              checked={data.all_modules_required}
              onCheckedChange={(checked) => update({ all_modules_required: checked })}
            />
          </div>

          <div className="flex items-center justify-between border p-3 rounded-md">
            <Label>Allow T&P Override</Label>
            <Switch
              checked={data.override_allowed}
              onCheckedChange={(checked) => update({ override_allowed: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label>Minimum Average Score</Label>
            <Input
              type="number"
              value={data.min_score ?? ''}
              onChange={(e) => update({ min_score: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

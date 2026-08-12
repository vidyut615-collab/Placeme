'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type PolicyData = {
  enabled: boolean
  clearance_required_before: 'application' | 'selection' | 'offer' | 'joining'
  backlog_clearance_deadline: string | null
}

type Props = {
  data: PolicyData
  onChange: (data: PolicyData) => void
}

export function AcademicClearancePolicy({ data, onChange }: Props) {
  const update = (partial: Partial<PolicyData>) => onChange({ ...data, ...partial })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Enable Academic Clearance Policy</Label>
        <Switch
          checked={data.enabled}
          onCheckedChange={(checked) => update({ enabled: checked })}
        />
      </div>

      <div className={`space-y-6 ${!data.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <p className="text-sm text-muted-foreground">
          Academic eligibility thresholds (GPA, backlogs, marks) are configured in the Eligibility Policy. This policy controls when clearance is checked.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Clearance Required Before</Label>
            <Select
              value={data.clearance_required_before || ''}
              onValueChange={(val) => update({ clearance_required_before: val as any })}
              disabled={!data.enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="application">Application</SelectItem>
                <SelectItem value="selection">Selection</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="joining">Joining</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Backlog Clearance Deadline</Label>
            <Input
              type="date"
              value={data.backlog_clearance_deadline ?? ''}
              onChange={(e) => update({ backlog_clearance_deadline: e.target.value || null })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

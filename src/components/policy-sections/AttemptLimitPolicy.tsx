'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type PolicyData = {
  enabled: boolean
  max_first_offer_attempts: number | null
  max_additional_offer_attempts: number | null
  what_counts_as_attempt: 'application' | 'shortlist' | 'assessment' | 'interview' | 'selection'
  rejection_consumes_attempt: boolean
  no_show_consumes_attempt: boolean
  withdrawal_consumes_attempt: boolean
}

type Props = {
  data: PolicyData
  onChange: (data: PolicyData) => void
}

export function AttemptLimitPolicy({ data, onChange }: Props) {
  const update = (partial: Partial<PolicyData>) => onChange({ ...data, ...partial })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Enable Attempt Limit Policy</Label>
        <Switch
          checked={data.enabled}
          onCheckedChange={(checked) => update({ enabled: checked })}
        />
      </div>

      <div className={`grid gap-4 md:grid-cols-2 ${!data.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="space-y-2">
          <Label>Max Attempts Before First Offer</Label>
          <Input
            type="number"
            value={data.max_first_offer_attempts ?? ''}
            onChange={(e) => update({ max_first_offer_attempts: e.target.value ? Number(e.target.value) : null })}
          />
        </div>

        <div className="space-y-2">
          <Label>Max Attempts After First Offer</Label>
          <Input
            type="number"
            value={data.max_additional_offer_attempts ?? ''}
            onChange={(e) => update({ max_additional_offer_attempts: e.target.value ? Number(e.target.value) : null })}
          />
        </div>

        <div className="space-y-2">
          <Label>What Counts As Attempt</Label>
          <Select
            value={data.what_counts_as_attempt}
            onValueChange={(val: PolicyData['what_counts_as_attempt']) => update({ what_counts_as_attempt: val })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="application">Application</SelectItem>
              <SelectItem value="shortlist">Shortlist</SelectItem>
              <SelectItem value="assessment">Assessment</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="selection">Selection</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4 pt-4 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between border p-3 rounded-md">
            <Label>Rejection Consumes Attempt</Label>
            <Switch
              checked={data.rejection_consumes_attempt}
              onCheckedChange={(checked) => update({ rejection_consumes_attempt: checked })}
            />
          </div>
          <div className="flex items-center justify-between border p-3 rounded-md">
            <Label>No Show Consumes Attempt</Label>
            <Switch
              checked={data.no_show_consumes_attempt}
              onCheckedChange={(checked) => update({ no_show_consumes_attempt: checked })}
            />
          </div>
          <div className="flex items-center justify-between border p-3 rounded-md">
            <Label>Withdrawal Consumes Attempt</Label>
            <Switch
              checked={data.withdrawal_consumes_attempt}
              onCheckedChange={(checked) => update({ withdrawal_consumes_attempt: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

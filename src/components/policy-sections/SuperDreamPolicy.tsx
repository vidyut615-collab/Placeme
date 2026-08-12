'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type PolicyData = {
  enabled: boolean
  classification_method: 'manual' | 'ctc_based' | 'level_based'
  min_ctc: number | null
  max_attempts: number | null
  max_offers: number | null
  replaces_previous_offer: boolean
  ends_placement: boolean
}

type Props = {
  data: PolicyData
  onChange: (data: PolicyData) => void
}

export function SuperDreamPolicy({ data, onChange }: Props) {
  const update = (partial: Partial<PolicyData>) => onChange({ ...data, ...partial })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Enable Super Dream Policy</Label>
        <Switch
          checked={data.enabled}
          onCheckedChange={(checked) => update({ enabled: checked })}
        />
      </div>

      <div className={`grid gap-4 md:grid-cols-2 ${!data.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="space-y-2">
          <Label>Classification Method</Label>
          <Select
          value={data.classification_method || ''}
          onValueChange={(val) => update({ classification_method: val as any })}
          disabled={!data.enabled}
        >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="ctc_based">CTC Based</SelectItem>
              <SelectItem value="level_based">Level Based</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.classification_method === 'ctc_based' && (
          <div className="space-y-2">
            <Label>Minimum CTC</Label>
            <Input
              type="number"
              value={data.min_ctc ?? ''}
              onChange={(e) => update({ min_ctc: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Max Attempts</Label>
          <Input
            type="number"
            value={data.max_attempts ?? ''}
            onChange={(e) => update({ max_attempts: e.target.value ? Number(e.target.value) : null })}
          />
        </div>

        <div className="space-y-2">
          <Label>Max Offers</Label>
          <Input
            type="number"
            value={data.max_offers ?? ''}
            onChange={(e) => update({ max_offers: e.target.value ? Number(e.target.value) : null })}
          />
        </div>

        <div className="flex items-center justify-between border p-3 rounded-md">
          <Label>Replaces Previous Offer</Label>
          <Switch
            checked={data.replaces_previous_offer}
            onCheckedChange={(checked) => update({ replaces_previous_offer: checked })}
          />
        </div>

        <div className="flex items-center justify-between border p-3 rounded-md">
          <Label>Ends Placement</Label>
          <Switch
            checked={data.ends_placement}
            onCheckedChange={(checked) => update({ ends_placement: checked })}
          />
        </div>
      </div>
    </div>
  )
}

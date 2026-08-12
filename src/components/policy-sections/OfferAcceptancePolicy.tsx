'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type PolicyData = {
  enabled: boolean
  acceptance_window_hours: number | null
  acceptance_window_days: number | null
  expired_offer_action: 'restore_eligibility' | 'no_action' | 'placement_suspension'
  declined_offer_action: 'restore_eligibility' | 'restore_with_restrictions' | 'no_restore'
}

type Props = {
  data: PolicyData
  onChange: (data: PolicyData) => void
}

export function OfferAcceptancePolicy({ data, onChange }: Props) {
  const update = (partial: Partial<PolicyData>) => onChange({ ...data, ...partial })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Enable Offer Acceptance Policy</Label>
        <Switch
          checked={data.enabled}
          onCheckedChange={(checked) => update({ enabled: checked })}
        />
      </div>

      <div className={`grid gap-4 md:grid-cols-2 ${!data.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="space-y-2">
          <Label>Acceptance Window (Hours)</Label>
          <Input
            type="number"
            value={data.acceptance_window_hours ?? ''}
            onChange={(e) => update({ acceptance_window_hours: e.target.value ? Number(e.target.value) : null })}
          />
        </div>

        <div className="space-y-2">
          <Label>Acceptance Window (Days)</Label>
          <Input
            type="number"
            value={data.acceptance_window_days ?? ''}
            onChange={(e) => update({ acceptance_window_days: e.target.value ? Number(e.target.value) : null })}
          />
        </div>

        <div className="space-y-2">
          <Label>Expired Offer Action</Label>
          <Select
            value={data.expired_offer_action || ''}
            onValueChange={(val) => update({ expired_offer_action: val as any })}
            disabled={!data.enabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="restore_eligibility">Restore Eligibility</SelectItem>
              <SelectItem value="no_action">No Action</SelectItem>
              <SelectItem value="placement_suspension">Placement Suspension</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Declined Offer Action</Label>
          <Select
            value={data.declined_offer_action || ''}
            onValueChange={(val) => update({ declined_offer_action: val as any })}
            disabled={!data.enabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="restore_eligibility">Restore Eligibility</SelectItem>
              <SelectItem value="restore_with_restrictions">Restore with Restrictions</SelectItem>
              <SelectItem value="no_restore">No Restore</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

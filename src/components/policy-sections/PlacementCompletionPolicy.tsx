'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type PolicyData = {
  enabled: boolean
  completion_trigger: 'selected' | 'offered' | 'offer_accepted' | 'hired' | 'joined'
  on_offer_withdrawn: 'reopen' | 'no_action' | 'tp_review'
  on_offer_rescinded: 'reopen' | 'no_action' | 'tp_review'
  on_not_joined: 'reopen' | 'no_action' | 'tp_review'
  counts_for_statistics: 'selected' | 'offered' | 'offer_accepted' | 'hired' | 'joined'
}

type Props = {
  data: PolicyData
  onChange: (data: PolicyData) => void
}

export function PlacementCompletionPolicy({ data, onChange }: Props) {
  const update = (partial: Partial<PolicyData>) => onChange({ ...data, ...partial })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Enable Placement Completion Policy</Label>
        <Switch
          checked={data.enabled}
          onCheckedChange={(checked) => update({ enabled: checked })}
        />
      </div>

      <div className={`grid gap-4 md:grid-cols-2 ${!data.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="space-y-2">
          <Label>Completion Trigger</Label>
          <Select
            value={data.completion_trigger}
            onValueChange={(val: PolicyData['completion_trigger']) => update({ completion_trigger: val })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="selected">Selected</SelectItem>
              <SelectItem value="offered">Offered</SelectItem>
              <SelectItem value="offer_accepted">Offer Accepted</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="joined">Joined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>On Offer Withdrawn</Label>
          <Select
            value={data.on_offer_withdrawn}
            onValueChange={(val: PolicyData['on_offer_withdrawn']) => update({ on_offer_withdrawn: val })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reopen">Reopen</SelectItem>
              <SelectItem value="no_action">No Action</SelectItem>
              <SelectItem value="tp_review">T&P Review</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>On Offer Rescinded</Label>
          <Select
            value={data.on_offer_rescinded}
            onValueChange={(val: PolicyData['on_offer_rescinded']) => update({ on_offer_rescinded: val })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reopen">Reopen</SelectItem>
              <SelectItem value="no_action">No Action</SelectItem>
              <SelectItem value="tp_review">T&P Review</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>On Not Joined</Label>
          <Select
            value={data.on_not_joined}
            onValueChange={(val: PolicyData['on_not_joined']) => update({ on_not_joined: val })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reopen">Reopen</SelectItem>
              <SelectItem value="no_action">No Action</SelectItem>
              <SelectItem value="tp_review">T&P Review</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Counts For Statistics</Label>
          <Select
            value={data.counts_for_statistics}
            onValueChange={(val: PolicyData['counts_for_statistics']) => update({ counts_for_statistics: val })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="selected">Selected</SelectItem>
              <SelectItem value="offered">Offered</SelectItem>
              <SelectItem value="offer_accepted">Offer Accepted</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="joined">Joined</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

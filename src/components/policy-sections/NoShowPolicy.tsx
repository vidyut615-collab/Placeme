'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type NoShowPolicyData = {
  enabled: boolean;
  max_no_shows: number;
  first_consequence: 'warning' | 'temporary_restriction' | 'placement_suspension';
  second_consequence: 'warning' | 'temporary_restriction' | 'placement_suspension';
  third_consequence: 'warning' | 'temporary_restriction' | 'placement_suspension';
  restriction_duration_days: number | null;
  valid_reasons: string[];
  document_required_for_excuse: boolean;
}

type Props = {
  data: NoShowPolicyData
  onChange: (data: NoShowPolicyData) => void
}

export function NoShowPolicy({ data, onChange }: Props) {
  const update = (partial: Partial<NoShowPolicyData>) => onChange({ ...data, ...partial })

  const consequenceOptions = [
    { value: 'warning', label: 'Warning' },
    { value: 'temporary_restriction', label: 'Temporary Restriction' },
    { value: 'placement_suspension', label: 'Placement Suspension' }
  ]

  const parseArray = (val: string) => val.split(',').map(s => s.trim()).filter(Boolean)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base">Enable No Show Policy</Label>
        <Switch checked={data.enabled} onCheckedChange={(enabled) => update({ enabled })} />
      </div>

      <div className={`grid gap-4 md:grid-cols-2 ${!data.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="space-y-2">
          <Label>Max No Shows</Label>
          <Input type="number" value={data.max_no_shows ?? ''} onChange={(e) => update({ max_no_shows: Number(e.target.value) })} />
        </div>

        <div className="space-y-2">
          <Label>First Consequence</Label>
          <Select value={data.first_consequence} onValueChange={(val: any) => update({ first_consequence: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Select consequence" />
            </SelectTrigger>
            <SelectContent>
              {consequenceOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Second Consequence</Label>
          <Select value={data.second_consequence} onValueChange={(val: any) => update({ second_consequence: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Select consequence" />
            </SelectTrigger>
            <SelectContent>
              {consequenceOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Third Consequence</Label>
          <Select value={data.third_consequence} onValueChange={(val: any) => update({ third_consequence: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Select consequence" />
            </SelectTrigger>
            <SelectContent>
              {consequenceOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Restriction Duration (Days)</Label>
          <Input type="number" value={data.restriction_duration_days ?? ''} onChange={(e) => update({ restriction_duration_days: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>

        <div className="space-y-2">
          <Label>Valid Reasons (comma-separated)</Label>
          <Input value={(data.valid_reasons || []).join(', ')} onChange={(e) => update({ valid_reasons: parseArray(e.target.value) })} />
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Switch checked={data.document_required_for_excuse} onCheckedChange={(val) => update({ document_required_for_excuse: val })} />
          <Label>Document Required for Excuse</Label>
        </div>
      </div>
    </div>
  )
}

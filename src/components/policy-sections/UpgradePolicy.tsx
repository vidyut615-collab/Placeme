'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type UpgradePolicyData = {
  enabled: boolean;
  comparison_field: 'compensation_ctc' | 'compensation_fixed' | 'total_compensation';
  comparison_operator: 'greater_than' | 'greater_than_or_equal';
  min_increment_pct: number | null;
  min_increment_amount: number | null;
  must_be_higher_level: boolean;
  must_be_higher_category: boolean;
  max_upgrade_attempts: number | null;
  rejection_consumes_attempt: boolean;
  new_offer_replaces_old: boolean;
  can_return_to_previous: boolean;
}

type Props = {
  data: UpgradePolicyData
  onChange: (data: UpgradePolicyData) => void
}

export function UpgradePolicy({ data, onChange }: Props) {
  const update = (partial: Partial<UpgradePolicyData>) => onChange({ ...data, ...partial })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base">Enable Upgrade Policy</Label>
        <Switch checked={data.enabled} onCheckedChange={(enabled) => update({ enabled })} />
      </div>

      <div className={`grid gap-4 md:grid-cols-2 ${!data.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="space-y-2">
          <Label>Comparison Field</Label>
          <Select value={data.comparison_field} onValueChange={(val: any) => update({ comparison_field: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compensation_ctc">Compensation CTC</SelectItem>
              <SelectItem value="compensation_fixed">Compensation Fixed</SelectItem>
              <SelectItem value="total_compensation">Total Compensation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Comparison Operator</Label>
          <Select value={data.comparison_operator} onValueChange={(val: any) => update({ comparison_operator: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="greater_than">Greater Than</SelectItem>
              <SelectItem value="greater_than_or_equal">Greater Than or Equal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Minimum % Increase</Label>
          <Input type="number" value={data.min_increment_pct ?? ''} onChange={(e) => update({ min_increment_pct: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>

        <div className="space-y-2">
          <Label>Minimum Amount Increase</Label>
          <Input type="number" value={data.min_increment_amount ?? ''} onChange={(e) => update({ min_increment_amount: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>

        <div className="space-y-2">
          <Label>Max Upgrade Attempts</Label>
          <Input type="number" value={data.max_upgrade_attempts ?? ''} onChange={(e) => update({ max_upgrade_attempts: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Switch checked={data.must_be_higher_level} onCheckedChange={(val) => update({ must_be_higher_level: val })} />
          <Label>Must Be Higher Level</Label>
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Switch checked={data.must_be_higher_category} onCheckedChange={(val) => update({ must_be_higher_category: val })} />
          <Label>Must Be Higher Category</Label>
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Switch checked={data.rejection_consumes_attempt} onCheckedChange={(val) => update({ rejection_consumes_attempt: val })} />
          <Label>Rejection Consumes Attempt</Label>
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Switch checked={data.new_offer_replaces_old} onCheckedChange={(val) => update({ new_offer_replaces_old: val })} />
          <Label>New Offer Replaces Old</Label>
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Switch checked={data.can_return_to_previous} onCheckedChange={(val) => update({ can_return_to_previous: val })} />
          <Label>Can Return To Previous Offer</Label>
        </div>

      </div>
    </div>
  )
}

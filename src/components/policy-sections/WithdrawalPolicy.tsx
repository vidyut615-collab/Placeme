'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type WithdrawalPolicyData = {
  enabled: boolean;
  rules: {
    after_applied: 'allowed' | 'not_allowed' | 'approval_required';
    after_shortlisted: 'allowed' | 'not_allowed' | 'approval_required';
    after_interviewing: 'allowed' | 'not_allowed' | 'approval_required';
    after_selected: 'allowed' | 'not_allowed' | 'approval_required';
    after_offered: 'allowed' | 'not_allowed' | 'approval_required';
    after_offer_accepted: 'allowed' | 'not_allowed' | 'approval_required';
  };
  consequence: 'none' | 'warning' | 'temporary_restriction' | 'placement_suspension';
  reason_required: boolean;
  document_required: boolean;
}

type Props = {
  data: WithdrawalPolicyData
  onChange: (data: WithdrawalPolicyData) => void
}

export function WithdrawalPolicy({ data, onChange }: Props) {
  const update = (partial: Partial<WithdrawalPolicyData>) => onChange({ ...data, ...partial })
  const updateRule = (key: keyof WithdrawalPolicyData['rules'], value: any) => {
    onChange({ ...data, rules: { ...data.rules, [key]: value } })
  }

  const ruleOptions = [
    { value: 'allowed', label: 'Allowed' },
    { value: 'not_allowed', label: 'Not Allowed' },
    { value: 'approval_required', label: 'Approval Required' }
  ]

  const ruleFields = [
    { key: 'after_applied', label: 'After Applied' },
    { key: 'after_shortlisted', label: 'After Shortlisted' },
    { key: 'after_interviewing', label: 'After Interviewing' },
    { key: 'after_selected', label: 'After Selected' },
    { key: 'after_offered', label: 'After Offered' },
    { key: 'after_offer_accepted', label: 'After Offer Accepted' }
  ] as const

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base">Enable Withdrawal Policy</Label>
        <Switch checked={data.enabled} onCheckedChange={(enabled) => update({ enabled })} />
      </div>

      <div className={`grid gap-4 md:grid-cols-2 ${!data.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {ruleFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            <Select value={data.rules?.[field.key]} onValueChange={(val) => updateRule(field.key, val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select rule" />
              </SelectTrigger>
              <SelectContent>
                {ruleOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        <div className="space-y-2">
          <Label>Consequence</Label>
          <Select value={data.consequence} onValueChange={(val: any) => update({ consequence: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Select consequence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="temporary_restriction">Temporary Restriction</SelectItem>
              <SelectItem value="placement_suspension">Placement Suspension</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Switch checked={data.reason_required} onCheckedChange={(val) => update({ reason_required: val })} />
          <Label>Reason Required</Label>
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Switch checked={data.document_required} onCheckedChange={(val) => update({ document_required: val })} />
          <Label>Document Required</Label>
        </div>

      </div>
    </div>
  )
}

'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

export type EligibilityPolicyData = {
  enabled: boolean;
  min_gpa: number | null;
  min_10th: number | null;
  min_12th: number | null;
  min_diploma: number | null;
  min_graduation: number | null;
  max_active_backlogs: number | null;
  max_historical_backlogs: number | null;
  max_gap_years: number | null;
  allowed_years: string[];
  allowed_types: string[];
  allowed_departments: string[];
  required_skills: string[];
  required_certifications: string[];
}

type Props = {
  data: EligibilityPolicyData
  onChange: (data: EligibilityPolicyData) => void
}

export function EligibilityPolicy({ data, onChange }: Props) {
  const update = (partial: Partial<EligibilityPolicyData>) => onChange({ ...data, ...partial })

  const parseArray = (val: string) => val.split(',').map(s => s.trim()).filter(Boolean)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base">Enable Eligibility Policy</Label>
        <Switch checked={data.enabled} onCheckedChange={(enabled) => update({ enabled })} />
      </div>

      <div className={`grid gap-4 md:grid-cols-2 ${!data.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="space-y-2">
          <Label>Minimum GPA</Label>
          <Input type="number" value={data.min_gpa ?? ''} onChange={(e) => update({ min_gpa: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Minimum 10th %</Label>
          <Input type="number" value={data.min_10th ?? ''} onChange={(e) => update({ min_10th: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Minimum 12th %</Label>
          <Input type="number" value={data.min_12th ?? ''} onChange={(e) => update({ min_12th: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Minimum Diploma %</Label>
          <Input type="number" value={data.min_diploma ?? ''} onChange={(e) => update({ min_diploma: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Minimum Graduation %</Label>
          <Input type="number" value={data.min_graduation ?? ''} onChange={(e) => update({ min_graduation: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Max Active Backlogs</Label>
          <Input type="number" value={data.max_active_backlogs ?? ''} onChange={(e) => update({ max_active_backlogs: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Max Historical Backlogs</Label>
          <Input type="number" value={data.max_historical_backlogs ?? ''} onChange={(e) => update({ max_historical_backlogs: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Max Gap Years</Label>
          <Input type="number" value={data.max_gap_years ?? ''} onChange={(e) => update({ max_gap_years: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Allowed Years (comma-separated)</Label>
          <Input value={(data.allowed_years || []).join(', ')} onChange={(e) => update({ allowed_years: parseArray(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Allowed Types (comma-separated)</Label>
          <Input value={(data.allowed_types || []).join(', ')} onChange={(e) => update({ allowed_types: parseArray(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Allowed Departments (comma-separated)</Label>
          <Input value={(data.allowed_departments || []).join(', ')} onChange={(e) => update({ allowed_departments: parseArray(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Required Skills (comma-separated)</Label>
          <Input value={(data.required_skills || []).join(', ')} onChange={(e) => update({ required_skills: parseArray(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Required Certifications (comma-separated)</Label>
          <Input value={(data.required_certifications || []).join(', ')} onChange={(e) => update({ required_certifications: parseArray(e.target.value) })} />
        </div>
      </div>
    </div>
  )
}

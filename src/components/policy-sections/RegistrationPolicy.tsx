'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export type RegistrationPolicyData = {
  enabled: boolean;
  requirement: 'mandatory' | 'optional';
  late_registration_allowed: boolean;
  approval_required_for_late: boolean;
  min_attendance_pct: number | null;
  academic_clearance_required: boolean;
  orientation_required: boolean;
  training_completion_required: boolean;
}

type Props = {
  data: RegistrationPolicyData
  onChange: (data: RegistrationPolicyData) => void
}

export function RegistrationPolicy({ data, onChange }: Props) {
  const update = (partial: Partial<RegistrationPolicyData>) => onChange({ ...data, ...partial })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base">Enable Registration Policy</Label>
        <Switch checked={data.enabled} onCheckedChange={(enabled) => update({ enabled })} />
      </div>

      <div className={`grid gap-4 md:grid-cols-2 ${!data.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="space-y-2">
          <Label>Requirement</Label>
          <Select value={data.requirement} onValueChange={(val: any) => update({ requirement: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Select requirement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mandatory">Mandatory</SelectItem>
              <SelectItem value="optional">Optional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Switch checked={data.late_registration_allowed} onCheckedChange={(val) => update({ late_registration_allowed: val })} />
          <Label>Late Registration Allowed</Label>
        </div>

        {data.late_registration_allowed && (
          <div className="flex items-center space-x-2 pt-8">
            <Switch checked={data.approval_required_for_late} onCheckedChange={(val) => update({ approval_required_for_late: val })} />
            <Label>Approval Required for Late Registration</Label>
          </div>
        )}

        <div className="space-y-2">
          <Label>Minimum Attendance %</Label>
          <Input 
            type="number" 
            value={data.min_attendance_pct ?? ''} 
            onChange={(e) => update({ min_attendance_pct: e.target.value === '' ? null : Number(e.target.value) })}
          />
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Switch checked={data.academic_clearance_required} onCheckedChange={(val) => update({ academic_clearance_required: val })} />
          <Label>Academic Clearance Required</Label>
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Switch checked={data.orientation_required} onCheckedChange={(val) => update({ orientation_required: val })} />
          <Label>Orientation Required</Label>
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Switch checked={data.training_completion_required} onCheckedChange={(val) => update({ training_completion_required: val })} />
          <Label>Training Completion Required</Label>
        </div>
      </div>
    </div>
  )
}

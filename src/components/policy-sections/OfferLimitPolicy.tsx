'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type OfferLimitPolicyData = {
  enabled: boolean;
  max_offers_total: number | null;
  max_active_offers: number | null;
  max_accepted_offers: number | null;
  max_offers_per_level: number | null;
  max_offers_per_category: number | null;
  debar_on_hired: boolean;
  offer_coexistence: 'student_chooses' | 'highest_remains' | 'latest_remains' | 'tp_decides';
  participation_ends_on: 'first_offer' | 'offer_accepted' | 'hired' | 'joined';
}

type Props = {
  data: OfferLimitPolicyData
  onChange: (data: OfferLimitPolicyData) => void
}

export function OfferLimitPolicy({ data, onChange }: Props) {
  const update = (partial: Partial<OfferLimitPolicyData>) => onChange({ ...data, ...partial })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-base">Enable Offer Limit Policy</Label>
        <Switch checked={data.enabled} onCheckedChange={(enabled) => update({ enabled })} />
      </div>

      <div className={`grid gap-4 md:grid-cols-2 ${!data.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="space-y-2">
          <Label>Max Offers Total</Label>
          <Input type="number" value={data.max_offers_total ?? ''} onChange={(e) => update({ max_offers_total: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        
        <div className="space-y-2">
          <Label>Max Active Offers</Label>
          <Input type="number" value={data.max_active_offers ?? ''} onChange={(e) => update({ max_active_offers: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>

        <div className="space-y-2">
          <Label>Max Accepted Offers</Label>
          <Input type="number" value={data.max_accepted_offers ?? ''} onChange={(e) => update({ max_accepted_offers: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>

        <div className="space-y-2">
          <Label>Max Offers Per Level</Label>
          <Input type="number" value={data.max_offers_per_level ?? ''} onChange={(e) => update({ max_offers_per_level: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>

        <div className="space-y-2">
          <Label>Max Offers Per Category</Label>
          <Input type="number" value={data.max_offers_per_category ?? ''} onChange={(e) => update({ max_offers_per_category: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>

        <div className="space-y-2">
          <Label>Offer Coexistence</Label>
          <Select value={data.offer_coexistence} onValueChange={(val: any) => update({ offer_coexistence: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Select rule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student_chooses">Student Chooses</SelectItem>
              <SelectItem value="highest_remains">Highest Remains</SelectItem>
              <SelectItem value="latest_remains">Latest Remains</SelectItem>
              <SelectItem value="tp_decides">T&P Decides</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Participation Ends On</Label>
          <Select value={data.participation_ends_on} onValueChange={(val: any) => update({ participation_ends_on: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Select rule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="first_offer">First Offer</SelectItem>
              <SelectItem value="offer_accepted">Offer Accepted</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="joined">Joined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Switch checked={data.debar_on_hired} onCheckedChange={(val) => update({ debar_on_hired: val })} />
          <Label>Debar on Hired</Label>
        </div>
      </div>
    </div>
  )
}

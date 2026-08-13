'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { savePlacementPolicies } from '@/app/(dashboards)/college/actions'
import { toast } from 'sonner'
import { Loader2, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Simple helper for a policy section
function PolicySection({
  title,
  description,
  tooltip,
  config,
  onChange,
  showMultiplier = false
}: {
  title: string
  description: string
  tooltip: string
  config: any
  onChange: (newConfig: any) => void
  showMultiplier?: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            {title}
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-zinc-400 hover:text-zinc-600 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Switch 
          checked={config?.enabled || false}
          onCheckedChange={(c) => onChange({ ...config, enabled: c })}
        />
      </CardHeader>
      <CardContent>
        <div className={`grid gap-4 mt-4 transition-opacity ${!config?.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="grid gap-2">
            <Label>Max Allowed Limit</Label>
            <Input 
              type="number" 
              value={config?.max_allowed ?? ''} 
              onChange={(e) => onChange({ ...config, max_allowed: parseInt(e.target.value) || 0 })}
            />
          </div>
          
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              Reinstatement Chances
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-600 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[250px]">
                  <p>When an admin manually removes a student from the blacklist for this specific policy, how many additional strikes are they allowed to make before being blacklisted again?</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input 
              type="number" 
              value={config?.reinstatement_chances ?? 1} 
              onChange={(e) => onChange({ ...config, reinstatement_chances: parseInt(e.target.value) || 0 })}
            />
          </div>

          {showMultiplier && (
            <div className="grid gap-2">
              <Label>Minimum CTC Multiplier</Label>
              <Input 
                type="number" 
                step="0.1"
                value={config?.min_multiplier ?? ''} 
                onChange={(e) => onChange({ ...config, min_multiplier: parseFloat(e.target.value) || 1 })}
                placeholder="e.g. 1.5"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function NewPlacementPolicyEditor({ initialConfig }: { initialConfig: any }) {
  const [config, setConfig] = useState<any>(initialConfig || {})
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setIsSaving(true)
    const result = await savePlacementPolicies(config)
    setIsSaving(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(result.success)
      router.refresh()
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-8 pb-10">
        <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-xl border border-zinc-100">
          <div>
            <h2 className="text-lg font-medium">Policy Engine Settings</h2>
            <p className="text-sm text-zinc-500">Configure how different infractions penalize students</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PolicySection
            title="Registration & Eligibility (Non-Participation)"
            description="Penalize students who are eligible for a job but fail to apply."
            tooltip="If a student is eligible but consistently ignores job postings without providing a valid reason, they receive a strike."
            config={config.non_participation || {}}
            onChange={(c) => setConfig({ ...config, non_participation: c })}
          />
          
          <PolicySection
            title="No-Show (Mid-Process)"
            description="Penalize students who ghost interviews or assessments."
            tooltip="Students who confirm their attendance for an interview or test but do not show up will be penalized. Excused absences handled by admin don't count."
            config={config.no_show || {}}
            onChange={(c) => setConfig({ ...config, no_show: c })}
          />

          <PolicySection
            title="Application Withdrawal (Mid-Process)"
            description="Penalize early-stage process dropouts."
            tooltip="If a student withdraws their application after it has been reviewed but before they are shortlisted, this policy logs a penalty."
            config={config.withdrawal || {}}
            onChange={(c) => setConfig({ ...config, withdrawal: c })}
          />

          <PolicySection
            title="Post-Shortlist Withdrawal (Critical Dropout)"
            description="Heavily penalize withdrawing after taking a valuable shortlist slot."
            tooltip="Withdrawing after being shortlisted means another student missed out on that slot. This usually has a very low tolerance."
            config={config.post_shortlist_withdrawal || {}}
            onChange={(c) => setConfig({ ...config, post_shortlist_withdrawal: c })}
          />

          <PolicySection
            title="Disciplinary Strikes (Misconduct)"
            description="Penalize unprofessional behavior during the process."
            tooltip="For cases like unprofessional emails, bad behavior during an interview, or not following company instructions."
            config={config.disciplinary || {}}
            onChange={(c) => setConfig({ ...config, disciplinary: c })}
          />

          <PolicySection
            title="Integrity Strikes (Data Fraud)"
            description="Instant blacklisting for fake resumes or fraudulent data."
            tooltip="Any case of faking GPA, certifications, or cheating on tests. Usually, setting Max Allowed Limit to 1 means instant blacklisting on the first offense."
            config={config.integrity || {}}
            onChange={(c) => setConfig({ ...config, integrity: c })}
          />

          <PolicySection
            title="Offer Rejection (Post-Hire Decline)"
            description="Penalize rejecting a final job offer."
            tooltip="When a student goes through the entire process, receives an offer, and then rejects it, causing damage to the college's relationship with the company."
            config={config.offer_rejection || {}}
            onChange={(c) => setConfig({ ...config, offer_rejection: c })}
          />

          <PolicySection
            title="Offer Upgrade Policy (Dream Job)"
            description="Allow placed students to apply for better opportunities."
            tooltip="Controls if a placed student can apply for another job. You can configure a Minimum CTC Multiplier (e.g. 1.5x) meaning they can only apply to jobs offering at least 50% more than their current offer."
            config={config.upgrade || {}}
            onChange={(c) => setConfig({ ...config, upgrade: c })}
            showMultiplier={true}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Policies
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}


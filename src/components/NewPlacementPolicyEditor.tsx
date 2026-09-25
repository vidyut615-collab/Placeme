'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { savePlacementPolicies } from '@/app/(dashboards)/college/actions'
import { toast } from 'sonner'
import { Loader2, Info, Sparkles, Star, Briefcase, Award, ShieldAlert, Lock } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Helper for standard conduct policy section
function PolicySection({
  title,
  description,
  tooltip,
  config,
  onChange,
  showMultiplier = false,
  disabled = false,
}: {
  title: string
  description: string
  tooltip: string
  config: any
  onChange: (newConfig: any) => void
  showMultiplier?: boolean
  disabled?: boolean
}) {
  return (
    <Card className={disabled ? 'bg-zinc-50/50 dark:bg-zinc-900/30' : ''}>
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
          disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled}
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
                disabled={disabled}
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

export function NewPlacementPolicyEditor({
  initialConfig,
  isAdmin = true,
}: {
  initialConfig: any
  isAdmin?: boolean
}) {
  const [config, setConfig] = useState<any>(initialConfig || {})
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    if (!isAdmin) return
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
      <div className="space-y-10 pb-12">
        {/* Read-Only Notice for College Staff */}
        {!isAdmin && (
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-800/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-center gap-3 shadow-xs">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <span className="font-bold block">Institutional Placement Policy View</span>
              <span className="text-xs text-amber-800/90 dark:text-amber-300/90">
                You are viewing active placement policies in read-only mode. Modifying policy thresholds, quotas, and penalty rules is restricted to College Administrators.
              </span>
            </div>
          </div>
        )}

        {/* Header summary bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Policy Engine Settings</h2>
            <p className="text-sm text-zinc-500">Configure institutional governance rules, application quotas, and conduct strikes.</p>
          </div>
          {isAdmin ? (
            <Button onClick={handleSave} disabled={isSaving} size="default" className="w-full md:w-auto">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save All Policies
            </Button>
          ) : (
            <Button
              disabled
              size="default"
              variant="outline"
              className="w-full md:w-auto cursor-not-allowed opacity-70 gap-1.5 border-zinc-300 dark:border-zinc-700"
            >
              <Lock className="h-4 w-4 text-zinc-400" />
              Admin Only (Locked)
            </Button>
          )}
        </div>

        <fieldset disabled={!isAdmin} className="space-y-10 border-0 p-0 m-0">

        {/* Global Security / Audit Banner */}
        <Card className="bg-blue-50/60 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                Enable Student Profile Auditing
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-zinc-400 hover:text-zinc-600 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p>When enabled, students cannot instantly modify verified resume credentials. Changes require coordinator review.</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription>Require admin verification for student academic updates, key skills, and resume edits.</CardDescription>
            </div>
            <Switch 
              disabled={!isAdmin}
              checked={config.profile_audit_enabled !== false}
              onCheckedChange={(c) => setConfig({ ...config, profile_audit_enabled: c })}
            />
          </CardHeader>
        </Card>

        {/* SECTION 1: Operational & Tier Policies (NEW) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              Institutional Governance
            </Badge>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Drive Limits & Opportunity Tiers
            </h3>
          </div>
          <p className="text-sm text-zinc-500">
            Define application quotas, 1-offer placement locking, and college-defined Dream / Super Dream CTC thresholds.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* 1-Offer Policy Card */}
            <Card className={!isAdmin ? 'bg-zinc-50/50 dark:bg-zinc-900/30' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4 text-emerald-600" />
                    1-Offer Policy & Placement Lock
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-zinc-400 hover:text-zinc-600 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        <p>Once a student receives an approved job offer, the policy locks them from applying to standard campus drives. Upgrades require matching Dream or Super Dream criteria.</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                  <CardDescription>Enforce the 1-student 1-job rule upon verified offer approval.</CardDescription>
                </div>
                <Switch 
                  disabled={!isAdmin}
                  checked={config?.offer_limit?.enabled || false}
                  onCheckedChange={(c) => setConfig({
                    ...config,
                    offer_limit: { 
                      ...config?.offer_limit, 
                      enabled: c, 
                      debar_on_hired: c ? true : false,
                      max_offers_total: 1
                    }
                  })}
                />
              </CardHeader>
              <CardContent>
                <div className={`grid gap-4 mt-4 transition-opacity ${!config?.offer_limit?.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Debar from regular drives once placed</Label>
                      <p className="text-xs text-zinc-500">Automatically block applications to standard drives after offer approval.</p>
                    </div>
                    <Switch 
                      disabled={!isAdmin}
                      checked={config?.offer_limit?.debar_on_hired ?? true}
                      onCheckedChange={(c) => setConfig({
                        ...config,
                        offer_limit: { ...config?.offer_limit, debar_on_hired: c }
                      })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Maximum Standard Offers Allowed</Label>
                    <Input 
                      disabled={!isAdmin}
                      type="number" 
                      value={config?.offer_limit?.max_offers_total ?? 1} 
                      onChange={(e) => setConfig({
                        ...config,
                        offer_limit: { ...config?.offer_limit, max_offers_total: e.target.value === '' ? null : parseInt(e.target.value) }
                      })}
                    />
                    <p className="text-xs text-zinc-500">Standard setting is 1 offer per student before requiring upgrade rules.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Limits Card */}
            <Card className={!isAdmin ? 'bg-zinc-50/50 dark:bg-zinc-900/30' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                    Application Limits & Quotas
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-zinc-400 hover:text-zinc-600 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        <p>Prevents students from spamming all open drives simultaneously and ensures fair interview distribution.</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                  <CardDescription>Cap concurrent active applications and total applications per season.</CardDescription>
                </div>
                <Switch 
                  disabled={!isAdmin}
                  checked={config?.application_limit?.enabled || false}
                  onCheckedChange={(c) => setConfig({
                    ...config,
                    application_limit: { ...config?.application_limit, enabled: c }
                  })}
                />
              </CardHeader>
              <CardContent>
                <div className={`grid gap-4 mt-4 transition-opacity ${!config?.application_limit?.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="grid gap-2">
                    <Label>Max Concurrent Active Applications</Label>
                    <Input 
                      disabled={!isAdmin}
                      type="number" 
                      placeholder="e.g. 3 or 5"
                      value={config?.application_limit?.max_active ?? ''} 
                      onChange={(e) => setConfig({
                        ...config,
                        application_limit: { ...config?.application_limit, max_active: e.target.value === '' ? null : parseInt(e.target.value) }
                      })}
                    />
                    <p className="text-xs text-zinc-500">Maximum ongoing recruitment processes a student can participate in at once.</p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Total Applications Cap per Season</Label>
                    <Input 
                      disabled={!isAdmin}
                      type="number" 
                      placeholder="e.g. 20 or 25"
                      value={config?.application_limit?.max_total ?? ''} 
                      onChange={(e) => setConfig({
                        ...config,
                        application_limit: { ...config?.application_limit, max_total: e.target.value === '' ? null : parseInt(e.target.value) }
                      })}
                    />
                    <p className="text-xs text-zinc-500">Maximum total campus recruitment drives a student may apply to in a cycle.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dream Company Policy Card */}
            <Card className={!isAdmin ? 'bg-zinc-50/50 dark:bg-zinc-900/30' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Dream Company Policy (College Defined)
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-zinc-400 hover:text-zinc-600 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        <p>Colleges hold 100% control over this threshold. Placed students holding standard offers are permitted to apply to drives offering at or above this CTC.</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                  <CardDescription>Custom CTC cutoff for high-value drives that placed students can upgrade to.</CardDescription>
                </div>
                <Switch 
                  disabled={!isAdmin}
                  checked={config?.dream?.enabled || false}
                  onCheckedChange={(c) => setConfig({
                    ...config,
                    dream: { ...config?.dream, enabled: c, classification_method: 'ctc_based' }
                  })}
                />
              </CardHeader>
              <CardContent>
                <div className={`grid gap-4 mt-4 transition-opacity ${!config?.dream?.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="grid gap-2">
                    <Label>Minimum CTC Cutoff (in ₹ LPA)</Label>
                    <Input 
                      disabled={!isAdmin}
                      type="number" 
                      step="0.5"
                      placeholder="e.g. 8 or 18"
                      value={config?.dream?.min_ctc ?? ''} 
                      onChange={(e) => setConfig({
                        ...config,
                        dream: { ...config?.dream, min_ctc: e.target.value === '' ? null : parseFloat(e.target.value) }
                      })}
                    />
                    <p className="text-xs text-zinc-500">Jobs with CTC at or above this amount qualify as Dream opportunities.</p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Max Dream Attempts Allowed</Label>
                    <Input 
                      disabled={!isAdmin}
                      type="number" 
                      placeholder="e.g. 2"
                      value={config?.dream?.max_dream_attempts ?? ''} 
                      onChange={(e) => setConfig({
                        ...config,
                        dream: { ...config?.dream, max_dream_attempts: e.target.value === '' ? null : parseInt(e.target.value) }
                      })}
                    />
                    <p className="text-xs text-zinc-500">How many Dream job drives a placed student can apply to.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Super Dream Company Policy Card */}
            <Card className={!isAdmin ? 'bg-zinc-50/50 dark:bg-zinc-900/30' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4 text-purple-500" />
                    Super Dream Company Policy (College Defined)
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-zinc-400 hover:text-zinc-600 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        <p>Colleges define their own Super Dream cutoff for elite packages (e.g. ₹15 LPA or ₹30 LPA). Placed students can participate up to the attempt limit.</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                  <CardDescription>Custom CTC cutoff for premium tier placement drives.</CardDescription>
                </div>
                <Switch 
                  disabled={!isAdmin}
                  checked={config?.super_dream?.enabled || false}
                  onCheckedChange={(c) => setConfig({
                    ...config,
                    super_dream: { ...config?.super_dream, enabled: c, classification_method: 'ctc_based' }
                  })}
                />
              </CardHeader>
              <CardContent>
                <div className={`grid gap-4 mt-4 transition-opacity ${!config?.super_dream?.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="grid gap-2">
                    <Label>Minimum CTC Cutoff (in ₹ LPA)</Label>
                    <Input 
                      disabled={!isAdmin}
                      type="number" 
                      step="0.5"
                      placeholder="e.g. 15 or 30"
                      value={config?.super_dream?.min_ctc ?? ''} 
                      onChange={(e) => setConfig({
                        ...config,
                        super_dream: { ...config?.super_dream, min_ctc: e.target.value === '' ? null : parseFloat(e.target.value) }
                      })}
                    />
                    <p className="text-xs text-zinc-500">Jobs with CTC at or above this amount qualify as Super Dream opportunities.</p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Max Super Dream Attempts Allowed</Label>
                    <Input 
                      disabled={!isAdmin}
                      type="number" 
                      placeholder="e.g. 1"
                      value={config?.super_dream?.max_attempts ?? ''} 
                      onChange={(e) => setConfig({
                        ...config,
                        super_dream: { ...config?.super_dream, max_attempts: e.target.value === '' ? null : parseInt(e.target.value) }
                      })}
                    />
                    <p className="text-xs text-zinc-500">How many Super Dream drives a placed student can attempt.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SECTION 2: Conduct & Penalty Policies */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b">
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
              Conduct & Compliance
            </Badge>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Student Conduct & Strike Tolerances
            </h3>
          </div>
          <p className="text-sm text-zinc-500">
            Configure automated penalties, strike limits, and blacklist thresholds for candidate infractions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <PolicySection
              title="Registration & Eligibility (Non-Participation)"
              description="Penalize students who are eligible for a job but fail to apply."
              tooltip="If a student is eligible but consistently ignores job postings without providing a valid reason, they receive a strike."
              config={config.non_participation || {}}
              onChange={(c) => setConfig({ ...config, non_participation: c })}
              disabled={!isAdmin}
            />
            
            <PolicySection
              title="No-Show (Mid-Process)"
              description="Penalize students who ghost interviews or assessments."
              tooltip="Students who confirm their attendance for an interview or test but do not show up will be penalized. Excused absences handled by admin don't count."
              config={config.no_show || {}}
              onChange={(c) => setConfig({ ...config, no_show: c })}
              disabled={!isAdmin}
            />

            <PolicySection
              title="Application Withdrawal (Mid-Process)"
              description="Penalize early-stage process dropouts."
              tooltip="If a student withdraws their application after it has been reviewed but before they are shortlisted, this policy logs a penalty."
              config={config.withdrawal || {}}
              onChange={(c) => setConfig({ ...config, withdrawal: c })}
              disabled={!isAdmin}
            />

            <PolicySection
              title="Post-Shortlist Withdrawal (Critical Dropout)"
              description="Heavily penalize withdrawing after taking a valuable shortlist slot."
              tooltip="Withdrawing after being shortlisted means another student missed out on that slot. This usually has a very low tolerance."
              config={config.post_shortlist_withdrawal || {}}
              onChange={(c) => setConfig({ ...config, post_shortlist_withdrawal: c })}
              disabled={!isAdmin}
            />

            <PolicySection
              title="Disciplinary Strikes (Misconduct)"
              description="Penalize unprofessional behavior during the process."
              tooltip="For cases like unprofessional emails, bad behavior during an interview, or not following company instructions."
              config={config.disciplinary || {}}
              onChange={(c) => setConfig({ ...config, disciplinary: c })}
              disabled={!isAdmin}
            />

            <PolicySection
              title="Integrity Strikes (Data Fraud)"
              description="Instant blacklisting for fake resumes or fraudulent data."
              tooltip="Any case of faking GPA, certifications, or cheating on tests. Usually, setting Max Allowed Limit to 1 means instant blacklisting on the first offense."
              config={config.integrity || {}}
              onChange={(c) => setConfig({ ...config, integrity: c })}
              disabled={!isAdmin}
            />

            <PolicySection
              title="Offer Rejection (Post-Hire Decline)"
              description="Penalize rejecting a final job offer."
              tooltip="When a student goes through the entire process, receives an offer, and then rejects it, causing damage to the college's relationship with the company."
              config={config.offer_rejection || {}}
              onChange={(c) => setConfig({ ...config, offer_rejection: c })}
              disabled={!isAdmin}
            />

            <PolicySection
              title="Offer Upgrade Policy (Multi-Offer Multiplier)"
              description="Allow placed students to apply for better opportunities."
              tooltip="Controls if a placed student can apply for another job. You can configure a Minimum CTC Multiplier (e.g. 1.5x) meaning they can only apply to jobs offering at least 50% more than their current offer."
              config={config.upgrade || {}}
              onChange={(c) => setConfig({ ...config, upgrade: c })}
              showMultiplier={true}
              disabled={!isAdmin}
            />
          </div>
        </div>

        </fieldset>

        {/* Floating bottom save bar */}
        {isAdmin && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving} size="lg" className="px-8 shadow-sm">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save All Placement Policies
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}


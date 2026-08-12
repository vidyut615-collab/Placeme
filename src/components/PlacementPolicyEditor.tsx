'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { savePlacementPolicies } from '@/app/(dashboards)/college/actions'
import { DEFAULT_POLICY_CONFIG, type PolicyConfig } from '@/lib/policy-engine'

// Policy section components
import { RegistrationPolicy } from './policy-sections/RegistrationPolicy'
import { EligibilityPolicy } from './policy-sections/EligibilityPolicy'
import { ApplicationLimitPolicy } from './policy-sections/ApplicationLimitPolicy'
import { WithdrawalPolicy } from './policy-sections/WithdrawalPolicy'
import { NoShowPolicy } from './policy-sections/NoShowPolicy'
import { OfferLimitPolicy } from './policy-sections/OfferLimitPolicy'
import { UpgradePolicy } from './policy-sections/UpgradePolicy'
import { JobTypePolicy } from './policy-sections/JobTypePolicy'
import { PlacementLevelPolicy } from './policy-sections/PlacementLevelPolicy'
import { PlacementCategoryPolicy } from './policy-sections/PlacementCategoryPolicy'
import { LevelMovementPolicy } from './policy-sections/LevelMovementPolicy'
import { AttemptLimitPolicy } from './policy-sections/AttemptLimitPolicy'
import { DreamPolicy } from './policy-sections/DreamPolicy'
import { SuperDreamPolicy } from './policy-sections/SuperDreamPolicy'
import { SpecialExceptionPolicy } from './policy-sections/SpecialExceptionPolicy'
import { OfferAcceptancePolicy } from './policy-sections/OfferAcceptancePolicy'
import { PlacementCompletionPolicy } from './policy-sections/PlacementCompletionPolicy'
import { TrainingReadinessPolicy } from './policy-sections/TrainingReadinessPolicy'
import { AcademicClearancePolicy } from './policy-sections/AcademicClearancePolicy'
import { OverrideManagementPolicy } from './policy-sections/OverrideManagementPolicy'

type PolicySectionDef = {
  key: keyof PolicyConfig
  title: string
  description: string
  policyNumber: number
  component: React.ComponentType<{ data: any; onChange: (data: any) => void }>
  group: string
}

const POLICY_SECTIONS: PolicySectionDef[] = [
  // Group: Registration & Eligibility
  { key: 'registration', title: 'Registration & Participation', description: 'Who can participate in the placement cycle', policyNumber: 1, component: RegistrationPolicy, group: 'Registration & Eligibility' },
  { key: 'eligibility', title: 'Job Eligibility Criteria', description: 'Academic and profile requirements for applying', policyNumber: 2, component: EligibilityPolicy, group: 'Registration & Eligibility' },
  { key: 'academic_clearance', title: 'Academic Clearance', description: 'When academic clearance is checked', policyNumber: 19, component: AcademicClearancePolicy, group: 'Registration & Eligibility' },
  { key: 'training_readiness', title: 'Training Readiness', description: 'Training prerequisites for placement', policyNumber: 18, component: TrainingReadinessPolicy, group: 'Registration & Eligibility' },

  // Group: Application Rules
  { key: 'application_limit', title: 'Application Limits', description: 'Control how many applications a student can submit', policyNumber: 3, component: ApplicationLimitPolicy, group: 'Application Rules' },
  { key: 'withdrawal', title: 'Application Withdrawal', description: 'Rules for withdrawing from recruitment processes', policyNumber: 4, component: WithdrawalPolicy, group: 'Application Rules' },
  { key: 'no_show', title: 'No-Show / Absenteeism', description: 'Consequences for missing recruitment events', policyNumber: 5, component: NoShowPolicy, group: 'Application Rules' },
  { key: 'attempt_limit', title: 'Attempt / Opportunity Limits', description: 'Maximum recruitment attempts per student', policyNumber: 12, component: AttemptLimitPolicy, group: 'Application Rules' },

  // Group: Offer Rules
  { key: 'offer_limit', title: 'Number of Offers', description: 'Maximum offers a student can receive or accept', policyNumber: 6, component: OfferLimitPolicy, group: 'Offer Rules' },
  { key: 'upgrade', title: 'Upgrade / Next Offer', description: 'When students with offers can pursue new opportunities', policyNumber: 7, component: UpgradePolicy, group: 'Offer Rules' },
  { key: 'offer_acceptance', title: 'Offer Acceptance', description: 'Offer acceptance windows and decline consequences', policyNumber: 16, component: OfferAcceptancePolicy, group: 'Offer Rules' },
  { key: 'placement_completion', title: 'Placement Completion', description: 'When a student is considered "Placed"', policyNumber: 17, component: PlacementCompletionPolicy, group: 'Offer Rules' },

  // Group: Classification & Movement
  { key: 'job_types', title: 'Job Type Classification', description: 'College-defined job categories (Core, Non-Core, etc.)', policyNumber: 8, component: JobTypePolicy, group: 'Classification & Movement' },
  { key: 'placement_levels', title: 'Placement Levels / Tiers', description: 'College-defined placement hierarchy', policyNumber: 9, component: PlacementLevelPolicy, group: 'Classification & Movement' },
  { key: 'placement_categories', title: 'Placement Categories', description: 'Sub-categories within placement levels', policyNumber: 10, component: PlacementCategoryPolicy, group: 'Classification & Movement' },
  { key: 'level_movement', title: 'Level / Category Movement', description: 'Rules for moving between tiers and categories', policyNumber: 11, component: LevelMovementPolicy, group: 'Classification & Movement' },
  { key: 'dream', title: 'Dream Opportunity', description: 'College-defined Dream classification and rules', policyNumber: 13, component: DreamPolicy, group: 'Classification & Movement' },
  { key: 'super_dream', title: 'Super Dream / Premium', description: 'College-defined premium opportunity classification', policyNumber: 14, component: SuperDreamPolicy, group: 'Classification & Movement' },

  // Group: Governance
  { key: 'special_exception', title: 'Special Exceptions', description: 'Handle cases where normal rules don\'t apply', policyNumber: 15, component: SpecialExceptionPolicy, group: 'Governance' },
  { key: 'override_management', title: 'Override & Audit', description: 'T&P admin override controls and audit trails', policyNumber: 20, component: OverrideManagementPolicy, group: 'Governance' },
]

const GROUPS = [
  'Registration & Eligibility',
  'Application Rules',
  'Offer Rules',
  'Classification & Movement',
  'Governance',
]

type Props = {
  initialConfig: PolicyConfig
}

export function PlacementPolicyEditor({ initialConfig }: Props) {
  const merged = { ...DEFAULT_POLICY_CONFIG, ...initialConfig }
  const [config, setConfig] = useState<PolicyConfig>(merged)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const updatePolicy = (key: keyof PolicyConfig) => (data: any) => {
    setConfig(prev => ({ ...prev, [key]: data }))
    setSuccess(false)
  }

  const handleSave = () => {
    setError('')
    setSuccess(false)
    startTransition(async () => {
      const res = await savePlacementPolicies(config)
      if (res.error) setError(res.error)
      else setSuccess(true)
    })
  }

  const enabledCount = POLICY_SECTIONS.filter(s => (config[s.key] as any)?.enabled).length

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border rounded-md p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {enabledCount} / {POLICY_SECTIONS.length} Active
          </Badge>
          <span className="text-sm text-zinc-500">
            Only active policies are enforced on student applications.
          </span>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-sm text-red-600">{error}</span>}
          {success && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Saved!
            </span>
          )}
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save All Policies'}
          </Button>
        </div>
      </div>

      {/* Policy groups */}
      {GROUPS.map(group => {
        const sections = POLICY_SECTIONS.filter(s => s.group === group)
        const activeInGroup = sections.filter(s => (config[s.key] as any)?.enabled).length

        return (
          <div key={group} className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">{group}</h2>
              <Badge variant="outline" className="text-xs">
                {activeInGroup}/{sections.length}
              </Badge>
            </div>

            {sections.map(section => {
              const policyData = (config[section.key] || (DEFAULT_POLICY_CONFIG as any)[section.key]) as any
              const isEnabled = policyData?.enabled || false
              const isExpanded = expandedSections.has(section.key)
              const Component = section.component

              return (
                <Card key={section.key} className={`transition-all ${isEnabled ? 'border-blue-200 dark:border-blue-800' : ''}`}>
                  <CardHeader
                    className="cursor-pointer select-none"
                    onClick={() => toggleSection(section.key)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded
                          ? <ChevronDown className="h-4 w-4 text-zinc-400" />
                          : <ChevronRight className="h-4 w-4 text-zinc-400" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">
                              #{section.policyNumber} — {section.title}
                            </CardTitle>
                            {isEnabled && (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-transparent text-xs">
                                Active
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="mt-1">{section.description}</CardDescription>
                        </div>
                      </div>
                      <div onClick={e => e.stopPropagation()}>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={checked => {
                            updatePolicy(section.key)({ ...policyData, enabled: checked })
                            if (checked && !isExpanded) toggleSection(section.key)
                          }}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent>
                      <Component data={policyData} onChange={updatePolicy(section.key)} />
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        )
      })}

      {/* Bottom save */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={isPending} size="lg">
          {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save All Policies'}
        </Button>
      </div>
    </div>
  )
}

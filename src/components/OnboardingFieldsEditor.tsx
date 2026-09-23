'use client'

import { AcademicConfigManager } from '@/components/AcademicConfigManager'

export function OnboardingFieldsEditor({ 
  collegeId, 
  initialFields 
}: { 
  collegeId: string, 
  initialFields: any 
}) {
  return (
    <AcademicConfigManager 
      collegeId={collegeId} 
      initialFields={initialFields} 
      role="agency" 
    />
  )
}

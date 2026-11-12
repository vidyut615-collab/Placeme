'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { updateStudentProfile } from '@/app/(dashboards)/student/profile/actions'
import {
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
  GraduationCap,
  BookOpen,
  Briefcase,
  Code2,
  Award,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'
import { ImageCropperModal } from './ImageCropperModal'

export interface EducationEntry {
  level: string
  institution: string
  board: string
  passing_year: string
  score: string
}

export interface ExperienceEntry {
  type?: string
  company: string
  role: string
  start_date: string
  end_date: string
  tech?: string
  description: string
}

export interface ProjectEntry {
  title: string
  tech?: string
  link?: string
  description: string
}

export interface ActivityEntry {
  org: string
  role: string
  start_date: string
  end_date: string
  description: string
}

export interface RecognitionEntry {
  award: string
  issuer: string
  date: string
  description: string
}

export interface SkillsState {
  languages: string
  frameworks: string
  tools: string
}

export interface LinksState {
  linkedin: string
  github: string
  portfolio: string
}

export interface OnboardingFields {
  years: string[]
  types: string[]
  departments: string[]
}

export interface StudentProfileFormProps {
  profile: Record<string, unknown>
  onboardingFields: OnboardingFields
  hasPendingRequest?: boolean
  auditEnabled?: boolean
  accessStatus?: 'active' | 'expired' | 'unpaid'
  collegeName?: string
}

type TabKey = 'basic' | 'education' | 'experience' | 'projects' | 'activities' | 'skills'

export function StudentProfileForm({
  profile,
  onboardingFields,
  hasPendingRequest,
  auditEnabled,
  accessStatus = 'active',
  collegeName = 'College Placement Office',
}: StudentProfileFormProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('basic')
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)

  const [formState, setFormState] = useState({
    first_name: (profile.first_name as string) || '',
    middle_name: (profile.middle_name as string) || '',
    last_name: (profile.last_name as string) || '',
    phone: (profile.phone as string) || '',
    gpa: String(profile.gpa ?? ''),
    year: (profile.year as string) || '',
    type: (profile.type as string) || '',
    department: (profile.department as string) || '',
    academic_10th: String(profile.academic_10th ?? ''),
    academic_12th: String(profile.academic_12th ?? ''),
    diploma_percentage: String(profile.diploma_percentage ?? ''),
    graduation_percentage: String(profile.graduation_percentage ?? ''),
    active_backlogs: String(profile.active_backlogs ?? ''),
    historical_backlogs: String(profile.historical_backlogs ?? ''),
    academic_gap_years: String(profile.academic_gap_years ?? ''),
    profile_picture: (profile.profile_picture as string) || '',

    // Expanded Section Arrays
    education: (Array.isArray(profile.education) ? profile.education : []) as EducationEntry[],
    experience: (Array.isArray(profile.experience) ? profile.experience : []) as ExperienceEntry[],
    projects: (Array.isArray(profile.projects) ? profile.projects : []) as ProjectEntry[],
    activities: (Array.isArray(profile.activities) ? profile.activities : []) as ActivityEntry[],
    recognitions: (Array.isArray(profile.recognitions) ? profile.recognitions : []) as RecognitionEntry[],
    skills: ((profile.skills as SkillsState) || { languages: '', frameworks: '', tools: '' }),
    links: ((profile.links as LinksState) || { linkedin: '', github: '', portfolio: '' }),
  })

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSuccess(false)
      setFormState((s) => ({ ...s, [field]: e.target.value }))
    }

  const handleSelect = (field: string) => (value: string | null) => {
    setSuccess(false)
    setFormState((s) => ({ ...s, [field]: value || '' }))
  }

  const handleNestedChange = (category: 'skills' | 'links', field: string, value: string) => {
    setSuccess(false)
    setFormState((s) => ({
      ...s,
      [category]: { ...s[category], [field]: value },
    }))
  }

  const handleEducationChange = (index: number, field: keyof EducationEntry, value: string) => {
    setSuccess(false)
    setFormState((s) => {
      const newArray = [...s.education]
      newArray[index] = { ...newArray[index], [field]: value }
      return { ...s, education: newArray }
    })
  }

  const handleExperienceChange = (index: number, field: keyof ExperienceEntry, value: string) => {
    setSuccess(false)
    setFormState((s) => {
      const newArray = [...s.experience]
      newArray[index] = { ...newArray[index], [field]: value }
      return { ...s, experience: newArray }
    })
  }

  const handleProjectChange = (index: number, field: keyof ProjectEntry, value: string) => {
    setSuccess(false)
    setFormState((s) => {
      const newArray = [...s.projects]
      newArray[index] = { ...newArray[index], [field]: value }
      return { ...s, projects: newArray }
    })
  }

  const handleActivityChange = (index: number, field: keyof ActivityEntry, value: string) => {
    setSuccess(false)
    setFormState((s) => {
      const newArray = [...s.activities]
      newArray[index] = { ...newArray[index], [field]: value }
      return { ...s, activities: newArray }
    })
  }

  const handleRecognitionChange = (index: number, field: keyof RecognitionEntry, value: string) => {
    setSuccess(false)
    setFormState((s) => {
      const newArray = [...s.recognitions]
      newArray[index] = { ...newArray[index], [field]: value }
      return { ...s, recognitions: newArray }
    })
  }

  const removeArrayItem = (
    category: 'education' | 'experience' | 'projects' | 'activities' | 'recognitions',
    index: number
  ) => {
    setSuccess(false)
    setFormState((s) => {
      const newArray = [...s[category]]
      newArray.splice(index, 1)
      return { ...s, [category]: newArray }
    })
  }

  // Portrait upload handlers
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      return
    }

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setCropImageSrc(reader.result?.toString() || null)
    })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCroppedUpload = async (croppedFile: File) => {
    if (croppedFile.size > 500 * 1024) {
      setError('Cropped portrait is too large. Please keep file size under 500KB.')
      return
    }

    setIsUploadingImage(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('User session not found')

      const fileName = `profiles/${userData.user.id}-${Date.now()}.png`
      const { data, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, croppedFile, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path)

      setFormState((s) => ({ ...s, profile_picture: publicUrlData.publicUrl }))
      setSuccess(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload portrait.'
      setError(message)
    } finally {
      setIsUploadingImage(false)
      setCropImageSrc(null)
    }
  }

  const executeSubmit = () => {
    const finalData = { ...formState }

    // Auto-extract standardized academic scores
    const extractScore = (levelName: string) => {
      const entry = finalData.education.find((e) => e.level === levelName)
      return entry && entry.score ? parseFloat(entry.score) || null : null
    }

    finalData.academic_10th = String(extractScore('10th') || finalData.academic_10th)
    finalData.academic_12th = String(extractScore('12th') || finalData.academic_12th)
    finalData.diploma_percentage = String(extractScore('Diploma') || finalData.diploma_percentage)
    finalData.graduation_percentage = String(extractScore('UG (UnderGrad)') || finalData.graduation_percentage)

    const fullName = `${finalData.first_name.trim()} ${
      finalData.middle_name ? finalData.middle_name.trim() + ' ' : ''
    }${finalData.last_name.trim()}`.trim()

    const payload = {
      ...finalData,
      full_name: fullName,
    }

    const fd = new FormData()
    fd.append('profile_data_json', JSON.stringify(payload))

    startTransition(async () => {
      const res = await updateStudentProfile(fd)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(true)
        setShowConfirm(false)
      }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)
    setError('')

    // Check for CGPA entered instead of percentage in education
    const hasCgpaError = formState.education.some((edu) => {
      const scoreNum = parseFloat(edu.score)
      return !isNaN(scoreNum) && scoreNum > 0 && scoreNum <= 10
    })

    if (hasCgpaError) {
      setError('Please convert all CGPA scores to percentage (e.g. 85 instead of 8.5) in the Education section.')
      setActiveTab('education')
      return
    }

    const CRITICAL_KEYS = [
      'first_name',
      'last_name',
      'middle_name',
      'phone',
      'gpa',
      'year',
      'type',
      'department',
      'active_backlogs',
      'historical_backlogs',
      'academic_gap_years',
      'education',
    ]

    const hasCriticalChanges = CRITICAL_KEYS.some((key) => {
      const oldVal = profile[key]
      const newVal = formState[key as keyof typeof formState]
      return JSON.stringify(oldVal !== undefined ? oldVal : '') !== JSON.stringify(newVal !== undefined ? newVal : '')
    })

    if (auditEnabled && hasCriticalChanges) {
      setShowConfirm(true)
    } else {
      executeSubmit()
    }
  }

  // Define tab navigation items
  const tabs: {
    id: TabKey
    label: string
    icon: React.ComponentType<{ className?: string }>
    count?: number
    isComplete: boolean
  }[] = [
    {
      id: 'basic',
      label: 'Academics & Personal',
      icon: GraduationCap,
      isComplete: Boolean(formState.first_name && formState.last_name && formState.gpa && formState.department),
    },
    {
      id: 'education',
      label: 'Education',
      icon: BookOpen,
      count: formState.education.length,
      isComplete: formState.education.length > 0,
    },
    {
      id: 'experience',
      label: 'Experience',
      icon: Briefcase,
      count: formState.experience.length,
      isComplete: formState.experience.length > 0,
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: Code2,
      count: formState.projects.length,
      isComplete: formState.projects.length > 0,
    },
    {
      id: 'activities',
      label: 'Activities & Honors',
      icon: Award,
      count: formState.activities.length + formState.recognitions.length,
      isComplete: formState.activities.length > 0 || formState.recognitions.length > 0,
    },
    {
      id: 'skills',
      label: 'Skills & Links',
      icon: Sparkles,
      isComplete: Boolean(
        formState.skills.languages ||
        formState.skills.frameworks ||
        formState.links.linkedin ||
        formState.links.github
      ),
    },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full min-w-0 max-w-full">
      {/* ── Pending Audit Notification ── */}
      {hasPendingRequest ? (
        <div className="bg-amber-500/[0.08] dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 p-4 rounded-xl text-xs border border-amber-500/20 space-y-1 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
          <div className="flex items-center gap-2 font-medium text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 stroke-[1.5]" />
            <span>Profile Audit Request Pending</span>
          </div>
          <p className="text-[#78716C] dark:text-[#8A847A] text-xs leading-relaxed">
            You have a pending profile update request currently undergoing review by {collegeName}. Further modifications are temporarily locked until the placement cell completes verification.
          </p>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] flex items-center justify-between text-xs text-[#78716C] dark:text-[#8A847A]">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>Live Recruitment Sync: Verified data feeds directly into recruiter shortlisting and AI resume compiles.</span>
          </div>
          <span className="hidden sm:inline font-mono text-[11px] text-[#78716C] dark:text-[#8A847A]">
            {auditEnabled ? 'TPO Gated' : 'Direct DB Sync'}
          </span>
        </div>
      )}

      <fieldset disabled={accessStatus !== 'active' || hasPendingRequest} className="space-y-6 border-0 p-0 m-0 w-full min-w-0 max-w-full [min-inline-size:0]">
        {/* ── Official Portrait Upload Banner ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 p-4 bg-[#FAF8F5] dark:bg-[#12110F] rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
          <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-white dark:bg-[#191816] shrink-0 border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
            {formState.profile_picture ? (
              <Image
                src={formState.profile_picture}
                alt="Profile Portrait"
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full text-[#78716C] dark:text-[#8A847A]">
                <Upload className="h-5 w-5 stroke-[1.5]" />
              </div>
            )}
            {isUploadingImage && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-xs text-[#1C1917] dark:text-[#EFECE6]">
                Official Candidate Portrait
              </h3>
              {formState.profile_picture && (
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/[0.08] dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-medium inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 stroke-[1.5]" />
                  Uploaded
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#78716C] dark:text-[#8A847A]">
              Clear professional headshot under 500KB. Displayed on your official DigiProfile dossier and company interview rosters.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingImage}
                  className="cursor-pointer text-xs h-7.5 px-3 bg-white dark:bg-[#191816] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[#1C1917] dark:text-[#EFECE6] shadow-[0_1px_2px_rgba(28,25,23,0.04)] hover:bg-[#FAF8F5] dark:hover:bg-[#141312]"
                >
                  {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={isUploadingImage}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>

              {formState.profile_picture && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormState((s) => ({ ...s, profile_picture: '' }))}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs h-7.5 px-2"
                >
                  <X className="h-3.5 w-3.5 mr-1 stroke-[1.5]" /> Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        {cropImageSrc && (
          <ImageCropperModal
            isOpen={Boolean(cropImageSrc)}
            imageSrc={cropImageSrc}
            onClose={() => setCropImageSrc(null)}
            onCropComplete={handleCroppedUpload}
          />
        )}

        {/* ── Tactile Pill Tab Switcher ── */}
        <div className="border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] pb-3 w-full max-w-full overflow-hidden">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 w-full max-w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer select-none ${
                    isActive
                      ? 'bg-[#0F766E] text-white dark:bg-[#14B8A6] dark:text-[#12110F] shadow-[0_1px_2px_rgba(15,118,110,0.2)]'
                      : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#78716C] dark:text-[#8A847A] hover:bg-white dark:hover:bg-[#191816] hover:text-[#1C1917] dark:hover:text-[#EFECE6] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 stroke-[1.5] ${isActive ? 'text-white dark:text-[#12110F]' : 'text-[#78716C] dark:text-[#8A847A]'}`} />
                  <span>{tab.label}</span>

                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-medium ${
                        isActive
                          ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#12110F]'
                          : 'bg-[#1C1917]/[0.06] dark:bg-[#EFECE6]/[0.08] text-[#1C1917] dark:text-[#EFECE6]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}

                  {tab.isComplete && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-white dark:bg-[#12110F]' : 'bg-[#10B981]'
                      }`}
                      title="Section complete"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Tab Content Panels ── */}
        <div className="min-h-[400px]">
          {/* Panel 1: Basics & Academics */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] uppercase tracking-wider">
                  Personal Information
                </h3>
                <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] mt-0.5">
                  Primary candidate identification used across placement correspondence.
                </p>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="first_name" className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    First Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    required
                    value={formState.first_name}
                    onChange={handleChange('first_name')}
                    placeholder="e.g. Aniket"
                    className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="middle_name" className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    Middle Name <span className="text-[#78716C] dark:text-[#8A847A] font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="middle_name"
                    value={formState.middle_name}
                    onChange={handleChange('middle_name')}
                    placeholder="e.g. Kumar"
                    className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="last_name" className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    Last Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    required
                    value={formState.last_name}
                    onChange={handleChange('last_name')}
                    placeholder="e.g. Sawardekar"
                    className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <Label htmlFor="phone" className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    Contact Phone Number <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={formState.phone}
                    onChange={handleChange('phone')}
                    placeholder="+91 98765 43210"
                    className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                  />
                </div>
              </div>

              {/* Institutional Placement Academics */}
              <div className="pt-5 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] space-y-4">
                <div>
                  <h3 className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] uppercase tracking-wider">
                    Institutional Placement Credentials
                  </h3>
                  <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] mt-0.5">
                    Governed by {collegeName} placement cell policies and company cutoffs.
                  </p>
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="gpa" className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                      Current CGPA <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="gpa"
                      value={formState.gpa}
                      onChange={handleChange('gpa')}
                      placeholder="e.g. 8.92"
                      className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">Graduation Year</Label>
                    <Select value={formState.year} onValueChange={handleSelect('year')}>
                      <SelectTrigger className="w-full h-9 text-xs bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-[#1C1917] dark:text-[#EFECE6] shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {onboardingFields.years.length > 0 ? (
                          onboardingFields.years.map((y) => (
                            <SelectItem key={y} value={y}>
                              {y}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No years configured
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">Degree Type</Label>
                    <Select value={formState.type} onValueChange={handleSelect('type')}>
                      <SelectTrigger className="w-full h-9 text-xs bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-[#1C1917] dark:text-[#EFECE6] shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {onboardingFields.types.length > 0 ? (
                          onboardingFields.types.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No types configured
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">Department</Label>
                    <Select value={formState.department} onValueChange={handleSelect('department')}>
                      <SelectTrigger className="w-full h-9 text-xs bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-[#1C1917] dark:text-[#EFECE6] shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {onboardingFields.departments.length > 0 ? (
                          onboardingFields.departments.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No departments configured
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Backlogs & Academic Gaps */}
                <div className="pt-4 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                  <h4 className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] uppercase tracking-wider mb-3">
                    Backlogs &amp; Educational Gaps
                  </h4>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="active_backlogs" className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                        Active Backlogs
                      </Label>
                      <Input
                        id="active_backlogs"
                        type="number"
                        value={formState.active_backlogs}
                        onChange={handleChange('active_backlogs')}
                        className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="historical_backlogs" className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                        Historical / Cleared Backlogs
                      </Label>
                      <Input
                        id="historical_backlogs"
                        type="number"
                        value={formState.historical_backlogs}
                        onChange={handleChange('historical_backlogs')}
                        className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="academic_gap_years" className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                        Academic Gap (Years)
                      </Label>
                      <Input
                        id="academic_gap_years"
                        type="number"
                        value={formState.academic_gap_years}
                        onChange={handleChange('academic_gap_years')}
                        className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Panel 2: Education History */}
          {activeTab === 'education' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] uppercase tracking-wider">
                    Detailed Education History
                  </h3>
                  <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] mt-0.5">
                    Standardized 10th, 12th, Diploma, and Degree records evaluated for company eligibility cutoffs.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormState((s) => ({
                      ...s,
                      education: [
                        ...s.education,
                        {
                          level: '',
                          institution: '',
                          board: '',
                          passing_year: '',
                          score: '',
                        },
                      ],
                    }))
                  }
                  className="h-8 px-3 text-xs bg-white dark:bg-[#191816] border border-[#0F766E]/20 text-[#0F766E] dark:text-[#14B8A6] hover:bg-[#0F766E]/5 gap-1.5 font-medium cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[1.5]" />
                  <span>Add Qualification</span>
                </Button>
              </div>

              {formState.education.map((edu, i) => {
                const scoreNum = parseFloat(edu.score)
                const showScoreWarning = !isNaN(scoreNum) && scoreNum > 0 && scoreNum <= 10

                return (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] relative transition-all shadow-[0_1px_2px_rgba(28,25,23,0.04)] space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06]">
                      <span className="text-[11px] font-mono font-medium text-[#1C1917] dark:text-[#EFECE6] uppercase tracking-wider">
                        Qualification #{i + 1} {edu.level ? `· ${edu.level}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeArrayItem('education', i)}
                        className="text-[#78716C] hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md transition-colors cursor-pointer"
                        title="Remove qualification"
                      >
                        <Trash2 className="h-3.5 w-3.5 stroke-[1.5]" />
                      </button>
                    </div>

                    <div className="grid gap-3.5 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">Level of Education</Label>
                        <Select
                          value={edu.level}
                          onValueChange={(val) => handleEducationChange(i, 'level', val || '')}
                        >
                          <SelectTrigger className="h-9 text-xs bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1]">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10th">10th Standard / Matriculation</SelectItem>
                            <SelectItem value="12th">12th Standard / Higher Secondary</SelectItem>
                            <SelectItem value="Diploma">Diploma (Polytechnic)</SelectItem>
                            <SelectItem value="UG (UnderGrad)">Undergraduate (B.Tech / B.E / B.Sc)</SelectItem>
                            <SelectItem value="PG (PostGrad)">Postgraduate (M.Tech / M.E / M.S)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">School / College Name</Label>
                        <Input
                          placeholder="e.g. Delhi Public School / IIT Bombay"
                          value={edu.institution}
                          onChange={(e) => handleEducationChange(i, 'institution', e.target.value)}
                          className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">Board / University</Label>
                        <Input
                          placeholder="e.g. CBSE / ICSE / State Board / Autonomous"
                          value={edu.board}
                          onChange={(e) => handleEducationChange(i, 'board', e.target.value)}
                          className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">Passing Year</Label>
                          <Input
                            placeholder="2022"
                            value={edu.passing_year}
                            onChange={(e) => handleEducationChange(i, 'passing_year', e.target.value)}
                            className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">Score (%)</Label>
                          <Input
                            placeholder="e.g. 92.5"
                            type="number"
                            step="0.01"
                            value={edu.score}
                            onChange={(e) => handleEducationChange(i, 'score', e.target.value)}
                            className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                          />
                        </div>
                      </div>
                    </div>

                    {showScoreWarning && (
                      <div className="p-2.5 rounded-lg bg-amber-500/[0.08] dark:bg-amber-500/15 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 stroke-[1.5] shrink-0" />
                        <span>
                          Please convert your CGPA to percentage (e.g. 85% instead of 8.5) before saving to comply with recruiting filters.
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}

              {formState.education.length === 0 && (
                <div className="p-8 text-center border border-dashed border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] rounded-xl space-y-2 bg-white dark:bg-[#191816]">
                  <BookOpen className="w-8 h-8 text-[#78716C] dark:text-[#8A847A] stroke-[1.5] mx-auto" />
                  <p className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    No academic records added yet
                  </p>
                  <p className="text-xs text-[#78716C] dark:text-[#8A847A]">
                    Add your 10th, 12th, and current degree scores for automated eligibility matching.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Panel 3: Work Experience & Internships */}
          {activeTab === 'experience' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] uppercase tracking-wider">
                    Work Experience &amp; Internships
                  </h3>
                  <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] mt-0.5">
                    Industry roles, software co-ops, research fellowships, and freelance projects.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormState((s) => ({
                      ...s,
                      experience: [
                        ...s.experience,
                        {
                          type: 'internship',
                          company: '',
                          role: '',
                          start_date: '',
                          end_date: '',
                          tech: '',
                          description: '',
                        },
                      ],
                    }))
                  }
                  className="h-8 px-3 text-xs bg-white dark:bg-[#191816] border border-[#0F766E]/20 text-[#0F766E] dark:text-[#14B8A6] hover:bg-[#0F766E]/5 gap-1.5 font-medium cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[1.5]" />
                  <span>Add Experience</span>
                </Button>
              </div>

              {formState.experience.map((exp, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] relative transition-all shadow-[0_1px_2px_rgba(28,25,23,0.04)] space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06]">
                    <span className="text-[11px] font-mono font-medium text-[#1C1917] dark:text-[#EFECE6] uppercase tracking-wider">
                      Role #{i + 1} {exp.company ? `· ${exp.company}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeArrayItem('experience', i)}
                      className="text-[#78716C] hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md transition-colors cursor-pointer"
                      title="Remove experience"
                    >
                      <Trash2 className="h-3.5 w-3.5 stroke-[1.5]" />
                    </button>
                  </div>

                  <div className="grid gap-3.5 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">Company Name</Label>
                      <Input
                        placeholder="e.g. Google India"
                        value={exp.company}
                        onChange={(e) => handleExperienceChange(i, 'company', e.target.value)}
                        className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">Designation / Role</Label>
                      <Input
                        placeholder="e.g. Software Engineering Intern"
                        value={exp.role}
                        onChange={(e) => handleExperienceChange(i, 'role', e.target.value)}
                        className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">Start Date</Label>
                      <Input
                        placeholder="MM/YYYY (e.g. 05/2025)"
                        value={exp.start_date}
                        onChange={(e) => handleExperienceChange(i, 'start_date', e.target.value)}
                        className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">End Date</Label>
                      <Input
                        placeholder="MM/YYYY or Present"
                        value={exp.end_date}
                        onChange={(e) => handleExperienceChange(i, 'end_date', e.target.value)}
                        className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                        Tech Stack Used <span className="text-[#78716C] dark:text-[#8A847A] font-normal">(Optional)</span>
                      </Label>
                      <Input
                        placeholder="e.g. TypeScript, React, Go, Docker, AWS"
                        value={exp.tech || ''}
                        onChange={(e) => handleExperienceChange(i, 'tech', e.target.value)}
                        className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                        Responsibilities &amp; Achievements
                      </Label>
                      <Textarea
                        placeholder="Describe key responsibilities, systems designed, metrics improved..."
                        value={exp.description}
                        onChange={(e) => handleExperienceChange(i, 'description', e.target.value)}
                        className="min-h-[80px] bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {formState.experience.length === 0 && (
                <div className="p-8 text-center border border-dashed border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] rounded-xl space-y-2 bg-white dark:bg-[#191816]">
                  <Briefcase className="w-8 h-8 text-[#78716C] dark:text-[#8A847A] stroke-[1.5] mx-auto" />
                  <p className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    No industry experience recorded
                  </p>
                  <p className="text-xs text-[#78716C] dark:text-[#8A847A]">
                    Add past summer internships, part-time developer roles, or technical freelance contracts.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Panel 4: Projects */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] uppercase tracking-wider">
                    Engineering Projects &amp; Open Source
                  </h3>
                  <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] mt-0.5">
                    Highlight capstone systems, production services, and technical repositories.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormState((s) => ({
                      ...s,
                      projects: [
                        ...s.projects,
                        {
                          title: '',
                          tech: '',
                          link: '',
                          description: '',
                        },
                      ],
                    }))
                  }
                  className="h-8 px-3 text-xs bg-white dark:bg-[#191816] border border-[#0F766E]/20 text-[#0F766E] dark:text-[#14B8A6] hover:bg-[#0F766E]/5 gap-1.5 font-medium cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[1.5]" />
                  <span>Add Project</span>
                </Button>
              </div>

              {formState.projects.map((proj, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] relative transition-all shadow-[0_1px_2px_rgba(28,25,23,0.04)] space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06]">
                    <span className="text-[11px] font-mono font-medium text-[#1C1917] dark:text-[#EFECE6] uppercase tracking-wider">
                      Project #{i + 1} {proj.title ? `· ${proj.title}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeArrayItem('projects', i)}
                      className="text-[#78716C] hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md transition-colors cursor-pointer"
                      title="Remove project"
                    >
                      <Trash2 className="h-3.5 w-3.5 stroke-[1.5]" />
                    </button>
                  </div>

                  <div className="grid gap-3.5 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">Project Title</Label>
                      <Input
                        placeholder="e.g. Distributed Task Orchestrator"
                        value={proj.title}
                        onChange={(e) => handleProjectChange(i, 'title', e.target.value)}
                        className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                        Link (GitHub / Live Demo)
                      </Label>
                      <Input
                        placeholder="https://github.com/username/project"
                        value={proj.link}
                        onChange={(e) => handleProjectChange(i, 'link', e.target.value)}
                        className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                        Technologies &amp; Frameworks
                      </Label>
                      <Input
                        placeholder="e.g. Next.js, Go, PostgreSQL, Redis, Docker"
                        value={proj.tech}
                        onChange={(e) => handleProjectChange(i, 'tech', e.target.value)}
                        className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                        Architecture &amp; Problem Solved
                      </Label>
                      <Textarea
                        placeholder="What challenge did this solve? Include architectural choices, benchmarks, or metrics..."
                        value={proj.description}
                        onChange={(e) => handleProjectChange(i, 'description', e.target.value)}
                        className="min-h-[80px] bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {formState.projects.length === 0 && (
                <div className="p-8 text-center border border-dashed border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] rounded-xl space-y-2 bg-white dark:bg-[#191816]">
                  <Code2 className="w-8 h-8 text-[#78716C] dark:text-[#8A847A] stroke-[1.5] mx-auto" />
                  <p className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    No engineering projects recorded
                  </p>
                  <p className="text-xs text-[#78716C] dark:text-[#8A847A]">
                    Highlight capstone projects, full-stack web applications, or open-source packages.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Panel 5: Activities & Honors */}
          {activeTab === 'activities' && (
            <div className="space-y-6">
              {/* Extracurricular Activities */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] uppercase tracking-wider">
                      Leadership &amp; Extracurriculars
                    </h3>
                    <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] mt-0.5">
                      Technical societies, student chapters, hackathon committees, and club leadership.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormState((s) => ({
                        ...s,
                        activities: [
                          ...s.activities,
                          {
                            org: '',
                            role: '',
                            start_date: '',
                            end_date: '',
                            description: '',
                          },
                        ],
                      }))
                    }
                    className="h-8 px-3 text-xs bg-white dark:bg-[#191816] border border-[#0F766E]/20 text-[#0F766E] dark:text-[#14B8A6] hover:bg-[#0F766E]/5 gap-1.5 font-medium cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[1.5]" />
                    <span>Add Activity</span>
                  </Button>
                </div>

                {formState.activities.map((act, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] relative transition-all shadow-[0_1px_2px_rgba(28,25,23,0.04)] space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06]">
                      <span className="text-[11px] font-mono font-medium text-[#1C1917] dark:text-[#EFECE6] uppercase tracking-wider">
                        Activity #{i + 1} {act.org ? `· ${act.org}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeArrayItem('activities', i)}
                        className="text-[#78716C] hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md transition-colors cursor-pointer"
                        title="Remove activity"
                      >
                        <Trash2 className="h-3.5 w-3.5 stroke-[1.5]" />
                      </button>
                    </div>

                    <div className="grid gap-3.5 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                          Organization / Chapter <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          placeholder="e.g. ACM / IEEE Student Branch"
                          value={act.org}
                          onChange={(e) => handleActivityChange(i, 'org', e.target.value)}
                          className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">Role / Title</Label>
                        <Input
                          placeholder="e.g. Lead Technical Organizer"
                          value={act.role}
                          onChange={(e) => handleActivityChange(i, 'role', e.target.value)}
                          className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">Start Date</Label>
                        <Input
                          placeholder="MM/YYYY"
                          value={act.start_date}
                          onChange={(e) => handleActivityChange(i, 'start_date', e.target.value)}
                          className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">End Date</Label>
                        <Input
                          placeholder="MM/YYYY or Present"
                          value={act.end_date}
                          onChange={(e) => handleActivityChange(i, 'end_date', e.target.value)}
                          className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                          Initiatives &amp; Impact
                        </Label>
                        <Textarea
                          placeholder="Conducted workshops for 300+ students, managed logistics..."
                          value={act.description}
                          onChange={(e) => handleActivityChange(i, 'description', e.target.value)}
                          className="min-h-[70px] bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Awards & Recognitions */}
              <div className="space-y-4 pt-5 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] uppercase tracking-wider">
                      Awards &amp; Recognitions
                    </h3>
                    <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] mt-0.5">
                      Hackathon podiums, national olympiads, scholarships, and academic honors.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormState((s) => ({
                        ...s,
                        recognitions: [
                          ...s.recognitions,
                          {
                            award: '',
                            issuer: '',
                            date: '',
                            description: '',
                          },
                        ],
                      }))
                    }
                    className="h-8 px-3 text-xs bg-white dark:bg-[#191816] border border-[#0F766E]/20 text-[#0F766E] dark:text-[#14B8A6] hover:bg-[#0F766E]/5 gap-1.5 font-medium cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[1.5]" />
                    <span>Add Award</span>
                  </Button>
                </div>

                {formState.recognitions.map((rec, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] relative transition-all shadow-[0_1px_2px_rgba(28,25,23,0.04)] space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06]">
                      <span className="text-[11px] font-mono font-medium text-[#1C1917] dark:text-[#EFECE6] uppercase tracking-wider">
                        Award #{i + 1} {rec.award ? `· ${rec.award}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeArrayItem('recognitions', i)}
                        className="text-[#78716C] hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md transition-colors cursor-pointer"
                        title="Remove award"
                      >
                        <Trash2 className="h-3.5 w-3.5 stroke-[1.5]" />
                      </button>
                    </div>

                    <div className="grid gap-3.5 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                          Award / Honor Title <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          placeholder="e.g. 1st Place - National Hackathon"
                          value={rec.award}
                          onChange={(e) => handleRecognitionChange(i, 'award', e.target.value)}
                          className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                          Conferring Organization
                        </Label>
                        <Input
                          placeholder="e.g. Ministry of Education / IEEE"
                          value={rec.issuer}
                          onChange={(e) => handleRecognitionChange(i, 'issuer', e.target.value)}
                          className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">Date Received</Label>
                        <Input
                          placeholder="MM/YYYY or YYYY"
                          value={rec.date}
                          onChange={(e) => handleRecognitionChange(i, 'date', e.target.value)}
                          className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">Description</Label>
                        <Textarea
                          placeholder="Ranked 1st among 2,500 national teams for developing..."
                          value={rec.description}
                          onChange={(e) => handleRecognitionChange(i, 'description', e.target.value)}
                          className="min-h-[70px] bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Panel 6: Technical Skills & Social Links */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] uppercase tracking-wider">
                    Technical &amp; Domain Competencies
                  </h3>
                  <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] mt-0.5">
                    Parsed directly by algorithms for job match scoring and ATS keyword alignment.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    Core Languages &amp; Runtime
                  </Label>
                  <TagInput
                    placeholder="Type language and press Enter (e.g. TypeScript, Python, Go, Rust)..."
                    value={formState.skills.languages}
                    onChange={(val) => handleNestedChange('skills', 'languages', val)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    Frameworks, Libraries &amp; Databases
                  </Label>
                  <TagInput
                    placeholder="Type framework and press Enter (e.g. Next.js, React, Node.js, PostgreSQL, Redis)..."
                    value={formState.skills.frameworks}
                    onChange={(val) => handleNestedChange('skills', 'frameworks', val)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    DevOps, Cloud Tools &amp; Spoken Languages
                  </Label>
                  <TagInput
                    placeholder="Type tool and press Enter (e.g. Docker, Kubernetes, AWS, Git, English (Fluent))..."
                    value={formState.skills.tools}
                    onChange={(val) => handleNestedChange('skills', 'tools', val)}
                  />
                </div>
              </div>

              {/* Online Links */}
              <div className="space-y-4 pt-5 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                <div>
                  <h3 className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] uppercase tracking-wider">
                    Professional Profiles &amp; Repositories
                  </h3>
                  <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] mt-0.5">
                    Included on company evaluation dossiers and candidate interview briefs.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">LinkedIn Profile URL</Label>
                    <Input
                      placeholder="https://linkedin.com/in/username"
                      value={formState.links.linkedin}
                      onChange={(e) => handleNestedChange('links', 'linkedin', e.target.value)}
                      className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">GitHub Profile URL</Label>
                    <Input
                      placeholder="https://github.com/username"
                      value={formState.links.github}
                      onChange={(e) => handleNestedChange('links', 'github', e.target.value)}
                      className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                      Portfolio / Personal Website
                    </Label>
                    <Input
                      placeholder="https://yourname.dev"
                      value={formState.links.portfolio}
                      onChange={(e) => handleNestedChange('links', 'portfolio', e.target.value)}
                      className="bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-xs h-9"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Error & Success Feedback ── */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/[0.08] dark:bg-rose-500/15 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 stroke-[1.5] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-500/[0.08] dark:bg-emerald-500/15 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 stroke-[1.5] shrink-0" />
            <span>Profile dossier saved and synchronized successfully!</span>
          </div>
        )}

        {/* ── Sticky Bottom Action Bar ── */}
        <div className="pt-4 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] font-mono">
            {auditEnabled
              ? 'Institutional policy active: Academic changes route through TPO approval'
              : 'Direct synchronization active: Instant database updates'}
          </p>

          <Button
            type="submit"
            disabled={isPending || hasPendingRequest || accessStatus !== 'active'}
            className="h-9 px-6 text-xs font-medium bg-[#0F766E] hover:bg-[#0D655E] text-white dark:bg-[#14B8A6] dark:hover:bg-[#0F766E] dark:text-[#12110F] rounded-lg shadow-[0_1px_2px_rgba(15,118,110,0.2)] cursor-pointer gap-2"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>{isPending ? 'Synchronizing...' : 'Save Profile Changes'}</span>
          </Button>
        </div>

        {/* ── Confirmation Modal for Audit-Gated Fields ── */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
            <DialogHeader>
              <DialogTitle className="text-base font-medium text-[#1C1917] dark:text-[#EFECE6]">
                Submit Profile for Placement Review?
              </DialogTitle>
              <DialogDescription className="text-xs text-[#78716C] dark:text-[#8A847A] mt-1 leading-relaxed">
                You have modified sensitive academic records (e.g. CGPA, backlogs, department). Submitting will route this proposed update to the {collegeName} Placement Cell for verification.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(false)}
                type="button"
                className="text-xs h-8 cursor-pointer bg-white dark:bg-[#141312] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[#1C1917] dark:text-[#EFECE6]"
              >
                Cancel
              </Button>
              <Button
                onClick={executeSubmit}
                disabled={isPending}
                type="button"
                size="sm"
                className="text-xs h-8 bg-[#0F766E] hover:bg-[#0D655E] text-white dark:bg-[#14B8A6] dark:hover:bg-[#0F766E] dark:text-[#12110F] cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Confirm & Submit Audit'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </fieldset>
    </form>
  )
}

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (val: string) => void
  placeholder: string
}) {
  const [inputValue, setInputValue] = useState('')
  const tags = value
    ? value
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    : []

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const newTag = inputValue.trim().replace(/,/g, '')
      if (newTag && !tags.includes(newTag)) {
        onChange([...tags, newTag].join(', '))
        setInputValue('')
      }
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove).join(', '))
  }

  return (
    <div className="space-y-2 p-3 rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F]">
      <Input
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-8 text-xs bg-white dark:bg-[#141312] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-[#1C1917] dark:text-[#EFECE6]"
      />
      <div className="flex flex-wrap gap-1.5 pt-1">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#0F766E]/[0.08] dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6] border border-[#0F766E]/20 text-xs px-2.5 py-0.5 font-medium font-mono"
          >
            <span>{tag}</span>
            <button
              type="button"
              className="hover:text-rose-600 rounded text-[#0F766E]/70 dark:text-[#14B8A6]/70 p-0.5 transition-colors cursor-pointer"
              onClick={() => removeTag(tag)}
            >
              <X className="w-3 h-3 stroke-[1.5]" />
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-[11px] text-[#78716C] dark:text-[#8A847A] py-0.5 font-mono">No skills tagged yet.</span>
        )}
      </div>
      <p className="text-[10px] text-[#78716C] dark:text-[#8A847A] font-mono">Press Enter or Comma to add tag.</p>
    </div>
  )
}

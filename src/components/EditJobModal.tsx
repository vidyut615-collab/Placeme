'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { updateJobDetails } from '@/app/(dashboards)/college/actions'
import { toast } from 'sonner'
import { 
  Edit3, 
  Lock, 
  ShieldAlert, 
  Loader2, 
  Building2, 
  Calendar, 
  FileText, 
  Check, 
  MapPin, 
  IndianRupee, 
  Briefcase, 
  GraduationCap, 
  Layers, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Tag,
  ShieldCheck,
  Sparkles
} from 'lucide-react'
import { 
  INDIAN_CITIES, 
  JOB_DOMAINS, 
  WORKPLACE_MODES, 
  EMPLOYMENT_TYPES, 
  DRIVE_MODES 
} from '@/lib/cities-data'

interface EditJobModalProps {
  job: any
  applicantCount: number
  jobTypes?: { id: string; name: string }[]
  placementLevels?: { id: string; name: string; is_dream: boolean; is_super_dream: boolean }[]
  placementCategories?: { id: string; name: string }[]
  placementCycles?: { id: string; name: string; is_active: boolean }[]
  academicFields?: {
    departments: string[]
    types: string[]
    years: string[]
  }
}

export function EditJobModal({
  job,
  applicantCount = 0,
  jobTypes = [],
  placementLevels = [],
  placementCategories = [],
  placementCycles = [],
  academicFields = { departments: [], types: [], years: [] },
}: EditJobModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasApplicants = applicantCount > 0

  // Category 1 Fields (Always Editable)
  const [description, setDescription] = useState(job.description || '')
  const [deadline, setDeadline] = useState(
    job.application_deadline ? new Date(job.application_deadline).toISOString().slice(0, 16) : ''
  )
  const [status, setStatus] = useState(job.status || 'active')
  const [cycleId, setCycleId] = useState(job.cycle_id || 'none')
  const [stage1, setStage1] = useState(job.custom_stages?.stage_1 || job.custom_stages?.stage_1_label || '')
  const [stage2, setStage2] = useState(job.custom_stages?.stage_2 || job.custom_stages?.stage_2_label || '')
  const [stage3, setStage3] = useState(job.custom_stages?.stage_3 || job.custom_stages?.stage_3_label || '')

  // Operational Fields (Always Editable)
  const [workplaceMode, setWorkplaceMode] = useState(job.workplace_mode || 'On-Site')
  const [selectedCity, setSelectedCity] = useState(job.job_location || 'Bengaluru / Bangalore')
  const [citySearch, setCitySearch] = useState('')
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false)
  const [jobDomain, setJobDomain] = useState(job.job_domain || '')
  const [driveMode, setDriveMode] = useState(job.drive_mode || 'Virtual / Online')
  const [skillsInput, setSkillsInput] = useState(job.skills_required || '')

  // PDF Attachment (Strict 500 KB limit)
  const [attachedPdf, setAttachedPdf] = useState<{ name: string; url: string; sizeKb: number } | null>(
    job.jd_attachment_url ? { name: job.jd_attachment_name || 'Official_JD.pdf', url: job.jd_attachment_url, sizeKb: 0 } : null
  )
  const [pdfError, setPdfError] = useState<string | null>(null)

  // Category 2/3 Fields (Contract & Comp - Only editable when 0 applicants)
  const [title, setTitle] = useState(job.title || '')
  const [companyName, setCompanyName] = useState(job.company_name || '')
  const [employmentType, setEmploymentType] = useState(job.employment_type || 'Full-time')
  const isInternshipType = employmentType === 'Internship' || employmentType === 'Intern+PPO'
  const [internshipStipend, setInternshipStipend] = useState(job.internship_stipend?.toString() || '')
  const [internshipDuration, setInternshipDuration] = useState(job.internship_duration || '')
  const [hasBond, setHasBond] = useState(job.has_bond === true)
  const [bondDuration, setBondDuration] = useState(job.bond_duration || '')
  const [bondPenaltyAmount, setBondPenaltyAmount] = useState(job.bond_penalty_amount?.toString() || '')
  const [ctc, setCtc] = useState(job.compensation_ctc?.toString() || '')
  const [fixed, setFixed] = useState(job.compensation_fixed?.toString() || '')
  const [variable, setVariable] = useState(job.compensation_variable?.toString() || '')

  // Keep state updated whenever modal is opened
  useEffect(() => {
    if (open) {
      setDescription(job.description || '')
      setDeadline(
        job.application_deadline ? new Date(job.application_deadline).toISOString().slice(0, 16) : ''
      )
      setStatus(job.status || 'active')
      setCycleId(job.cycle_id || 'none')
      setStage1(job.custom_stages?.stage_1 || job.custom_stages?.stage_1_label || '')
      setStage2(job.custom_stages?.stage_2 || job.custom_stages?.stage_2_label || '')
      setStage3(job.custom_stages?.stage_3 || job.custom_stages?.stage_3_label || '')
      setWorkplaceMode(job.workplace_mode || 'On-Site')
      setSelectedCity(job.job_location || 'Bengaluru / Bangalore')
      setJobDomain(job.job_domain || '')
      setDriveMode(job.drive_mode || 'Virtual / Online')
      setSkillsInput(job.skills_required || '')
      setAttachedPdf(
        job.jd_attachment_url ? { name: job.jd_attachment_name || 'Official_JD.pdf', url: job.jd_attachment_url, sizeKb: 0 } : null
      )
      setTitle(job.title || '')
      setCompanyName(job.company_name || '')
      setEmploymentType(job.employment_type || 'Full-time')
      setInternshipStipend(job.internship_stipend?.toString() || '')
      setInternshipDuration(job.internship_duration || '')
      setHasBond(job.has_bond === true)
      setBondDuration(job.bond_duration || '')
      setBondPenaltyAmount(job.bond_penalty_amount?.toString() || '')
      setCtc(job.compensation_ctc?.toString() || '')
      setFixed(job.compensation_fixed?.toString() || '')
      setVariable(job.compensation_variable?.toString() || '')
    }
  }, [open, job])

  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return INDIAN_CITIES
    const q = citySearch.toLowerCase()
    return INDIAN_CITIES.filter(c => c.toLowerCase().includes(q))
  }, [citySearch])

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPdfError(null)
    const file = e.target.files?.[0]
    if (!file) return

    const maxSizeBytes = 500 * 1024
    if (file.size > maxSizeBytes) {
      setPdfError(`File size (${Math.round(file.size / 1024)} KB) exceeds the 500 KB limit. Please upload a compressed PDF.`)
      e.target.value = ''
      return
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setPdfError('Only official PDF documents are accepted.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setAttachedPdf({
        name: file.name,
        url: reader.result as string,
        sizeKb: Math.round(file.size / 1024)
      })
    }
    reader.readAsDataURL(file)
  }

  const removePdf = () => {
    setAttachedPdf(null)
    setPdfError(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    formData.set('description', description)
    formData.set('application_deadline', deadline)
    formData.set('status', status)
    formData.set('cycle_id', cycleId)
    formData.set('stage_1_label', stage1)
    formData.set('stage_2_label', stage2)
    formData.set('stage_3_label', stage3)
    formData.set('workplace_mode', workplaceMode)
    formData.set('job_location', selectedCity)
    formData.set('job_domain', jobDomain)
    formData.set('drive_mode', driveMode)
    formData.set('skills_required', skillsInput.trim())

    if (attachedPdf) {
      formData.set('jd_attachment_url', attachedPdf.url)
      formData.set('jd_attachment_name', attachedPdf.name)
    } else {
      formData.set('jd_attachment_url', '')
      formData.set('jd_attachment_name', '')
    }

    if (!hasApplicants) {
      formData.set('title', title)
      formData.set('company_name', companyName)
      formData.set('employment_type', employmentType)
      if (isInternshipType) {
        if (internshipStipend) formData.set('internship_stipend', internshipStipend)
        if (internshipDuration) formData.set('internship_duration', internshipDuration)
      }
      formData.set('has_bond', hasBond ? 'true' : 'false')
      if (hasBond) {
        if (bondDuration) formData.set('bond_duration', bondDuration)
        if (bondPenaltyAmount) formData.set('bond_penalty_amount', bondPenaltyAmount)
      }
      if (ctc) formData.set('compensation_ctc', ctc)
      if (fixed) formData.set('compensation_fixed', fixed)
      if (variable) formData.set('compensation_variable', variable)
    }

    const res = await updateJobDetails(job.id, formData)
    setIsSubmitting(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success || 'Job updated successfully!')
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="gap-2">
          <Edit3 className="h-4 w-4" />
          Edit Job Details
        </Button>
      } />
      <DialogContent 
        className="!w-[min(95vw,calc(92vh*16/9))] !max-w-[min(95vw,calc(92vh*16/9))] sm:!max-w-[min(95vw,calc(92vh*16/9))] h-[92vh] max-h-[92vh] flex flex-col p-6 md:p-8 overflow-hidden"
        style={{
          width: 'min(95vw, calc(92vh * 16 / 9))',
          maxWidth: 'min(95vw, calc(92vh * 16 / 9))',
          height: '92vh',
          maxHeight: '92vh',
        }}
      >
        <DialogHeader className="pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Edit Job Drive: {job.title}
            </DialogTitle>
            <span className="text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
              Widescreen 16:9 Editor
            </span>
          </div>
          <DialogDescription className="text-xs text-zinc-500">
            Update drive specifications, location, custom stages, deadlines, and JD attachments.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 py-4">
          {hasApplicants && (
            <div className="mb-4 p-3.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 flex items-start gap-3">
              <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200">
                <span className="font-bold">Contract Safeguard Active ({applicantCount} Registered Applicants):</span>
                <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                  Company Name, Title, Core CTC, and Eligibility criteria are strictly locked to protect candidate trust. You can freely update Workplace Mode, City, Domain, Skills, Interview Round Names, Application Deadlines, and JD Attachments.
                </p>
              </div>
            </div>
          )}

          <form id="edit-job-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* ══════════════════════════════════════════════════════════
                LEFT COLUMN: Role, Location, Compensation, Bond, Skills
                ══════════════════════════════════════════════════════════ */}
            <div className="space-y-6">

              {/* 1. ROLE & LOCATION SPECIFICS */}
              <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  Role &amp; Location Specifics
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="edit-title" className="text-xs font-semibold flex items-center gap-1">
                      Job Title / Designation
                      {hasApplicants && <Lock className="h-3 w-3 text-amber-600" />}
                    </Label>
                    <Input 
                      id="edit-title" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={hasApplicants} 
                      required 
                      className={`h-9 text-sm ${hasApplicants ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="edit-company" className="text-xs font-semibold flex items-center gap-1">
                      Company / Employer
                      {hasApplicants && <Lock className="h-3 w-3 text-amber-600" />}
                    </Label>
                    <Input 
                      id="edit-company" 
                      value={companyName} 
                      onChange={(e) => setCompanyName(e.target.value)}
                      disabled={hasApplicants} 
                      required 
                      className={`h-9 text-sm ${hasApplicants ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Workplace Mode *</Label>
                    <Select value={workplaceMode} onValueChange={(val) => setWorkplaceMode(val || 'On-Site')}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select Workplace Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {WORKPLACE_MODES.map((mode) => (
                          <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Searchable City */}
                  <div className="space-y-1 sm:col-span-2 relative">
                    <Label className="text-xs font-semibold flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-red-500" />
                      Job Location / City *
                    </Label>

                    <div className="relative">
                      <div 
                        onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                        className="flex items-center justify-between h-9 px-3 text-sm rounded-md border bg-white dark:bg-zinc-950 cursor-pointer hover:border-zinc-400 transition-colors"
                      >
                        <span className="truncate">{selectedCity || 'Search & select city...'}</span>
                        <span className="text-[10px] text-zinc-400">▼</span>
                      </div>

                      {cityDropdownOpen && (
                        <div className="absolute z-50 left-0 right-0 top-10 p-2 bg-white dark:bg-zinc-950 border rounded-lg shadow-xl max-h-60 flex flex-col">
                          <Input
                            placeholder="Type to filter cities..."
                            value={citySearch}
                            onChange={(e) => setCitySearch(e.target.value)}
                            className="h-8 text-xs mb-2"
                            autoFocus
                          />
                          <div className="overflow-y-auto flex-1 space-y-0.5 pr-1">
                            {filteredCities.map((city) => (
                              <button
                                key={city}
                                type="button"
                                onClick={() => {
                                  setSelectedCity(city)
                                  setCityDropdownOpen(false)
                                  setCitySearch('')
                                }}
                                className={`w-full text-left text-xs px-2.5 py-1.5 rounded-md transition-colors flex items-center justify-between ${
                                  selectedCity === city
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 font-semibold'
                                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                              >
                                <span>{city}</span>
                                {selectedCity === city && <Check className="h-3.5 w-3.5 text-blue-600" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="edit-domain" className="text-xs font-semibold">Job Domain</Label>
                    <Input 
                      id="edit-domain" 
                      value={jobDomain} 
                      onChange={(e) => setJobDomain(e.target.value)}
                      list="edit-job-domains" 
                      placeholder="e.g. Software Development" 
                      className="h-9 text-sm" 
                    />
                    <datalist id="edit-job-domains">
                      {JOB_DOMAINS.map(d => <option key={d} value={d} />)}
                    </datalist>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Drive Mode *</Label>
                    <Select value={driveMode} onValueChange={(val) => setDriveMode(val || 'Virtual / Online')}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select Drive Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {DRIVE_MODES.map((dm) => (
                          <SelectItem key={dm} value={dm}>{dm}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 2. EMPLOYMENT TYPE & COMPENSATION */}
              <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-green-600 flex items-center gap-1.5">
                    <IndianRupee className="h-4 w-4" />
                    Employment &amp; Remuneration
                  </h3>
                  {hasApplicants && (
                    <span className="text-[10px] text-amber-700 font-medium bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200">
                      Locked (Applicants Present)
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Employment Type</Label>
                    <Select 
                      value={employmentType} 
                      onValueChange={(val) => !hasApplicants && setEmploymentType(val || 'Full-time')}
                      disabled={hasApplicants}
                    >
                      <SelectTrigger className={`h-9 text-sm ${hasApplicants ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed' : ''}`}>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_TYPES.map((et) => (
                          <SelectItem key={et} value={et}>{et}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* CONDITIONAL INTERNSHIP FIELDS */}
                  {isInternshipType && (
                    <div className="p-3.5 rounded-lg border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 space-y-3">
                      <div className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                        Internship Terms ({employmentType})
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Monthly Stipend (₹/month)</Label>
                          <Input 
                            value={internshipStipend} 
                            onChange={(e) => setInternshipStipend(e.target.value)}
                            disabled={hasApplicants} 
                            type="number" 
                            placeholder="e.g. 40000" 
                            className={`h-9 text-sm bg-white dark:bg-zinc-950 ${hasApplicants ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : ''}`}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Internship Duration</Label>
                          <Input 
                            value={internshipDuration} 
                            onChange={(e) => setInternshipDuration(e.target.value)}
                            disabled={hasApplicants} 
                            placeholder="e.g. 6 Months (Jan - Jun)" 
                            className={`h-9 text-sm bg-white dark:bg-zinc-950 ${hasApplicants ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : ''}`}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FULL-TIME CTC */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      {isInternshipType && employmentType === 'Intern+PPO' ? 'PPO Conversion CTC Package (LPA)' : 'Compensation Package (CTC in LPA)'}
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-zinc-500">Total CTC</Label>
                        <Input 
                          value={ctc} 
                          onChange={(e) => setCtc(e.target.value)}
                          disabled={hasApplicants} 
                          type="number" 
                          step="0.01" 
                          placeholder="e.g. 14.5" 
                          className={`h-9 text-sm ${hasApplicants ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed' : ''}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-zinc-500">Fixed Base</Label>
                        <Input 
                          value={fixed} 
                          onChange={(e) => setFixed(e.target.value)}
                          disabled={hasApplicants} 
                          type="number" 
                          step="0.01" 
                          placeholder="e.g. 12.0" 
                          className={`h-9 text-sm ${hasApplicants ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed' : ''}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-zinc-500">Variable</Label>
                        <Input 
                          value={variable} 
                          onChange={(e) => setVariable(e.target.value)}
                          disabled={hasApplicants} 
                          type="number" 
                          step="0.01" 
                          placeholder="e.g. 2.5" 
                          className={`h-9 text-sm ${hasApplicants ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed' : ''}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. GOVERNANCE & BOND */}
              <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    Service Agreement / Bond
                  </h3>
                  {hasApplicants && (
                    <span className="text-[10px] text-amber-700 font-medium bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200">
                      Locked
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-lg border bg-zinc-50/50 dark:bg-zinc-950/40">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold">Service Agreement Required?</div>
                      <div className="text-[11px] text-zinc-500">Lock-in period or break penalty</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={hasApplicants}
                        variant={!hasBond ? 'default' : 'outline'}
                        onClick={() => !hasApplicants && setHasBond(false)}
                        className="h-8 text-xs"
                      >
                        No Bond
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={hasApplicants}
                        variant={hasBond ? 'default' : 'outline'}
                        onClick={() => !hasApplicants && setHasBond(true)}
                        className="h-8 text-xs"
                      >
                        Yes, Bond
                      </Button>
                    </div>
                  </div>

                  {hasBond && (
                    <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Bond Duration</Label>
                        <Input 
                          value={bondDuration} 
                          onChange={(e) => setBondDuration(e.target.value)}
                          disabled={hasApplicants}
                          placeholder="e.g. 1 Year, 2 Years" 
                          className="h-9 text-sm bg-white dark:bg-zinc-950" 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Bond Penalty Amount (₹)</Label>
                        <Input 
                          value={bondPenaltyAmount} 
                          onChange={(e) => setBondPenaltyAmount(e.target.value)}
                          disabled={hasApplicants}
                          type="number" 
                          placeholder="e.g. 150000" 
                          className="h-9 text-sm bg-white dark:bg-zinc-950" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. REQUIRED SKILLS & ATTACHMENT */}
              <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <Tag className="h-4 w-4" />
                  Skills &amp; Official Brochure / PDF
                </h3>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="edit-skills" className="text-xs font-semibold flex items-center justify-between">
                      <span>Required Skills (Comma-separated)</span>
                      <span className="text-[10px] text-zinc-400">Always editable</span>
                    </Label>
                    <Input 
                      id="edit-skills" 
                      value={skillsInput} 
                      onChange={(e) => setSkillsInput(e.target.value)}
                      placeholder="e.g. Python, React, PostgreSQL, Docker, AWS" 
                      className="h-9 text-sm" 
                    />
                  </div>

                  {/* PDF Upload strictly max 500 KB */}
                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-zinc-400" />
                        Official JD Document (PDF Only, Max 500 KB)
                      </span>
                      <span className="text-[10px] text-amber-600 font-medium">500 KB cap</span>
                    </Label>

                    {!attachedPdf ? (
                      <div className="border-2 border-dashed rounded-lg p-3 text-center hover:border-zinc-400 transition-colors bg-zinc-50/50 dark:bg-zinc-950/40">
                        <input
                          id="edit_jd_pdf_upload"
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handlePdfUpload}
                          className="hidden"
                        />
                        <label htmlFor="edit_jd_pdf_upload" className="cursor-pointer flex flex-col items-center justify-center space-y-1">
                          <Upload className="h-5 w-5 text-zinc-400" />
                          <div className="text-xs font-medium text-blue-600 hover:underline">
                            Click to attach official JD document
                          </div>
                          <p className="text-[10px] text-zinc-500">PDF format only (up to 500 KB)</p>
                        </label>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 truncate">{attachedPdf.name}</div>
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400">Attached Document</div>
                          </div>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={removePdf}
                          className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {pdfError && (
                      <div className="p-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded border border-red-200 dark:border-red-900 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{pdfError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* ══════════════════════════════════════════════════════════
                RIGHT COLUMN: Window, Custom Stages, Description
                ══════════════════════════════════════════════════════════ */}
            <div className="space-y-6">

              {/* 5. APPLICATION DEADLINE & STATUS */}
              <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Window &amp; Status
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Listing Status</Label>
                    <Select value={status} onValueChange={(val) => setStatus(val || 'active')}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active (Visible)</SelectItem>
                        <SelectItem value="paused">Paused (Draft / Hidden)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Application Deadline</Label>
                    <Input 
                      type="datetime-local" 
                      value={deadline} 
                      onChange={(e) => setDeadline(e.target.value)}
                      className="h-9 text-sm" 
                    />
                  </div>

                  {placementCycles && placementCycles.length > 0 && (
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs font-semibold">Placement Season <span className="text-red-500">*</span></Label>
                      <Select value={cycleId} onValueChange={(val) => setCycleId(val)}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select Cycle" />
                        </SelectTrigger>
                        <SelectContent>
                          {placementCycles
                            .filter(c => c.is_active || c.id === job.cycle_id)
                            .map(pc => (
                            <SelectItem key={pc.id} value={pc.id}>
                              {pc.name} {pc.is_active ? ' (Active)' : ' (Inactive)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* 6. CUSTOM ROUND NAMES */}
              <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-indigo-600" />
                    Custom Drive Rounds (Pipeline)
                  </h3>
                  <span className="text-[11px] text-zinc-400">Always editable</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Round 1 Name</Label>
                    <Input 
                      value={stage1} 
                      onChange={(e) => setStage1(e.target.value)} 
                      placeholder="e.g. Online Test" 
                      className="h-8 text-xs" 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Round 2 Name</Label>
                    <Input 
                      value={stage2} 
                      onChange={(e) => setStage2(e.target.value)} 
                      placeholder="e.g. Technical Interview" 
                      className="h-8 text-xs" 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Round 3 Name</Label>
                    <Input 
                      value={stage3} 
                      onChange={(e) => setStage3(e.target.value)} 
                      placeholder="e.g. Managerial / HR" 
                      className="h-8 text-xs" 
                    />
                  </div>
                </div>
              </div>

              {/* 7. JOB DESCRIPTION */}
              <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-2 shadow-xs">
                <Label className="text-xs font-semibold">Job Description &amp; Responsibilities *</Label>
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  required 
                  className="min-h-[220px] text-sm"
                />
              </div>

            </div>

          </form>
        </div>

        <div className="flex justify-end pt-3 border-t gap-3 flex-shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="edit-job-form" size="sm" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

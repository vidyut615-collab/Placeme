'use client'

import { useState, useTransition, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus, 
  Briefcase, 
  GraduationCap, 
  IndianRupee, 
  ShieldCheck, 
  Check, 
  Layers, 
  MapPin, 
  FileText, 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Building2,
  Calendar,
  Sparkles,
  HelpCircle,
  Tag
} from 'lucide-react'
import { 
  INDIAN_CITIES, 
  JOB_DOMAINS, 
  WORKPLACE_MODES, 
  EMPLOYMENT_TYPES, 
  DRIVE_MODES 
} from '@/lib/cities-data'

interface CreateJobModalProps {
  action: (formData: FormData) => Promise<{ error?: string; success?: string }>
  title: string
  description: string
  jobTypes?: Array<{ id: string; name: string }>
  placementLevels?: Array<{ id: string; name: string; is_dream?: boolean; is_super_dream?: boolean }>
  placementCategories?: Array<{ id: string; name: string }>
  placementCycles?: Array<{ id: string; name: string; is_active?: boolean }>
  academicFields?: {
    departments?: string[]
    types?: string[]
    years?: string[]
  }
}

export function CreateJobModal({
  action,
  title,
  description,
  jobTypes = [],
  placementLevels = [],
  placementCategories = [],
  placementCycles = [],
  academicFields = { departments: [], types: [], years: [] }
}: CreateJobModalProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Selected multi-select academic options
  const [selectedDepts, setSelectedDepts] = useState<string[]>([])
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>([])
  const [selectedYears, setSelectedYears] = useState<string[]>([])

  // Employment Type & Conditional Fields
  const [employmentType, setEmploymentType] = useState<string>('Full-time')
  const isInternshipType = employmentType === 'Internship' || employmentType === 'Intern+PPO'

  // Service Agreement / Bond
  const [hasBond, setHasBond] = useState<boolean>(false)

  // Location / Searchable City
  const [selectedCity, setSelectedCity] = useState<string>('Bengaluru / Bangalore')
  const [citySearch, setCitySearch] = useState<string>('')
  const [cityDropdownOpen, setCityDropdownOpen] = useState<boolean>(false)

  // Required Skills (Comma-separated)
  const [skillsInput, setSkillsInput] = useState<string>('')
  const skillsList = useMemo(() => {
    return skillsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  }, [skillsInput])

  // PDF Attachment (Strict 500 KB limit)
  const [attachedPdf, setAttachedPdf] = useState<{ name: string; url: string; sizeKb: number } | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return INDIAN_CITIES
    const q = citySearch.toLowerCase()
    return INDIAN_CITIES.filter(c => c.toLowerCase().includes(q))
  }, [citySearch])

  const toggleItem = (list: string[], setList: (items: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item))
    } else {
      setList([...list, item])
    }
  }

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPdfError(null)
    const file = e.target.files?.[0]
    if (!file) return

    // Strict 500 KB limit (500 * 1024 bytes)
    const maxSizeBytes = 500 * 1024
    if (file.size > maxSizeBytes) {
      setPdfError(`File size (${Math.round(file.size / 1024)} KB) exceeds the 500 KB limit. Please upload a compressed PDF.`)
      e.target.value = ''
      return
    }

    // Must be PDF
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

  const handleSubmit = (formData: FormData) => {
    setErrorMsg(null)
    
    // Set custom components into formData
    formData.set('employment_type', employmentType)
    formData.set('job_location', selectedCity)
    formData.set('has_bond', hasBond ? 'true' : 'false')
    formData.set('skills_required', skillsInput.trim())

    if (attachedPdf) {
      formData.set('jd_attachment_url', attachedPdf.url)
      formData.set('jd_attachment_name', attachedPdf.name)
    }

    // Append multi-select arrays as comma-separated values
    if (selectedDepts.length > 0) {
      formData.set('eligibility_allowed_departments', selectedDepts.join(','))
    }
    if (selectedDegrees.length > 0) {
      formData.set('eligibility_allowed_degrees', selectedDegrees.join(','))
    }
    if (selectedYears.length > 0) {
      formData.set('eligibility_allowed_years', selectedYears.join(','))
    }

    startTransition(async () => {
      const res = await action(formData)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setOpen(false)
        setSelectedDepts([])
        setSelectedDegrees([])
        setSelectedYears([])
        setAttachedPdf(null)
        setSkillsInput('')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="gap-2">
          <Plus className="h-4 w-4" />{title}
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
              <Briefcase className="h-5 w-5 text-blue-600" />
              {title}
            </DialogTitle>
            <span className="text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
              Widescreen 16:9 Editor
            </span>
          </div>
          <DialogDescription className="text-xs text-zinc-500">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 py-4">
          {errorMsg && (
            <div className="mb-4 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form id="create-job-form" action={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
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
                    <Label htmlFor="title" className="text-xs font-semibold">Job Title / Designation *</Label>
                    <Input id="title" name="title" placeholder="e.g. Associate Software Engineer (Full Stack)" required className="h-9 text-sm" />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="company_name" className="text-xs font-semibold">Company / Employer *</Label>
                    <Input id="company_name" name="company_name" placeholder="e.g. Microsoft India" required className="h-9 text-sm" />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="workplace_mode" className="text-xs font-semibold">Workplace Mode *</Label>
                    <Select name="workplace_mode" defaultValue="On-Site">
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

                  {/* Searchable City / Location Dropdown */}
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
                            {filteredCities.length === 0 && (
                              <div className="p-3 text-center text-xs text-zinc-400">
                                No matching cities. You can type custom city in description.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Job Domain & Drive Mode */}
                  <div className="space-y-1">
                    <Label htmlFor="job_domain" className="text-xs font-semibold">Job Domain / Track</Label>
                    <Input 
                      id="job_domain" 
                      name="job_domain" 
                      list="job-domains-list"
                      placeholder="e.g. Software Development" 
                      className="h-9 text-sm" 
                    />
                    <datalist id="job-domains-list">
                      {JOB_DOMAINS.map(d => <option key={d} value={d} />)}
                    </datalist>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="drive_mode" className="text-xs font-semibold">Drive Mode *</Label>
                    <Select name="drive_mode" defaultValue="Virtual / Online">
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

              {/* 2. EMPLOYMENT TYPE & CONDITIONAL REMUNERATION */}
              <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-green-600 flex items-center gap-1.5">
                    <IndianRupee className="h-4 w-4" />
                    Employment &amp; Remuneration
                  </h3>
                  <span className="text-[11px] text-zinc-400">Conditional inputs by type</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Employment Type *</Label>
                    <Select value={employmentType} onValueChange={(val) => setEmploymentType(val || 'Full-time')}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select Employment Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_TYPES.map((et) => (
                          <SelectItem key={et} value={et}>{et}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* CONDITIONAL INTERNSHIP FIELDS: Displayed ONLY for Internship or Intern+PPO */}
                  {isInternshipType && (
                    <div className="p-3.5 rounded-lg border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 space-y-3">
                      <div className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                        Internship Terms ({employmentType})
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="internship_stipend" className="text-xs font-semibold">Monthly Stipend (₹/month) *</Label>
                          <Input 
                            id="internship_stipend" 
                            name="internship_stipend" 
                            type="number" 
                            placeholder="e.g. 40000" 
                            className="h-9 text-sm bg-white dark:bg-zinc-950" 
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="internship_duration" className="text-xs font-semibold">Internship Duration</Label>
                          <Input 
                            id="internship_duration" 
                            name="internship_duration" 
                            placeholder="e.g. 6 Months (Jan - Jun)" 
                            className="h-9 text-sm bg-white dark:bg-zinc-950" 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FULL-TIME CTC PACKAGE (Relevant for Full-time, Part-time, and Intern+PPO conversion) */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      {isInternshipType && employmentType === 'Intern+PPO' ? 'PPO Conversion CTC Package (LPA)' : 'Compensation Package (CTC in LPA)'}
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="compensation_ctc" className="text-[11px] text-zinc-500">Total CTC (LPA)</Label>
                        <Input id="compensation_ctc" name="compensation_ctc" type="number" step="0.01" placeholder="e.g. 14.5" className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="compensation_fixed" className="text-[11px] text-zinc-500">Fixed Base (LPA)</Label>
                        <Input id="compensation_fixed" name="compensation_fixed" type="number" step="0.01" placeholder="e.g. 12.0" className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="compensation_variable" className="text-[11px] text-zinc-500">Variable / Bonus</Label>
                        <Input id="compensation_variable" name="compensation_variable" type="number" step="0.01" placeholder="e.g. 2.5" className="h-9 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. GOVERNANCE & SERVICE AGREEMENT (BOND) */}
              <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    Service Agreement / Bond Transparency
                  </h3>
                  <span className="text-[11px] text-zinc-400">Institutional policy</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-lg border bg-zinc-50/50 dark:bg-zinc-950/40">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold">Is there a Service Agreement / Employment Bond?</div>
                      <div className="text-[11px] text-zinc-500">Mandates student lock-in period or financial penalty for early exit</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={!hasBond ? 'default' : 'outline'}
                        onClick={() => setHasBond(false)}
                        className="h-8 text-xs"
                      >
                        No Bond
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={hasBond ? 'default' : 'outline'}
                        onClick={() => setHasBond(true)}
                        className="h-8 text-xs"
                      >
                        Yes, Bond Exists
                      </Button>
                    </div>
                  </div>

                  {/* CONDITIONAL BOND DETAILS */}
                  {hasBond && (
                    <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="bond_duration" className="text-xs font-semibold">Bond Duration</Label>
                        <Input 
                          id="bond_duration" 
                          name="bond_duration" 
                          placeholder="e.g. 1 Year, 18 Months, 2 Years" 
                          className="h-9 text-sm bg-white dark:bg-zinc-950" 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="bond_penalty_amount" className="text-xs font-semibold">Bond Penalty Amount (₹)</Label>
                        <Input 
                          id="bond_penalty_amount" 
                          name="bond_penalty_amount" 
                          type="number" 
                          placeholder="e.g. 150000" 
                          className="h-9 text-sm bg-white dark:bg-zinc-950" 
                        />
                      </div>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 sm:col-span-2">
                        * Provide duration, break amount, or both to ensure complete compliance for student applicants.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. REQUIRED SKILLS & OFFICIAL JD PDF (MAX 500 KB) */}
              <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <Tag className="h-4 w-4" />
                  Skills &amp; Official Brochure / PDF
                </h3>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="skills_input" className="text-xs font-semibold flex items-center justify-between">
                      <span>Required Skills &amp; Tech Stack</span>
                      <span className="text-[10px] text-zinc-400">Comma-separated</span>
                    </Label>
                    <Input 
                      id="skills_input" 
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      placeholder="e.g. Python, React, PostgreSQL, Docker, Data Structures" 
                      className="h-9 text-sm" 
                    />
                    {skillsList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {skillsList.map((skill, idx) => (
                          <span key={idx} className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* PDF Upload strictly max 500 KB */}
                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-zinc-400" />
                        Official JD Document (PDF Only, Max 500 KB)
                      </span>
                      <span className="text-[10px] text-amber-600 font-medium">Strict 500 KB cap</span>
                    </Label>

                    {!attachedPdf ? (
                      <div className="border-2 border-dashed rounded-lg p-3 text-center hover:border-zinc-400 transition-colors bg-zinc-50/50 dark:bg-zinc-950/40">
                        <input
                          id="jd_pdf_upload"
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handlePdfUpload}
                          className="hidden"
                        />
                        <label htmlFor="jd_pdf_upload" className="cursor-pointer flex flex-col items-center justify-center space-y-1">
                          <Upload className="h-5 w-5 text-zinc-400" />
                          <div className="text-xs font-medium text-blue-600 hover:underline">
                            Click to attach official JD document
                          </div>
                          <p className="text-[10px] text-zinc-500">
                            PDF format only (must be $\le$ 500 KB)
                          </p>
                        </label>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 truncate">{attachedPdf.name}</div>
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400">{attachedPdf.sizeKb} KB (Valid)</div>
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
                RIGHT COLUMN: Classification, Rounds, Eligibility, Description
                ══════════════════════════════════════════════════════════ */}
            <div className="space-y-6">

              {/* 5. PLACEMENT CLASSIFICATION & CYCLE */}
              <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  Policy Classifications &amp; Window
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="status" className="text-xs font-semibold">Listing Status</Label>
                    <Select name="status" defaultValue="active">
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
                    <Label htmlFor="application_deadline" className="text-xs font-semibold">Application Deadline</Label>
                    <Input id="application_deadline" name="application_deadline" type="datetime-local" className="h-9 text-sm" />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="placement_level_id" className="text-xs font-semibold">Placement Tier</Label>
                    <Select name="placement_level_id">
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select Tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Standard Tier</SelectItem>
                        {placementLevels.map(pl => (
                          <SelectItem key={pl.id} value={pl.id}>
                            {pl.name} {pl.is_super_dream ? '⭐ Super Dream' : pl.is_dream ? '🌟 Dream' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {placementCycles && placementCycles.length > 0 && (
                    <div className="space-y-1">
                      <Label htmlFor="cycle_id" className="text-xs font-semibold">Placement Season <span className="text-red-500">*</span></Label>
                      <Select name="cycle_id" defaultValue={placementCycles.find(c => c.is_active)?.id} required>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select Active Season" />
                        </SelectTrigger>
                        <SelectContent>
                          {placementCycles.filter(c => c.is_active).map(pc => (
                            <SelectItem key={pc.id} value={pc.id}>
                              {pc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* 6. CUSTOM ROUND NAMES (OPTIONAL) */}
              <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-indigo-600" />
                    Custom Drive Rounds (Optional)
                  </h3>
                  <span className="text-[11px] text-zinc-400">Pipeline stage names</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="stage_1_label" className="text-[11px] font-semibold">Round 1 Name</Label>
                    <Input id="stage_1_label" name="stage_1_label" placeholder="e.g. Online Test" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="stage_2_label" className="text-[11px] font-semibold">Round 2 Name</Label>
                    <Input id="stage_2_label" name="stage_2_label" placeholder="e.g. Technical Interview" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="stage_3_label" className="text-[11px] font-semibold">Round 3 Name</Label>
                    <Input id="stage_3_label" name="stage_3_label" placeholder="e.g. Managerial / HR" className="h-8 text-xs" />
                  </div>
                </div>
              </div>

              {/* 7. ACADEMIC ELIGIBILITY CUTOFFS */}
              <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4" />
                    Academic Eligibility Cutoffs
                  </h3>
                  <span className="text-[11px] text-zinc-400">Policy criteria</span>
                </div>

                {/* Numeric cutoffs */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="eligibility_min_cgpa" className="text-[11px] font-semibold">Min CGPA</Label>
                    <Input id="eligibility_min_cgpa" name="eligibility_min_cgpa" type="number" step="0.01" placeholder="e.g. 7.5" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="eligibility_min_10th" className="text-[11px] font-semibold">Min 10th %</Label>
                    <Input id="eligibility_min_10th" name="eligibility_min_10th" type="number" step="0.1" placeholder="e.g. 70" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="eligibility_min_12th" className="text-[11px] font-semibold">Min 12th %</Label>
                    <Input id="eligibility_min_12th" name="eligibility_min_12th" type="number" step="0.1" placeholder="e.g. 70" className="h-8 text-xs" />
                  </div>
                </div>

                {/* Backlogs & Gender */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="eligibility_max_active_backlogs" className="text-[11px] font-semibold">Active Backlogs</Label>
                    <Input id="eligibility_max_active_backlogs" name="eligibility_max_active_backlogs" type="number" placeholder="0" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="eligibility_max_historical_backlogs" className="text-[11px] font-semibold">Total Backlogs</Label>
                    <Input id="eligibility_max_historical_backlogs" name="eligibility_max_historical_backlogs" type="number" placeholder="e.g. 2" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="eligibility_allowed_genders" className="text-[11px] font-semibold">Gender</Label>
                    <Select name="eligibility_allowed_genders" defaultValue="any">
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Gender</SelectItem>
                        <SelectItem value="male">Male Only</SelectItem>
                        <SelectItem value="female">Female Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Multi-select degrees */}
                {academicFields?.types && academicFields.types.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-semibold">Eligible Degree Programs</Label>
                      <span className="text-[10px] text-zinc-400">
                        {selectedDegrees.length === 0 ? 'All eligible' : `${selectedDegrees.length} selected`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 p-2 rounded-lg border bg-zinc-50/50 dark:bg-zinc-950/40 max-h-24 overflow-y-auto">
                      {academicFields.types.map(deg => {
                        const isSelected = selectedDegrees.includes(deg)
                        return (
                          <button
                            key={deg}
                            type="button"
                            onClick={() => toggleItem(selectedDegrees, setSelectedDegrees, deg)}
                            className={`text-[11px] px-2 py-0.5 rounded-md border flex items-center gap-1 transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 font-medium'
                                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                            {deg}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Multi-select branches */}
                {academicFields?.departments && academicFields.departments.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-semibold">Eligible Branches / Departments</Label>
                      <span className="text-[10px] text-zinc-400">
                        {selectedDepts.length === 0 ? 'All eligible' : `${selectedDepts.length} selected`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 p-2 rounded-lg border bg-zinc-50/50 dark:bg-zinc-950/40 max-h-24 overflow-y-auto">
                      {academicFields.departments.map(dept => {
                        const isSelected = selectedDepts.includes(dept)
                        return (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => toggleItem(selectedDepts, setSelectedDepts, dept)}
                            className={`text-[11px] px-2 py-0.5 rounded-md border flex items-center gap-1 transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                            {dept}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Multi-select batches */}
                {academicFields?.years && academicFields.years.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-semibold">Eligible Passing Batches</Label>
                      <span className="text-[10px] text-zinc-400">
                        {selectedYears.length === 0 ? 'All eligible' : `${selectedYears.length} selected`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 p-2 rounded-lg border bg-zinc-50/50 dark:bg-zinc-950/40">
                      {academicFields.years.map(yr => {
                        const isSelected = selectedYears.includes(yr)
                        return (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => toggleItem(selectedYears, setSelectedYears, yr)}
                            className={`text-[11px] px-2 py-0.5 rounded-md border flex items-center gap-1 transition-all ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600 font-medium'
                                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                            {yr}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 8. JOB DESCRIPTION & RESPONSIBILITIES */}
              <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-2 shadow-xs">
                <Label htmlFor="description" className="text-xs font-semibold">Job Description &amp; Responsibilities *</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="Provide comprehensive details on role overview, core responsibilities, key qualifications, and work culture..." 
                  required 
                  className="min-h-[140px] text-sm"
                />
              </div>

            </div>

          </form>
        </div>

        <div className="flex justify-end pt-3 border-t gap-3 flex-shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="create-job-form" size="sm" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
            {isPending ? 'Publishing Drive...' : 'Publish Job Drive'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

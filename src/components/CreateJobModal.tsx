'use client'

import { useState, useTransition, useMemo, useRef, useEffect } from 'react'
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
  Calendar,
  Sparkles,
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

  // Location / Searchable City with Click-Outside
  const [selectedCity, setSelectedCity] = useState<string>('Bengaluru / Bangalore')
  const [citySearch, setCitySearch] = useState<string>('')
  const [cityDropdownOpen, setCityDropdownOpen] = useState<boolean>(false)
  const cityDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setCityDropdownOpen(false)
      }
    }
    if (cityDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [cityDropdownOpen])

  // Placement Cycles (Only Active Cycles)
  const activeCycles = useMemo(() => placementCycles.filter(c => c.is_active), [placementCycles])
  const [selectedCycleId, setSelectedCycleId] = useState<string>(() => activeCycles[0]?.id || '')

  useEffect(() => {
    if (activeCycles.length > 0 && !activeCycles.some(c => c.id === selectedCycleId)) {
      setSelectedCycleId(activeCycles[0].id)
    }
  }, [activeCycles, selectedCycleId])

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

  const handleSubmit = (formData: FormData) => {
    setErrorMsg(null)
    formData.set('job_location', selectedCity)

    if (attachedPdf) {
      formData.set('jd_attachment_url', attachedPdf.url)
      formData.set('jd_attachment_name', attachedPdf.name)
    }

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
              Job Post Requisition Form
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

          {/* Form structured in a clean, legible long-form layout */}
          <form id="create-job-form" action={handleSubmit} className="max-w-3xl mx-auto space-y-6 pb-6">

            {/* 1. ROLE & LOCATION SPECIFICS */}
            <div className="p-5 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs">
              <div className="border-b pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  1. Role &amp; Location Specifics
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">Core job identification and work location parameters</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-semibold">
                    Job Title / Designation <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="title" 
                    name="title" 
                    placeholder="e.g. Associate Software Engineer (Full Stack)" 
                    required 
                    className="h-9 text-sm" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="company_name" className="text-xs font-semibold">
                    Company / Employer <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="company_name" 
                    name="company_name" 
                    placeholder="e.g. Microsoft India" 
                    required 
                    className="h-9 text-sm" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="workplace_mode" className="text-xs font-semibold">
                      Workplace Mode <span className="text-red-500">*</span>
                    </Label>
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

                  <div className="space-y-1.5">
                    <Label htmlFor="drive_mode" className="text-xs font-semibold">
                      Drive Mode <span className="text-red-500">*</span>
                    </Label>
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

                {/* Searchable City / Location Dropdown with Click-Outside Ref */}
                <div className="space-y-1.5 relative" ref={cityDropdownRef}>
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-red-500" />
                    Job Location / City <span className="text-red-500">*</span>
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

                <div className="space-y-1.5">
                  <Label htmlFor="job_domain" className="text-xs font-semibold">Job Domain / Functional Track</Label>
                  <Input 
                    id="job_domain" 
                    name="job_domain" 
                    list="job-domains-list"
                    placeholder="e.g. Software Development, Data Science, Core Engineering" 
                    className="h-9 text-sm" 
                  />
                  <datalist id="job-domains-list">
                    {JOB_DOMAINS.map(d => <option key={d} value={d} />)}
                  </datalist>
                </div>
              </div>
            </div>

            {/* 2. EMPLOYMENT TYPE & REMUNERATION */}
            <div className="p-5 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs">
              <div className="border-b pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-green-600 flex items-center gap-1.5">
                  <IndianRupee className="h-4 w-4" />
                  2. Employment &amp; Remuneration
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">Contract type and compensation package breakdown</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Employment Type <span className="text-red-500">*</span>
                  </Label>
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

                {/* CONDITIONAL INTERNSHIP FIELDS */}
                {isInternshipType && (
                  <div className="p-4 rounded-lg border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 space-y-3">
                    <div className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                      Internship Terms ({employmentType})
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="internship_stipend" className="text-xs font-semibold">
                          Monthly Stipend (₹/month) <span className="text-red-500">*</span>
                        </Label>
                        <Input 
                          id="internship_stipend" 
                          name="internship_stipend" 
                          type="number" 
                          placeholder="e.g. 40000" 
                          className="h-9 text-sm bg-white dark:bg-zinc-950" 
                        />
                      </div>

                      <div className="space-y-1.5">
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

                {/* FULL-TIME CTC PACKAGE */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold">
                    {isInternshipType && employmentType === 'Intern+PPO' ? 'PPO Conversion CTC Package (LPA)' : 'Compensation Package (CTC in LPA)'}
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="compensation_ctc" className="text-[11px] text-zinc-500">Total CTC (LPA)</Label>
                      <Input id="compensation_ctc" name="compensation_ctc" type="number" step="0.01" placeholder="e.g. 14.5" className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="compensation_fixed" className="text-[11px] text-zinc-500">Fixed Base (LPA)</Label>
                      <Input id="compensation_fixed" name="compensation_fixed" type="number" step="0.01" placeholder="e.g. 12.0" className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="compensation_variable" className="text-[11px] text-zinc-500">Variable / Bonus</Label>
                      <Input id="compensation_variable" name="compensation_variable" type="number" step="0.01" placeholder="e.g. 2.5" className="h-9 text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. GOVERNANCE & SERVICE AGREEMENT (BOND) */}
            <div className="p-5 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs">
              <div className="border-b pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  3. Service Agreement / Bond Transparency
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">Employment contract lock-in periods or exit penalties</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-zinc-50/50 dark:bg-zinc-950/40">
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

                {hasBond && (
                  <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="bond_duration" className="text-xs font-semibold">Bond Duration</Label>
                        <Input 
                          id="bond_duration" 
                          name="bond_duration" 
                          placeholder="e.g. 1 Year, 18 Months, 2 Years" 
                          className="h-9 text-sm bg-white dark:bg-zinc-950" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="bond_penalty_amount" className="text-xs font-semibold">Bond Penalty Amount (₹)</Label>
                        <Input 
                          id="bond_penalty_amount" 
                          name="bond_penalty_amount" 
                          type="number" 
                          placeholder="e.g. 150000" 
                          className="h-9 text-sm bg-white dark:bg-zinc-950" 
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      * Provide duration, break amount, or both to ensure complete compliance for student applicants.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 4. REQUIRED SKILLS & OFFICIAL JD PDF */}
            <div className="p-5 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs">
              <div className="border-b pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <Tag className="h-4 w-4" />
                  4. Skills &amp; Official Brochure / PDF
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">Required tech stack, tags, and authentic company job description</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="skills_required" className="text-xs font-semibold">
                    Primary Required Skills (Comma-separated)
                  </Label>
                  <Input 
                    id="skills_required" 
                    name="skills_required" 
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="e.g. React.js, Python, PostgreSQL, System Design" 
                    className="h-9 text-sm" 
                  />
                  {skillsList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {skillsList.map((skill, idx) => (
                        <span key={idx} className="text-[11px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Official Job Description (PDF Attachment - Max 500 KB)
                  </Label>
                  
                  {!attachedPdf ? (
                    <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-5 text-center hover:border-zinc-300 transition-colors">
                      <Upload className="h-6 w-6 text-zinc-400 mx-auto mb-1.5" />
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                        Upload official company JD or brochure
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Strictly PDF only • Maximum 500 KB</p>
                      <input 
                        type="file" 
                        accept="application/pdf,.pdf" 
                        onChange={handlePdfUpload}
                        className="hidden" 
                        id="jd-pdf-upload" 
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => document.getElementById('jd-pdf-upload')?.click()}
                        className="mt-3 h-8 text-xs"
                      >
                        Choose PDF
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {attachedPdf.name}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            {attachedPdf.sizeKb} KB • PDF Document
                          </div>
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={removePdf}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {pdfError && (
                    <p className="text-xs text-red-600 mt-1">{pdfError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 5. ACADEMIC ELIGIBILITY CRITERIA */}
            <div className="p-5 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs">
              <div className="border-b pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  5. Academic Eligibility Criteria
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">Academic marks, allowed backlogs, departments, and passing batches</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="eligibility_min_gpa" className="text-xs font-semibold">Minimum CGPA (0 - 10)</Label>
                    <Input id="eligibility_min_gpa" name="eligibility_min_gpa" type="number" step="0.01" min="0" max="10" placeholder="e.g. 7.50" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="eligibility_max_backlogs" className="text-xs font-semibold">Max Active Backlogs Allowed</Label>
                    <Input id="eligibility_max_backlogs" name="eligibility_max_backlogs" type="number" min="0" placeholder="e.g. 0" className="h-9 text-sm" />
                  </div>
                </div>

                {/* Multi-select degree types */}
                {academicFields?.types && academicFields.types.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Eligible Degree Programs</Label>
                      <span className="text-[10px] text-zinc-400">
                        {selectedDegrees.length === 0 ? 'All degree types eligible' : `${selectedDegrees.length} selected`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border bg-zinc-50/50 dark:bg-zinc-950/40">
                      {academicFields.types.map(degree => {
                        const isSelected = selectedDegrees.includes(degree)
                        return (
                          <button
                            key={degree}
                            type="button"
                            onClick={() => toggleItem(selectedDegrees, setSelectedDegrees, degree)}
                            className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1 transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 font-medium'
                                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                            {degree}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Multi-select branches */}
                {academicFields?.departments && academicFields.departments.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Eligible Branches / Departments</Label>
                      <span className="text-[10px] text-zinc-400">
                        {selectedDepts.length === 0 ? 'All branches eligible' : `${selectedDepts.length} selected`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border bg-zinc-50/50 dark:bg-zinc-950/40 max-h-36 overflow-y-auto">
                      {academicFields.departments.map(dept => {
                        const isSelected = selectedDepts.includes(dept)
                        return (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => toggleItem(selectedDepts, setSelectedDepts, dept)}
                            className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1 transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
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
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Eligible Passing Batches</Label>
                      <span className="text-[10px] text-zinc-400">
                        {selectedYears.length === 0 ? 'All batches eligible' : `${selectedYears.length} selected`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border bg-zinc-50/50 dark:bg-zinc-950/40">
                      {academicFields.years.map(yr => {
                        const isSelected = selectedYears.includes(yr)
                        return (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => toggleItem(selectedYears, setSelectedYears, yr)}
                            className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1 transition-all ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600 font-medium'
                                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
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
            </div>

            {/* 6. DRIVE LOGISTICS & TIMELINE */}
            <div className="p-5 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs">
              <div className="border-b pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  6. Drive Logistics &amp; Timeline
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">Placement cycle assignment, deadline, and live visibility status</p>
              </div>

              <div className="space-y-4">
                {/* Placement Cycle Selection (College only) */}
                {placementCycles && placementCycles.length > 0 && (
                  <div className="space-y-1.5">
                    <Label htmlFor="cycle_id" className="text-xs font-semibold">
                      Placement Cycle <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      name="cycle_id" 
                      value={selectedCycleId} 
                      onValueChange={(val) => setSelectedCycleId(val || '')} 
                      required
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select Active Placement Cycle">
                          {activeCycles.find(c => c.id === selectedCycleId)?.name || 'Select Active Placement Cycle'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {activeCycles.map((pc) => (
                          <SelectItem key={pc.id} value={pc.id}>
                            {pc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-zinc-500">
                      The job drive will be organized under this active recruitment cycle.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
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

                  <div className="space-y-1.5">
                    <Label htmlFor="application_deadline" className="text-xs font-semibold">
                      Application Deadline (DD/MM/YYYY HH:MM)
                    </Label>
                    <Input 
                      id="application_deadline" 
                      name="application_deadline" 
                      type="datetime-local" 
                      step="60" 
                      className="h-9 text-sm" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 7. CUSTOM DRIVE ROUNDS (OPTIONAL) */}
            <div className="p-5 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs">
              <div className="border-b pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <Layers className="h-4 w-4" />
                  7. Custom Drive Rounds (Optional)
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">Configure interview progression phases for this employer</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="stage_1_name" className="text-xs font-semibold">Stage 1</Label>
                  <Input id="stage_1_name" name="stage_1_name" placeholder="e.g. Online Assessment" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="stage_2_name" className="text-xs font-semibold">Stage 2</Label>
                  <Input id="stage_2_name" name="stage_2_name" placeholder="e.g. Technical Round 1" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="stage_3_name" className="text-xs font-semibold">Stage 3</Label>
                  <Input id="stage_3_name" name="stage_3_name" placeholder="e.g. HR Interview" className="h-9 text-xs" />
                </div>
              </div>
            </div>

            {/* 8. JOB DESCRIPTION & RESPONSIBILITIES */}
            <div className="p-5 rounded-xl border bg-white dark:bg-zinc-900/60 space-y-3 shadow-xs">
              <div className="border-b pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  8. Job Description &amp; Responsibilities
                </h3>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-semibold">
                  Detailed Description <span className="text-red-500">*</span>
                </Label>
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
          <Button 
            type="submit" 
            form="create-job-form" 
            size="sm" 
            disabled={isPending} 
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[130px]"
          >
            {isPending ? 'Publishing Drive...' : 'Publish Job Drive'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

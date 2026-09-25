'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateCollegeProfile } from '@/app/(dashboards)/college/actions'
import { 
  Building2, 
  Globe, 
  MapPin, 
  Mail, 
  Phone, 
  Award, 
  ShieldCheck, 
  Upload, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  ShieldAlert, 
  AlertCircle,
  TrendingUp,
  Plane,
  Laptop
} from 'lucide-react'

interface CollegeDetailsFormProps {
  initialData: {
    name: string
    website?: string | null
    location?: string | null
    description?: string | null
    contact_email?: string | null
    contact_phone?: string | null
    logo_url?: string | null
    banner_url?: string | null
    brochure_url?: string | null
    address_street?: string | null
    address_state?: string | null
    address_pincode?: string | null
    naac_grade?: string | null
    nba_accreditation?: string | null
    aishe_code?: string | null
    university_affiliation?: string | null
    nirf_rank?: string | null
    establishment_year?: string | null
    lab_capacity?: string | null
    auditorium_capacity?: string | null
    interview_cabins?: string | null
    nearest_airport?: string | null
    nearest_railway?: string | null
    campus_guest_house?: string | null
    highest_ctc?: string | null
    average_ctc?: string | null
    total_companies_visited?: string | null
  }
  isAdmin?: boolean
}

export function CollegeDetailsForm({ initialData, isAdmin = true }: CollegeDetailsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Media states with 2 MB limit (2 * 1024 * 1024 bytes)
  const [logoUrl, setLogoUrl] = useState<string>(initialData.logo_url || '')
  const [bannerUrl, setBannerUrl] = useState<string>(initialData.banner_url || '')
  const [brochureUrl, setBrochureUrl] = useState<string>(initialData.brochure_url || '')
  const [brochureName, setBrochureName] = useState<string>(initialData.brochure_url ? 'Placement_Brochure.pdf' : '')

  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleMediaUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'banner' | 'brochure'
  ) => {
    setUploadError(null)
    const file = e.target.files?.[0]
    if (!file) return

    // Strict 2 MB limit (2 * 1024 * 1024 bytes)
    const maxSizeBytes = 2 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setUploadError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 2 MB limit. Please upload a smaller file.`)
      e.target.value = ''
      return
    }

    if (type === 'brochure') {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setUploadError('Placement brochure must be an authentic PDF document.')
        e.target.value = ''
        return
      }
    } else {
      if (!file.type.startsWith('image/')) {
        setUploadError('Logo and Banner must be valid image files (PNG, JPG, WebP).')
        e.target.value = ''
        return
      }
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      if (type === 'logo') setLogoUrl(result)
      if (type === 'banner') setBannerUrl(result)
      if (type === 'brochure') {
        setBrochureUrl(result)
        setBrochureName(file.name)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isAdmin) return
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    formData.set('logo_url', logoUrl)
    formData.set('banner_url', bannerUrl)
    formData.set('brochure_url', brochureUrl)

    startTransition(async () => {
      const result = await updateCollegeProfile(formData)
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else if (result.success) {
        setMessage({ type: 'success', text: result.success })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl pb-10">
      {!isAdmin && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-800/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-center gap-3 shadow-xs">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <span className="font-bold block">Institutional Profile View</span>
            <span className="text-xs text-amber-800/90 dark:text-amber-300/90">
              You are viewing institutional details in read-only mode. Editing college details and placement office contacts is restricted to College Administrators.
            </span>
          </div>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-xl text-sm border flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {message.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-4 rounded-xl text-sm border bg-red-50 text-red-600 border-red-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      <fieldset disabled={!isAdmin} className="space-y-6 border-0 p-0 m-0">

        {/* 1. INSTITUTIONAL IDENTITY & BRANDING MEDIA */}
        <div className="p-6 rounded-2xl border bg-white dark:bg-zinc-900 space-y-5 shadow-xs">
          <div className="border-b pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              1. Institutional Identity &amp; Branding
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Primary college name, official website, and branding assets (Max 2 MB)</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">
                Official College Name <span className="text-red-500">*</span>
              </Label>
              <Input id="name" name="name" defaultValue={initialData.name} required className="text-sm" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="website" className="text-xs font-semibold flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-zinc-400" />
                Official Website URL (Optional)
              </Label>
              <Input 
                id="website" 
                name="website" 
                type="url" 
                placeholder="https://www.college.edu" 
                defaultValue={initialData.website || ''} 
                className="text-sm" 
              />
            </div>

            {/* Media Uploads Grid: Logo & Campus Banner (2 MB limit) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* College Logo */}
              <div className="p-4 rounded-xl border bg-zinc-50/50 dark:bg-zinc-950/40 space-y-3">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5 text-blue-600" />
                  College Logo (Optional • Max 2 MB)
                </Label>
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-14 w-14 rounded-lg object-contain border bg-white p-1" />
                  ) : (
                    <div className="h-14 w-14 rounded-lg border border-dashed flex items-center justify-center text-zinc-400 bg-white dark:bg-zinc-900">
                      <Building2 className="h-6 w-6" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <input 
                      id="college-logo-input" 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleMediaUpload(e, 'logo')} 
                      className="hidden" 
                    />
                    <div className="flex items-center gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => document.getElementById('college-logo-input')?.click()}
                        className="h-7 text-xs"
                      >
                        {logoUrl ? 'Change Logo' : 'Upload Logo'}
                      </Button>
                      {logoUrl && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setLogoUrl('')} 
                          className="h-7 text-xs text-red-500"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 block">PNG, JPG, SVG • Under 2 MB</span>
                  </div>
                </div>
              </div>

              {/* Campus Banner */}
              <div className="p-4 rounded-xl border bg-zinc-50/50 dark:bg-zinc-950/40 space-y-3">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5 text-indigo-600" />
                  Campus Cover / Banner (Optional • Max 2 MB)
                </Label>
                <div className="flex items-center gap-3">
                  {bannerUrl ? (
                    <img src={bannerUrl} alt="Banner" className="h-14 w-24 rounded-lg object-cover border" />
                  ) : (
                    <div className="h-14 w-24 rounded-lg border border-dashed flex items-center justify-center text-zinc-400 bg-white dark:bg-zinc-900 text-xs">
                      No Banner
                    </div>
                  )}
                  <div className="space-y-1">
                    <input 
                      id="college-banner-input" 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleMediaUpload(e, 'banner')} 
                      className="hidden" 
                    />
                    <div className="flex items-center gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => document.getElementById('college-banner-input')?.click()}
                        className="h-7 text-xs"
                      >
                        {bannerUrl ? 'Change Banner' : 'Upload Banner'}
                      </Button>
                      {bannerUrl && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setBannerUrl('')} 
                          className="h-7 text-xs text-red-500"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 block">Wide landscape • Under 2 MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. CAMPUS ADDRESS & LOCATION */}
        <div className="p-6 rounded-2xl border bg-white dark:bg-zinc-900 space-y-5 shadow-xs">
          <div className="border-b pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-rose-600 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              2. Campus Address &amp; Location
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Physical location coordinates for visiting corporate delegates and offer letters</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-semibold">City / District (Optional)</Label>
                <Input 
                  id="location" 
                  name="location" 
                  placeholder="e.g. Mumbai" 
                  defaultValue={initialData.location || ''} 
                  className="text-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address_state" className="text-xs font-semibold">State / Province (Optional)</Label>
                <Input 
                  id="address_state" 
                  name="address_state" 
                  placeholder="e.g. Maharashtra" 
                  defaultValue={initialData.address_state || ''} 
                  className="text-sm" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address_street" className="text-xs font-semibold">Full Campus Street Address (Optional)</Label>
                <Input 
                  id="address_street" 
                  name="address_street" 
                  placeholder="e.g. Powai, Main Gate Road, Tech Zone" 
                  defaultValue={initialData.address_street || ''} 
                  className="text-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address_pincode" className="text-xs font-semibold">Postal Pincode (Optional)</Label>
                <Input 
                  id="address_pincode" 
                  name="address_pincode" 
                  placeholder="e.g. 400076" 
                  defaultValue={initialData.address_pincode || ''} 
                  className="text-sm" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. OFFICIAL PLACEMENT CELL CONTACTS */}
        <div className="p-6 rounded-2xl border bg-white dark:bg-zinc-900 space-y-5 shadow-xs">
          <div className="border-b pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-green-600 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              3. Official Placement Cell Contacts
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Public channels for company HR teams to initiate drive inquiries</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact_email" className="text-xs font-semibold flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-zinc-400" />
                Placement Desk Email (Optional)
              </Label>
              <Input 
                id="contact_email" 
                name="contact_email" 
                type="email" 
                placeholder="placements@college.edu" 
                defaultValue={initialData.contact_email || ''} 
                className="text-sm" 
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact_phone" className="text-xs font-semibold flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-zinc-400" />
                Placement Office Boardline (Optional)
              </Label>
              <Input 
                id="contact_phone" 
                name="contact_phone" 
                type="tel" 
                placeholder="+91 22 2576 7000" 
                defaultValue={initialData.contact_phone || ''} 
                className="text-sm" 
              />
            </div>
          </div>
        </div>

        {/* 4. ACCREDITATIONS & GOVERNMENT CODES */}
        <div className="p-6 rounded-2xl border bg-white dark:bg-zinc-900 space-y-5 shadow-xs">
          <div className="border-b pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 flex items-center gap-2">
              <Award className="h-4 w-4" />
              4. Accreditations, Affiliations &amp; Recognition
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Government recognitions and national ranking metrics (All Optional)</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="naac_grade" className="text-xs font-semibold">NAAC Accreditation Grade</Label>
                <Input 
                  id="naac_grade" 
                  name="naac_grade" 
                  placeholder="e.g. A++, A+, A" 
                  defaultValue={initialData.naac_grade || ''} 
                  className="text-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nirf_rank" className="text-xs font-semibold">NIRF Ranking / Band</Label>
                <Input 
                  id="nirf_rank" 
                  name="nirf_rank" 
                  placeholder="e.g. Rank 42 in Engineering" 
                  defaultValue={initialData.nirf_rank || ''} 
                  className="text-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="establishment_year" className="text-xs font-semibold">Establishment Year</Label>
                <Input 
                  id="establishment_year" 
                  name="establishment_year" 
                  placeholder="e.g. 1985" 
                  defaultValue={initialData.establishment_year || ''} 
                  className="text-sm" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="aishe_code" className="text-xs font-semibold">AISHE Institutional Code</Label>
                <Input 
                  id="aishe_code" 
                  name="aishe_code" 
                  placeholder="e.g. C-12345" 
                  defaultValue={initialData.aishe_code || ''} 
                  className="text-sm" 
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="university_affiliation" className="text-xs font-semibold">Affiliated University / Autonomous Status</Label>
                <Input 
                  id="university_affiliation" 
                  name="university_affiliation" 
                  placeholder="e.g. Autonomous (Affiliated to University of Mumbai)" 
                  defaultValue={initialData.university_affiliation || ''} 
                  className="text-sm" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nba_accreditation" className="text-xs font-semibold">NBA Accredited Programs / Branches</Label>
              <Input 
                id="nba_accreditation" 
                name="nba_accreditation" 
                placeholder="e.g. Computer Science, Electronics & Communication, Mechanical" 
                defaultValue={initialData.nba_accreditation || ''} 
                className="text-sm" 
              />
            </div>
          </div>
        </div>

        {/* 5. ON-CAMPUS DRIVE INFRASTRUCTURE */}
        <div className="p-6 rounded-2xl border bg-white dark:bg-zinc-900 space-y-5 shadow-xs">
          <div className="border-b pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-600 flex items-center gap-2">
              <Laptop className="h-4 w-4" />
              5. On-Campus Drive Infrastructure (For Visiting HRs)
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Physical testing labs, interview cabins, and guest transit details</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="lab_capacity" className="text-xs font-semibold">Online Lab Testing Capacity</Label>
                <Input 
                  id="lab_capacity" 
                  name="lab_capacity" 
                  placeholder="e.g. 500+ PCs with LAN & Webcams" 
                  defaultValue={initialData.lab_capacity || ''} 
                  className="text-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="auditorium_capacity" className="text-xs font-semibold">Auditorium / PPT Hall Capacity</Label>
                <Input 
                  id="auditorium_capacity" 
                  name="auditorium_capacity" 
                  placeholder="e.g. 800 seats with AV setup" 
                  defaultValue={initialData.auditorium_capacity || ''} 
                  className="text-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="interview_cabins" className="text-xs font-semibold">Interview Cabins &amp; GD Rooms</Label>
                <Input 
                  id="interview_cabins" 
                  name="interview_cabins" 
                  placeholder="e.g. 14 Interview Cabins, 4 GD Rooms" 
                  defaultValue={initialData.interview_cabins || ''} 
                  className="text-sm" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nearest_airport" className="text-xs font-semibold flex items-center gap-1">
                  <Plane className="h-3 w-3 text-zinc-400" />
                  Nearest Airport &amp; Distance
                </Label>
                <Input 
                  id="nearest_airport" 
                  name="nearest_airport" 
                  placeholder="e.g. International Airport (18 km)" 
                  defaultValue={initialData.nearest_airport || ''} 
                  className="text-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nearest_railway" className="text-xs font-semibold">Nearest Railway Station</Label>
                <Input 
                  id="nearest_railway" 
                  name="nearest_railway" 
                  placeholder="e.g. Central Junction (6 km)" 
                  defaultValue={initialData.nearest_railway || ''} 
                  className="text-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="campus_guest_house" className="text-xs font-semibold">Campus Guest House / Stay</Label>
                <Input 
                  id="campus_guest_house" 
                  name="campus_guest_house" 
                  placeholder="e.g. Available (20 AC Rooms)" 
                  defaultValue={initialData.campus_guest_house || ''} 
                  className="text-sm" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* 6. PLACEMENT HIGHLIGHTS & BROCHURE */}
        <div className="p-6 rounded-2xl border bg-white dark:bg-zinc-900 space-y-5 shadow-xs">
          <div className="border-b pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              6. Placement Highlights &amp; Annual Brochure
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Past season compensation highlights and downloadable recruiter brochure (Max 2 MB)</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="highest_ctc" className="text-xs font-semibold">Highest CTC (Previous Season)</Label>
                <Input 
                  id="highest_ctc" 
                  name="highest_ctc" 
                  placeholder="e.g. 45 LPA" 
                  defaultValue={initialData.highest_ctc || ''} 
                  className="text-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="average_ctc" className="text-xs font-semibold">Average CTC</Label>
                <Input 
                  id="average_ctc" 
                  name="average_ctc" 
                  placeholder="e.g. 9.2 LPA" 
                  defaultValue={initialData.average_ctc || ''} 
                  className="text-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="total_companies_visited" className="text-xs font-semibold">Total Recruiting Partners</Label>
                <Input 
                  id="total_companies_visited" 
                  name="total_companies_visited" 
                  placeholder="e.g. 140+ Companies" 
                  defaultValue={initialData.total_companies_visited || ''} 
                  className="text-sm" 
                />
              </div>
            </div>

            {/* Official Brochure PDF Upload (2 MB Limit) */}
            <div className="p-4 rounded-xl border bg-zinc-50/50 dark:bg-zinc-950/40 space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-600" />
                Annual Placement Brochure (Optional • PDF Document • Max 2 MB)
              </Label>
              
              {!brochureUrl ? (
                <div className="flex items-center gap-3">
                  <input 
                    id="brochure-upload-input" 
                    type="file" 
                    accept="application/pdf,.pdf" 
                    onChange={(e) => handleMediaUpload(e, 'brochure')} 
                    className="hidden" 
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => document.getElementById('brochure-upload-input')?.click()}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload PDF Brochure
                  </Button>
                  <span className="text-[11px] text-zinc-400">Strictly PDF • Under 2 MB</span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-lg border bg-white dark:bg-zinc-900 border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">{brochureName || 'Placement_Brochure.pdf'}</span>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setBrochureUrl(''); setBrochureName(''); }}
                    className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 7. ABOUT THE COLLEGE DESCRIPTION */}
        <div className="p-6 rounded-2xl border bg-white dark:bg-zinc-900 space-y-3 shadow-xs">
          <Label htmlFor="description" className="text-xs font-semibold">
            Institutional Overview &amp; Placement Vision (Optional)
          </Label>
          <Textarea 
            id="description" 
            name="description" 
            placeholder="Provide a comprehensive institutional summary, key pedagogical milestones, student demographic highlights, and corporate engagement track record..." 
            className="min-h-[140px] text-sm"
            defaultValue={initialData.description || ''} 
          />
        </div>

      </fieldset>

      {isAdmin && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button 
            type="submit" 
            disabled={isPending} 
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px] gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Save College Profile
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  )
}

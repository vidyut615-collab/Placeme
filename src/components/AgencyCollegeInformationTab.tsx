'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { updateCollege } from '@/app/(dashboards)/agency/actions'
import { INDIAN_CITIES } from '@/lib/cities-data'
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
  Loader2, 
  TrendingUp, 
  Plane, 
  Laptop, 
  Edit3, 
  Save, 
  X, 
  ExternalLink,
  GraduationCap,
  Info,
  Calendar,
  Compass,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

export interface CollegeFullData {
  id: string
  name: string
  website?: string | null
  city?: string | null
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

interface AgencyCollegeInformationTabProps {
  college: CollegeFullData
}

export function AgencyCollegeInformationTab({ college }: AgencyCollegeInformationTabProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Media states for edit mode
  const [logoUrl, setLogoUrl] = useState<string>(college.logo_url || '')
  const [bannerUrl, setBannerUrl] = useState<string>(college.banner_url || '')
  const [brochureUrl, setBrochureUrl] = useState<string>(college.brochure_url || '')
  const [brochureName, setBrochureName] = useState<string>(college.brochure_url ? 'Placement_Brochure.pdf' : '')
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleMediaUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'banner' | 'brochure'
  ) => {
    setUploadError(null)
    const file = e.target.files?.[0]
    if (!file) return

    const maxSizeBytes = 2 * 1024 * 1024 // 2 MB
    if (file.size > maxSizeBytes) {
      setUploadError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 2 MB limit.`)
      e.target.value = ''
      return
    }

    if (type === 'brochure') {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setUploadError('Placement brochure must be a valid PDF.')
        e.target.value = ''
        return
      }
    } else {
      if (!file.type.startsWith('image/')) {
        setUploadError('Logo and Banner must be valid image files (PNG, JPG, WebP, SVG).')
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

  const handleCancel = () => {
    // Reset media to original
    setLogoUrl(college.logo_url || '')
    setBannerUrl(college.banner_url || '')
    setBrochureUrl(college.brochure_url || '')
    setBrochureName(college.brochure_url ? 'Placement_Brochure.pdf' : '')
    setUploadError(null)
    setIsEditing(false)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploadError(null)

    const formData = new FormData(e.currentTarget)
    formData.append('id', college.id)
    formData.set('logo_url', logoUrl)
    formData.set('banner_url', bannerUrl)
    formData.set('brochure_url', brochureUrl)

    startTransition(async () => {
      const res = await updateCollege(formData)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(res?.success || 'College details updated successfully!')
        setIsEditing(false)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* TOP ACTION BAR - EDIT OPTION ON TOP LEFT */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border bg-white dark:bg-zinc-900 shadow-xs">
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <Button 
              type="button" 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit Details</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isPending}
                className="flex items-center gap-1.5 border-zinc-300 dark:border-zinc-700"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
              <Button 
                type="submit" 
                form="agency-college-edit-form"
                disabled={isPending}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{isPending ? 'Saving Changes...' : 'Save Changes'}</span>
              </Button>
            </div>
          )}

          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

          <p className="text-xs text-zinc-500">
            {isEditing 
              ? 'Editing all institutional parameters. Agency admin can modify any field, including City (Hub).' 
              : 'Complete institutional profile combining agency initialization data and college updates.'}
          </p>
        </div>

        <Badge variant={isEditing ? 'default' : 'secondary'} className="text-xs">
          {isEditing ? 'Edit Mode Active' : 'Read-Only Preview'}
        </Badge>
      </div>

      {uploadError && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 text-xs border border-red-200 dark:border-red-900">
          {uploadError}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. VIEW MODE                                                              */}
      {/* ========================================================================= */}
      {!isEditing && (
        <div className="space-y-6">
          {/* INSTITUTION HERO / BRANDING CARD */}
          <Card className="overflow-hidden border shadow-sm">
            {college.banner_url ? (
              <div className="h-44 sm:h-56 w-full relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src={college.banner_url} 
                  alt="Campus Banner" 
                  fill
                  sizes="(max-width: 768px) 100vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-28 sm:h-36 w-full bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 flex items-center px-6" />
            )}

            <CardContent className="pt-0 relative px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 sm:-mt-12 mb-4">
                <div className="flex items-end gap-4">
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 border-white dark:border-zinc-900 bg-white dark:bg-zinc-950 shadow-md p-1.5 shrink-0 flex items-center justify-center overflow-hidden relative">
                    {college.logo_url ? (
                      <Image src={college.logo_url} alt="Logo" fill sizes="96px" className="object-contain p-1.5" />
                    ) : (
                      <Building2 className="h-10 w-10 text-blue-600 relative z-10" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                      {college.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-blue-600" />
                        {college.city || 'City Not Assigned'}
                      </span>
                      {college.location && <span>• {college.location}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200">
                    City Hub: {college.city || 'Unassigned'}
                  </Badge>
                  {college.brochure_url && (
                    <a 
                      href={college.brochure_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View Placement Brochure
                    </a>
                  )}
                  {college.website && (
                    <a 
                      href={college.website.startsWith('http') ? college.website : `https://${college.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Globe className="h-3.5 w-3.5 text-blue-600" />
                      Website
                      <ExternalLink className="h-3 w-3 text-zinc-400" />
                    </a>
                  )}
                </div>
              </div>

              {/* Quick Contacts Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t text-xs">
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Mail className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="font-medium text-zinc-500">Email:</span>
                  {college.contact_email ? (
                    <a href={`mailto:${college.contact_email}`} className="text-blue-600 hover:underline truncate">
                      {college.contact_email}
                    </a>
                  ) : (
                    <span className="text-zinc-400 italic">Not provided</span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Phone className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="font-medium text-zinc-500">Phone:</span>
                  <span>{college.contact_phone || <span className="text-zinc-400 italic">Not provided</span>}</span>
                </div>

                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Compass className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="font-medium text-zinc-500">Campus:</span>
                  <span className="truncate">{college.location || <span className="text-zinc-400 italic">Not provided</span>}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 1. ABOUT & INSTITUTIONAL OVERVIEW */}
          <Card className="shadow-sm border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                About the Institution & Placement Vision
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {college.description ? (
                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                  {college.description}
                </p>
              ) : (
                <p className="text-sm text-zinc-400 italic">
                  No institutional description provided yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* 2. CAMPUS ADDRESS & LOCATION DETAILS */}
          <Card className="shadow-sm border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-rose-600" />
                Campus Address & Geographic Logistics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border">
                  <div className="text-xs text-zinc-500 font-medium mb-1">City Hub (Configured by Agency)</div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                    {college.city || 'Unassigned'}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border">
                  <div className="text-xs text-zinc-500 font-medium mb-1">Campus Location / Address</div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {college.location || <span className="text-zinc-400 font-normal italic">-</span>}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border">
                  <div className="text-xs text-zinc-500 font-medium mb-1">Street Address</div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {college.address_street || <span className="text-zinc-400 font-normal italic">-</span>}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border">
                  <div className="text-xs text-zinc-500 font-medium mb-1">State & Pincode</div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {college.address_state || '-'}{college.address_pincode ? ` - ${college.address_pincode}` : ''}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. ACCREDITATIONS & APPROVALS */}
          <Card className="shadow-sm border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-600" />
                Academic Accreditations & Recognitions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border space-y-1">
                  <span className="text-[11px] font-medium text-zinc-500 uppercase">NAAC Grade</span>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">
                    {college.naac_grade ? (
                      <span className="inline-flex px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs border border-amber-200">
                        {college.naac_grade}
                      </span>
                    ) : '-'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border space-y-1">
                  <span className="text-[11px] font-medium text-zinc-500 uppercase">NBA Accr.</span>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">
                    {college.nba_accreditation || '-'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border space-y-1">
                  <span className="text-[11px] font-medium text-zinc-500 uppercase">NIRF Rank</span>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">{college.nirf_rank || '-'}</div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border space-y-1">
                  <span className="text-[11px] font-medium text-zinc-500 uppercase">Est. Year</span>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">{college.establishment_year || '-'}</div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border space-y-1">
                  <span className="text-[11px] font-medium text-zinc-500 uppercase">AISHE Code</span>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">{college.aishe_code || '-'}</div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border space-y-1">
                  <span className="text-[11px] font-medium text-zinc-500 uppercase">Affiliation</span>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate" title={college.university_affiliation || ''}>
                    {college.university_affiliation || '-'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. PLACEMENT TRACK RECORD & HIGHLIGHTS */}
          <Card className="shadow-sm border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Placement Track Record & Compensation Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="p-4 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900">
                  <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">Highest CTC Offered</div>
                  <div className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                    {college.highest_ctc ? `₹${college.highest_ctc}` : '-'}
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
                  <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Average Batch CTC</div>
                  <div className="text-xl font-bold text-blue-800 dark:text-blue-200">
                    {college.average_ctc ? `₹${college.average_ctc}` : '-'}
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-purple-50/50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900">
                  <div className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1">Total Companies Visited</div>
                  <div className="text-xl font-bold text-purple-800 dark:text-purple-200">
                    {college.total_companies_visited || '-'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. INFRASTRUCTURE & PLACEMENT LOGISTICS */}
          <Card className="shadow-sm border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Laptop className="h-4 w-4 text-indigo-600" />
                Campus Infrastructure & Placement Drive Logistics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border space-y-1">
                  <span className="text-[11px] font-medium text-zinc-500 uppercase">Lab Capacity</span>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {college.lab_capacity ? `${college.lab_capacity} PCs` : '-'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border space-y-1">
                  <span className="text-[11px] font-medium text-zinc-500 uppercase">Auditorium</span>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {college.auditorium_capacity ? `${college.auditorium_capacity} seats` : '-'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border space-y-1">
                  <span className="text-[11px] font-medium text-zinc-500 uppercase">Interview Cabins</span>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {college.interview_cabins ? `${college.interview_cabins} cabins` : '-'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border space-y-1">
                  <span className="text-[11px] font-medium text-zinc-500 uppercase">Guest House</span>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {college.campus_guest_house || '-'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border space-y-1">
                  <span className="text-[11px] font-medium text-zinc-500 uppercase">Nearest Airport</span>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={college.nearest_airport || ''}>
                    {college.nearest_airport || '-'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border space-y-1">
                  <span className="text-[11px] font-medium text-zinc-500 uppercase">Nearest Railway</span>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={college.nearest_railway || ''}>
                    {college.nearest_railway || '-'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EDIT MODE - INLINE EDITABLE FORM                                       */}
      {/* ========================================================================= */}
      {isEditing && (
        <form id="agency-college-edit-form" onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: IDENTITY & BRANDING */}
          <Card className="shadow-sm border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                1. Institutional Identity, Branding & City Hub
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="agency-col-name" className="text-xs font-semibold">
                    College Name <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="agency-col-name"
                    name="name" 
                    defaultValue={college.name} 
                    required 
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-city" className="text-xs font-semibold">
                    City (Hub) <span className="text-red-500">*</span> — Agency Controlled
                  </Label>
                  <Input 
                    id="agency-col-city"
                    name="city" 
                    list="agency-cities-list"
                    defaultValue={college.city || 'Bengaluru / Bangalore'} 
                    placeholder="Search or select standard city hub..."
                    required 
                    autoComplete="off"
                    className="text-sm font-medium"
                  />
                  <datalist id="agency-cities-list">
                    {INDIAN_CITIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-website" className="text-xs font-semibold">
                    Official Website URL
                  </Label>
                  <Input 
                    id="agency-col-website"
                    name="website" 
                    type="url"
                    defaultValue={college.website || ''} 
                    placeholder="https://college.edu"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Logo & Banner Uploaders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Logo */}
                <div className="p-4 rounded-xl border bg-zinc-50/50 dark:bg-zinc-950/40 space-y-3">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Upload className="h-3.5 w-3.5 text-blue-600" />
                    College Official Logo (Max 2 MB)
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-xl border bg-white dark:bg-zinc-900 shadow-xs p-1 flex items-center justify-center shrink-0">
                      {logoUrl ? (
                        <Image src={logoUrl} alt="Logo" width={56} height={56} className="h-full w-full object-contain" />
                      ) : (
                        <Building2 className="h-6 w-6 text-zinc-400" />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <input 
                        id="agency-col-logo-input" 
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
                          onClick={() => document.getElementById('agency-col-logo-input')?.click()}
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
                      <span className="text-[10px] text-zinc-400 block">PNG, JPG, SVG • Max 2 MB</span>
                    </div>
                  </div>
                </div>

                {/* Banner */}
                <div className="p-4 rounded-xl border bg-zinc-50/50 dark:bg-zinc-950/40 space-y-3">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Upload className="h-3.5 w-3.5 text-indigo-600" />
                    Campus Cover Banner (Max 2 MB)
                  </Label>
                  <div className="flex items-center gap-3">
                    {bannerUrl ? (
                      <Image src={bannerUrl} alt="Banner" width={96} height={56} className="h-14 w-24 rounded-lg object-cover border" />
                    ) : (
                      <div className="h-14 w-24 rounded-lg border border-dashed flex items-center justify-center text-zinc-400 bg-white dark:bg-zinc-900 text-xs">
                        No Banner
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <input 
                        id="agency-col-banner-input" 
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
                          onClick={() => document.getElementById('agency-col-banner-input')?.click()}
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
                      <span className="text-[10px] text-zinc-400 block">Landscape • Max 2 MB</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: CAMPUS ADDRESS & LOCATION */}
          <Card className="shadow-sm border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-rose-600" />
                2. Campus Address & Geographic Coordinates
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-location" className="text-xs font-semibold">
                    Campus Location / Landmark Address
                  </Label>
                  <Input 
                    id="agency-col-location"
                    name="location" 
                    defaultValue={college.location || ''} 
                    placeholder="e.g. Powai, Mumbai, Maharashtra"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-street" className="text-xs font-semibold">
                    Street Address / Sector
                  </Label>
                  <Input 
                    id="agency-col-street"
                    name="address_street" 
                    defaultValue={college.address_street || ''} 
                    placeholder="e.g. Main Gate Road, Powai"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-state" className="text-xs font-semibold">
                    State / Province
                  </Label>
                  <Input 
                    id="agency-col-state"
                    name="address_state" 
                    defaultValue={college.address_state || ''} 
                    placeholder="e.g. Maharashtra"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-pincode" className="text-xs font-semibold">
                    Postal Pincode
                  </Label>
                  <Input 
                    id="agency-col-pincode"
                    name="address_pincode" 
                    defaultValue={college.address_pincode || ''} 
                    placeholder="e.g. 400076"
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3: OFFICIAL CONTACTS */}
          <Card className="shadow-sm border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                3. Placement Cell & Public Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-email" className="text-xs font-semibold">
                    Placement Cell Public Email
                  </Label>
                  <Input 
                    id="agency-col-email"
                    name="contact_email" 
                    type="email"
                    defaultValue={college.contact_email || ''} 
                    placeholder="placements@college.edu"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-phone" className="text-xs font-semibold">
                    Official Contact Phone
                  </Label>
                  <Input 
                    id="agency-col-phone"
                    name="contact_phone" 
                    type="tel"
                    defaultValue={college.contact_phone || ''} 
                    placeholder="+91 98765 43210"
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 4: ABOUT & PLACEMENT BROCHURE */}
          <Card className="shadow-sm border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                4. Institutional Overview & Placement Brochure
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="agency-col-desc" className="text-xs font-semibold">
                  Institutional Overview & Placement Vision
                </Label>
                <Textarea 
                  id="agency-col-desc"
                  name="description" 
                  defaultValue={college.description || ''} 
                  placeholder="Summary of institution achievements, campus life, placement statistics..."
                  className="min-h-[110px] text-sm"
                />
              </div>

              {/* Brochure Uploader */}
              <div className="p-4 rounded-xl border bg-zinc-50/50 dark:bg-zinc-950/40 space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-emerald-600" />
                  Official Placement Brochure PDF (Max 2 MB)
                </Label>
                {!brochureUrl ? (
                  <div className="flex items-center gap-3">
                    <input 
                      id="agency-brochure-input" 
                      type="file" 
                      accept="application/pdf" 
                      onChange={(e) => handleMediaUpload(e, 'brochure')} 
                      className="hidden" 
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => document.getElementById('agency-brochure-input')?.click()}
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
                      <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                        {brochureName || 'Placement_Brochure.pdf'}
                      </span>
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
            </CardContent>
          </Card>

          {/* SECTION 5: ACCREDITATIONS & APPROVALS */}
          <Card className="shadow-sm border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-600" />
                5. Academic Accreditations & Recognitions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-naac" className="text-xs font-semibold">NAAC Grade</Label>
                  <select 
                    id="agency-col-naac"
                    name="naac_grade"
                    defaultValue={college.naac_grade || ''}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select Grade</option>
                    <option value="A++">A++</option>
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="B++">B++</option>
                    <option value="B+">B+</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="NA">NA / Applied</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-nba" className="text-xs font-semibold">NBA Accreditation</Label>
                  <select 
                    id="agency-col-nba"
                    name="nba_accreditation"
                    defaultValue={college.nba_accreditation || ''}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select Status</option>
                    <option value="Accredited">Accredited</option>
                    <option value="Partially Accredited">Partially Accredited</option>
                    <option value="Not Accredited">Not Accredited</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-nirf" className="text-xs font-semibold">NIRF Ranking</Label>
                  <Input 
                    id="agency-col-nirf"
                    name="nirf_rank" 
                    defaultValue={college.nirf_rank || ''} 
                    placeholder="e.g. Rank 45 or 101-150 Band"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-aishe" className="text-xs font-semibold">AISHE Code</Label>
                  <Input 
                    id="agency-col-aishe"
                    name="aishe_code" 
                    defaultValue={college.aishe_code || ''} 
                    placeholder="e.g. C-12345"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-affil" className="text-xs font-semibold">University Affiliation</Label>
                  <Input 
                    id="agency-col-affil"
                    name="university_affiliation" 
                    defaultValue={college.university_affiliation || ''} 
                    placeholder="e.g. Mumbai University / Autonomous"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-est" className="text-xs font-semibold">Establishment Year</Label>
                  <Input 
                    id="agency-col-est"
                    name="establishment_year" 
                    defaultValue={college.establishment_year || ''} 
                    placeholder="e.g. 1958"
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 6: PLACEMENT TRACK RECORD */}
          <Card className="shadow-sm border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                6. Placement Statistics & Track Record
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-highest-ctc" className="text-xs font-semibold">
                    Highest CTC Offered (LPA / Amount)
                  </Label>
                  <Input 
                    id="agency-col-highest-ctc"
                    name="highest_ctc" 
                    defaultValue={college.highest_ctc || ''} 
                    placeholder="e.g. 45 LPA or 45,00,000"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-avg-ctc" className="text-xs font-semibold">
                    Average CTC (LPA / Amount)
                  </Label>
                  <Input 
                    id="agency-col-avg-ctc"
                    name="average_ctc" 
                    defaultValue={college.average_ctc || ''} 
                    placeholder="e.g. 12.5 LPA or 12,50,000"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-companies" className="text-xs font-semibold">
                    Total Companies Visited (Last Cycle)
                  </Label>
                  <Input 
                    id="agency-col-companies"
                    name="total_companies_visited" 
                    defaultValue={college.total_companies_visited || ''} 
                    placeholder="e.g. 240+"
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 7: CAMPUS INFRASTRUCTURE & DRIVE LOGISTICS */}
          <Card className="shadow-sm border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Laptop className="h-4 w-4 text-indigo-600" />
                7. Infrastructure & On-Campus Drive Facilities
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-lab" className="text-xs font-semibold">Lab Capacity (Computers)</Label>
                  <Input 
                    id="agency-col-lab"
                    name="lab_capacity" 
                    defaultValue={college.lab_capacity || ''} 
                    placeholder="e.g. 450"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-auditorium" className="text-xs font-semibold">Auditorium Capacity (Seats)</Label>
                  <Input 
                    id="agency-col-auditorium"
                    name="auditorium_capacity" 
                    defaultValue={college.auditorium_capacity || ''} 
                    placeholder="e.g. 800"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-cabins" className="text-xs font-semibold">Interview Cabins</Label>
                  <Input 
                    id="agency-col-cabins"
                    name="interview_cabins" 
                    defaultValue={college.interview_cabins || ''} 
                    placeholder="e.g. 20"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-airport" className="text-xs font-semibold">Nearest Airport</Label>
                  <Input 
                    id="agency-col-airport"
                    name="nearest_airport" 
                    defaultValue={college.nearest_airport || ''} 
                    placeholder="e.g. Chhatrapati Shivaji Maharaj Intl (BOM - 8 km)"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-railway" className="text-xs font-semibold">Nearest Railway Station</Label>
                  <Input 
                    id="agency-col-railway"
                    name="nearest_railway" 
                    defaultValue={college.nearest_railway || ''} 
                    placeholder="e.g. Kanjurmarg (3 km) / Bandra Terminus"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="agency-col-guest" className="text-xs font-semibold">Campus Guest House Available</Label>
                  <select 
                    id="agency-col-guest"
                    name="campus_guest_house"
                    defaultValue={college.campus_guest_house || ''}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select Option</option>
                    <option value="Yes">Yes (Available for Corporate Recruiters)</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BOTTOM ACTION BAR */}
          <div className="flex items-center justify-end gap-3 p-4 rounded-xl border bg-white dark:bg-zinc-900 shadow-xs">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
              {isPending ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

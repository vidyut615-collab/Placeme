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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { updateStudentProfile } from '@/app/(dashboards)/student/profile/actions'
import { CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react'

type OnboardingFields = {
  years: string[]
  types: string[]
  departments: string[]
}

type StudentProfileFormProps = {
  profile: Record<string, any>
  onboardingFields: OnboardingFields
  hasPendingRequest?: boolean
  auditEnabled?: boolean
}

export function StudentProfileForm({ profile, onboardingFields, hasPendingRequest, auditEnabled }: StudentProfileFormProps) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formState, setFormState] = useState({
    first_name: profile.first_name || '',
    middle_name: profile.middle_name || '',
    last_name: profile.last_name || '',
    phone: profile.phone || '',
    gpa: profile.gpa || '',
    year: profile.year || '',
    type: profile.type || '',
    department: profile.department || '',
    academic_10th: profile.academic_10th || '',
    academic_12th: profile.academic_12th || '',
    diploma_percentage: profile.diploma_percentage || '',
    graduation_percentage: profile.graduation_percentage || '',
    active_backlogs: profile.active_backlogs || '',
    historical_backlogs: profile.historical_backlogs || '',
    academic_gap_years: profile.academic_gap_years || '',
    
    // NEW EXPANDED FIELDS
    education: profile.education || [],
    experience: profile.experience || [],
    projects: profile.projects || [],
    skills: profile.skills || { languages: '', frameworks: '', tools: '' },
    links: profile.links || { linkedin: '', github: '', portfolio: '' }
  })

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormState(s => ({ ...s, [field]: e.target.value }))

  const handleSelect = (field: string) => (value: string) =>
    setFormState(s => ({ ...s, [field]: value }))

  // Nested handlers
  const handleNestedChange = (category: 'skills' | 'links', field: string, value: string) => {
    setFormState(s => ({
      ...s,
      [category]: { ...s[category], [field]: value }
    }))
  }

  // Array handlers
  const handleArrayChange = (category: 'education' | 'experience' | 'projects', index: number, field: string, value: string) => {
    setFormState(s => {
      const newArray = [...s[category]]
      newArray[index] = { ...newArray[index], [field]: value }
      return { ...s, [category]: newArray }
    })
  }

  const addArrayItem = (category: 'education' | 'experience' | 'projects', template: any) => {
    setFormState(s => ({
      ...s,
      [category]: [...s[category], template]
    }))
  }

  const removeArrayItem = (category: 'education' | 'experience' | 'projects', index: number) => {
    setFormState(s => {
      const newArray = [...s[category]]
      newArray.splice(index, 1)
      return { ...s, [category]: newArray }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)
    setError('')
    
    const finalData = {
      ...formState,
      full_name: `${formState.first_name.trim()} ${formState.middle_name ? formState.middle_name.trim() + ' ' : ''}${formState.last_name.trim()}`.trim()
    }
    
    const fd = new FormData()
    fd.append('profile_data_json', JSON.stringify(finalData))
    
    startTransition(async () => {
      const res = await updateStudentProfile(fd)
      if (res.error) setError(res.error)
      else setSuccess(true)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {hasPendingRequest ? (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md text-sm mb-4 border border-yellow-200">
          <strong className="font-semibold block mb-1">Audit Request Pending</strong>
          You have a profile update request currently under review by your college placement office. You cannot make further changes until it is approved or rejected.
        </div>
      ) : (
        <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm mb-4">
          Build your comprehensive placement profile. This serves as your digital resume for companies.
        </div>
      )}

      <div className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
        <TabsList className="mb-4 flex flex-wrap h-auto p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <TabsTrigger value="basic" className="flex-1 min-w-[120px]">Basic & Academics</TabsTrigger>
          <TabsTrigger value="education" className="flex-1 min-w-[120px]">Past Education</TabsTrigger>
          <TabsTrigger value="experience" className="flex-1 min-w-[120px]">Experience</TabsTrigger>
          <TabsTrigger value="projects" className="flex-1 min-w-[120px]">Projects</TabsTrigger>
          <TabsTrigger value="skills" className="flex-1 min-w-[120px]">Skills & Links</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name <span className="text-red-500">*</span></Label>
              <Input id="first_name" required value={formState.first_name} onChange={handleChange('first_name')} placeholder="John" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name <span className="text-red-500">*</span></Label>
              <Input id="last_name" required value={formState.last_name} onChange={handleChange('last_name')} placeholder="Doe" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="middle_name">Middle Name (Optional)</Label>
              <Input id="middle_name" value={formState.middle_name} onChange={handleChange('middle_name')} placeholder="Michael" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={formState.phone} onChange={handleChange('phone')} placeholder="+91 XXXXX XXXXX" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 pt-4 border-t border-zinc-200">
            <div className="space-y-2">
              <Label htmlFor="gpa">Current GPA</Label>
              <Input id="gpa" value={formState.gpa} onChange={handleChange('gpa')} placeholder="e.g. 8.5" />
            </div>
            <div className="space-y-2">
              <Label>Graduation Year</Label>
              <Select value={formState.year} onValueChange={handleSelect('year')}>
                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>
                  {onboardingFields.years.length > 0 ? (
                    onboardingFields.years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)
                  ) : <SelectItem value="none" disabled>No years configured</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Degree Type</Label>
              <Select value={formState.type} onValueChange={handleSelect('type')}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {onboardingFields.types.length > 0 ? (
                    onboardingFields.types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)
                  ) : <SelectItem value="none" disabled>No types configured</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={formState.department} onValueChange={handleSelect('department')}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {onboardingFields.departments.length > 0 ? (
                  onboardingFields.departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)
                ) : <SelectItem value="none" disabled>No departments configured</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          
          <div className="pt-4 border-t border-zinc-200">
            <h3 className="text-lg font-medium mb-4">Academic Backlogs & Gaps</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="active_backlogs">Active Backlogs</Label>
                <Input id="active_backlogs" type="number" value={formState.active_backlogs} onChange={handleChange('active_backlogs')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="historical_backlogs">Historical Backlogs</Label>
                <Input id="historical_backlogs" type="number" value={formState.historical_backlogs} onChange={handleChange('historical_backlogs')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="academic_gap_years">Academic Gap (Years)</Label>
                <Input id="academic_gap_years" type="number" value={formState.academic_gap_years} onChange={handleChange('academic_gap_years')} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="education" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-md border">
            <div className="col-span-full mb-2">
              <h4 className="font-medium text-sm">Quick Fill (Legacy)</h4>
            </div>
            <div className="space-y-2">
              <Label htmlFor="academic_10th">10th %</Label>
              <Input id="academic_10th" type="number" step="0.01" value={formState.academic_10th} onChange={handleChange('academic_10th')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="academic_12th">12th %</Label>
              <Input id="academic_12th" type="number" step="0.01" value={formState.academic_12th} onChange={handleChange('academic_12th')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diploma_percentage">Diploma %</Label>
              <Input id="diploma_percentage" type="number" step="0.01" value={formState.diploma_percentage} onChange={handleChange('diploma_percentage')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="graduation_percentage">UG %</Label>
              <Input id="graduation_percentage" type="number" step="0.01" value={formState.graduation_percentage} onChange={handleChange('graduation_percentage')} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Detailed Education History</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('education', { level: '', institution: '', board: '', passing_year: '', score: '' })}>
                <Plus className="h-4 w-4 mr-2" /> Add Education
              </Button>
            </div>
            {formState.education.map((edu: any, i: number) => (
              <div key={i} className="p-4 border rounded-md relative bg-white dark:bg-zinc-950">
                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeArrayItem('education', i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid gap-4 md:grid-cols-2 mt-2">
                  <div className="space-y-2">
                    <Label>Level</Label>
                    <Input placeholder="e.g. 10th, 12th, Diploma, UG" value={edu.level} onChange={(e) => handleArrayChange('education', i, 'level', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Institution Name</Label>
                    <Input placeholder="e.g. Delhi Public School" value={edu.institution} onChange={(e) => handleArrayChange('education', i, 'institution', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Board / University</Label>
                    <Input placeholder="e.g. CBSE" value={edu.board} onChange={(e) => handleArrayChange('education', i, 'board', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Passing Year</Label>
                      <Input placeholder="2020" value={edu.passing_year} onChange={(e) => handleArrayChange('education', i, 'passing_year', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Score (%)</Label>
                      <Input placeholder="95" value={edu.score} onChange={(e) => handleArrayChange('education', i, 'score', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {formState.education.length === 0 && <p className="text-sm text-zinc-500 italic">No detailed education added yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="experience" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Work Experience & Internships</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('experience', { type: 'internship', company: '', role: '', start_date: '', end_date: '', description: '' })}>
              <Plus className="h-4 w-4 mr-2" /> Add Experience
            </Button>
          </div>
          {formState.experience.map((exp: any, i: number) => (
            <div key={i} className="p-4 border rounded-md relative bg-white dark:bg-zinc-950">
              <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeArrayItem('experience', i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="grid gap-4 md:grid-cols-2 mt-2">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input placeholder="e.g. Google" value={exp.company} onChange={(e) => handleArrayChange('experience', i, 'company', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input placeholder="e.g. Software Engineering Intern" value={exp.role} onChange={(e) => handleArrayChange('experience', i, 'role', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input placeholder="MM/YYYY" value={exp.start_date} onChange={(e) => handleArrayChange('experience', i, 'start_date', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input placeholder="MM/YYYY or Present" value={exp.end_date} onChange={(e) => handleArrayChange('experience', i, 'end_date', e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Describe your responsibilities and achievements..." value={exp.description} onChange={(e) => handleArrayChange('experience', i, 'description', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          {formState.experience.length === 0 && <p className="text-sm text-zinc-500 italic">No experience added yet.</p>}
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Projects</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('projects', { title: '', tech: '', link: '', description: '' })}>
              <Plus className="h-4 w-4 mr-2" /> Add Project
            </Button>
          </div>
          {formState.projects.map((proj: any, i: number) => (
            <div key={i} className="p-4 border rounded-md relative bg-white dark:bg-zinc-950">
              <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeArrayItem('projects', i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="grid gap-4 md:grid-cols-2 mt-2">
                <div className="space-y-2">
                  <Label>Project Title</Label>
                  <Input placeholder="e.g. E-Commerce Backend" value={proj.title} onChange={(e) => handleArrayChange('projects', i, 'title', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Link (GitHub/Live)</Label>
                  <Input placeholder="https://..." value={proj.link} onChange={(e) => handleArrayChange('projects', i, 'link', e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Technologies Used</Label>
                  <Input placeholder="e.g. React, Node.js, MongoDB" value={proj.tech} onChange={(e) => handleArrayChange('projects', i, 'tech', e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea placeholder="What did you build? What problem did it solve?" value={proj.description} onChange={(e) => handleArrayChange('projects', i, 'description', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          {formState.projects.length === 0 && <p className="text-sm text-zinc-500 italic">No projects added yet.</p>}
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Technical Skills</h3>
            <div className="space-y-2">
              <Label>Programming Languages</Label>
              <Input placeholder="e.g. Python, Java, C++" value={formState.skills.languages} onChange={(e) => handleNestedChange('skills', 'languages', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Frameworks & Libraries</Label>
              <Input placeholder="e.g. React, Next.js, Spring Boot" value={formState.skills.frameworks} onChange={(e) => handleNestedChange('skills', 'frameworks', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tools & Platforms</Label>
              <Input placeholder="e.g. Git, Docker, AWS" value={formState.skills.tools} onChange={(e) => handleNestedChange('skills', 'tools', e.target.value)} />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-medium">Important Links</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>LinkedIn URL</Label>
                <Input placeholder="https://linkedin.com/in/..." value={formState.links.linkedin} onChange={(e) => handleNestedChange('links', 'linkedin', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>GitHub URL</Label>
                <Input placeholder="https://github.com/..." value={formState.links.github} onChange={(e) => handleNestedChange('links', 'github', e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Portfolio / Personal Website</Label>
                <Input placeholder="https://..." value={formState.links.portfolio} onChange={(e) => handleNestedChange('links', 'portfolio', e.target.value)} />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {error && <p className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-md">{error}</p>}
      {success && (
        <div className="flex items-center gap-2 text-sm text-green-700 font-medium bg-green-50 p-3 rounded-md border border-green-200">
          <CheckCircle2 className="h-5 w-5" />
          Profile updated successfully!
        </div>
      )}

      <div className="pt-4 border-t flex justify-end">
        <Button type="submit" disabled={isPending || hasPendingRequest} className="w-full sm:w-auto min-w-[200px]">
          {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving Profile...</> : 'Save Profile'}
        </Button>
      </div>
      </div>
    </form>
  )
}

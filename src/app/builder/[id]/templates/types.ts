export interface ResumeSettings {
  template: 'classic' | 'modern' | 'executive'
  fontFamily: string
  fontSize: number // in pt (e.g. 9.5, 10, 10.5)
  lineHeight: number // (e.g. 1.35, 1.45)
  margin: number // in mm (e.g. 10, 14, 18)
  accentColor: string // hex code
  pageFit: 'auto' | '1-page' | '2-page'
}

export interface WorkHistoryItem {
  profile_work_id: string
  role: string
  company: string
  start_date?: string
  end_date?: string
  tech?: string
  original_description?: string
  is_tailored: boolean
  is_saved?: boolean
  ai_options: string[]
  final_edited_text: string
}

export interface ProjectItem {
  profile_project_id: string
  title: string
  tech?: string
  original_description?: string
  is_tailored: boolean
  is_saved?: boolean
  ai_options: string[]
  final_edited_text: string
}

export interface CareerObjective {
  is_generated: boolean
  is_saved?: boolean
  ai_options: string[]
  final_edited_text: string
}

export interface ResumeDataState {
  settings: ResumeSettings
  work_histories: WorkHistoryItem[]
  projects: ProjectItem[]
  career_objective: CareerObjective
  profile_overrides?: {
    linkedin?: string
    email?: string
    phone?: string
  }
}

export interface ProfileData {
  basic?: {
    full_name?: string
    email?: string
    phone?: string
    address?: string
  }
  full_name?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  links?: {
    linkedin?: string
    github?: string
    portfolio?: string
  }
  type?: string // degree e.g. B.Tech
  department?: string // e.g. Computer Science
  year?: string | number // grad year
  gpa?: string | number
  skills?: {
    languages?: string
    tools?: string
    frameworks?: string
  }
  experience?: Array<{
    company?: string
    role?: string
    tech?: string
    start_date?: string
    end_date?: string
    description?: string
  }>
  projects?: Array<{
    title?: string
    tech?: string
    description?: string
    link?: string
  }>
  activities?: Array<{
    org?: string
    role?: string
    start_date?: string
    end_date?: string
    description?: string
  }>
  recognitions?: Array<{
    award?: string
    issuer?: string
    date?: string
    description?: string
  }>
}

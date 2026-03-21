export interface ResumeSection {
  id: string
  type: 'basic' | 'education' | 'experience' | 'skills' | 'projects' | 'awards' | 'languages' | 'certifications'
  title: string
  visible: boolean
  order: number
  content: Record<string, any>
}

export interface Resume {
  id: string
  userId: string
  sections: ResumeSection[]
  theme: 'light' | 'dark'
  createdAt: string
  updatedAt: string
}

export interface BasicInfo {
  name: string
  title: string
  email: string
  phone: string
  location: string
  avatar?: string
  bio?: string
}

export interface EducationItem {
  id: string
  school: string
  degree: string
  field: string
  startDate: string
  endDate: string
  description?: string
}

export interface ExperienceItem {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  description?: string
  highlights?: string[]
}

export interface SkillItem {
  id: string
  category: string
  skills: string[]
}

export interface ProjectItem {
  id: string
  name: string
  description: string
  technologies: string[]
  link?: string
  startDate?: string
  endDate?: string
}

export interface AwardItem {
  id: string
  title: string
  issuer: string
  date: string
  description?: string
}

export interface LanguageItem {
  id: string
  language: string
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'fluent'
}

export interface CertificationItem {
  id: string
  name: string
  issuer: string
  date: string
  credentialId?: string
  credentialUrl?: string
}

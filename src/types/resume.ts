export type ResumeSectionType =
  | 'basic'
  | 'education'
  | 'experience'
  | 'skills'
  | 'projects'
  | 'awards'
  | 'languages'
  | 'certifications'
  | 'introduction'

export interface ResumeSectionBase {
  id: string
  type: ResumeSectionType
  title: string
  visible: boolean
  order: number
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
  workYears?: string
  status?: string
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
  skill: string
}

export interface ProjectItem {
  id: string
  name: string
  description: string
  technologies?: string[]
  link?: string
  /** 项目时间（手输原文，预览右侧展示为 YYYY.MM ~ YYYY.MM） */
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

export interface BasicSection extends ResumeSectionBase {
  type: 'basic'
  content: BasicInfo
}

export interface EducationSection extends ResumeSectionBase {
  type: 'education'
  content: { items: EducationItem[] }
}

export interface ExperienceSection extends ResumeSectionBase {
  type: 'experience'
  content: { items: ExperienceItem[] }
}

export interface SkillsSection extends ResumeSectionBase {
  type: 'skills'
  content: { items: SkillItem[] }
}

export interface ProjectsSection extends ResumeSectionBase {
  type: 'projects'
  content: { items: ProjectItem[] }
}

export interface AwardsSection extends ResumeSectionBase {
  type: 'awards'
  content: { items: AwardItem[] }
}

export interface LanguagesSection extends ResumeSectionBase {
  type: 'languages'
  content: { items: LanguageItem[] }
}

export interface CertificationsSection extends ResumeSectionBase {
  type: 'certifications'
  content: { items: CertificationItem[] }
}

export interface IntroductionSection extends ResumeSectionBase {
  type: 'introduction'
  content: { text: string }
}

export type ResumeSection =
  | BasicSection
  | EducationSection
  | ExperienceSection
  | SkillsSection
  | ProjectsSection
  | AwardsSection
  | LanguagesSection
  | CertificationsSection
  | IntroductionSection

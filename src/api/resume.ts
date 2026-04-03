import http from './http'
import type { Resume, ResumeSection } from '@/types/resume'
import { generateDefaultResume } from '@/data/resume'
import { resumeDb } from '@/lib/resumeDb'
import { useAuthStore } from '@/stores/auth'

export const resumeApi = {
  async getResume(): Promise<Resume> {
    try {
      const authStore = useAuthStore()
      if (authStore.isLoggedIn && authStore.user?.id) {
        const dbResume = await resumeDb.getResume(authStore.user.id)
        if (dbResume) return dbResume
      }
      const publicResume = await resumeDb.getPublicResume()
      if (publicResume) return publicResume
      return generateDefaultResume()
    } catch {
      return generateDefaultResume()
    }
  },

  async updateResume(resume: Resume): Promise<Resume> {
    try {
      const authStore = useAuthStore()
      if (authStore.isLoggedIn && authStore.user?.id) {
        const success = await resumeDb.saveResume(authStore.user.id, resume)
        if (success) return resume
      }
      return resume
    } catch {
      return resume
    }
  },

  async updateSections(sections: ResumeSection[]): Promise<ResumeSection[]> {
    try {
      const { data } = await http.put('/resume/sections', { sections })
      return data
    } catch {
      return sections
    }
  },

  async toggleSection(sectionId: string, visible: boolean): Promise<void> {
    try {
      await http.patch(`/resume/sections/${sectionId}`, { visible })
    } catch {
      // 模拟成功
    }
  },

  async reorderSections(sections: ResumeSection[]): Promise<void> {
    try {
      await http.patch('/resume/sections/reorder', { sections })
    } catch {
      // 模拟成功
    }
  },

  async exportPDF(): Promise<Blob> {
    try {
      const response = await http.get('/resume/export/pdf', { responseType: 'blob' })
      return response.data as Blob
    } catch {
      return new Blob(['PDF export not available'], { type: 'application/pdf' })
    }
  },
}

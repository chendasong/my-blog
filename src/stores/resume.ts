import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Resume, ResumeSection } from '@/types/resume'

export const useResumeStore = defineStore('resume', () => {
  const resume = ref<Resume | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const setResume = (data: Resume) => {
    resume.value = data
  }

  const updateSection = (sectionId: string, content: Record<string, unknown>) => {
    if (!resume.value) return
    const section = resume.value.sections.find(s => s.id === sectionId)
    if (section) {
      section.content = content
    }
  }

  const toggleSection = (sectionId: string, visible: boolean) => {
    if (!resume.value) return
    const section = resume.value.sections.find(s => s.id === sectionId)
    if (section) {
      section.visible = visible
    }
  }

  const reorderSections = (sections: ResumeSection[]) => {
    if (!resume.value) return
    resume.value.sections = sections
  }

  const clearError = () => {
    error.value = null
  }

  return {
    resume,
    loading,
    error,
    setResume,
    updateSection,
    toggleSection,
    reorderSections,
    clearError,
  }
})

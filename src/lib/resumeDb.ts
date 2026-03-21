import { supabase } from '@/lib/supabase'
import type { Resume } from '@/types/resume'

export const resumeDb = {
  async getResume(userId: string): Promise<Resume | null> {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error) throw error
      return data ? JSON.parse(data.content) : null
    } catch (error) {
      console.error('Failed to fetch resume from DB:', error)
      return null
    }
  },

  async saveResume(userId: string, resume: Resume): Promise<boolean> {
    try {
      const { error: upsertError } = await supabase
        .from('resumes')
        .upsert({
          user_id: userId,
          content: JSON.stringify(resume),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
      
      if (upsertError) throw upsertError
      return true
    } catch (error) {
      console.error('Failed to save resume to DB:', error)
      return false
    }
  },

  async deleteResume(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('user_id', userId)
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to delete resume from DB:', error)
      return false
    }
  },
}

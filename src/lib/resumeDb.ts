import { supabase } from "@/lib/supabase";
import type { Resume } from "@/types/resume";

export const resumeDb = {
  async getResume(userId: string): Promise<Resume | null> {
    try {
      const { data, error } = await supabase
        .from("resumes")
        .select("content")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data ? JSON.parse(data.content) : null;
    } catch (error) {
      console.error("Failed to fetch resume from DB:", error);
      return null;
    }
  },

  async saveResume(userId: string, resume: Resume): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("resumes")
        .upsert({
          user_id: userId,
          content: JSON.stringify(resume),
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Failed to save resume to DB:", error);
      return false;
    }
  },

  /** 公开读取：用于未登录访客查看最新一份简历 */
  async getPublicResume(): Promise<Resume | null> {
    try {
      const { data, error } = await supabase
        .from("resumes")
        .select("content")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? JSON.parse(data.content) : null;
    } catch (error) {
      console.error("Failed to fetch public resume from DB:", error);
      return null;
    }
  },

  async deleteResume(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("resumes")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Failed to delete resume from DB:", error);
      return false;
    }
  },
};

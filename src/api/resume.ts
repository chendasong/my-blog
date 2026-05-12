import http from "./http";
import type { ResumeDocument, ResumeRow, ResumeSection, ResumeTemplate } from "@/types/resume";
import { generateDefaultResume, generateDefaultResumeDocument } from "@/data/resume";
import { resumeRowsToDocument } from "@/lib/resumeDocument";
import { resumeDb } from "@/lib/resumeDb";
import { useAuthStore } from "@/stores/auth";

/** 已登录用户简历行：先查一次；若无行则插入默认模板再查一次，避免「ensure + list」双请求。 */
async function listResumesForUserOrSeedDefault(userId: string): Promise<ResumeRow[]> {
  let rows = await resumeDb.listResumesForUser(userId);
  if (rows.length > 0) return rows;
  const r = generateDefaultResume();
  await resumeDb.insertResumeRow(userId, {
    name: "默认模板",
    content: { sections: r.sections, theme: r.theme },
  });
  return resumeDb.listResumesForUser(userId);
}

export const resumeApi = {
  /**
   * 已登录：从 `resumes` 拉取该用户所有行（created_at 升序）并组装为 ResumeDocument。
   * 未登录：全表 `resumes` 按 created_at 升序第一条（对外浏览页）。
   */
  async getResume(): Promise<ResumeDocument> {
    try {
      const authStore = useAuthStore();
      if (authStore.isLoggedIn && authStore.user?.id) {
        const uid = authStore.user.id;
        const rows = await listResumesForUserOrSeedDefault(uid);
        return resumeRowsToDocument(rows);
      }
      const first = await resumeDb.getPublicFirstResumeRow();
      if (first) {
        return resumeRowsToDocument([first]);
      }
      return generateDefaultResumeDocument();
    } catch {
      return generateDefaultResumeDocument();
    }
  },

  /** 已登录：仅从数据库刷新并组装文档 */
  async loadResumeDocumentFromDatabase(): Promise<ResumeDocument | null> {
    try {
      const authStore = useAuthStore();
      if (!authStore.isLoggedIn || !authStore.user?.id) return null;
      const uid = authStore.user.id;
      const rows = await listResumesForUserOrSeedDefault(uid);
      if (!rows.length) return null;
      return resumeRowsToDocument(rows);
    } catch {
      return null;
    }
  },

  /**
   * 将当前文档同步到 `resumes`：按行 id 更新/插入新行、删除文档中已去掉的行（默认=最早一条不可删）。
   */
  async updateResume(resume: ResumeDocument): Promise<ResumeDocument> {
    try {
      const authStore = useAuthStore();
      if (!authStore.isLoggedIn || !authStore.user?.id) return resume;
      const uid = authStore.user.id;
      const ok = await resumeDb.syncResumeDocument(uid, resume);
      if (!ok) return resume;
      const rows = await resumeDb.listResumesForUser(uid);
      return resumeRowsToDocument(rows);
    } catch {
      return resume;
    }
  },

  /** 新增一行（id 由数据库生成） */
  async createTemplateRow(input: {
    name: string;
    sections: ResumeSection[];
    theme: "light" | "dark";
  }): Promise<ResumeTemplate | null> {
    const authStore = useAuthStore();
    if (!authStore.isLoggedIn || !authStore.user?.id) return null;
    const uid = authStore.user.id;
    const row = await resumeDb.insertResumeRow(uid, {
      name: input.name,
      content: { sections: input.sections, theme: input.theme },
    });
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      sections: row.content.sections,
      theme: row.content.theme,
    };
  },

  async deleteTemplateRow(templateId: string): Promise<boolean> {
    const authStore = useAuthStore();
    if (!authStore.isLoggedIn || !authStore.user?.id) return false;
    return resumeDb.deleteResumeRow(authStore.user.id, templateId);
  },

  async updateTemplateName(templateId: string, name: string): Promise<boolean> {
    const authStore = useAuthStore();
    if (!authStore.isLoggedIn || !authStore.user?.id) return false;
    return resumeDb.updateResumeRow(authStore.user.id, templateId, { name });
  },

  async updateSections(sections: ResumeSection[]): Promise<ResumeSection[]> {
    try {
      const { data } = await http.put("/resume/sections", { sections });
      return data;
    } catch {
      return sections;
    }
  },

  async toggleSection(sectionId: string, visible: boolean): Promise<void> {
    try {
      await http.patch(`/resume/sections/${sectionId}`, { visible });
    } catch {
      // 模拟成功
    }
  },

  async reorderSections(sections: ResumeSection[]): Promise<void> {
    try {
      await http.patch("/resume/sections/reorder", { sections });
    } catch {
      // 模拟成功
    }
  },

  async exportPDF(): Promise<Blob> {
    try {
      const response = await http.get("/resume/export/pdf", { responseType: "blob" });
      return response.data as Blob;
    } catch {
      return new Blob(["PDF export not available"], { type: "application/pdf" });
    }
  },
};

import { generateDefaultResume } from '@/data/resume'
import { getActiveTemplate, normalizeStoredResume } from '@/lib/resumeDocument'
import { supabase } from '@/lib/supabase'
import type { ResumeDocument, ResumeRow, ResumeSection } from '@/types/resume'

/** 解开 JSONB 里误存的双引号包裹字符串（可能多层） */
function unwrapJsonValue(v: unknown, maxDepth: number): unknown {
  let cur: unknown = v
  for (let d = 0; d < maxDepth; d++) {
    if (typeof cur !== 'string') return cur
    const s = cur.trim()
    if (!s) return null
    try {
      cur = JSON.parse(s) as unknown
    } catch {
      return null
    }
  }
  return cur
}

/**
 * 将 `resumes.content` 规范为 { sections, theme }。
 * 兼容：JSON 字符串、旧版整包 ResumeDocument（含 templates）、仅含行元数据的错误写入。
 */
function coerceResumeContent(raw: unknown): { sections: ResumeSection[]; theme: 'light' | 'dark' } {
  const topWasString = typeof raw === 'string'
  const unwrapped = unwrapJsonValue(raw, 4)
  const v = unwrapped === null ? raw : unwrapped

  if (!v || typeof v !== 'object') {
    if (topWasString) {
      const d = generateDefaultResume()
      return { sections: d.sections, theme: d.theme }
    }
    return { sections: [], theme: 'light' }
  }

  const o = v as Record<string, unknown>

  if (Array.isArray(o.sections)) {
    return {
      sections: o.sections as ResumeSection[],
      theme: o.theme === 'dark' ? 'dark' : 'light',
    }
  }

  const doc = normalizeStoredResume(v)
  if (doc) {
    const t = getActiveTemplate(doc)
    return {
      sections: Array.isArray(t.sections) ? t.sections : [],
      theme: t.theme === 'dark' ? 'dark' : 'light',
    }
  }

  if (o.content != null && typeof o.content === 'object') {
    return coerceResumeContent(o.content)
  }

  const looksLikeRowDumpedIntoContent =
    !Array.isArray(o.sections) &&
    !Array.isArray(o.templates) &&
    ('userId' in o ||
      'user_id' in o ||
      'createdAt' in o ||
      'created_at' in o ||
      topWasString)

  if (looksLikeRowDumpedIntoContent && Object.keys(o).length > 0) {
    const d = generateDefaultResume()
    return { sections: d.sections, theme: d.theme }
  }

  return { sections: [], theme: 'light' }
}

function mapRow(raw: Record<string, unknown>): ResumeRow {
  const parsed = coerceResumeContent(raw.content)
  return {
    id: String(raw.id),
    user_id: String(raw.user_id),
    name: String(raw.name ?? ''),
    content: parsed,
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
  }
}

/**
 * 表 `resumes`：每行一条简历/模板。
 * 列仅：`id`（默认 gen_random_uuid）、`user_id`、`name`、`content`（JSONB）、`created_at`、`updated_at`。
 */
export const resumeDb = {
  async listResumesForUser(userId: string): Promise<ResumeRow[]> {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []).map((r) => mapRow(r as Record<string, unknown>))
    } catch (e) {
      console.error('listResumesForUser', e)
      return []
    }
  },

  /** 该用户 created_at 最早的一行 id（默认模板，不可删） */
  async getDefaultResumeRowId(userId: string): Promise<string | null> {
    const rows = await resumeDb.listResumesForUser(userId)
    return rows.length ? rows[0]!.id : null
  },

  async getResumeRow(userId: string, resumeId: string): Promise<ResumeRow | null> {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .eq('id', resumeId)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      return mapRow(data as Record<string, unknown>)
    } catch (e) {
      console.error('getResumeRow', e)
      return null
    }
  },

  /**
   * 对外浏览：全表按 created_at 升序取第一条（「列表里的第一个」）。
   */
  async getPublicFirstResumeRow(): Promise<ResumeRow | null> {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      return mapRow(data as Record<string, unknown>)
    } catch (e) {
      console.error('getPublicFirstResumeRow', e)
      return null
    }
  },

  async insertResumeRow(
    userId: string,
    input: {
      name: string
      content: { sections: ResumeSection[]; theme: 'light' | 'dark' }
    },
  ): Promise<ResumeRow | null> {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .insert({
          user_id: userId,
          name: input.name,
          content: input.content,
        })
        .select('*')
        .single()
      if (error) throw error
      if (!data) return null
      return mapRow(data as Record<string, unknown>)
    } catch (e) {
      console.error('insertResumeRow', e)
      return null
    }
  },

  async updateResumeRow(
    userId: string,
    resumeId: string,
    patch: {
      name?: string
      content?: { sections: ResumeSection[]; theme: 'light' | 'dark' }
    },
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('resumes')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('id', resumeId)
      if (error) throw error
      return true
    } catch (e) {
      console.error('updateResumeRow', e)
      return false
    }
  },

  async deleteResumeRow(userId: string, resumeId: string): Promise<boolean> {
    try {
      const defId = await resumeDb.getDefaultResumeRowId(userId)
      if (defId === resumeId) {
        console.warn('Refusing to delete default (first) resume row')
        return false
      }
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('user_id', userId)
        .eq('id', resumeId)
      if (error) throw error
      return true
    } catch (e) {
      console.error('deleteResumeRow', e)
      return false
    }
  },

  async syncResumeDocument(userId: string, doc: ResumeDocument): Promise<boolean> {
    try {
      let rows = await resumeDb.listResumesForUser(userId)
      const incomingIds = new Set(doc.templates.map((t) => t.id))

      for (const r of rows) {
        if (!incomingIds.has(r.id)) {
          if (r.id === doc.defaultTemplateId) continue
          const ok = await resumeDb.deleteResumeRow(userId, r.id)
          if (!ok) return false
        }
      }

      rows = await resumeDb.listResumesForUser(userId)

      for (const t of doc.templates) {
        const existing = rows.find((r) => r.id === t.id)
        const content = { sections: t.sections, theme: t.theme }
        if (existing) {
          const ok = await resumeDb.updateResumeRow(userId, t.id, {
            name: t.name,
            content,
          })
          if (!ok) return false
        } else {
          const ins = await resumeDb.insertResumeRow(userId, {
            name: t.name,
            content,
          })
          if (!ins) return false
        }
      }
      return true
    } catch (e) {
      console.error('syncResumeDocument', e)
      return false
    }
  },

  async deleteAllResumesForUser(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('resumes').delete().eq('user_id', userId)
      if (error) throw error
      return true
    } catch (e) {
      console.error('deleteAllResumesForUser', e)
      return false
    }
  },
}

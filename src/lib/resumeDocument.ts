import type {
  Resume,
  ResumeDocument,
  ResumeRow,
  ResumeSection,
  ResumeTemplate,
} from '@/types/resume'

function newId(): string {
  return crypto.randomUUID()
}

function cloneSections(sections: ResumeSection[]): ResumeSection[] {
  return JSON.parse(JSON.stringify(sections)) as ResumeSection[]
}

/** 将旧版单份 Resume 包成多模板文档（一条「默认模板」） */
export function wrapResumeAsDocument(r: Resume): ResumeDocument {
  const tid = newId()
  return {
    id: r.id,
    userId: r.userId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    defaultTemplateId: tid,
    activeTemplateId: tid,
    templates: [
      {
        id: tid,
        name: '默认模板',
        sections: cloneSections(r.sections),
        theme: r.theme ?? 'light',
      },
    ],
  }
}

function normalizeOneTemplate(raw: unknown): ResumeTemplate | null {
  if (!raw || typeof raw !== 'object') return null
  const t = raw as Record<string, unknown>
  if (typeof t.id !== 'string' || !Array.isArray(t.sections)) return null
  const name = typeof t.name === 'string' && t.name.trim() ? t.name.trim() : '未命名模板'
  const theme = t.theme === 'dark' ? 'dark' : 'light'
  return {
    id: t.id,
    name,
    sections: t.sections as ResumeSection[],
    theme,
  }
}

/**
 * 解析 DB 中的 content（旧版 Resume 或新版 ResumeDocument）。
 * 无法识别时返回 null，由调用方回退到 generateDefaultResumeDocument。
 */
export function normalizeStoredResume(raw: unknown): ResumeDocument | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>

  if (Array.isArray(o.templates) && o.templates.length > 0) {
    const templates = o.templates
      .map(normalizeOneTemplate)
      .filter((x): x is ResumeTemplate => x !== null)
    if (!templates.length) return null

    let activeTemplateId =
      typeof o.activeTemplateId === 'string' ? o.activeTemplateId : templates[0]!.id
    if (!templates.some((x) => x.id === activeTemplateId)) {
      activeTemplateId = templates[0]!.id
    }

    let defaultTemplateId =
      typeof o.defaultTemplateId === 'string' ? o.defaultTemplateId : templates[0]!.id
    if (!templates.some((x) => x.id === defaultTemplateId)) {
      const byName = templates.find((x) => x.name === '默认模板')
      defaultTemplateId = byName?.id ?? templates[0]!.id
    }

    return {
      id: typeof o.id === 'string' ? o.id : 'resume-1',
      userId: typeof o.userId === 'string' ? o.userId : 'user-1',
      createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString(),
      updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : new Date().toISOString(),
      defaultTemplateId,
      activeTemplateId,
      templates,
    }
  }

  if (Array.isArray(o.sections)) {
    return wrapResumeAsDocument(o as unknown as Resume)
  }

  return null
}

export function getActiveTemplate(doc: ResumeDocument): ResumeTemplate {
  const t = doc.templates.find((x) => x.id === doc.activeTemplateId)
  if (t) return t
  return doc.templates[0]!
}

export function getTemplateById(
  doc: ResumeDocument,
  templateId: string,
): ResumeTemplate | undefined {
  return doc.templates.find((x) => x.id === templateId)
}

export function cloneTemplatePayload(
  template: ResumeTemplate,
): Pick<ResumeTemplate, 'sections' | 'theme'> {
  return {
    sections: cloneSections(template.sections),
    theme: template.theme,
  }
}

/** 将 Supabase 多行 resumes 组装为编辑器使用的 ResumeDocument；活动模板固定为 created_at 最早的一条（与接口顺序一致）。 */
export function resumeRowsToDocument(rows: ResumeRow[]): ResumeDocument {
  if (!rows.length) {
    const now = new Date().toISOString()
    return {
      id: 'resume-1',
      userId: 'user-1',
      createdAt: now,
      updatedAt: now,
      defaultTemplateId: '',
      activeTemplateId: '',
      templates: [],
    }
  }
  const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const defaultRow = sorted[0]!
  const defaultTemplateId = defaultRow.id
  const templates: ResumeTemplate[] = sorted.map((r) => ({
    id: r.id,
    name: r.name,
    sections: Array.isArray(r.content?.sections) ? r.content.sections : [],
    theme: r.content?.theme === 'dark' ? 'dark' : 'light',
  }))
  const activeTemplateId = defaultTemplateId
  const createdAt = sorted.reduce(
    (a, r) => (r.created_at < a ? r.created_at : a),
    sorted[0]!.created_at,
  )
  const updatedAt = sorted.reduce(
    (a, r) => (r.updated_at > a ? r.updated_at : a),
    sorted[0]!.updated_at,
  )
  return {
    id: 'resume-1',
    userId: sorted[0]!.user_id,
    createdAt,
    updatedAt,
    defaultTemplateId,
    activeTemplateId,
    templates,
  }
}

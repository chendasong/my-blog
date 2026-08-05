import type { AppGenChatMessage, AppGenFileMap, AppGenPlan, AppGenPipelineStatus } from './types'

/**
 * AI 应用生成工作区的浏览器本地持久化（localStorage）。
 * 保存对话、虚拟工程 files、规划 plan；不保存 WebContainer 预览会话。
 */

const STORAGE_KEY = 'ai_app_gen_workspace_v1'

export type AppGenPersistedWorkspace = {
  version: 1
  updatedAt: number
  inputText: string
  status: AppGenPipelineStatus
  messages: AppGenChatMessage[]
  files: AppGenFileMap
  plan: AppGenPlan | null
  selectedPath: string
}

/** 刷新页面后只恢复稳定终态，不把「生成中/安装中」带给用户 */
const RESTORABLE_STATUS: AppGenPipelineStatus[] = [
  'idle',
  'ready',
  'previewing',
  'error',
  'cancelled',
]

function sanitizeStatus(status: unknown): AppGenPipelineStatus {
  if (typeof status === 'string' && RESTORABLE_STATUS.includes(status as AppGenPipelineStatus)) {
    return status as AppGenPipelineStatus
  }
  return 'idle'
}

function sanitizeMessages(raw: unknown): AppGenChatMessage[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      const m = item as Partial<AppGenChatMessage>
      if (!m || typeof m.id !== 'string') return null
      if (m.role !== 'user' && m.role !== 'assistant' && m.role !== 'system') return null
      return {
        id: m.id,
        role: m.role,
        content: typeof m.content === 'string' ? m.content : '',
        thinking: typeof m.thinking === 'string' ? m.thinking : '',
        thinkingOpen: false,
        streaming: false,
        at: typeof m.at === 'number' ? m.at : Date.now(),
      } satisfies AppGenChatMessage
    })
    .filter((m): m is AppGenChatMessage => Boolean(m))
    .slice(-80) // 防止对话无限膨胀撑爆配额
}

function sanitizeFiles(raw: unknown): AppGenFileMap {
  if (!raw || typeof raw !== 'object') return {}
  const out: AppGenFileMap = {}
  for (const [path, content] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof content === 'string' && path && !path.includes('..')) {
      out[path] = content
    }
  }
  return out
}

export function loadAppGenWorkspace(): AppGenPersistedWorkspace | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AppGenPersistedWorkspace>
    if (parsed.version !== 1) return null
    const files = sanitizeFiles(parsed.files)
    const messages = sanitizeMessages(parsed.messages)
    if (!Object.keys(files).length && !messages.length) return null
    return {
      version: 1,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
      inputText: typeof parsed.inputText === 'string' ? parsed.inputText : '',
      status: sanitizeStatus(parsed.status),
      messages,
      files,
      plan: parsed.plan && typeof parsed.plan === 'object' ? (parsed.plan as AppGenPlan) : null,
      selectedPath: typeof parsed.selectedPath === 'string' ? parsed.selectedPath : '',
    }
  } catch {
    return null
  }
}

export function saveAppGenWorkspace(data: Omit<AppGenPersistedWorkspace, 'version' | 'updatedAt'>): boolean {
  const payload: AppGenPersistedWorkspace = {
    version: 1,
    updatedAt: Date.now(),
    inputText: data.inputText,
    status: sanitizeStatus(data.status),
    messages: sanitizeMessages(data.messages),
    files: sanitizeFiles(data.files),
    plan: data.plan,
    selectedPath: data.selectedPath || '',
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    return true
  } catch {
    // 配额满时尝试只保留最近对话
    try {
      payload.messages = payload.messages.slice(-30)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      return true
    } catch {
      return false
    }
  }
}

export function clearAppGenWorkspace(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

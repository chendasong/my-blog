import { jsonrepair } from 'jsonrepair'
import type { Router } from 'vue-router'
import { volcanoChatComplete } from '@/api/agent'
import { articleApi } from '@/api/articles'
import { noteApi } from '@/api/notes'
import { emitMusicCommand } from '@/lib/musicBridge'

export interface AssistantSearchItem {
  title: string
  path: string
  category?: string
}

/** 助手消息中可点击的搜索列表（文章 / 笔记） */
export interface AssistantSearchBlock {
  kind: 'articles' | 'notes'
  label: string
  items: AssistantSearchItem[]
}

export interface AssistantChatMessage {
  role: 'user' | 'assistant'
  content: string
  searchBlocks?: AssistantSearchBlock[]
}

/** 一轮对话的完整回复（含可选的结构化搜索结果，供 UI 渲染链接） */
export interface AssistantReply {
  content: string
  searchBlocks?: AssistantSearchBlock[]
}

interface ToolExecResult {
  text: string
  searchBlock?: AssistantSearchBlock
}

export interface AssistantToolCall {
  name: string
  arguments: Record<string, unknown>
}

function extractFirstJsonObjectString(raw: string): string | null {
  let t = raw.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) t = fence[1].trim()
  const start = t.indexOf('{')
  if (start === -1) return null
  let depth = 0
  let inString = false
  let escape = false
  for (let p = start; p < t.length; p++) {
    const ch = t[p]
    if (inString) {
      if (escape) {
        escape = false
        continue
      }
      if (ch === '\\') {
        escape = true
        continue
      }
      if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return t.slice(start, p + 1)
    }
  }
  return null
}

function parseModelJson(raw: string): Record<string, unknown> {
  let t = raw.trim()
  if (t.startsWith('"') && t.length > 2) {
    try {
      const once = JSON.parse(t)
      if (typeof once === 'string') t = once.trim()
    } catch {
      /* noop */
    }
  }
  const extracted = extractFirstJsonObjectString(t)
  if (extracted) t = extracted
  else if (!t.startsWith('{')) throw new Error('未找到 JSON')
  t = t
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([}\]])/g, '$1')
  try {
    return JSON.parse(t) as Record<string, unknown>
  } catch {
    try {
      return JSON.parse(t.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')) as Record<string, unknown>
    } catch {
      return JSON.parse(jsonrepair(t)) as Record<string, unknown>
    }
  }
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function asNumber(v: unknown, fallback: number): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback
}

function normalizeTools(raw: unknown): AssistantToolCall[] {
  if (!Array.isArray(raw)) return []
  const out: AssistantToolCall[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const o = item as Record<string, unknown>
    const name = asString(o.name, '').trim()
    if (!name) continue
    const args =
      o.arguments && typeof o.arguments === 'object' && !Array.isArray(o.arguments)
        ? (o.arguments as Record<string, unknown>)
        : {}
    out.push({ name, arguments: args })
  }
  return out
}

function safePath(path: string): string | null {
  const p = path.trim().split(/[?#]/)[0]
  if (!p.startsWith('/') || p.includes('..')) return null
  if (!/^\/[\w\-./]*$/.test(p)) return null
  return p
}

async function executeTool(
  tool: AssistantToolCall,
  router: Router
): Promise<ToolExecResult> {
  const { name, arguments: args } = tool
  try {
    switch (name) {
      case 'navigate': {
        const path = safePath(asString(args.path, ''))
        if (!path) return { text: '（跳转失败：路径不合法）' }
        await router.push(path)
        return { text: `（已跳转：${path}）` }
      }
      case 'search_articles': {
        const keyword = asString(args.keyword, '').trim()
        const limit = Math.min(10, Math.max(1, asNumber(args.limit, 5)))
        if (!keyword) return { text: '（搜索文章：请提供关键词）' }
        const { items: slice } = await articleApi.getPage({
          q: keyword,
          limit,
          offset: 0,
        })
        if (!slice.length)
          return { text: `（未找到与「${keyword}」相关的文章）` }
        return {
          text: '',
          searchBlock: {
            kind: 'articles',
            label: '文章搜索结果',
            items: slice.map((a) => ({
              title: a.title,
              path: `/blog/${a.id}`,
              category: a.category,
            })),
          },
        }
      }
      case 'search_notes': {
        const keyword = asString(args.keyword, '').trim()
        const limit = Math.min(10, Math.max(1, asNumber(args.limit, 5)))
        if (!keyword) return { text: '（搜索笔记：请提供关键词）' }
        const { items: slice } = await noteApi.getPage({
          q: keyword,
          limit,
          offset: 0,
        })
        if (!slice.length)
          return { text: `（未找到与「${keyword}」相关的笔记）` }
        return {
          text: '',
          searchBlock: {
            kind: 'notes',
            label: '笔记搜索结果',
            items: slice.map((n) => ({
              title: n.title,
              path: `/notes/${n.id}`,
              category: n.category,
            })),
          },
        }
      }
      case 'music_play_pause':
        emitMusicCommand({ type: 'toggle_play' })
        return { text: '（已切换播放/暂停）' }
      case 'music_next':
        emitMusicCommand({ type: 'next' })
        return { text: '（已切到下一首）' }
      case 'music_prev':
        emitMusicCommand({ type: 'prev' })
        return { text: '（已切到上一首）' }
      case 'music_select': {
        const idx = Math.floor(asNumber(args.index, 1)) - 1
        if (idx < 0) return { text: '（曲目序号无效）' }
        emitMusicCommand({ type: 'select_track', index: idx })
        return { text: `（已选择第 ${idx + 1} 首）` }
      }
      case 'music_loop': {
        const mode = asString(args.mode, 'all') as 'off' | 'all' | 'one'
        if (!['off', 'all', 'one'].includes(mode))
          return { text: '（循环模式须为 off / all / one）' }
        emitMusicCommand({ type: 'set_loop', mode })
        const label =
          mode === 'all' ? '列表循环' : mode === 'one' ? '单曲循环' : '不循环'
        return { text: `（循环模式：${label}）` }
      }
      default:
        return { text: `（未知工具：${name}）` }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { text: `（执行 ${name} 失败：${msg}）` }
  }
}

const SYSTEM_PROMPT = `你是 Luminary 个人博客网站内的「AI 助手」。用户主要说中文。
你必须只输出一个 JSON 对象，不要 markdown 代码块，不要其它说明。格式：
{
  "message": "对用户说的简短、自然、友好的回复",
  "tools": [ { "name": "工具名", "arguments": { } } ]
}

可用工具（可同时调用多个，按顺序执行）：
1. navigate — 站内路由跳转。arguments: { "path": "/路径" }。path 必须以 / 开头。常用：/ 首页，/blog 文章列表，/notes 笔记，/ai AI工坊，/ai/agent AI Agent 写作，/resume 简历，/resume/edit 编辑简历，/couple 情侣空间，/login 登录。
2. search_articles — 按标题/摘要搜索文章。arguments: { "keyword": "关键词", "limit": 5 }
3. search_notes — 搜索笔记。arguments: { "keyword": "关键词", "limit": 5 }
4. music_play_pause — 播放/暂停背景音乐。arguments: {}
5. music_next — 下一首。arguments: {}
6. music_prev — 上一首。arguments: {}
7. music_select — 播放列表第几首。arguments: { "index": 1 } 从 1 开始
8. music_loop — 循环模式。arguments: { "mode": "off" | "all" | "one" } 分别：不循环、列表循环、单曲循环

若只需要聊天、不需要操作网站，tools 设为 []。
用户若要去「写文章、自动发布」那类流程，应 navigate 到 /ai/agent 并 message 里说明。`

export async function runSiteAssistantTurn(
  history: AssistantChatMessage[],
  userText: string,
  router: Router,
  options?: { signal?: AbortSignal }
): Promise<AssistantReply> {
  const trimmed = userText.trim()
  if (!trimmed) return { content: '' }

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: trimmed },
  ]

  const raw = await volcanoChatComplete(messages, {
    signal: options?.signal,
    maxTokens: 2048,
    temperature: 0.35,
  })

  let obj: Record<string, unknown>
  try {
    obj = parseModelJson(raw)
  } catch {
    return {
      content:
        raw.trim() || '抱歉，我没能理解，请换一种说法试试。',
    }
  }

  const message = asString(obj.message, '').trim() || '好的。'
  const tools = normalizeTools(obj.tools)
  if (!tools.length) return { content: message }

  const parts: string[] = [message]
  const searchBlocks: AssistantSearchBlock[] = []
  for (const t of tools) {
    const r = await executeTool(t, router)
    if (r.text.trim()) parts.push(r.text.trim())
    if (r.searchBlock?.items.length) searchBlocks.push(r.searchBlock)
  }
  return {
    content: parts.join('\n\n'),
    searchBlocks: searchBlocks.length ? searchBlocks : undefined,
  }
}

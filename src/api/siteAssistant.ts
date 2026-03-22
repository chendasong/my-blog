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

/** 去掉空格与大小写，便于匹配口语 */
function compactRouteKey(s: string): string {
  return s.replace(/\s+/g, '').toLowerCase()
}

/**
 * 明显是搜索、长文聊天等场景，不走本地跳转，交给大模型。
 */
function shouldSkipDirectNav(raw: string): boolean {
  if (raw.length > 72) return true
  return /搜索|查找|搜一下|关键词|哪篇|推荐|为什么|怎么|如何|什么是|解释|写一段|总结|分析/.test(raw)
}

/**
 * 常见「去某页」说法 → 站内 path；匹配不到返回 null。
 * 规则按短语从长到短尝试，避免「文章」误伤长句（仅整句很短时才等于「文章」）。
 */
function matchDirectNavigationPath(userText: string): string | null {
  const raw = userText.trim()
  if (!raw || shouldSkipDirectNav(raw)) return null

  const slash = raw.match(/\/[\w\-./]+/)?.[0]
  if (slash) {
    const p = safePath(slash)
    if (p) return p
  }

  let s = raw
    .replace(/^请(帮我)?/u, '')
    .replace(/^(帮我|麻烦您?|麻烦)/u, '')
    .trim()
  s = s.replace(/^(打开|进入|跳转|去|到|前往|点开|点进|打开一下|我想去|我要|帮我)/u, '').trim()
  s = s.replace(/[。！？…]+$/u, '').trim()
  const c = compactRouteKey(s)

  const rules: { path: string; phrases: string[] }[] = [
    /** 新增文章 / 写笔记：优先于列表页与 AI Agent，避免走大模型 */
    {
      path: '/blog/new',
      phrases: [
        '新建文章',
        '新增文章',
        '发表文章',
        '添加文章',
        '写文章',
        '写博客',
        '新建博客',
        '新增博客',
        '发布文章',
        '去写文章',
        '我要写文章',
      ],
    },
    {
      path: '/notes/new',
      phrases: [
        '新建笔记',
        '新笔记',
        '写笔记',
        '添加笔记',
        '新增笔记',
        '去写笔记',
        '我要写笔记',
        '记笔记',
      ],
    },
    {
      path: '/ai/agent',
      phrases: [
        '写作agent',
        'aiagent',
        'ai agent',
        '写作 agent',
        '写作工坊',
        '去写作',
        '打开写作agent',
        '打开agent',
        '智能写作',
        '写作助手',
      ],
    },
    { path: '/couple', phrases: ['情侣空间', '情侣页', '恋爱空间'] },
    {
      path: '/blog',
      phrases: [
        '打开文章列表',
        '文章列表',
        '博客列表',
        '文章页',
        '打开文章',
        '去看文章',
        '所有文章',
        'blog',
        'blogs',
      ],
    },
    { path: '/notes', phrases: ['笔记列表', '笔记页', '我的笔记', 'notes'] },
    { path: '/ai', phrases: ['ai工坊', 'ai 工坊', 'ai页面', '智能工坊'] },
    { path: '/login', phrases: ['登录页', '登陆页', '去登录', '去登陆', '登录界面'] },
    { path: '/', phrases: ['首页', '主页', '回首页', '网站首页', '回到首页', 'home'] },
    { path: '/blog', phrases: ['博客', '文章'] },
    { path: '/notes', phrases: ['笔记'] },
    { path: '/ai', phrases: ['ai'] },
    { path: '/couple', phrases: ['情侣'] },
    { path: '/login', phrases: ['登录', '登陆'] },
  ]

  const prefixes = ['', '打开', '去', '进入', '到', '前往']

  for (const { path, phrases } of rules) {
    const sorted = [...phrases].sort((a, b) => b.length - a.length)
    for (const ph of sorted) {
      const pc = compactRouteKey(ph)
      if (!pc) continue
      if (c === pc) return path
      for (const pre of prefixes) {
        if (!pre) continue
        if (c === compactRouteKey(pre + ph)) return path
      }
    }
  }

  return null
}

/**
 * 无需大模型的纯跳转：命中即 router.push 并返回空文案（与 navigate 工具成功时一致）。
 */
async function tryDirectNavigationOnly(
  userText: string,
  router: Router,
): Promise<AssistantReply | null> {
  const path = matchDirectNavigationPath(userText)
  if (!path) return null
  try {
    await router.push(path)
    return { content: '' }
  } catch {
    return null
  }
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
        return { text: '' }
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
1. navigate — 站内路由跳转。arguments: { "path": "/路径" }。path 必须以 / 开头。常用：/ 首页，/blog 文章列表，/blog/new 新建文章编辑器，/notes 笔记列表，/notes/new 新建笔记，/ai AI工坊，/ai/agent 写作 Agent 流水线，/resume 简历，/resume/edit 编辑简历，/couple 情侣空间，/login 登录。
2. search_articles — 按标题/摘要搜索文章。arguments: { "keyword": "关键词", "limit": 5 }
3. search_notes — 搜索笔记。arguments: { "keyword": "关键词", "limit": 5 }
4. music_play_pause — 播放/暂停背景音乐。arguments: {}
5. music_next — 下一首。arguments: {}
6. music_prev — 上一首。arguments: {}
7. music_select — 播放列表第几首。arguments: { "index": 1 } 从 1 开始
8. music_loop — 循环模式。arguments: { "mode": "off" | "all" | "one" } 分别：不循环、列表循环、单曲循环

若只需要聊天、不需要操作网站，tools 设为 []。
用户要在编辑器里**新建一篇博客文章**，navigate 到 /blog/new；要用**写作 Agent 多步流水线**，navigate 到 /ai/agent。`

export async function runSiteAssistantTurn(
  history: AssistantChatMessage[],
  userText: string,
  router: Router,
  options?: { signal?: AbortSignal }
): Promise<AssistantReply> {
  const trimmed = userText.trim()
  if (!trimmed) return { content: '' }

  const direct = await tryDirectNavigationOnly(trimmed, router)
  if (direct) return direct

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

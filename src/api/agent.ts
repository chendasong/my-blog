import { jsonrepair } from 'jsonrepair'
import { getVolcanoChatModel, getVolcanoKey, VOLCANO_ARK_API } from '@/api/volcano'
import { categories } from '@/data/articles'
import type { AgentArticleDraft, AgentNoteDraft, NoteCategory } from '@/types'

/** AI Agent：火山方舟文本对话（与博客「AI 生成封面」同密钥，模型见 VITE_VOLCANO_CHAT_MODEL） */
const VOLC_CHAT_URL = `${VOLCANO_ARK_API}/chat/completions`

const CATEGORY_NAMES = categories.map((c) => c.name).join('、')
const NOTE_CATEGORIES: NoteCategory[] = ['work', 'life', 'study', 'idea', 'todo']

export interface VolcanoChatOptions {
  signal?: AbortSignal
  temperature?: number
  maxTokens?: number
  /** OpenAI 兼容：核采样，省略则由服务端默认 */
  topP?: number
}

/** 方舟 Chat 兼容 OpenAI 多模态：user 消息可为文本或多段 text + image_url */
export type VolcanoChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

export interface VolcanoChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | VolcanoChatContentPart[]
}

export async function volcanoChatComplete(
  messages: VolcanoChatMessage[],
  options?: VolcanoChatOptions
): Promise<string> {
  const model = getVolcanoChatModel().trim()
  if (!model) {
    throw new Error('未配置 VITE_VOLCANO_CHAT_MODEL')
  }
  if (!getVolcanoKey().trim()) {
    throw new Error('未配置 VITE_VOLCANO_KEY')
  }
  const payload: Record<string, unknown> = {
    model,
    messages,
    temperature: options?.temperature ?? 0.45,
    max_tokens: options?.maxTokens ?? 8192,
  }
  if (typeof options?.topP === 'number') {
    payload.top_p = options.topP
  }

  const resp = await fetch(VOLC_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getVolcanoKey()}`,
    },
    body: JSON.stringify(payload),
    signal: options?.signal,
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    const msg = (err as { error?: { message?: string } })?.error?.message
    throw new Error(msg || `火山模型请求失败 (${resp.status})`)
  }

  const data = await resp.json()
  const text = extractMessageContent(data)
  if (!text.trim()) {
    throw new Error('模型未返回有效文本')
  }
  return text.trim()
}

/** 兼容火山/OpenAI 格式：content 可能为 string，或 [{ type, text }] 数组；部分模型把长文放在 reasoning_content */
function extractMessageContent(data: unknown): string {
  const msg = (data as {
    choices?: Array<{
      message?: { content?: unknown; reasoning_content?: string }
    }>
  })?.choices?.[0]?.message
  if (!msg) return ''

  const fromParts = (c: unknown): string => {
    if (typeof c === 'string') return c
    if (Array.isArray(c)) {
      return c
        .map((part: unknown) => {
          if (typeof part === 'string') return part
          if (part && typeof part === 'object' && 'text' in part) {
            return String((part as { text?: string }).text ?? '')
          }
          if (part && typeof part === 'object' && 'content' in part) {
            return String((part as { content?: string }).content ?? '')
          }
          return ''
        })
        .join('')
    }
    return ''
  }

  const main = fromParts(msg.content).trim()
  if (main) return main
  const r = msg.reasoning_content
  if (typeof r === 'string' && r.trim()) return r
  return ''
}

export interface VolcanoChatStreamOptions {
  messages: VolcanoChatMessage[]
  signal?: AbortSignal
  temperature?: number
  maxTokens?: number
  topP?: number
  onChunk: (text: string) => void
  /** 部分豆包推理模型会流式输出 reasoning_content */
  onReasoning?: (text: string) => void
  onDone: () => void
  onError: (msg: string) => void
}

/**
 * 火山方舟流式对话（OpenAI 兼容 SSE），模型与密钥同 volcanoChatComplete。
 */
export async function volcanoChatStream(
  options: VolcanoChatStreamOptions,
): Promise<void> {
  const model = getVolcanoChatModel().trim()
  if (!model) {
    options.onError('未配置 VITE_VOLCANO_CHAT_MODEL')
    return
  }
  if (!getVolcanoKey().trim()) {
    options.onError('未配置 VITE_VOLCANO_KEY')
    return
  }

  const {
    messages,
    signal,
    temperature = 0.7,
    maxTokens = 4096,
    topP,
    onChunk,
    onReasoning,
    onDone,
    onError,
  } = options

  const streamPayload: Record<string, unknown> = {
    model,
    messages,
    stream: true,
    max_tokens: maxTokens,
    temperature,
  }
  if (typeof topP === 'number') {
    streamPayload.top_p = topP
  }

  try {
    const resp = await fetch(VOLC_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getVolcanoKey()}`,
      },
      body: JSON.stringify(streamPayload),
      signal,
    })

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      onError(
        (err as { error?: { message?: string } })?.error?.message ||
          `火山模型请求失败 (${resp.status})`,
      )
      return
    }

    const reader = resp.body?.getReader()
    if (!reader) {
      onError('无法读取响应流')
      return
    }

    const decoder = new TextDecoder()
    let carry = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      carry += decoder.decode(value, { stream: true })
      const lines = carry.split('\n')
      carry = lines.pop() ?? ''
      for (const rawLine of lines) {
        const line = rawLine.trim()
        if (!line.startsWith('data:')) continue
        const payload = line.replace(/^data:\s*/, '').trim()
        if (payload === '[DONE]') {
          onDone()
          return
        }
        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{
              delta?: {
                content?: string | null
                reasoning_content?: string | null
              }
            }>
            error?: { message?: string }
          }
          if (json.error?.message) {
            onError(json.error.message)
            await reader.cancel()
            return
          }
          const delta = json.choices?.[0]?.delta as
            | Record<string, unknown>
            | undefined
          if (!delta || typeof delta !== 'object') continue

          const reasoningPiece =
            (typeof delta.reasoning_content === 'string' &&
              delta.reasoning_content) ||
            (typeof delta.thinking === 'string' && delta.thinking) ||
            (typeof delta.reasoning === 'string' && delta.reasoning) ||
            ''
          if (reasoningPiece) {
            onReasoning?.(reasoningPiece)
          }

          if (typeof delta.content === 'string' && delta.content) {
            onChunk(delta.content)
          }
        } catch {
          /* 半行 JSON，忽略 */
        }
      }
    }
    onDone()
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      onDone()
      return
    }
    onError(e instanceof Error ? e.message : '网络错误')
  }
}

/** 从模型输出中取出第一个完整 JSON 对象（按括号配对，避免 content 里含 `}` 时误截断） */
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

function normalizeJsonText(s: string): string {
  return s
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([}\]])/g, '$1')
}

/**
 * 模型常在 content 里夹 Markdown，未转义 `"` 会破坏 JSON；先用标准 parse，失败再用 jsonrepair。
 */
function parseJsonObject(raw: string): Record<string, unknown> {
  let t = raw.trim()
  // 整段是「JSON 字符串」时再解一层（部分网关会再包一层）
  if (t.startsWith('"') && t.length > 2) {
    try {
      const once = JSON.parse(t)
      if (typeof once === 'string') t = once.trim()
    } catch {
      /* 保持原样 */
    }
  }

  const extracted = extractFirstJsonObjectString(t)
  if (extracted) t = extracted
  else if (!t.startsWith('{')) throw new Error('未找到 JSON 对象')

  t = normalizeJsonText(t)

  let parsed: unknown
  const tryParse = (s: string) => {
    parsed = JSON.parse(s)
  }
  try {
    tryParse(t)
  } catch (e) {
    try {
      tryParse(t.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'))
    } catch {
      try {
        tryParse(jsonrepair(t))
      } catch {
        throw e
      }
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON 格式不是对象')
  }
  return parsed as Record<string, unknown>
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean)
}

function asBool(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback
}

function normalizeNoteCategory(v: unknown): NoteCategory {
  const s = typeof v === 'string' ? v : ''
  if (NOTE_CATEGORIES.includes(s as NoteCategory)) return s as NoteCategory
  const map: Record<string, NoteCategory> = {
    工作: 'work',
    生活: 'life',
    学习: 'study',
    想法: 'idea',
    待办: 'todo',
  }
  return map[s] ?? 'idea'
}

function normalizeArticleCategory(v: unknown): string {
  const s = typeof v === 'string' ? v.trim() : ''
  if (categories.some((c) => c.name === s)) return s
  const map: Record<string, string> = {
    tech: '技术',
    life: '生活',
    design: '设计',
    thinking: '思考',
    技术: '技术',
    生活: '生活',
    设计: '设计',
    思考: '思考',
  }
  return map[s] || '技术'
}

/** 第一步：根据用户描述生成「写作任务提示词」（供第二步使用） */
export async function generateAgentWritingPrompt(
  mode: 'article' | 'note',
  userDescription: string,
  options?: VolcanoChatOptions
): Promise<string> {
  const system =
    mode === 'article'
      ? `作者是资深前端开发工程师，你是文章写作助手。根据作者的一句话需求，输出一段给后续模型用的**详细写作任务提示词**（中文）。
要求：说明目标读者、建议结构（引言/主体/小结）、语气、必须覆盖的要点。不要输出 JSON，不要编号列表套娃，纯段落文本。450 字以内。`
      : `作者是资深前端开发工程师，你是笔记助手。根据作者的一句话需求，输出一段给后续模型用的**详细记录任务提示词**（中文）。
要求：说明记录的关键信息、条理（可简要点出）。不要输出 JSON，纯段落文本。350 字以内。`

  return volcanoChatComplete(
    [
      { role: 'system', content: system },
      { role: 'user', content: `用户需求：\n${userDescription}` },
    ],
    { ...options, maxTokens: options?.maxTokens ?? 1200, temperature: 0.5 }
  )
}

/** 第二步：生成文章结构化字段（Markdown 正文） */
export async function generateAgentArticleDraft(
  userDescription: string,
  writingPrompt: string,
  options?: VolcanoChatOptions
): Promise<AgentArticleDraft> {
  const system = `你是博客编辑与作者。只输出**一个 JSON 对象**，键不可增减：
{
  "title": "标题",
  "summary": "1-2句摘要，120字内",
  "content": "Markdown 正文，800-2500 字，层次清晰",
  "category": "必须从以下选一：${CATEGORY_NAMES}",
  "tags": ["标签1","标签2"],
  "coverPrompt": "给图片模型用的封面描述，需体现主题；建议包含：宽高比 16:9、吉伊卡哇风格科普插画、主题关键词",
  "featured": false
}
重要：字符串里若出现英文双引号 "，必须写成 \\"；更推荐用中文引号「」或不用引号。禁止 markdown 代码围栏、禁止 JSON 外任何字符。`

  const raw = await volcanoChatComplete(
    [
      { role: 'system', content: system },
      {
        role: 'user',
        content: `用户原始描述：\n${userDescription}\n\n写作任务提示：\n${writingPrompt}`,
      },
    ],
    { ...options, maxTokens: 12000, temperature: 0.45 }
  )

  let obj: Record<string, unknown>
  try {
    obj = parseJsonObject(raw)
  } catch (e) {
    const hint = e instanceof Error ? e.message : String(e)
    throw new Error(`第二步：解析 JSON 失败（${hint}）。可重试或缩短描述。`)
  }

  return {
    title: asString(obj.title, '未命名文章'),
    summary: asString(obj.summary, ''),
    content: asString(obj.content, ''),
    category: normalizeArticleCategory(obj.category),
    tags: asStringArray(obj.tags).slice(0, 8),
    coverPrompt: asString(obj.coverPrompt, userDescription.slice(0, 200)),
    featured: asBool(obj.featured, false),
  }
}

/** 第二步：生成笔记结构化字段 */
export async function generateAgentNoteDraft(
  userDescription: string,
  writingPrompt: string,
  options?: VolcanoChatOptions
): Promise<AgentNoteDraft> {
  const system = `你是效率笔记助手。只输出**一个 JSON 对象**：
{
  "title": "笔记标题",
  "content": "Markdown 正文，可含清单、待办",
  "category": "必须是其一：work | life | study | idea | todo（小写英文）",
  "tags": ["标签"],
  "color": "#6C8EBF",
  "pinned": false
}
color 使用十六进制，可从 #6C8EBF #82B366 #D6B656 #9673A6 #B85450 #4CAF82 中选。
**content 字符串内禁止出现未转义的英文双引号 "**；必须写成 \\" 或改用「」引号，否则 JSON 非法。
禁止 markdown 代码围栏、禁止 JSON 外文字。`

  const raw = await volcanoChatComplete(
    [
      { role: 'system', content: system },
      {
        role: 'user',
        content: `用户原始描述：\n${userDescription}\n\n记录任务提示：\n${writingPrompt}`,
      },
    ],
    { ...options, maxTokens: 12000, temperature: 0.45 }
  )

  let obj: Record<string, unknown>
  try {
    obj = parseJsonObject(raw)
  } catch (e) {
    const hint = e instanceof Error ? e.message : String(e)
    throw new Error(`第二步：解析 JSON 失败（${hint}）。可重试或缩短描述。`)
  }

  const allowedColors = ['#6C8EBF', '#82B366', '#D6B656', '#9673A6', '#B85450', '#4CAF82']
  let color = asString(obj.color, '#6C8EBF')
  if (!/^#[0-9A-Fa-f]{6}$/.test(color) || !allowedColors.includes(color)) {
    color = '#6C8EBF'
  }

  return {
    title: asString(obj.title, '未命名笔记'),
    content: asString(obj.content, ''),
    category: normalizeNoteCategory(obj.category),
    tags: asStringArray(obj.tags).slice(0, 8),
    color,
    pinned: asBool(obj.pinned, false),
  }
}

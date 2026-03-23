import {
  volcanoChatComplete,
  type VolcanoChatContentPart,
} from '@/api/agent'
import {
  getVolcanoChatModel,
  getVolcanoKey,
  getVolcanoVideoModel,
  VOLCANO_ARK_API,
} from '@/api/volcano'

export type SeedanceRatio = '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | 'adaptive'

export type SeedanceResolution = '480p' | '720p' | '1080p'

/**
 * 图生视频参考图 role。
 * 前端当前仅传首帧 first_frame、尾帧 last_frame；reference_image 保留供扩展。
 */
export type VideoReferenceFrameRole =
  | 'first_frame'
  | 'last_frame'
  | 'reference_image'

export interface SeedanceVideoOptions {
  ratio: SeedanceRatio
  resolution: SeedanceResolution
  /** 秒数 4–12；智能时长传 -1（仅 Seedance 1.5 Pro） */
  duration: number
  generateAudio: boolean
  /** -1 表示随机 */
  seed: number
  /**
   * 参考图顺序：首帧 → 可选 reference_image → 尾帧（当前前端仅传首尾）。
   * URL 为 HTTPS 或 data:image/...;base64,...；总数不超过 SEEDANCE_MAX_REFERENCE_IMAGES
   */
  referenceFrames?: Array<{ url: string; role: VideoReferenceFrameRole }>
}

/** 参考图数量上限（视频任务与扩写视觉上下文共用） */
export const SEEDANCE_MAX_REFERENCE_IMAGES = 8

/**
 * Seedance 1.0 lite-i2v 等对 ratio 限制更严；非 lite 且有参考图时一般用 adaptive。
 */
function resolveRequestRatio(
  model: string,
  userRatio: SeedanceRatio,
  hasReferenceImages: boolean,
): SeedanceRatio {
  const m = model.toLowerCase()
  const isLiteI2v = m.includes('lite') && m.includes('i2v')

  if (isLiteI2v) {
    const ok: SeedanceRatio[] = ['16:9', '9:16', '1:1']
    if (userRatio === 'adaptive' || !ok.includes(userRatio)) {
      return '16:9'
    }
    return userRatio
  }

  if (hasReferenceImages) {
    return 'adaptive'
  }
  return userRatio
}

/** 多关键帧时在正文里追加，利于接口侧衔接（与豆包扩写中的运镜描写互补） */
const SEEDANCE_MULTI_FRAME_TRANSITION_HINT =
  '流畅过渡，画面渐变，自然运镜，关键帧之间光影、色调与主体动作衔接连贯。'

export function withMultiFrameTransitionHint(
  prompt: string,
  referenceImageCount: number,
): string {
  const p = prompt.trim()
  if (referenceImageCount < 2) return p
  if (!p) return SEEDANCE_MULTI_FRAME_TRANSITION_HINT
  if (p.includes('流畅过渡') && p.includes('自然运镜')) return p
  return `${p} ${SEEDANCE_MULTI_FRAME_TRANSITION_HINT}`
}

const AUDIO_TRACK_MARKER = '【音轨】'

/** 把「是否带声音」写进送 Seedance 的正文，与接口 generate_audio 双管齐下 */
export function withVideoAudioPromptHint(
  prompt: string,
  generateAudio: boolean,
): string {
  const p = prompt.trim()
  if (p.includes(AUDIO_TRACK_MARKER)) return p
  const hint = generateAudio
    ? `${AUDIO_TRACK_MARKER}需生成同步音频：环境声与动作音效自然贴切；若有对白或旁白须与画面情绪、节奏一致。`
    : `${AUDIO_TRACK_MARKER}纯静音成片，不要对白、旁白与环境音效，仅画面与氛围。`
  return p ? `${p} ${hint}` : hint
}

function doubaoAudioPreferenceLine(generateAudio: boolean): string {
  return generateAudio
    ? '【本次设置】将生成带同步音频的视频：请在提示词中适当体现环境声、动作音效及对白/旁白氛围（若有），利于音画一致。'
    : '【本次设置】将生成无声视频：提示词只写画面与氛围，不要写对白、旁白或具体音效描写。'
}

function assertVolcanoKey() {
  const k = getVolcanoKey()
  if (!k) throw new Error('未配置 VITE_VOLCANO_KEY，无法调用视频生成')
  return k
}

function assertVolcanoVideoModel(): string {
  const m = getVolcanoVideoModel()
  if (!m) throw new Error('未配置 VITE_VOLCANO_VIDEO_MODEL，无法调用视频生成')
  return m
}

const SEEDANCE_VIDEO_PROMPT_SYSTEM = `你是电影工业级分镜与 AI 视频提示词专家，把用户的简短想法改写成适合文生视频模型（如 Seedance）的高质量中文画面描述。

硬性要求：
- 只输出一段可直接用于视频生成的提示词正文，不要标题、前缀、「提示词：」、引号或 Markdown 代码块。
- 包含：场景与环境、主体与动作、光影与色调、镜头语言（景别与运镜，如推、拉、摇、跟、航拍等）、氛围与情绪；若适合可一句带过环境声或对白氛围。
- 严格基于用户想法扩展，不凭空换成无关题材；语言精炼但信息饱满，总长度约 80～240 字。
- 若用户已经写得很完整，以润色增强电影感为主，保留核心信息与意图。`

const SEEDANCE_VIDEO_PROMPT_SYSTEM_VISION = `你是电影工业级分镜与 AI 视频提示词专家。用户会按顺序提供参考图（通常为视频首帧与尾帧）和一段文字说明。
你必须**仔细观察每张图**中的场景、主体、构图、光线、色调与氛围，将画面信息与用户文字结合，改写成适合 AI 视频模型（如 Seedance）的**一段**高质量中文画面描述。

硬性要求：
- 只输出一段可直接用于视频生成的提示词正文，不要标题、前缀、「提示词：」、引号或 Markdown 代码块。
- 提示词须体现参考图里可见的具体元素、空间关系与情绪，与用户文字一致；不得编造图中明显不存在的核心主体。
- 若有多张图，应体现镜头推进或时间线上的变化感，并自然融入「流畅过渡」「画面渐变」「自然运镜」等衔接语义（可化为具体运镜与光影过渡描写，勿机械堆砌词组）。
- 总长度约 100～280 字；若用户文字已很完整，以统合画面与润色电影感为主。`

function sanitizeExpandedVideoPrompt(raw: string, fallback: string): string {
  let s = raw.trim()
  const fence = s.match(/```(?:[\w-]*)?\s*([\s\S]*?)```/)
  if (fence) s = fence[1].trim()
  s = s.replace(/^(提示词|输出|正文|画面描述)[:：]?\s*/i, '').trim()
  s = s.replace(/^["'「『]|["'」』]$/g, '').trim()
  if (s.length < 10 || s.length > 900) return fallback
  return s
}

/**
 * 用火山方舟对话模型（VITE_VOLCANO_CHAT_MODEL，需支持多模态时传 referenceImageUrls）扩写视频提示词。
 * 有参考图时会把图一并传入，按场景生成；失败时退回原文；仅中止信号抛出 AbortError。
 */
export async function expandVideoPromptWithDoubao(
  userIdea: string,
  options?: {
    signal?: AbortSignal
    /** data URL 或 https，顺序与首帧→尾帧一致，最多取前 SEEDANCE_MAX_REFERENCE_IMAGES 张 */
    referenceImageUrls?: string[]
    /** 与界面「输出声音」一致，写入扩写约束 */
    generateAudio?: boolean
  },
): Promise<string> {
  const t = userIdea.trim()
  const urls = (options?.referenceImageUrls ?? [])
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, SEEDANCE_MAX_REFERENCE_IMAGES)

  if (!t && !urls.length) return ''

  if (!getVolcanoKey().trim() || !getVolcanoChatModel().trim()) return t

  const audioLine =
    options?.generateAudio === undefined
      ? ''
      : `${doubaoAudioPreferenceLine(options.generateAudio)}\n\n`

  const runTextOnly = async () => {
    if (!t) return t
    const out = await volcanoChatComplete(
      [
        { role: 'system', content: SEEDANCE_VIDEO_PROMPT_SYSTEM },
        {
          role: 'user',
          content: `${audioLine}请将下列内容改写为电影级 AI 视频提示词（直接输出正文即可）：\n\n${t}`,
        },
      ],
      { signal: options?.signal, temperature: 0.55, maxTokens: 1024 },
    )
    return sanitizeExpandedVideoPrompt(out, t)
  }

  try {
    if (urls.length) {
      const userParts: VolcanoChatContentPart[] = [
        {
          type: 'text',
          text:
            `${audioLine}以下参考图按顺序对应：首帧（第一张）、尾帧（第二张，若有）。请结合每张图的画面内容与最后一段用户文字，生成电影级 AI 视频提示词正文。`,
        },
      ]
      for (const url of urls) {
        userParts.push({ type: 'image_url', image_url: { url } })
      }
      userParts.push({
        type: 'text',
        text: t
          ? `用户补充说明（可与画面综合理解）：\n${t}`
          : '用户未补充文字，请主要依据参考图生成提示词。',
      })
      try {
        const out = await volcanoChatComplete(
          [
            { role: 'system', content: SEEDANCE_VIDEO_PROMPT_SYSTEM_VISION },
            { role: 'user', content: userParts },
          ],
          { signal: options?.signal, temperature: 0.52, maxTokens: 1280 },
        )
        const cleaned = sanitizeExpandedVideoPrompt(out, t || '参考图场景')
        return cleaned
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') throw e
        if (t) return await runTextOnly()
        return t
      }
    }
    return await runTextOnly()
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    return t
  }
}

export async function createSeedanceVideoTask(
  prompt: string,
  options: SeedanceVideoOptions,
): Promise<string> {
  const key = assertVolcanoKey()
  const model = assertVolcanoVideoModel()
  const text = prompt.trim()
  const content: Array<Record<string, unknown>> = [{ type: 'text', text }]
  const raw = options.referenceFrames?.filter((f) => f.url?.trim()) ?? []
  const firstParts = raw.filter((f) => f.role === 'first_frame')
  const refParts = raw.filter((f) => f.role === 'reference_image')
  const lastParts = raw.filter((f) => f.role === 'last_frame')
  const ordered = [...firstParts, ...refParts, ...lastParts]
  for (const f of ordered) {
    content.push({
      type: 'image_url',
      image_url: { url: f.url.trim() },
      role: f.role,
    })
  }
  const ratio = resolveRequestRatio(model, options.ratio, ordered.length > 0)
  const body: Record<string, unknown> = {
    model,
    content,
    ratio,
    resolution: options.resolution,
    duration: options.duration,
    generate_audio: options.generateAudio,
    /** 部分接入层与示例使用驼峰，与 snake 一并传，避免被忽略 */
    generateAudio: options.generateAudio,
    seed: options.seed,
    watermark: false,
  }
  const r = await fetch(`${VOLCANO_ARK_API}/contents/generations/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })
  const data = (await r.json().catch(() => ({}))) as {
    id?: string
    error?: { message?: string; code?: string }
  }
  if (!r.ok) {
    throw new Error(data?.error?.message || `创建视频任务失败 (${r.status})`)
  }
  const id = data.id?.trim()
  if (!id) throw new Error('创建任务成功但未返回任务 ID')
  return id
}

export type SeedanceTaskStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'expired' | string

export async function getSeedanceVideoTask(taskId: string): Promise<{
  status: SeedanceTaskStatus
  videoUrl?: string
  errorMessage?: string
}> {
  const key = assertVolcanoKey()
  const r = await fetch(`${VOLCANO_ARK_API}/contents/generations/tasks/${encodeURIComponent(taskId)}`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  const data = (await r.json().catch(() => ({}))) as {
    status?: SeedanceTaskStatus
    content?: { video_url?: string }
    error?: { message?: string }
  }
  if (!r.ok) {
    throw new Error(data?.error?.message || `查询任务失败 (${r.status})`)
  }
  return {
    status: data.status || 'unknown',
    videoUrl: data.content?.video_url,
    errorMessage: data.error?.message,
  }
}

const POLL_MS = 8000
const POLL_MAX_MS = 25 * 60 * 1000

async function sleepInterruptible(ms: number, isAborted: () => boolean): Promise<void> {
  const step = 300
  let left = ms
  while (left > 0) {
    if (isAborted()) throw new Error('已停止')
    const chunk = Math.min(step, left)
    await new Promise<void>((r) => window.setTimeout(r, chunk))
    left -= chunk
  }
}

/** 轮询直到成功/失败/超时；isAborted 返回 true 时中止 */
export async function waitSeedanceVideoTask(
  taskId: string,
  isAborted: () => boolean,
): Promise<string> {
  const deadline = Date.now() + POLL_MAX_MS
  while (Date.now() < deadline) {
    if (isAborted()) throw new Error('已停止')
    const { status, videoUrl, errorMessage } = await getSeedanceVideoTask(taskId)
    if (status === 'succeeded') {
      if (!videoUrl) throw new Error('任务成功但未返回视频地址')
      return videoUrl
    }
    if (status === 'failed') {
      throw new Error(errorMessage || '视频生成失败')
    }
    if (status === 'expired') {
      throw new Error('视频生成任务已过期')
    }
    await sleepInterruptible(POLL_MS, isAborted)
  }
  throw new Error('等待视频生成超时，请稍后在火山控制台查看任务状态')
}

import {
  volcanoChatComplete,
  volcanoChatStream,
} from '@/api/agent'
import { getVolcanoImageModel, getVolcanoKey, VOLCANO_ARK_API } from '@/api/volcano'

/** AI 工坊各功能 system 提示；文本走火山方舟 VITE_VOLCANO_CHAT_MODEL（见 volcanoChatComplete） */
const SYSTEM_PROMPTS: Record<string, string> = {
  '1': `请用中文写作。
你是文案创作师。严格按三部分输出，并用小标题或序号标清：
1）标题：2～3 个备选标题
2）正文：篇幅必须遵守下文【文案模式】中的字数区间（这是硬要求）
3）社交版本：适合朋友圈/微博的一小段，可加 emoji`,

  '2': `请用中文进行思考推理。
你是全栈工程师，精通 TS/Vue3/Python/Go/React。输出：1.类型注解 2.关键注释 3.使用说明 4.依赖安装(如果有必要)`,

  '3': `请用中文进行思考推理。
图像分析师。输出：1.场景 2.主体 3.色彩构图 4.文字 5.情感`,

  '7': `请用中文进行思考推理。
精通古典诗词和现代诗的诗人。
输出：1.古典作品 2.现代诗 3.创作说明。禁止内容平淡缺乏意境`,

  '9': `请用中文进行思考推理。
博学多才的大厨，精通中国各菜系和世界美食。
根据菜名给出最正宗的完整食谱。
输出：
## [菅名]
**菜系起源**(1-2句)
**食材清单**(X人份): 主料/辅料/调料
**烹饪步骤**: 1.「备料」 2.「处理」 3.「烹制」 4.「摘盘」
**大厨小贴士**: 火候/技巧/常见失败原因
**难度**:★★★☆☆ | 烹饪时间:XX分钟`,



  '10': `请用中文进行思考推理。
你是一位中西医结合的健康顾问，深厚的中医功底，同时掌握现代医学知识。
分析用户描述的症状或健康问题，以中医为主、西医为辅给出全面分析。
输出格式：
## 症状分析
**中医辨识**：（从气血阴阳、脏腑、内外因等视角分析）
**西医参考**：（对应的现代医学解释）
## 调理建议
**中药调理**：（推荐方副或中成药，说明功效）
**饮食调养**：（宜吃什么、忌吃什么）
**生活起居**：（作息、运动、情绪建议）
**穴位保健**：（可自行按摩的穴位）
## 注意事项
（告知需就医的情况及注意事项）
免责声明：以上建议仅供参考，不可替代专业就医。`,
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface StreamOptions {
  featureId: string
  userInput: string
  onChunk: (text: string) => void
  onDone: () => void
  onError: (err: string) => void
  thinkingMode?: 'fast' | 'balanced' | 'deep'
  onThink?: (text: string) => void
}

export interface GenerateImagesOptions {
  /** 是否添加可见水印；默认 false（无水印） */
  watermark?: boolean
  /** 中止进行中的请求 */
  signal?: AbortSignal
  /**
   * 输出尺寸：像素 `WxH`（如 `1728x2304`）或模型支持的分辨率关键字（如 `2K`）。
   * 不传时默认 `2K`。
   */
  size?: string
  /**
   * 上一格成图 URL，用于图生图/参考延续（火山部分模型支持 `image` 字段）。
   * 与文生图共用同一接口时传入；不支持时接口可能报错，需换支持参考图的模型。
   */
  referenceImageUrl?: string | null
}

/** 非流式对话，用于分镜 JSON 等（火山方舟 chat） */
export async function completeChat(
  systemPrompt: string,
  userContent: string,
  opts?: { max_tokens?: number; temperature?: number; signal?: AbortSignal },
): Promise<string> {
  return volcanoChatComplete(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    {
      maxTokens: opts?.max_tokens ?? 8192,
      temperature: opts?.temperature ?? 0.35,
      signal: opts?.signal,
    },
  )
}

function parseComicScenesJson(raw: string, expected: number): string[] {
  let t = raw.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) t = fence[1].trim()
  let arr: unknown
  try {
    arr = JSON.parse(t)
  } catch {
    throw new Error('分镜解析失败：模型未返回合法 JSON 数组')
  }
  if (!Array.isArray(arr)) {
    throw new Error('分镜解析失败：应为 JSON 数组')
  }
  const scenes = arr
    .map((x) => String(x ?? '').trim())
    .filter(Boolean)
  if (scenes.length < expected) {
    throw new Error(`分镜不足：得到 ${scenes.length} 格，需要 ${expected} 格`)
  }
  return scenes.slice(0, expected)
}

/**
 * 从正文提炼条漫分镜（中文场景描述），条数与 panelCount 一致。
 */
export async function extractComicScenesFromArticle(
  article: string,
  panelCount: number,
  signal?: AbortSignal,
): Promise<string[]> {
  const n = Math.min(Math.max(2, panelCount), 12)
  const system = `漫画分镜。只输出 JSON 数组，长度 ${n}，无 markdown、无解释。
每项一条中文字符串，≥20字，≤130字，含两部分：
画：信息写满——场景、人物外貌与动作表情、道具与环境细节、光影色调，避免空洞词。
对白：只用角色台词，不写旁白。可多人多泡：甲:「……」乙:「……」，台词具体有戏，忌一句带过。
顺叙；第1格交代场景与人物关系。`
  const user = `正文拆 ${n} 格，JSON 数组：\n\n${article.trim()}`
  const raw = await completeChat(system, user, {
    max_tokens: 3072,
    temperature: 0.35,
    signal,
  })
  return parseComicScenesJson(raw, n)
}

export async function generateImages(
  prompt: string,
  n = 1,
  options?: GenerateImagesOptions,
): Promise<string[]> {
  const count = Math.min(Math.max(1, n), 4)
  const sizeOpt = options?.size?.trim()
  const body: Record<string, unknown> = {
    model: getVolcanoImageModel(),
    prompt,
    size: sizeOpt || '2k',
    response_format: 'url',
    watermark: options?.watermark ?? false,
  }
  if (count > 1) body.n = count
  const ref = options?.referenceImageUrl?.trim()
  if (ref) {
    body.image = ref
  }
  const resp = await fetch(`${VOLCANO_ARK_API}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getVolcanoKey()}`,
    },
    body: JSON.stringify(body),
    signal: options?.signal,
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err?.error?.message || `图片生成失败 (${resp.status})`)
  }
  const data = await resp.json()
  const list = (data.data as Array<{ url: string }> | undefined) ?? []
  const urls = list.map((x) => x.url).filter(Boolean)
  return urls.length ? urls : []
}

/** AI 工坊对话：与下拉「快速 / 平衡 / 深度」对应，控制 max_tokens、temperature、top_p */
const WORKSHOP_CHAT_MODE_PARAMS = {
  fast: { maxTokens: 1536, temperature: 0.52, topP: 0.82 },
  balanced: { maxTokens: 4096, temperature: 0.72, topP: 0.92 },
  deep: { maxTokens: 8192, temperature: 0.82, topP: 0.98 },
} as const

const WORKSHOP_MODE_SYSTEM_SUFFIX: Record<
  keyof typeof WORKSHOP_CHAT_MODE_PARAMS,
  string
> = {
  fast:
    '\n\n【模式：快速】务求简短：先结论后要点，少铺垫与重复，总篇幅宜短。',
  balanced:
    '\n\n【模式：平衡】结构清楚、详略得当，篇幅适中，按任务需要展开。',
  deep:
    '\n\n【模式：深度】充分展开：分层论述、举例或分步说明，把用户主题写透，勿因「看起来简单」而缩短输出。',
}

/** 文案创作（feature 1）：三种模式对应不同正文汉字篇幅，避免深度仍只有短文 */
const COPYWRITING_MODE_BLOCK: Record<
  keyof typeof WORKSHOP_CHAT_MODE_PARAMS,
  string
> = {
  fast:
    '\n\n【文案模式：快速】正文约 200～380 字（1～2 段）；标题 2 个；社交版≤45 字。',
  balanced:
    '\n\n【文案模式：平衡】正文须达到 **300～560 字**（2～3 段，有画面与细节）；标题 2～3 个；社交版≤52 字。',
  deep:
    '\n\n【文案模式：深度】正文须 **不少于 580 字，建议 680～1100 字**，至少分 **3～5 段**：写清场景、细节、情绪递进或时间线，禁止寥寥数段敷衍；标题 2～3 个；社交版≤68 字。',
}

export async function streamChat(options: StreamOptions) {
  const { featureId, userInput, thinkingMode = 'fast', onChunk, onThink, onDone, onError } =
    options
  const baseSystem = SYSTEM_PROMPTS[featureId] || '你是一个智能助手。'
  const systemPrompt =
    featureId === '1'
      ? baseSystem + COPYWRITING_MODE_BLOCK[thinkingMode]
      : baseSystem + WORKSHOP_MODE_SYSTEM_SUFFIX[thinkingMode]
  const p = WORKSHOP_CHAT_MODE_PARAMS[thinkingMode]
  const maxTokens =
    featureId === '1' && thinkingMode === 'deep'
      ? Math.max(p.maxTokens, 10240)
      : p.maxTokens

  await volcanoChatStream({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput },
    ],
    maxTokens,
    temperature: p.temperature,
    topP: p.topP,
    onChunk,
    onReasoning: onThink,
    onDone,
    onError,
  })
}

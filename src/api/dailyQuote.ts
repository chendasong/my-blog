import dayjs from 'dayjs'
import { volcanoChatComplete } from '@/api/agent'
import { hasModel, getRuntimeAiModelConfig } from '@/lib/modelConfig'
import { fetchWeatherPreferGps, formatWeatherLine, type WeatherBrief } from '@/api/weather'

const STORAGE_KEY = 'home_daily_quote_v5'

export type DailyQuoteCache = {
  date: string
  text: string
  fromAi?: boolean
  weather?: WeatherBrief | null
}

/** 未配置模型 / AI 失败时的默认语录（按日期轮换） */
const FALLBACK_QUOTES = [
  '慢下来，并不是落后，而是把心安放回自己身上。窗外风声起伏，日子仍旧往前走；你只要把眼前这一杯水喝完，把这一口气呼匀。不必急着证明什么，温柔地对待未完成的事，也温柔地对待还在努力的自己。光会一点点亮起来，你也会。',
  '有些路看起来很长，其实只是今天心里比较累。允许自己停一停，把肩膀松一松，把期待放轻一点。世界不会因为你歇一口气就离开，真正重要的人和事，往往更愿意等你准备好。请记得：休息也是前进的一部分，温柔同样是一种力量。',
  '你已经走得很远了，只是偶尔忘记回头看看自己。把焦虑轻轻放在一边，去做一件小而确定的事：写一行字，泡一杯茶，看一会儿天空。细碎的安稳会慢慢叠成勇气。愿你被理解，也被自己善待；愿今天的你，比昨天多一点点从容。',
]

function todayKey(): string {
  return dayjs().format('YYYY-MM-DD')
}

function pickFallback(): string {
  const i = Math.abs(dayjs().date()) % FALLBACK_QUOTES.length
  return FALLBACK_QUOTES[i]
}

function readCache(): DailyQuoteCache | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<DailyQuoteCache>
    if (typeof parsed.date !== 'string' || typeof parsed.text !== 'string') return null
    const text = parsed.text.trim()
    if (!text) return null
    return {
      date: parsed.date,
      text,
      fromAi: parsed.fromAi !== false,
      weather: parsed.weather ?? null,
    }
  } catch {
    return null
  }
}

function writeCache(entry: DailyQuoteCache): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry))
  } catch {
    /* ignore quota */
  }
}

function isValidTodayCache(cached: DailyQuoteCache | null): cached is DailyQuoteCache {
  return Boolean(cached && cached.date === todayKey() && cached.text.trim().length >= 80)
}

/** 同步读取今日缓存，供首页立刻展示，避免白屏等待 */
export function peekDailyQuoteCache(): DailyQuoteCache | null {
  const cached = readCache()
  return isValidTodayCache(cached) ? cached : null
}

function sanitizeQuote(raw: string): string {
  let t = raw
    .replace(/^["「『“‘]+/, '')
    .replace(/["」』”’]+$/, '')
    .replace(/^语录[：:]\s*/, '')
    .replace(/\s+/g, '')
    .trim()
  if (t.length > 160) {
    const cut = t.slice(0, 150)
    const stop = Math.max(
      cut.lastIndexOf('。'),
      cut.lastIndexOf('！'),
      cut.lastIndexOf('？'),
      cut.lastIndexOf('；'),
    )
    t = stop >= 100 ? cut.slice(0, stop + 1) : `${cut.trim()}…`
  }
  return t
}

async function generateQuote(weather: WeatherBrief | null, place: string): Promise<string> {
  const dateLabel = dayjs().format('YYYY年M月D日')
  const weatherHint = weather
    ? `当地天气：${formatWeatherLine(weather)}（${weather.location || place}）。可自然融入天气氛围，但不要写成天气预报。`
    : `地点参考：${place || '中国'}。`
  const raw = await volcanoChatComplete(
    [
      {
        role: 'system',
        content:
          '你是一位温柔的情感写作者。请用简体中文写一段「每日情感语录」。硬性要求：正文汉字数量必须在 100～150 字之间（含标点也按字符计，目标 120 字左右），温暖、真诚、有画面感，适合个人博客首页；不要标题、不要作者署名、不要引号包裹全文、不要列表或表情符号，只输出语录正文一段。写完请在心里默数，若不足 100 字必须继续补充到达标。',
      },
      {
        role: 'user',
        content: `今天是${dateLabel}。${weatherHint}\n请写一段 100～150 字的今日情感语录。`,
      },
    ],
    { temperature: 0.85, maxTokens: 420 },
  )
  const text = sanitizeQuote(raw)
  if (text.length < 100) throw new Error(`语录过短（${text.length}字）`)
  return text
}

async function refreshWeatherQuietly(place: string, cached: DailyQuoteCache): Promise<void> {
  try {
    const weather = await fetchWeatherPreferGps(place)
    writeCache({ ...cached, weather })
  } catch {
    /* ignore */
  }
}

/**
 * 当天语录只生成一次，写入 localStorage；之后刷新页面直接读缓存。
 * 天气不阻塞语录展示：有缓存时后台刷新天气。
 */
export async function getDailyEmotionalQuote(place: string): Promise<{
  text: string
  fromAi: boolean
  date: string
  weather: WeatherBrief | null
}> {
  const date = todayKey()
  const cached = readCache()

  if (isValidTodayCache(cached)) {
    void refreshWeatherQuietly(place, cached)
    return {
      text: cached.text,
      fromAi: cached.fromAi !== false,
      date,
      weather: cached.weather ?? null,
    }
  }

  const weather = await fetchWeatherPreferGps(place).catch(() => null)
  const cfg = getRuntimeAiModelConfig()

  if (!hasModel(cfg, 'text')) {
    const text = pickFallback()
    writeCache({ date, text, fromAi: false, weather })
    return { text, fromAi: false, date, weather }
  }

  try {
    const text = await generateQuote(weather, place)
    writeCache({ date, text, fromAi: true, weather })
    return { text, fromAi: true, date, weather }
  } catch {
    const text = pickFallback()
    writeCache({ date, text, fromAi: false, weather })
    return { text, fromAi: false, date, weather }
  }
}

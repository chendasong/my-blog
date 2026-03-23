import dayjs from 'dayjs'
import type { Article } from '@/types'

function normalizeTitleForCompare(raw: string): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}

/** 归一化编辑距离比例，1 表示完全相同；用于去掉「标题几乎一样」的重复推荐 */
function titleSimilarityRatio(a: string, b: string): number {
  const A = normalizeTitleForCompare(a)
  const B = normalizeTitleForCompare(b)
  if (!A.length && !B.length) return 1
  if (!A.length || !B.length) return 0
  if (A === B) return 1
  const d = levenshtein(A, B)
  const maxLen = Math.max(A.length, B.length)
  return 1 - d / maxLen
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const row = new Uint16Array(n + 1)
  for (let j = 0; j <= n; j++) row[j] = j
  for (let i = 1; i <= m; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = row[j]
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost)
      prev = tmp
    }
  }
  return row[n]
}

/**
 * 相关文章得分：同分类、标签重合、精选、阅读量、发布时间新鲜度。
 * 仅用于排序，无绝对含义。
 */
function scoreRelated(current: Article, other: Article): number {
  let s = 0
  if (other.category === current.category) s += 48

  const curTags = new Set((current.tags || []).filter(Boolean))
  for (const t of other.tags || []) {
    if (t && curTags.has(t)) s += 20
  }

  if (other.featured) s += 8

  const views = other.views ?? 0
  s += Math.min(22, Math.log1p(views) * 2.2)

  const pub = other.publishedAt || other.updatedAt
  const d = dayjs(pub)
  if (d.isValid()) {
    const days = dayjs().diff(d, 'day')
    if (days >= 0 && days < 400) {
      s += Math.max(0, 16 - days / 28)
    }
  }

  return s
}

/** 与当前篇标题过近则不再推荐（避免同系列多篇占满） */
const SIMILAR_TO_CURRENT_MIN = 0.78

/** 已选列表中若已有标题极似的，跳过（提升多样性） */
const SIMILAR_TO_PICKED_MIN = 0.72

/**
 * 从全站列表中选出与当前文章最相关的若干篇（排除自身）。
 * 按综合得分降序，再贪心去掉标题高度相似的条目，适用于详情页「推荐阅读」。
 */
export function pickRelatedArticles(
  current: Article,
  pool: Article[],
  limit = 6,
): Article[] {
  const cap = Math.max(1, limit)
  const scored = pool
    .filter((a) => a.id !== current.id)
    .map((article) => ({ article, score: scoreRelated(current, article) }))
    .sort((x, y) => y.score - x.score)

  const picked: Article[] = []
  for (const { article } of scored) {
    if (picked.length >= cap) break
    if (titleSimilarityRatio(current.title, article.title) >= SIMILAR_TO_CURRENT_MIN) {
      continue
    }
    if (
      picked.some((p) => titleSimilarityRatio(p.title, article.title) >= SIMILAR_TO_PICKED_MIN)
    ) {
      continue
    }
    picked.push(article)
  }

  return picked
}

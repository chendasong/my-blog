/** Markdown / 富文本 HTML 标题解析为 TOC，与正文内 h1–h3 id 生成规则一致 */

import { isStoredArticleHtml } from '@/lib/articleContent'

export interface KnowledgeTocItem {
  level: number
  text: string
  id: string
}

function slugBase(text: string): string {
  const t = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
  return t.slice(0, 56) || 'section'
}

export function buildTocFromMarkdown(md: string): KnowledgeTocItem[] {
  const used = new Set<string>()
  const out: KnowledgeTocItem[] = []
  for (const line of md.split('\n')) {
    const m = line.match(/^(#{1,3})\s+(.+?)\s*$/)
    if (!m) continue
    const level = m[1].length
    const text = m[2].trim()
    let base = slugBase(text)
    let id = base
    let n = 1
    while (used.has(id)) {
      id = `${base}-${n++}`
    }
    used.add(id)
    out.push({ level, text, id })
  }
  return out
}

/** 从 TipTap 导出的 HTML 中按文档顺序提取 h1–h3 作为大纲 */
export function buildTocFromHtml(html: string): KnowledgeTocItem[] {
  const raw = html?.trim() ?? ''
  if (!raw || typeof DOMParser === 'undefined') return []
  try {
    const doc = new DOMParser().parseFromString(raw, 'text/html')
    const headings = doc.querySelectorAll('h1, h2, h3')
    const used = new Set<string>()
    const out: KnowledgeTocItem[] = []
    headings.forEach((el) => {
      const tag = el.tagName.toLowerCase()
      const level = tag === 'h1' ? 1 : tag === 'h2' ? 2 : 3
      const text = el.textContent?.trim() || ''
      let base = slugBase(text)
      let id = base
      let n = 1
      while (used.has(id)) {
        id = `${base}-${n++}`
      }
      used.add(id)
      out.push({ level, text, id })
    })
    return out
  } catch {
    return []
  }
}

/** 正文为 Markdown 或富文本 HTML 时统一生成 TOC */
export function buildTocFromArticleBody(content: string): KnowledgeTocItem[] {
  if (!content?.trim()) return []
  if (isStoredArticleHtml(content)) return buildTocFromHtml(content)
  return buildTocFromMarkdown(content)
}

/** 将 TOC 中的 id 按顺序赋给容器内 h1–h3（与 marked 输出顺序一致） */
export function applyHeadingIdsFromToc(container: HTMLElement | null, toc: KnowledgeTocItem[]) {
  if (!container) return
  const headings = container.querySelectorAll<HTMLElement>('h1, h2, h3')
  toc.forEach((item, i) => {
    const el = headings[i]
    if (el) el.id = item.id
  })
}

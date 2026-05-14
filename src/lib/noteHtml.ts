import type { Config } from 'dompurify'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { isStoredArticleHtml } from '@/lib/articleContent'

/** 详情页：与 DOMPurify 白名单（含 TipTap 任务列表 data-* / checkbox） */
const VIEW_SANITIZE: Config = {
  ADD_ATTR: ['target', 'rel', 'class', 'data-type', 'data-checked', 'type', 'checked'],
  ADD_TAGS: ['input'],
}

/** 编辑页加载：已是富文本 HTML 则原样给 TipTap；否则按 Markdown 转成 HTML */
export function noteContentToEditorHtml(raw: string): string {
  const s = raw ?? ''
  if (!s.trim()) return ''
  if (isStoredArticleHtml(s)) return s
  return marked.parse(s, { async: false }) as string
}

/** 详情页任务列表：禁用勾选并从 Tab 序移除（仅对 label 设 pointer-events 仍会触发 label 的默认行为） */
function applyReadOnlyTaskList(html: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return html
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    doc.querySelectorAll('ul[data-type="taskList"] input[type="checkbox"]').forEach((el) => {
      el.setAttribute('disabled', '')
      el.setAttribute('tabindex', '-1')
      el.setAttribute('aria-disabled', 'true')
    })
    return doc.body.innerHTML
  } catch {
    return html
  }
}

/** 详情页：HTML 或 Markdown 均转为可安全 v-html 的字符串 */
export function noteContentToSafeHtmlForView(raw: string): string {
  const s = raw ?? ''
  if (!s.trim()) return ''
  const body = isStoredArticleHtml(s) ? s : (marked.parse(s, { async: false }) as string)
  const safe = String(DOMPurify.sanitize(body, VIEW_SANITIZE))
  return applyReadOnlyTaskList(safe)
}

/** 列表卡片摘要：去掉标签与多余空白 */
export function notePlainTextPreview(raw: string, maxLen: number): string {
  const text = (raw ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*`\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= maxLen) return text
  return `${text.slice(0, maxLen)}…`
}

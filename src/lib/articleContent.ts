/** 判断正文是否为富文本 HTML（TipTap 等保存的片段），用于与旧 Markdown 区分 */
export function isStoredArticleHtml(content: string): boolean {
  const t = content.trim()
  if (!t) return false
  return /^<(p|h[1-6]|blockquote|ul|ol|pre|div|hr)\b/i.test(t)
}

/** 富文本是否无实质正文（空段落、仅 br/nbsp 等） */
export function isRichTextEmpty(html: string): boolean {
  if (!html?.trim()) return true
  const text = html
    .replace(/<br\s*\/?>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u200b/g, '')
    .trim()
  return !text
}

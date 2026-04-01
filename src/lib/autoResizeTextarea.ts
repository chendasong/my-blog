/**
 * 将 textarea 高度设为内容高度，不低于 minPx。
 * maxPx 为有限数时不超过 maxPx，超出部分出现纵向滚动；为 Infinity 时随内容增高、不出现内部滚动条。
 */
export function syncTextareaHeight(
  el: HTMLTextAreaElement | null,
  minPx: number,
  maxPx: number = Number.POSITIVE_INFINITY
) {
  if (!el) return
  const finiteMax = Number.isFinite(maxPx)
  if (!el.value) {
    el.style.overflowY = 'hidden'
    el.style.height = `${minPx}px`
    return
  }
  el.style.height = 'auto'
  const natural = el.scrollHeight
  const h = finiteMax ? Math.min(Math.max(natural, minPx), maxPx) : Math.max(natural, minPx)
  el.style.height = `${h}px`
  el.style.overflowY = finiteMax && natural > maxPx ? 'auto' : 'hidden'
}

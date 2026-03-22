/** 将 textarea 高度设为内容高度，夹在 minPx ~ maxPx 之间；无内容时固定为单行 min，避免占位/scrollHeight 抖动与内部滚动条 */
export function syncTextareaHeight(
  el: HTMLTextAreaElement | null,
  minPx: number,
  maxPx: number
) {
  if (!el) return
  el.style.overflowY = 'hidden'
  if (!el.value) {
    el.style.height = `${minPx}px`
    return
  }
  el.style.height = 'auto'
  const h = Math.min(Math.max(el.scrollHeight, minPx), maxPx)
  el.style.height = `${h}px`
}

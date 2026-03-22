/**
 * 悬浮按钮松手贴边：仅在 mouseup 且发生过拖动时由调用方调用。
 * 水平方向：按按钮中心落在左/右半屏，贴到左缘或右缘（始终贴左右边之一）。
 * 垂直方向：不强制顶/底，只在可视区内留白夹紧，避免拖出屏外。
 */
export function snapFabToEdges(
  x: number,
  y: number,
  fabSize: number,
  vw: number,
  vh: number,
  margin = 12
): { x: number; y: number } {
  const centerX = x + fabSize / 2
  const nx = centerX <= vw / 2 ? margin : vw - fabSize - margin
  const ny = Math.max(margin, Math.min(y, vh - fabSize - margin))
  return { x: nx, y: ny }
}

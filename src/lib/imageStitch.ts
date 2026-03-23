/**
 * 将多张远程图片纵向拼接为一张 PNG。
 * 拉图逻辑见 fetchRemoteImageBlob（直连 + /api/image-proxy 回退）。
 */

import { fetchRemoteImageBlob } from '@/lib/fetchRemoteImageBlob'

const MAX_CANVAS_W = 4096
const MAX_CANVAS_H = 12000
const MAX_CANVAS_PIXELS = 72_000_000

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  const obj = URL.createObjectURL(blob)
  return new Promise((resolve, reject) => {
    const im = new Image()
    im.onload = () => {
      URL.revokeObjectURL(obj)
      resolve(im)
    }
    im.onerror = () => {
      URL.revokeObjectURL(obj)
      reject(new Error('图片解码失败'))
    }
    im.src = obj
  })
}

/**
 * 将多张远程图片纵向拼接为一张 PNG（经 fetch→blob，避免 canvas 跨域污染）。
 */
export async function stitchImagesVertically(
  urls: string[],
  opts?: { gap?: number; background?: string },
): Promise<Blob> {
  if (!urls.length) throw new Error('没有可拼接的图片')
  const gap = opts?.gap ?? 10
  const bg = opts?.background ?? '#ffffff'

  const images: HTMLImageElement[] = []
  for (const u of urls) {
    const blob = await fetchRemoteImageBlob(u)
    const img = await loadImageFromBlob(blob)
    if (!img.naturalWidth || !img.naturalHeight) {
      throw new Error('某张图片尺寸无效')
    }
    images.push(img)
  }

  let targetW = Math.max(...images.map((im) => im.naturalWidth), 1)
  let scaledHeights = images.map((im) =>
    Math.max(1, Math.round((im.naturalHeight * targetW) / im.naturalWidth)),
  )
  let totalH = scaledHeights.reduce((acc, h) => acc + h + gap, 0) - gap

  const scale = Math.min(
    1,
    MAX_CANVAS_W / targetW,
    MAX_CANVAS_H / totalH,
    Math.sqrt(MAX_CANVAS_PIXELS / Math.max(1, targetW * totalH)),
  )
  if (scale < 1) {
    targetW = Math.max(1, Math.floor(targetW * scale))
    scaledHeights = images.map((im) =>
      Math.max(1, Math.round((im.naturalHeight * targetW) / im.naturalWidth)),
    )
    totalH = scaledHeights.reduce((acc, h) => acc + h + gap, 0) - gap
  }

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = totalH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  let y = 0
  for (let i = 0; i < images.length; i++) {
    const h = scaledHeights[i]
    ctx.drawImage(images[i], 0, y, targetW, h)
    y += h + gap
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b)
        else {
          reject(
            new Error(
              '导出 PNG 失败（画布可能过大，已自动缩小后仍失败请减少格数）',
            ),
          )
        }
      },
      'image/png',
    )
  })
}

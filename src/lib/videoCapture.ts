/** 从本地视频文件截取一帧为 JPEG Blob，用于记忆列表封面（不上传整段视频到列表） */
export function captureVideoFrameAsJpegBlob(
  file: File,
  seekSec = 0.12,
  maxWidth = 720,
  quality = 0.82,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    video.src = objectUrl

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl)
      video.removeAttribute('src')
      video.load()
    }

    const fail = (msg: string) => {
      cleanup()
      reject(new Error(msg))
    }

    video.onerror = () => fail('视频无法解码')

    video.onloadedmetadata = () => {
      const dur = Number.isFinite(video.duration) ? video.duration : 0
      const t =
        dur > 0.2
          ? Math.min(Math.max(seekSec, 0.05), dur - 0.05)
          : Math.max(seekSec, 0.05)
      try {
        video.currentTime = t
      } catch {
        fail('无法定位视频帧')
      }
    }

    video.onseeked = () => {
      try {
        const vw = video.videoWidth
        const vh = video.videoHeight
        if (!vw || !vh) {
          fail('无效视频尺寸')
          return
        }
        let tw = vw
        let th = vh
        if (vw > maxWidth) {
          tw = maxWidth
          th = Math.round((vh * maxWidth) / vw)
        }
        const canvas = document.createElement('canvas')
        canvas.width = tw
        canvas.height = th
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          fail('Canvas 不可用')
          return
        }
        ctx.drawImage(video, 0, 0, tw, th)
        canvas.toBlob(
          (blob) => {
            cleanup()
            if (blob) resolve(blob)
            else fail('导出图片失败')
          },
          'image/jpeg',
          quality,
        )
      } catch (e) {
        fail(e instanceof Error ? e.message : '截帧失败')
      }
    }
  })
}

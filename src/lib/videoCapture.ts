/**
 * 从本地视频文件截取一帧为 JPEG Blob（情侣记忆上传封面等）。
 *
 * 为何不用 FFmpeg.wasm：
 * - 浏览器内嵌 FFmpeg 需加载数十 MB WASM，冷启动慢、内存大，移动端极易 OOM 或更不稳定。
 * - 本方案用原生 <video> + Canvas，体量小；通过挂 DOM、preload、尺寸重试等缓解 iOS/WebKit 差异。
 *
 * 七牛：Kodo 直传对象存储不会在「上传完成」时自动生成封面图；需自行上传封面，
 * 或使用七牛「视频截帧」等数据处理（vframe / 工作流）对**已上传**的 URL 再处理（另配管道与计费）。
 */
const CAPTURE_TIMEOUT_MS = 28_000

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
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    /** 仅 metadata 在部分手机上不足以解码出 seek 后的帧 */
    video.preload = 'auto'
    video.src = objectUrl

    /** iOS/Safari 等对未插入文档的 video 解码不完整，易出现 videoWidth=0 或黑帧 */
    Object.assign(video.style, {
      position: 'fixed',
      left: '-9999px',
      top: '0',
      width: '1px',
      height: '1px',
      opacity: '0',
      pointerEvents: 'none',
    })
    document.body.appendChild(video)

    let finished = false
    const timeoutId = window.setTimeout(() => {
      if (finished) return
      finished = true
      teardown()
      reject(new Error('截帧超时，请换较短视频或 MP4(H.264) 格式重试'))
    }, CAPTURE_TIMEOUT_MS)

    const teardown = () => {
      clearTimeout(timeoutId)
      try {
        video.pause()
        video.removeAttribute('src')
        video.load()
      } catch {
        /* noop */
      }
      if (video.parentNode) {
        video.parentNode.removeChild(video)
      }
      URL.revokeObjectURL(objectUrl)
    }

    const fail = (msg: string) => {
      if (finished) return
      finished = true
      teardown()
      reject(new Error(msg))
    }

    const succeed = (blob: Blob) => {
      if (finished) return
      finished = true
      clearTimeout(timeoutId)
      teardown()
      resolve(blob)
    }

    function drawToJpeg(vw: number, vh: number) {
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
      try {
        ctx.drawImage(video, 0, 0, tw, th)
      } catch (e) {
        fail(e instanceof Error ? e.message : '截帧失败')
        return
      }
      canvas.toBlob(
        (blob) => {
          if (blob) succeed(blob)
          else fail('导出图片失败')
        },
        'image/jpeg',
        quality,
      )
    }

    /** seek 后偶现首帧尚未提交到解码输出，双 rAF 再读尺寸 */
    function drawWhenReady() {
      const tryOnce = () => {
        const vw = video.videoWidth
        const vh = video.videoHeight
        if (vw && vh) {
          drawToJpeg(vw, vh)
          return true
        }
        return false
      }
      if (tryOnce()) return
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (tryOnce()) return
          fail('无效视频尺寸（可尝试 H.264 MP4 或稍短视频）')
        })
      })
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
        drawWhenReady()
      } catch (e) {
        fail(e instanceof Error ? e.message : '截帧失败')
      }
    }
  })
}

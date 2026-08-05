/**
 * 浏览器端打包下载。
 * 用户生成完应用后可一键导出 zip 到本地离线开发；不依赖服务端存储完整工程。
 */
import { zipSync, strToU8 } from 'fflate'
import type { AppGenFileMap } from './types'

/**
 * 将内存中的 AppGenFileMap 打成 zip 并触发下载。
 * @param files 相对路径 → 文件正文（与 WebContainer 挂载、文件树同一套 key）
 * @param zipName 下载文件名，默认 ai-app.zip；无 .zip 后缀时自动补上
 */
export function downloadAppZip(files: AppGenFileMap, zipName = 'ai-app.zip') {
  const entries: Record<string, Uint8Array> = {}
  for (const [path, content] of Object.entries(files)) {
    entries[path.replace(/^\/+/, '')] = strToU8(content)
  }
  const zipped = zipSync(entries, { level: 6 })
  const blob = new Blob([zipped.buffer.slice(zipped.byteOffset, zipped.byteOffset + zipped.byteLength) as ArrayBuffer], {
    type: 'application/zip',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = zipName.endsWith('.zip') ? zipName : `${zipName}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

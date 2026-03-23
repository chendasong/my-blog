/**
 * 浏览器拉远程图为 Blob：先直连，失败再走同源 /api/image-proxy。
 * 与文章保存时服务端转存思路一致（绕开源站无 CORS），供下载、canvas 等复用。
 */

export function buildImageProxyUrl(remoteUrl: string): string {
  const q = encodeURIComponent(remoteUrl)
  const base = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(
    /\/$/,
    '',
  )
  if (base) return `${base}/api/image-proxy?url=${q}`
  return `/api/image-proxy?url=${q}`
}

export async function fetchRemoteImageBlob(remoteUrl: string): Promise<Blob> {
  const direct = async () => {
    const res = await fetch(remoteUrl, { mode: 'cors' })
    if (!res.ok) throw new Error(`直连 HTTP ${res.status}`)
    return res.blob()
  }
  const viaProxy = async () => {
    const res = await fetch(buildImageProxyUrl(remoteUrl), { mode: 'cors' })
    if (!res.ok) {
      let detail = ''
      try {
        const j = (await res.json()) as { error?: string }
        detail = typeof j?.error === 'string' ? j.error : JSON.stringify(j)
      } catch {
        detail = await res.text().catch(() => '')
      }
      throw new Error(detail || `代理 HTTP ${res.status}`)
    }
    return res.blob()
  }
  try {
    return await direct()
  } catch {
    return viaProxy()
  }
}

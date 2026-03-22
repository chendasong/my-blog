import { supabase } from '@/lib/supabase'

export function isQiniuConfigured(): boolean {
  return !!(import.meta.env.VITE_QINIU_PUBLIC_BASE as string | undefined)?.trim()
}

function apiBase(): string {
  return (import.meta.env.VITE_API_BASE as string | undefined)?.trim() ?? ''
}

export async function fetchQiniuUploadToken(): Promise<{ token: string; publicBase: string }> {
  const headers: Record<string, string> = {}
  const secret = (import.meta.env.VITE_QINIU_ADMIN_SECRET as string | undefined)?.trim()
  if (secret) headers['x-qiniu-admin-secret'] = secret

  const r = await fetch(`${apiBase()}/api/qiniu-upload-token`, { headers })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(t || `upload token ${r.status}`)
  }
  return r.json() as Promise<{ token: string; publicBase: string }>
}

async function uploadViaSupabase(file: File, keyHint: string): Promise<string> {
  const ext = file.name.split('.').pop()
  const safe = keyHint.replace(/[/\\]/g, '-')
  const fileName = `${safe}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('images').upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from('images').getPublicUrl(fileName)
  return data.publicUrl
}

/** 直传七牛（需部署 /api 并配置环境变量）；失败时可回退 Supabase */
export async function uploadFileToQiniu(file: File, keyPrefix: string): Promise<string> {
  const clientPublic = (import.meta.env.VITE_QINIU_PUBLIC_BASE as string | undefined)?.trim()?.replace(/\/$/, '')
  if (!clientPublic) throw new Error('VITE_QINIU_PUBLIC_BASE missing')

  const { token, publicBase } = await fetchQiniuUploadToken()
  const base = (publicBase || clientPublic).replace(/\/$/, '')

  const rawExt = file.name.split('.').pop() || 'bin'
  const ext = rawExt.replace(/[^a-zA-Z0-9]/g, '') || 'bin'
  const safePrefix = keyPrefix.replace(/^\/+|\/+$/g, '')
  const key = `${safePrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const form = new FormData()
  form.append('token', token)
  form.append('key', key)
  form.append('file', file)

  const up = await fetch('https://upload.qiniup.com', { method: 'POST', body: form })
  if (!up.ok) {
    const t = await up.text()
    throw new Error(t || 'qiniu upload failed')
  }
  const body = (await up.json()) as { key?: string }
  const finalKey = body.key || key
  return `${base}/${finalKey}`
}

export async function uploadImageSmart(file: File, keyPrefix = 'articles'): Promise<string> {
  if (!isQiniuConfigured()) {
    return uploadViaSupabase(file, keyPrefix)
  }
  try {
    return await uploadFileToQiniu(file, keyPrefix)
  } catch (e) {
    console.warn('[storage] Qiniu upload failed, fallback Supabase', e)
    return uploadViaSupabase(file, keyPrefix)
  }
}

export function urlHostedOnConfiguredQiniu(fileUrl: string): boolean {
  const base = (import.meta.env.VITE_QINIU_PUBLIC_BASE as string | undefined)?.trim()?.replace(/\/$/, '')
  if (!base) return false
  try {
    return new URL(fileUrl).origin === new URL(base).origin
  } catch {
    return false
  }
}

/** 是否为本站上传到七牛或 Supabase `images` 桶的 URL（避免误删正文里的外链图） */
export function isHostedStorageAssetUrl(url: string): boolean {
  const u = url?.trim()
  if (!u || !/^https?:\/\//i.test(u)) return false
  if (urlHostedOnConfiguredQiniu(u)) return true
  try {
    return new URL(u).pathname.includes('/storage/v1/object/public/images/')
  } catch {
    return false
  }
}

/** 从 Markdown/HTML 正文中提取图片 URL（仅用于删除文章时清理对象存储） */
export function extractImageUrlsFromArticleContent(md: string): string[] {
  if (!md) return []
  const out = new Set<string>()
  const mdImg = /!\[[^\]]*\]\((https?:[^)\s]+)\)/gi
  let m: RegExpExecArray | null
  while ((m = mdImg.exec(md)) !== null) {
    out.add(m[1].trim())
  }
  const htmlImg = /<img[^>]+src=["'](https?:[^"']+)["']/gi
  while ((m = htmlImg.exec(md)) !== null) {
    out.add(m[1].trim())
  }
  return [...out]
}

/** 删除七牛对象或（旧数据）Supabase Storage 文件 */
export async function deleteRemoteStorageFile(fileUrl: string): Promise<void> {
  if (urlHostedOnConfiguredQiniu(fileUrl)) {
    const secret = (import.meta.env.VITE_QINIU_ADMIN_SECRET as string | undefined)?.trim()
    if (!secret) {
      console.warn('[storage] VITE_QINIU_ADMIN_SECRET 未配置，无法调用删除接口')
      return
    }
    const r = await fetch(`${apiBase()}/api/qiniu-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-qiniu-admin-secret': secret,
      },
      body: JSON.stringify({ url: fileUrl }),
    })
    if (!r.ok) {
      const t = await r.text()
      console.error('[storage] qiniu delete failed', t)
    }
    return
  }

  try {
    const url = new URL(fileUrl)
    const pathname = url.pathname
    let filePath = ''
    if (pathname.includes('/storage/v1/object/public/images/')) {
      filePath = pathname.split('/storage/v1/object/public/images/')[1]
    } else if (pathname.includes('/images/')) {
      filePath = pathname.split('/images/')[1]
    }
    if (filePath) {
      const { error } = await supabase.storage.from('images').remove([filePath])
      if (error) console.error('删除文件失败:', error)
    } else {
      console.warn('无法从 URL 提取 Supabase 路径:', fileUrl)
    }
  } catch (err) {
    console.error('删除文件出错:', err)
  }
}

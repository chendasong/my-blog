import { supabase } from '@/lib/supabase'

/** 绑定域名漏写协议时，拼接出的地址会被浏览器当成相对路径；默认补 https://（与常见 CDN/HTTPS 绑定一致） */
function normalizeQiniuPublicBase(raw: string | undefined | null): string {
  const s = String(raw ?? '').trim().replace(/\/$/, '')
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s.replace(/^\/+/, '')}`
}

/**
 * 展示用：把「无协议」的七牛/CDN 串补成绝对地址（默认 https，避免旧逻辑误补 http://）。
 * 站内路径（以 / 开头）、data:/blob: 原样返回；已带 http(s):// 的整串原样返回（与库内一致）。
 */
export function ensureHttpUrlForAssets(url: string | undefined | null): string {
  const u = String(url ?? '').trim()
  if (!u) return ''
  if (u.startsWith('/') || u.startsWith('data:') || u.startsWith('blob:')) return u
  if (/^https?:\/\//i.test(u)) return u
  return `https://${u.replace(/^\/+/, '')}`
}

export function isQiniuConfigured(): boolean {
  return !!(import.meta.env.VITE_QINIU_PUBLIC_BASE as string | undefined)?.trim()
}

function apiBase(): string {
  return (import.meta.env.VITE_API_BASE as string | undefined)?.trim() ?? ''
}

/** 比真实过期略短，避免时钟偏差与边界时刻上传失败 */
const QINIU_TOKEN_SKEW_SEC = 120
const QINIU_TOKEN_DEFAULT_EXPIRES_SEC = 7200

type QiniuTokenCache = { token: string; publicBase: string; expiresAtMs: number }

let qiniuTokenCache: QiniuTokenCache | null = null
let qiniuTokenInflight: Promise<QiniuTokenCache> | null = null

export function invalidateQiniuUploadTokenCache(): void {
  qiniuTokenCache = null
}

async function fetchQiniuUploadTokenFromApi(): Promise<QiniuTokenCache> {
  const headers: Record<string, string> = {}
  const secret = (import.meta.env.VITE_QINIU_ADMIN_SECRET as string | undefined)?.trim()
  if (secret) headers['x-qiniu-admin-secret'] = secret

  const url = `${apiBase()}/api/qiniu-upload-token`
  const r = await fetch(url, { headers })
  const text = await r.text()
  if (!r.ok) {
    let detail = text?.slice(0, 200) || ''
    try {
      const j = JSON.parse(text) as { error?: string }
      if (j?.error) detail = j.error
    } catch {
      /* 可能是 HTML 404 等 */
    }
    if (detail.includes('<!DOCTYPE') || detail.includes('<html'))
      detail =
        '接口返回了网页而非 JSON（本地请确认 npm run dev 已重启，且勿把 VITE_API_BASE 指到无 /api 的地址）'
    throw new Error(
      r.status === 503 && detail.includes('qiniu_not_configured')
        ? '七牛未配置：请在 .env 中填写 QINIU_ACCESS_KEY / QINIU_SECRET_KEY / QINIU_BUCKET / QINIU_PUBLIC_BASE 后重启 dev'
        : detail || `获取上传凭证失败 (${r.status})`,
    )
  }
  let parsed: { token: string; publicBase: string; expiresIn?: number }
  try {
    parsed = JSON.parse(text) as { token: string; publicBase: string; expiresIn?: number }
  } catch {
    throw new Error('上传凭证接口返回非 JSON，请检查 /api/qiniu-upload-token 是否可访问')
  }
  const expiresIn =
    typeof parsed.expiresIn === 'number' && parsed.expiresIn > 60
      ? parsed.expiresIn
      : QINIU_TOKEN_DEFAULT_EXPIRES_SEC
  const ttlSec = Math.max(60, expiresIn - QINIU_TOKEN_SKEW_SEC)
  return {
    token: parsed.token,
    publicBase: parsed.publicBase,
    expiresAtMs: Date.now() + ttlSec * 1000,
  }
}

/**
 * 获取七牛上传凭证；在有效期内复用内存缓存，多文件连续上传只打一次 `/api/qiniu-upload-token`。
 * 服务端当前策略为 2h 有效，缓存会提前约 2 分钟失效。
 */
export async function fetchQiniuUploadToken(): Promise<{ token: string; publicBase: string }> {
  const now = Date.now()
  if (qiniuTokenCache && now < qiniuTokenCache.expiresAtMs) {
    return { token: qiniuTokenCache.token, publicBase: qiniuTokenCache.publicBase }
  }
  if (!qiniuTokenInflight) {
    qiniuTokenInflight = fetchQiniuUploadTokenFromApi()
      .then((c) => {
        qiniuTokenCache = c
        return c
      })
      .finally(() => {
        qiniuTokenInflight = null
      })
  }
  const c = await qiniuTokenInflight
  return { token: c.token, publicBase: c.publicBase }
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

/** 直传七牛（需部署 /api 并配置环境变量） */
export async function uploadFileToQiniu(file: File, keyPrefix: string): Promise<string> {
  const clientPublic = normalizeQiniuPublicBase(import.meta.env.VITE_QINIU_PUBLIC_BASE as string | undefined)
  if (!clientPublic) throw new Error('VITE_QINIU_PUBLIC_BASE missing')

  const { token, publicBase } = await fetchQiniuUploadToken()
  const base = normalizeQiniuPublicBase(publicBase || clientPublic)

  const rawExt = file.name.split('.').pop() || 'bin'
  const ext = rawExt.replace(/[^a-zA-Z0-9]/g, '') || 'bin'
  const safePrefix = keyPrefix.replace(/^\/+|\/+$/g, '')
  const key = `${safePrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const form = new FormData()
  form.append('token', token)
  form.append('key', key)
  form.append('file', file)

  let up = await fetch('https://upload.qiniup.com', { method: 'POST', body: form })
  if (!up.ok) {
    const t = await up.text()
    // 凭证过期或无效时七牛常返回 401，清缓存后重试一次（会重新拉 token）
    if (up.status === 401) {
      invalidateQiniuUploadTokenCache()
      const again = await fetchQiniuUploadToken()
      const base2 = normalizeQiniuPublicBase(again.publicBase || clientPublic)
      const form2 = new FormData()
      form2.append('token', again.token)
      form2.append('key', key)
      form2.append('file', file)
      up = await fetch('https://upload.qiniup.com', { method: 'POST', body: form2 })
      if (!up.ok) throw new Error((await up.text()) || 'qiniu upload failed')
      const body2 = (await up.json()) as { key?: string }
      const finalKey2 = body2.key || key
      return `${base2}/${finalKey2}`
    }
    throw new Error(t || 'qiniu upload failed')
  }
  const body = (await up.json()) as { key?: string }
  const finalKey = body.key || key
  return `${base}/${finalKey}`
}

/**
 * 统一上传入口：已配置 `VITE_QINIU_PUBLIC_BASE` 时**只走七牛**（含音乐、封面、记忆图等），不再回退 Supabase。
 * 未配置七牛时（仅本地/无对象存储）才使用 Supabase `images` 桶。
 */
export async function uploadImageSmart(file: File, keyPrefix = 'articles'): Promise<string> {
  if (!isQiniuConfigured()) {
    return uploadViaSupabase(file, keyPrefix)
  }
  return uploadFileToQiniu(file, keyPrefix)
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

function extFromImageMime(mime: string): string | undefined {
  const m = mime?.split(';')[0]?.trim().toLowerCase()
  return m ? MIME_TO_EXT[m] : undefined
}

/**
 * 服务端拉取外链并写入七牛（同源 `/api/qiniu-fetch-upload`），绕过浏览器对图源的 CORS。
 * 需配置 `QINIU_ADMIN_SECRET`（服务端）与 `VITE_QINIU_ADMIN_SECRET`（前端请求头），且已配置七牛 bucket。
 */
export async function uploadRemoteImageViaServerApi(
  sourceUrl: string,
  keyPrefix = 'ai-generated',
): Promise<string> {
  const secret = (import.meta.env.VITE_QINIU_ADMIN_SECRET as string | undefined)?.trim()
  if (!secret) throw new Error('未配置 VITE_QINIU_ADMIN_SECRET，无法服务端转存')

  /** 与拉 token 一致：未配 VITE_API_BASE 时用同源相对路径（本地 dev / Vercel 同域） */
  const apiRoot = apiBase().replace(/\/$/, '')
  const endpoint = `${apiRoot}/api/qiniu-fetch-upload`

  const r = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-qiniu-admin-secret': secret,
    },
    body: JSON.stringify({
      sourceUrl: String(sourceUrl ?? '').trim(),
      keyPrefix,
    }),
  })
  const data = (await r.json().catch(() => ({}))) as { url?: string; error?: string }
  if (!r.ok) {
    const err = data.error || r.statusText || '转存失败'
    throw new Error(typeof err === 'string' ? err : '转存失败')
  }
  const out = data.url
  if (!out) throw new Error('转存返回缺少 url')
  return out
}

/**
 * 将外链图片拉取后上传到本站配置的存储（七牛优先，否则 Supabase `images`）。
 * 已是本站七牛或 Supabase 公链的 URL 会直接返回，不重复上传。
 * 若已配七牛与 `VITE_QINIU_ADMIN_SECRET`，会优先走服务端拉取再上传，避免图源无 CORS 时失败。
 */
export async function mirrorRemoteImageToHostingIfNeeded(
  rawUrl: string,
  keyPrefix = 'articles/covers',
): Promise<string> {
  const url = String(rawUrl ?? '').trim()
  if (!url || !/^https?:\/\//i.test(url)) return url
  if (isHostedStorageAssetUrl(url)) return url

  const secret = (import.meta.env.VITE_QINIU_ADMIN_SECRET as string | undefined)?.trim()
  if (secret && isQiniuConfigured()) {
    return await uploadRemoteImageViaServerApi(url, keyPrefix)
  }

  const res = await fetch(url, { mode: 'cors', credentials: 'omit' })
  if (!res.ok) throw new Error(`图片拉取失败（${res.status}）`)
  const blob = await res.blob()
  if (!blob.size) throw new Error('图片拉取结果为空')
  const ext = extFromImageMime(blob.type) || 'png'
  const file = new File([blob], `cover-${Date.now()}.${ext}`, {
    type: blob.type || 'image/png',
  })
  return uploadImageSmart(file, keyPrefix)
}

export function urlHostedOnConfiguredQiniu(fileUrl: string): boolean {
  const base = normalizeQiniuPublicBase(import.meta.env.VITE_QINIU_PUBLIC_BASE as string | undefined)
  if (!base) return false
  try {
    const u = new URL(fileUrl)
    const b = new URL(base)
    return u.hostname.toLowerCase() === b.hostname.toLowerCase()
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

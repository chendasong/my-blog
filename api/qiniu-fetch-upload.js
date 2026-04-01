import { createRequire } from 'module'
import { Readable } from 'stream'
import { randomBytes } from 'crypto'

const require = createRequire(import.meta.url)
const qiniu = require('qiniu')

const MAX_BYTES = 15 * 1024 * 1024
const FETCH_TIMEOUT_MS = 60000

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'x-qiniu-admin-secret, Content-Type')
}

function normalizePublicBase(raw) {
  const s = String(raw || '')
    .trim()
    .replace(/\/$/, '')
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s.replace(/^\/+/, '')}`
}

function resolveZone(q, name) {
  const map = {
    z0: q.zone.Zone_z0,
    z1: q.zone.Zone_z1,
    z2: q.zone.Zone_z2,
    na0: q.zone.Zone_na0,
    as0: q.zone.Zone_as0,
  }
  return map[name] || q.zone.Zone_z0
}

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

function extFromMime(mime) {
  const m = String(mime || '')
    .split(';')[0]
    .trim()
    .toLowerCase()
  return MIME_TO_EXT[m] || ''
}

function extFromUrlPath(u) {
  try {
    const p = new URL(u).pathname.toLowerCase()
    const m = p.match(/\.(jpe?g|png|webp|gif|avif)(?:\?|$)/)
    return m ? (m[1] === 'jpeg' ? 'jpg' : m[1]) : ''
  } catch {
    return ''
  }
}

/** 豆包/部分 CDN 返回非 image/* 或空 Content-Type，用魔数判定 */
function sniffImageFromBuffer(buf) {
  if (!buf || buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' }
  }
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { mime: 'image/png', ext: 'png' }
  }
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return { mime: 'image/gif', ext: 'gif' }
  }
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp' }
  }
  return null
}

function sanitizeKeyPrefix(raw) {
  const s = String(raw || 'ai-generated')
    .trim()
    .replace(/[^a-zA-Z0-9/_-]/g, '')
    .replace(/^\/+|\/+$/g, '')
  return s || 'ai-generated'
}

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const adminSecret = process.env.QINIU_ADMIN_SECRET
  if (!adminSecret) {
    return res.status(503).json({ error: 'mirror_disabled_set_QINIU_ADMIN_SECRET' })
  }
  if (req.headers['x-qiniu-admin-secret'] !== adminSecret) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }
  if (!body || typeof body !== 'object') body = {}

  const sourceUrl = String(body.sourceUrl || '').trim()
  if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) {
    return res.status(400).json({ error: 'invalid_or_missing_sourceUrl' })
  }

  const accessKey = process.env.QINIU_ACCESS_KEY
  const secretKey = process.env.QINIU_SECRET_KEY
  const bucket = process.env.QINIU_BUCKET
  const publicBaseRaw = normalizePublicBase(process.env.QINIU_PUBLIC_BASE || '')
  if (!accessKey || !secretKey || !bucket || !publicBaseRaw) {
    return res.status(503).json({ error: 'qiniu_not_configured' })
  }

  let buffer
  let contentType = 'application/octet-stream'
  try {
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
    const r = await fetch(sourceUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: ac.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; chends-qiniu-mirror/1.0; +https://github.com)',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    })
    clearTimeout(t)
    if (!r.ok) {
      return res.status(502).json({ error: `source_fetch_failed_${r.status}` })
    }
    const ctHeader = (r.headers.get('content-type') || '')
      .split(';')[0]
      .trim()
      .toLowerCase()
    const ab = await r.arrayBuffer()
    buffer = Buffer.from(ab)

    if (ctHeader.startsWith('image/')) {
      contentType = ctHeader
    } else {
      const sniffed = sniffImageFromBuffer(buffer)
      if (sniffed) {
        contentType = sniffed.mime
      } else if (
        ctHeader === 'application/octet-stream' ||
        ctHeader === 'binary/octet-stream' ||
        ctHeader === ''
      ) {
        contentType = 'application/octet-stream'
      } else {
        return res.status(400).json({
          error: `unsupported_content_type:${ctHeader || 'empty'}`,
        })
      }
    }
  } catch (e) {
    const msg = e?.name === 'AbortError' ? 'source_fetch_timeout' : String(e?.message || e)
    console.error('[qiniu-fetch-upload] fetch', e)
    return res.status(502).json({ error: msg })
  }

  if (!buffer.length) {
    return res.status(400).json({ error: 'empty_body' })
  }
  if (buffer.length > MAX_BYTES) {
    return res.status(413).json({ error: 'image_too_large' })
  }

  let ext = extFromMime(contentType)
  if (!ext) ext = extFromUrlPath(sourceUrl)
  if (!ext) ext = 'png'

  const keyPrefix = sanitizeKeyPrefix(body.keyPrefix)
  const key = `${keyPrefix}/ai-${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`

  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
  const putPolicy = new qiniu.rs.PutPolicy({
    scope: bucket,
    expires: 3600,
  })
  const uploadToken = putPolicy.uploadToken(mac)

  const config = new qiniu.conf.Config()
  config.zone = resolveZone(qiniu, process.env.QINIU_ZONE || 'z0')
  const formUploader = new qiniu.form_up.FormUploader(config)
  const putExtra = new qiniu.form_up.PutExtra()
  putExtra.mimeType = contentType.startsWith('image/') ? contentType : `image/${ext}`

  const stream = Readable.from(buffer)

  try {
    await new Promise((resolve, reject) => {
      formUploader.putStream(uploadToken, key, stream, putExtra, (err, _body, respInfo) => {
        if (err) return reject(err)
        const code = respInfo.statusCode
        if (code === 200) resolve(null)
        else reject(new Error(`qiniu upload ${code} ${JSON.stringify(_body)}`))
      })
    })
  } catch (e) {
    console.error('[qiniu-fetch-upload] put', e)
    return res.status(500).json({ error: String(e?.message || e) })
  }

  const publicUrl = `${publicBaseRaw.replace(/\/$/, '')}/${key}`
  return res.status(200).json({ url: publicUrl, key })
}

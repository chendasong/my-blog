import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const qiniu = require('qiniu')

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

function keyFromPublicUrl(fileUrl, publicBase) {
  const base = publicBase.replace(/\/$/, '')
  const u = new URL(fileUrl)
  const b = new URL(base)
  // 与 origin 严格相等会误判：库里可能是 http://，环境变量常为 https://
  if (u.hostname.toLowerCase() !== b.hostname.toLowerCase()) return null
  const k = u.pathname.replace(/^\//, '')
  return decodeURIComponent(k) || null
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
    return res.status(503).json({ error: 'delete_disabled_set_QINIU_ADMIN_SECRET' })
  }
  if (req.headers['x-qiniu-admin-secret'] !== adminSecret) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const publicBase = normalizePublicBase(process.env.QINIU_PUBLIC_BASE || '')

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }
  if (!body || typeof body !== 'object') body = {}

  let key = body.key
  const url = body.url
  if (!key && url) {
    try {
      key = keyFromPublicUrl(url, publicBase)
    } catch {
      key = null
    }
  }
  if (!key) {
    return res.status(400).json({ error: 'missing_key_or_url' })
  }

  const accessKey = process.env.QINIU_ACCESS_KEY
  const secretKey = process.env.QINIU_SECRET_KEY
  const bucket = process.env.QINIU_BUCKET
  if (!accessKey || !secretKey || !bucket) {
    return res.status(503).json({ error: 'qiniu_not_configured' })
  }

  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
  const config = new qiniu.conf.Config()
  config.zone = resolveZone(qiniu, process.env.QINIU_ZONE || 'z0')
  const bucketManager = new qiniu.rs.BucketManager(mac, config)

  try {
    await new Promise((resolve, reject) => {
      bucketManager.delete(bucket, key, (err, _respBody, respInfo) => {
        if (err) return reject(err)
        const code = respInfo.statusCode
        if (code === 200 || code === 612) resolve(null)
        else reject(new Error(`qiniu delete ${code}`))
      })
    })
    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('[qiniu-delete]', e)
    return res.status(500).json({ error: String(e?.message || e) })
  }
}

import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const qiniu = require('qiniu')

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'x-qiniu-admin-secret, Content-Type')
}

/** 无协议时浏览器会把最终 URL 当相对路径；默认 https（CDN 常见）；纯 HTTP 请写完整 http:// */
function normalizePublicBase(raw) {
  const s = String(raw || '')
    .trim()
    .replace(/\/$/, '')
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s.replace(/^\/+/, '')}`
}

export default function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const adminSecret = process.env.QINIU_ADMIN_SECRET
  if (adminSecret) {
    const h = req.headers['x-qiniu-admin-secret']
    if (h !== adminSecret) {
      return res.status(401).json({ error: 'unauthorized' })
    }
  }

  const accessKey = process.env.QINIU_ACCESS_KEY
  const secretKey = process.env.QINIU_SECRET_KEY
  const bucket = process.env.QINIU_BUCKET
  const publicBase = normalizePublicBase(process.env.QINIU_PUBLIC_BASE || '')

  if (!accessKey || !secretKey || !bucket || !publicBase) {
    return res.status(503).json({ error: 'qiniu_not_configured' })
  }

  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
  /** 与前端缓存一致：PutPolicy.expires 为秒，七牛 token 在该时长内有效 */
  const expiresInSeconds = 7200
  const putPolicy = new qiniu.rs.PutPolicy({
    scope: bucket,
    expires: expiresInSeconds,
  })
  const uploadToken = putPolicy.uploadToken(mac)

  return res.status(200).json({
    token: uploadToken,
    publicBase,
    bucket,
    expiresIn: expiresInSeconds,
  })
}

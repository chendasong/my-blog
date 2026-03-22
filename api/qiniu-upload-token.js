import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const qiniu = require('qiniu')

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'x-qiniu-admin-secret, Content-Type')
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
  const publicBase = (process.env.QINIU_PUBLIC_BASE || '').replace(/\/$/, '')

  if (!accessKey || !secretKey || !bucket || !publicBase) {
    return res.status(503).json({ error: 'qiniu_not_configured' })
  }

  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
  const putPolicy = new qiniu.rs.PutPolicy({
    scope: bucket,
    expires: 7200,
  })
  const uploadToken = putPolicy.uploadToken(mac)

  return res.status(200).json({
    token: uploadToken,
    publicBase,
    bucket,
  })
}

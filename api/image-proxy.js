/**
 * 服务端拉取远程图片并回传，供前端 canvas 拼接（绕过部分 CDN 无 CORS 的问题）。
 * GET /api/image-proxy?url=https%3A%2F%2F...
 * 仅允许常见图床/云厂商域名，降低 SSRF 风险。
 */

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function isAllowedHost(hostname) {
  if (!hostname || typeof hostname !== 'string') return false
  const h = String(hostname).toLowerCase()
  if (h === 'localhost' || h.endsWith('.localhost')) return true
  const suffixes = [
    '.volces.com',
    '.volcengine.com',
    '.byteimg.com',
    '.bytecdn.cn',
    '.qiniucdn.com',
    '.clouddn.com',
    '.qnssl.com',
    '.myqcloud.com',
    '.aliyuncs.com',
    '.cloudfront.net',
    '.amazonaws.com',
  ]
  return suffixes.some((s) => h.endsWith(s))
}

const MAX_BYTES = 25 * 1024 * 1024
const FETCH_TIMEOUT_MS = 45000

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    return res.end()
  }
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.end(JSON.stringify({ error: 'method_not_allowed' }))
  }

  let targetUrl
  try {
    const rawUrl = new URL(req.url || '', 'http://internal')
    const param = rawUrl.searchParams.get('url')
    if (!param) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      return res.end(JSON.stringify({ error: 'missing_url' }))
    }
    targetUrl = new URL(param)
  } catch {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.end(JSON.stringify({ error: 'invalid_url' }))
  }

  if (targetUrl.protocol !== 'https:' && targetUrl.protocol !== 'http:') {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.end(JSON.stringify({ error: 'bad_protocol' }))
  }

  if (!isAllowedHost(targetUrl.hostname)) {
    res.statusCode = 403
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.end(JSON.stringify({ error: 'host_not_allowed' }))
  }

  try {
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
    const r = await fetch(targetUrl.href, {
      method: 'GET',
      redirect: 'follow',
      signal: ac.signal,
      headers: {
        'User-Agent': 'chends-image-proxy/1.0',
        Accept: 'image/*,*/*;q=0.5',
      },
    })
    clearTimeout(timer)

    if (!r.ok) {
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      return res.end(JSON.stringify({ error: `upstream_${r.status}` }))
    }

    const ab = await r.arrayBuffer()
    const buffer = Buffer.from(ab)
    if (!buffer.length) {
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      return res.end(JSON.stringify({ error: 'empty_body' }))
    }
    if (buffer.length > MAX_BYTES) {
      res.statusCode = 413
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      return res.end(JSON.stringify({ error: 'too_large' }))
    }

    let ct = (r.headers.get('content-type') || 'image/png').split(';')[0].trim()
    if (!ct.startsWith('image/') && ct !== 'application/octet-stream') {
      ct = 'image/png'
    }

    res.statusCode = 200
    res.setHeader('Content-Type', ct)
    res.setHeader('Cache-Control', 'private, max-age=120')
    return res.end(buffer)
  } catch (e) {
    const msg =
      e?.name === 'AbortError' ? 'fetch_timeout' : String(e?.message || e)
    console.error('[image-proxy]', msg)
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.end(JSON.stringify({ error: msg }))
  }
}

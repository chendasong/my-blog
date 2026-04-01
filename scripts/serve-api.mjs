/**
 * 生产环境自建服务器（仅部署了 `dist/` 静态资源时）用本脚本提供 `/api/*`，与本地 Vite 插件行为一致。
 *
 * 用法：
 *   在项目根目录放置与本地一致的 `.env`（含 QINIU_*、QINIU_ADMIN_SECRET）
 *   node scripts/serve-api.mjs
 *   默认监听 127.0.0.1:8787（可用环境变量 PORT / API_HOST 修改）
 *
 * Nginx 示例：
 *   location /api/ {
 *     proxy_pass http://127.0.0.1:8787;
 *     proxy_http_version 1.1;
 *     proxy_set_header Host $host;
 *     proxy_set_header X-Real-IP $remote_addr;
 *     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
 *     proxy_set_header X-Forwarded-Proto $scheme;
 *     client_max_body_size 50m;
 *   }
 */

import http from 'node:http'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import dotenv from 'dotenv'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: join(root, '.env') })
dotenv.config({ path: join(root, '.env.local') })

function patchVercelRes(res) {
  Object.assign(res, {
    status(code) {
      res.statusCode = code
      return {
        json(obj) {
          if (res.writableEnded) return
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(obj))
        },
        end(s) {
          if (res.writableEnded) return
          res.end(s)
        },
      }
    },
  })
  return res
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJsonError(res, e) {
  if (res.writableEnded) return
  res.statusCode = 500
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify({ error: String(e?.message || e) }))
}

const routes = {
  '/api/qiniu-upload-token': 'qiniu-upload-token.js',
  '/api/qiniu-delete': 'qiniu-delete.js',
  '/api/qiniu-fetch-upload': 'qiniu-fetch-upload.js',
  '/api/image-proxy': 'image-proxy.js',
}

const server = http.createServer(async (req, res) => {
  let pathname
  try {
    pathname = new URL(req.url || '/', 'http://127.0.0.1').pathname
    if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1)
  } catch {
    res.statusCode = 400
    res.end('Bad Request')
    return
  }

  const file = routes[pathname]
  if (!file) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'not_found' }))
    return
  }

  const nodeRes = res
  const patched = patchVercelRes(nodeRes)

  try {
    const href = pathToFileURL(join(root, 'api', file)).href
    const mod = await import(href)
    const handler = mod.default

    if (file === 'qiniu-delete.js' || file === 'qiniu-fetch-upload.js') {
      if (req.method === 'POST') {
        const raw = await readBody(req)
        req.body = raw
      }
    }

    await handler(req, patched)
  } catch (e) {
    console.error('[serve-api]', pathname, e)
    sendJsonError(nodeRes, e)
  }
})

const port = Number(process.env.PORT || process.env.API_PORT || 8787)
const host = process.env.API_HOST || '127.0.0.1'

server.listen(port, host, () => {
  console.log(`[serve-api] http://${host}:${port}  (Qiniu /api/*)`)
})

import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import dotenv from 'dotenv'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * 本地 `npm run dev` 时 Vite 不会跑 `api/*.js`；且 Vercel 的 handler 使用 res.status().json()，
 * 需补一层与原生 ServerResponse 的兼容。
 *
 * 必须用 `middlewares.use('/api/...', fn)` 精确挂载：若写成 `use(async (req,res,next) => …)`
 * 且手写 pathname 判断，在 Connect 下请求可能仍落到后面的 transformMiddleware，
 * 把 `api/qiniu-upload-token.js` 当模块返回（Content-Type 像 JS/HTML、体积很大），上传就会失败。
 */
function loadDotenv(root: string) {
  dotenv.config({ path: resolve(root, '.env') })
  dotenv.config({ path: resolve(root, '.env.local') })
}

function patchVercelRes(res: ServerResponse): ServerResponse {
  Object.assign(res, {
    status(code: number) {
      res.statusCode = code
      return {
        json(obj: unknown) {
          if (res.writableEnded) return
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(obj))
        },
        end(s?: string | Buffer) {
          if (res.writableEnded) return
          res.end(s)
        },
      }
    },
  })
  return res
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolveBody, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(c as Buffer))
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJsonError(res: ServerResponse, e: unknown) {
  if (res.writableEnded) return
  res.statusCode = 500
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify({ error: String((e as Error)?.message || e) }))
}

export function localVercelApiPlugin(root: string): Plugin {
  return {
    name: 'local-vercel-api',
    enforce: 'pre',
    configureServer(server) {
      loadDotenv(root)

      const tokenHref = pathToFileURL(join(root, 'api', 'qiniu-upload-token.js')).href
      const deleteHref = pathToFileURL(join(root, 'api', 'qiniu-delete.js')).href
      const fetchUploadHref = pathToFileURL(join(root, 'api', 'qiniu-fetch-upload.js')).href

      server.middlewares.use('/api/qiniu-upload-token', (req, res, _next) => {
        const nodeRes = res as unknown as ServerResponse
        const patched = patchVercelRes(nodeRes)
        import(/* @vite-ignore */ tokenHref)
          .then((mod) => {
            mod.default(req as IncomingMessage, patched)
          })
          .catch((e) => {
            console.error('[local-vercel-api] qiniu-upload-token', e)
            sendJsonError(nodeRes, e)
          })
      })

      server.middlewares.use('/api/qiniu-delete', (req, res, _next) => {
        const nodeRes = res as unknown as ServerResponse
        const patched = patchVercelRes(nodeRes)
        void (async () => {
          try {
            if (req.method === 'POST') {
              const raw = await readBody(req as IncomingMessage)
              ;(req as IncomingMessage & { body?: string }).body = raw
            }
            const mod = await import(/* @vite-ignore */ deleteHref)
            await mod.default(req as IncomingMessage, patched)
          } catch (e) {
            console.error('[local-vercel-api] qiniu-delete', e)
            sendJsonError(nodeRes, e)
          }
        })()
      })

      server.middlewares.use('/api/qiniu-fetch-upload', (req, res, _next) => {
        const nodeRes = res as unknown as ServerResponse
        const patched = patchVercelRes(nodeRes)
        void (async () => {
          try {
            if (req.method === 'POST') {
              const raw = await readBody(req as IncomingMessage)
              ;(req as IncomingMessage & { body?: string }).body = raw
            }
            const mod = await import(/* @vite-ignore */ fetchUploadHref)
            await mod.default(req as IncomingMessage, patched)
          } catch (e) {
            console.error('[local-vercel-api] qiniu-fetch-upload', e)
            sendJsonError(nodeRes, e)
          }
        })()
      })
    },
  }
}

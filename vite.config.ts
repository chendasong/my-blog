import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { localVercelApiPlugin } from './vite/localVercelApiPlugin'

/**
 * Vite 默认只把 `VITE_` 注入 `import.meta.env`。
 * 七牛在 .env 里常与 API 共用 `QINIU_PUBLIC_BASE` / `QINIU_ADMIN_SECRET`（无 VITE_ 前缀），
 * 这里合并进前端可读变量，避免「只配了 QINIU_* 导致前端认为未配置七牛」。
 */
function pickEnv(
  env: Record<string, string>,
  keys: string[],
): string {
  for (const k of keys) {
    const v = env[k] ?? process.env[k]
    if (v !== undefined && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

export default defineConfig(({ mode }) => {
  const root = __dirname
  const env = loadEnv(mode, root, '')

  const qiniuPublic = pickEnv(env, [
    'VITE_QINIU_PUBLIC_BASE',
    'QINIU_PUBLIC_BASE',
  ]).replace(/\/$/, '')
  const qiniuAdminSecret = pickEnv(env, [
    'VITE_QINIU_ADMIN_SECRET',
    'QINIU_ADMIN_SECRET',
  ])
  const apiBase = pickEnv(env, ['VITE_API_BASE', 'API_BASE'])

  return {
    plugins: [localVercelApiPlugin(__dirname), vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
      open: false,
    },
    define: {
      'import.meta.env.VITE_QINIU_PUBLIC_BASE': JSON.stringify(qiniuPublic),
      'import.meta.env.VITE_QINIU_ADMIN_SECRET': JSON.stringify(qiniuAdminSecret),
      'import.meta.env.VITE_API_BASE': JSON.stringify(apiBase),
    },
  }
})

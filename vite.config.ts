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

/** Rollup manualChunks：按依赖拆包，利于长期缓存与并行加载（顺序：先匹配子路径再匹配父包名） */
function manualChunks(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined
  const m = id.replace(/\\/g, '/')

  if (m.includes('@vueuse')) return 'vueuse'
  if (m.includes('vue-router')) return 'vue-router'
  if (m.includes('/pinia/')) return 'pinia'
  if (m.includes('@supabase')) return 'supabase'
  if (m.includes('marked')) return 'marked'
  if (m.includes('highlight.js')) return 'highlight'
  if (m.includes('/axios/')) return 'axios'
  if (m.includes('/dayjs/')) return 'dayjs'
  if (m.includes('/qiniu/')) return 'qiniu'
  if (m.includes('jsonrepair')) return 'jsonrepair'
  if (m.includes('bcryptjs')) return 'bcrypt'
  if (m.includes('@vue/')) return 'vue-ecosystem'
  /** 与 @vue/* 同包，避免单独 `vue` chunk 在合并后为空 */
  if (m.includes('node_modules/vue/')) return 'vue-ecosystem'

  return 'vendor'
}

export default defineConfig(({ mode, command }) => {
  const root = __dirname
  const env = loadEnv(mode, root, '')
  const isProd = mode === 'production'
  const isBuild = command === 'build'

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
    /**
     * 不在 dist 里生成 .gz / .br：避免「同一份 JS 占三份磁盘」；Vercel/CDN 会对传输内容动态压缩。
     * 若自建 Nginx 且需 gzip_static，可再接入 vite-plugin-compression（通常只保留 gzip 即可）。
     */
    plugins: [localVercelApiPlugin(__dirname), vue()],
    /**
     * JS：生产用 **Terser** 做最终压缩（Vite 仅支持 esbuild | terser，不能接 uglify-js；
     * Terser 为 Uglify 系继任者，对 ES 模块/现代语法完整支持，体积通常小于纯 esbuild）。
     * CSS：在 postcss.config.js 中用 cssnano，此处 cssMinify: false 避免重复。
     */
    build: {
      target: 'es2020',
      minify: isBuild ? 'terser' : false,
      cssMinify: false,
      sourcemap: false,
      chunkSizeWarningLimit: 900,
      terserOptions: isBuild
        ? {
          compress: {
            drop_console: isProd,
            drop_debugger: true,
            passes: 2,
            ecma: 2020,
            module: true,
          },
          mangle: {
            safari10: true,
          },
          format: {
            comments: false,
            ecma: 2020,
          },
        }
        : undefined,
      rollupOptions: {
        output: {
          manualChunks,
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash][extname]',
        },
      },
    },
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

/**
 * LLM 输出解析与规范化。
 * 模型常返回 Markdown 包裹、缺逗号或字段名不一致的 JSON；本模块把「脏文本」变成
 * 可运行的 AppGenPlan 与 AppGenFileMap，供 scaffold 打底与后续增量生成/合并使用。
 */
import { jsonrepair } from 'jsonrepair'
import type { AppGenFileMap, AppGenPlan, AppGenRoutePlan } from './types'

/**
 * 从模型原始回复中提取 JSON 对象。
 * 策略：整段 parse → 代码块内 parse → 首尾大括号切片 → jsonrepair 兜底。
 * 业务上允许模型在 JSON 前后加说明文字，只要内含合法对象即可进入后续 normalize。
 */
export function extractJsonObject(raw: string): unknown {
  const text = raw.trim()
  const tryParse = (s: string) => JSON.parse(s) as unknown

  try {
    return tryParse(text)
  } catch {
    /* continue */
  }

  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence?.[1]) {
    const inner = fence[1].trim()
    try {
      return tryParse(inner)
    } catch {
      try {
        return tryParse(jsonrepair(inner))
      } catch {
        /* continue */
      }
    }
  }

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) {
    const slice = text.slice(start, end + 1)
    try {
      return tryParse(slice)
    } catch {
      return tryParse(jsonrepair(slice))
    }
  }

  return tryParse(jsonrepair(text))
}

/**
 * 把 LLM 规划 JSON 规范为 AppGenPlan。
 * - 兼容 appName/name、appTitle/title 等别名，避免 prompt 微调导致解析失败
 * - 路由缺省时补 HomeView，且强制存在 path: '/'（Web 应用必须有可访问首页）
 * - routes/components 各截断至 6 条，控制生成规模与 WebContainer 预览成本
 */
export function normalizePlan(input: unknown): AppGenPlan {
  const obj = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const appName = String(obj.appName || obj.name || 'my-app').trim() || 'my-app'
  const appTitle = String(obj.appTitle || obj.title || appName).trim() || appName
  const description = String(obj.description || '').trim()

  const routesRaw = Array.isArray(obj.routes) ? obj.routes : []
  const routes: AppGenRoutePlan[] = routesRaw
    .map((r, i) => {
      const row = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>
      const path = String(row.path || '/').trim() || '/'
      const name = String(row.name || `Page${i + 1}`).trim()
      let viewFile = String(row.viewFile || row.file || `${name}View.vue`).trim()
      if (!viewFile.endsWith('.vue')) viewFile += '.vue'
      // 只保留文件名，防止模型写绝对路径或 src/views/ 前缀与 scaffold 重复拼接
      viewFile = viewFile.replace(/^.*[\\/]/, '')
      return {
        path: path.startsWith('/') ? path : `/${path}`,
        name,
        viewFile,
        description: String(row.description || '').trim(),
      }
    })
    .filter((r) => r.viewFile)

  if (!routes.length) {
    routes.push({
      path: '/',
      name: 'Home',
      viewFile: 'HomeView.vue',
      description: description || '首页',
    })
  }

  // 无根路由时插入首页，保证导航与 RouterLink 始终有可跳转入口
  if (!routes.some((r) => r.path === '/')) {
    routes.unshift({
      path: '/',
      name: 'Home',
      viewFile: 'HomeView.vue',
      description: '首页',
    })
  }

  const components = Array.isArray(obj.components)
    ? obj.components
        .map((c) => String(c || '').trim())
        .filter(Boolean)
        .map((c) => (c.endsWith('.vue') ? c.replace(/^.*[\\/]/, '') : `${c.replace(/^.*[\\/]/, '')}.vue`))
    : []

  return {
    appName,
    appTitle,
    description,
    routes: routes.slice(0, 6),
    components: components.slice(0, 6),
    notes: typeof obj.notes === 'string' ? obj.notes : undefined,
  }
}

/**
 * 把 LLM 返回的文件列表转为 path → content 映射。
 * 支持两种常见形态：顶层即 files，或 { files: { "src/App.vue": "..." } }；
 * 值可以是字符串，或 { content: string } 对象（部分模型习惯这种结构）。
 */
export function normalizeGeneratedFiles(input: unknown): AppGenFileMap {
  const out: AppGenFileMap = {}
  if (!input || typeof input !== 'object') return out

  const obj = input as Record<string, unknown>
  const filesNode = obj.files && typeof obj.files === 'object' ? (obj.files as Record<string, unknown>) : obj

  for (const [rawPath, value] of Object.entries(filesNode)) {
    const path = normalizeFilePath(rawPath)
    if (!path) continue
    if (typeof value === 'string') {
      out[path] = value
      continue
    }
    if (value && typeof value === 'object' && 'content' in (value as object)) {
      out[path] = String((value as { content?: unknown }).content ?? '')
    }
  }
  return out
}

/**
 * 统一相对路径并拒绝越界路径。
 * 白名单：src/**、根级工程文件；模型若只给 HomeView.vue 等短名，按 View/Page 后缀
 * 推断放入 src/views 或 src/components，与 createVueViteScaffold 目录约定对齐。
 */
export function normalizeFilePath(raw: string): string | null {
  let p = raw.trim().replace(/\\/g, '/')
  if (!p || p.includes('..')) return null
  p = p.replace(/^\.\//, '')
  if (p.startsWith('/')) p = p.slice(1)
  if (
    !(
      p.startsWith('src/') ||
      p === 'index.html' ||
      p === 'package.json' ||
      p === 'vite.config.ts' ||
      p === 'tsconfig.json' ||
      p === 'tsconfig.node.json' ||
      p === 'README.md'
    )
  ) {
    if (p.endsWith('.vue') && !p.includes('/')) {
      if (/View\.vue$/i.test(p) || /Page\.vue$/i.test(p)) p = `src/views/${p}`
      else p = `src/components/${p}`
    } else if (p.startsWith('views/')) {
      p = `src/${p}`
    } else if (p.startsWith('components/')) {
      p = `src/${p}`
    } else {
      return null
    }
  }
  return p
}

/** 增量合并：patch 覆盖 base 同路径文件，用于「脚手架 + LLM 补页」或「编辑后局部更新」 */
export function mergeFiles(base: AppGenFileMap, patch: AppGenFileMap): AppGenFileMap {
  return { ...base, ...patch }
}

/** 路径字典序排序，供文件树与代码面板稳定展示顺序 */
export function listSortedPaths(files: AppGenFileMap): string[] {
  return Object.keys(files).sort((a, b) => a.localeCompare(b))
}

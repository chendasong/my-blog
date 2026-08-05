import { assertAiModelReady } from '@/api/volcano'
import { createVueViteScaffold } from './scaffold'
import {
  extractJsonObject,
  mergeFiles,
  normalizeGeneratedFiles,
  normalizePlan,
} from './parse'
import { streamChatText, throwIfAborted } from './stream'
import type { AppGenFileMap, AppGenPlan, AppGenProgressEvent } from './types'

/**
 * 首次生成流水线：流式规划应用结构 → 写入固定脚手架 → 分批流式生成页面与组件。
 */

export type RunAppGenOptions = {
  requirement: string
  signal?: AbortSignal
  onEvent?: (ev: AppGenProgressEvent) => void
}

function emit(onEvent: RunAppGenOptions['onEvent'], ev: AppGenProgressEvent) {
  onEvent?.(ev)
}

function newAssistantId() {
  return `asst-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

async function streamStep(
  options: RunAppGenOptions,
  args: {
    title: string
    fallbackThinking: string
    messages: Parameters<typeof streamChatText>[0]
    temperature?: number
    maxTokens?: number
  },
): Promise<string> {
  const { onEvent, signal } = options
  throwIfAborted(signal)
  const id = newAssistantId()
  emit(onEvent, { type: 'assistant-start', id, title: args.title })
  emit(onEvent, { type: 'thinking-delta', id, text: args.fallbackThinking })

  try {
    const { content, reasoning } = await streamChatText(args.messages, {
      signal,
      temperature: args.temperature,
      maxTokens: args.maxTokens,
      onReasoning: (delta) => emit(onEvent, { type: 'thinking-delta', id, text: delta }),
      onContent: (delta) => emit(onEvent, { type: 'content-delta', id, text: delta }),
    })
    if (!reasoning.trim()) {
      // 模型未单独返回思考时，保留阶段提示即可
    }
    emit(onEvent, { type: 'assistant-end', id })
    throwIfAborted(signal)
    return content
  } catch (e) {
    emit(onEvent, { type: 'assistant-end', id })
    throw e
  }
}

/** 第一步：根据用户需求产出路由、页面、组件清单（JSON） */
async function planApp(options: RunAppGenOptions): Promise<AppGenPlan> {
  const raw = await streamStep(options, {
    title: '规划应用结构',
    fallbackThinking:
      '先理解需求边界，再拆路由与组件，确保输出可运行的 Vue3 + Vite + TS 工程结构…\n',
    messages: [
      {
        role: 'system',
        content: `你是资深 Vue 架构师。根据用户需求规划一个「完整可运行」的 Vue 3 + Vite + TypeScript + Vue Router 单页应用。
只输出 JSON（不要 Markdown 解释），结构：
{
  "appName": "英文短名-kebab",
  "appTitle": "中文标题",
  "description": "一句话简介",
  "routes": [
    { "path": "/", "name": "Home", "viewFile": "HomeView.vue", "description": "页面职责" }
  ],
  "components": ["FeatureCard.vue"],
  "notes": "实现要点"
}
约束：
- routes 2～5 个，必须含 path="/"
- viewFile 仅文件名且以 View.vue 结尾
- components 0～4 个，仅 .vue 文件名
- 适合前端展示/工具/落地页，不要后端与数据库`,
      },
      { role: 'user', content: options.requirement },
    ],
    temperature: 0.4,
    maxTokens: 2500,
  })
  return normalizePlan(extractJsonObject(raw))
}

/** 按 targets 列表流式生成一批文件的完整源码 */
async function generateBatchFiles(
  options: RunAppGenOptions,
  plan: AppGenPlan,
  targets: string[],
  batchIndex: number,
  batchTotal: number,
): Promise<AppGenFileMap> {
  const raw = await streamStep(options, {
    title: `生成代码 (${batchIndex}/${batchTotal})`,
    fallbackThinking: `正在为 ${targets.join('、')} 编写完整源码，保证可编译可运行…\n`,
    messages: [
      {
        role: 'system',
        content: `你是 Vue 3 高级工程师。请为给定文件生成完整可运行源码。
只输出 JSON：{ "files": { "相对路径": "完整文件内容字符串" } }
要求：
- 使用 <script setup lang="ts">
- 可用项目已有样式类：card / grid / grid-2 / btn / muted
- 不要写后端请求；可用本地 ref/computed 做交互演示
- 路由页面要有实质 UI，不要空壳
- 路径必须是下列之一：${targets.join(', ')}
- 每个文件内容必须完整，禁止省略号截断`,
      },
      {
        role: 'user',
        content: JSON.stringify(
          {
            requirement: options.requirement,
            appTitle: plan.appTitle,
            description: plan.description,
            routes: plan.routes,
            components: plan.components || [],
            generateFiles: targets,
          },
          null,
          2,
        ),
      },
    ],
    temperature: 0.35,
    maxTokens: 12000,
  })
  return normalizeGeneratedFiles(extractJsonObject(raw))
}

/**
 * 流式规划 → 脚手架 → 分批流式生成业务文件（可中断）
 */
export async function runAppGenPipeline(options: RunAppGenOptions): Promise<{
  plan: AppGenPlan
  files: AppGenFileMap
}> {
  const { requirement, signal, onEvent } = options
  assertAiModelReady('text')
  options.requirement = requirement.trim()

  emit(onEvent, { type: 'status', status: 'planning' })
  emit(onEvent, { type: 'step', message: '开始分析需求并规划应用…' })

  const plan = await planApp(options)
  emit(onEvent, { type: 'plan', plan })
  emit(onEvent, {
    type: 'step',
    message: `规划完成：${plan.appTitle}（${plan.routes.length} 个页面）`,
  })

  emit(onEvent, { type: 'status', status: 'generating' })
  let files = createVueViteScaffold(plan)
  emit(onEvent, { type: 'files', files })
  emit(onEvent, { type: 'step', message: '已创建 Vue3 + Vite + TS + Router 脚手架' })

  const viewTargets = plan.routes.map((r) => `src/views/${r.viewFile}`)
  const compTargets = (plan.components || []).map((c) =>
    c.startsWith('src/') ? c : `src/components/${c.endsWith('.vue') ? c : `${c}.vue`}`,
  )

  /** 页面每批 2 个，组件一批，App.vue 单独一批，平衡质量与上下文长度 */
  const batches: string[][] = []
  for (let i = 0; i < viewTargets.length; i += 2) {
    batches.push(viewTargets.slice(i, i + 2))
  }
  if (compTargets.length) batches.push(compTargets)
  batches.push(['src/App.vue'])

  for (let i = 0; i < batches.length; i += 1) {
    throwIfAborted(signal)
    const targets = batches[i]
    emit(onEvent, {
      type: 'step',
      message: `生成文件批次 ${i + 1}/${batches.length}：${targets.join(', ')}`,
    })
    const patch = await generateBatchFiles(options, plan, targets, i + 1, batches.length)
    const filtered: AppGenFileMap = {}
    for (const t of targets) {
      if (typeof patch[t] === 'string' && patch[t].trim()) filtered[t] = patch[t]
    }
    for (const [p, content] of Object.entries(patch)) {
      if (targets.includes(p) || targets.some((t) => t.endsWith(p))) {
        const key = targets.find((t) => t === p || t.endsWith(p)) || p
        if (content.trim()) filtered[key] = content
      }
    }
    files = mergeFiles(files, filtered)
    for (const [path, content] of Object.entries(filtered)) {
      emit(onEvent, { type: 'file', path, content })
    }
    emit(onEvent, { type: 'files', files })
  }

  emit(onEvent, { type: 'status', status: 'ready' })
  emit(onEvent, { type: 'step', message: '代码生成完成，准备启动预览' })
  return { plan, files }
}

import { assertAiModelReady } from '@/api/volcano'
import {
  extractJsonObject,
  listSortedPaths,
  mergeFiles,
  normalizeFilePath,
  normalizeGeneratedFiles,
} from './parse'
import { streamChatText, throwIfAborted } from './stream'
import type { AppGenFileMap, AppGenPlan, AppGenProgressEvent } from './types'

/**
 * 续改流水线：在已有 Vue 工程上按用户指令做增量修改，不重建脚手架。
 * 流程：规划 modify/create/delete → 删除文件 → 分批流式改写/新建 → 合并回 files。
 */

export type RunAppGenEditOptions = {
  instruction: string
  files: AppGenFileMap
  plan?: AppGenPlan | null
  signal?: AbortSignal
  onEvent?: (ev: AppGenProgressEvent) => void
}

type EditPlan = {
  summary: string
  modify: string[]
  create: string[]
  delete: string[]
}

function emit(onEvent: RunAppGenEditOptions['onEvent'], ev: AppGenProgressEvent) {
  onEvent?.(ev)
}

function newAssistantId() {
  return `asst-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

/** 单步 LLM 调用：向 UI 推送 assistant 消息流，返回完整 content 供 JSON 解析 */
async function streamStep(
  options: RunAppGenEditOptions,
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
    const { content } = await streamChatText(args.messages, {
      signal,
      temperature: args.temperature,
      maxTokens: args.maxTokens,
      onReasoning: (delta) => emit(onEvent, { type: 'thinking-delta', id, text: delta }),
      onContent: (delta) => emit(onEvent, { type: 'content-delta', id, text: delta }),
    })
    emit(onEvent, { type: 'assistant-end', id })
    throwIfAborted(signal)
    return content
  } catch (e) {
    emit(onEvent, { type: 'assistant-end', id })
    throw e
  }
}

/** 规范化模型输出的修改计划，并与现有 files 对齐（create 撞车则并入 modify） */
function normalizeEditPlan(input: unknown, existing: AppGenFileMap): EditPlan {
  const obj = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const summary = String(obj.summary || obj.message || '按你的要求修改工程').trim()

  const normList = (raw: unknown): string[] => {
    if (!Array.isArray(raw)) return []
    const out: string[] = []
    for (const item of raw) {
      const path = normalizeFilePath(String(item || ''))
      if (path) out.push(path)
    }
    return [...new Set(out)]
  }

  let modify = normList(obj.modify ?? obj.files ?? obj.targets)
  let create = normList(obj.create)
  let del = normList(obj.delete)

  // create 里若文件已存在，挪到 modify
  create = create.filter((p) => {
    if (existing[p] !== undefined) {
      modify.push(p)
      return false
    }
    return true
  })
  modify = [...new Set(modify)].filter((p) => !del.includes(p))
  create = [...new Set(create)].filter((p) => !del.includes(p) && !modify.includes(p))

  if (!modify.length && !create.length && !del.length) {
    // 兜底：优先改页面与 App
    const views = listSortedPaths(existing).filter((p) => p.startsWith('src/views/'))
    modify = views.slice(0, 2)
    if (existing['src/App.vue']) modify.push('src/App.vue')
  }

  return { summary, modify, create, delete: del }
}

/** 送入 prompt 时截断超长文件，避免超出上下文；要求模型基于可见部分完整重写 */
function clipFile(content: string, max = 9000): string {
  if (content.length <= max) return content
  return `${content.slice(0, max)}\n\n/* …已截断，请基于可见部分完整重写该文件… */`
}

/**
 * 在已有工程上按用户指令做增量修改（不重建脚手架）
 */
export async function runAppGenEditPipeline(options: RunAppGenEditOptions): Promise<{
  files: AppGenFileMap
  changed: string[]
  deleted: string[]
  summary: string
}> {
  assertAiModelReady('text')
  const instruction = options.instruction.trim()
  let files = { ...options.files }
  const existingPaths = listSortedPaths(files)

  emit(options.onEvent, { type: 'status', status: 'planning' })
  emit(options.onEvent, { type: 'step', message: '分析修改意图（基于当前工程，不会重建项目）…' })

  const planRaw = await streamStep(options, {
    title: '规划修改',
    fallbackThinking: '对照现有文件树，判断要改哪些文件、是否新建或删除…\n',
    messages: [
      {
        role: 'system',
        content: `你是 Vue 3 工程维护助手。用户要在「已有项目」上继续改，不要重建整个应用。
只输出 JSON：
{
  "summary": "一句话说明本次改动",
  "modify": ["已有文件相对路径"],
  "create": ["新建文件相对路径"],
  "delete": ["要删除的相对路径"]
}
约束：
- modify/create/delete 合计通常 1～6 个，尽量少改
- 路径用工程相对路径，如 src/views/HomeView.vue
- 若需新页面，记得把 src/router/index.ts、src/App.vue 放进 modify
- 不要输出 markdown`,
      },
      {
        role: 'user',
        content: JSON.stringify(
          {
            instruction,
            appTitle: options.plan?.appTitle,
            existingFiles: existingPaths,
          },
          null,
          2,
        ),
      },
    ],
    temperature: 0.3,
    maxTokens: 2000,
  })

  const editPlan = normalizeEditPlan(extractJsonObject(planRaw), files)
  emit(options.onEvent, { type: 'step', message: `修改计划：${editPlan.summary}` })
  if (editPlan.modify.length) {
    emit(options.onEvent, { type: 'step', message: `将修改：${editPlan.modify.join(', ')}` })
  }
  if (editPlan.create.length) {
    emit(options.onEvent, { type: 'step', message: `将新建：${editPlan.create.join(', ')}` })
  }
  if (editPlan.delete.length) {
    emit(options.onEvent, { type: 'step', message: `将删除：${editPlan.delete.join(', ')}` })
  }

  emit(options.onEvent, { type: 'status', status: 'generating' })

  for (const path of editPlan.delete) {
    throwIfAborted(options.signal)
    if (files[path] !== undefined) {
      delete files[path]
      emit(options.onEvent, { type: 'step', message: `已删除 ${path}` })
    }
  }

  const writeTargets = [...editPlan.modify, ...editPlan.create]
  /** 每批最多 2 个文件，控制单次输出 token 与失败重试成本 */
  const batches: string[][] = []
  for (let i = 0; i < writeTargets.length; i += 2) {
    batches.push(writeTargets.slice(i, i + 2))
  }

  const changed: string[] = [...editPlan.delete]

  for (let i = 0; i < batches.length; i += 1) {
    throwIfAborted(options.signal)
    const targets = batches[i]
    emit(options.onEvent, {
      type: 'step',
      message: `改写文件 (${i + 1}/${batches.length})：${targets.join(', ')}`,
    })

    const currentSnippets: Record<string, string> = {}
    for (const t of targets) {
      if (typeof files[t] === 'string') currentSnippets[t] = clipFile(files[t])
    }

    const raw = await streamStep(options, {
      title: `应用修改 (${i + 1}/${batches.length})`,
      fallbackThinking: `按指令改写 ${targets.join('、')}，保持与现有工程风格一致…\n`,
      messages: [
        {
          role: 'system',
          content: `你是 Vue 3 高级工程师。在已有项目上按用户指令改代码。
只输出 JSON：{ "files": { "相对路径": "完整文件内容" } }
要求：
- 路径必须是：${targets.join(', ')}
- 每个文件必须输出完整内容（禁止省略号截断）
- 使用 <script setup lang="ts">
- 保持现有样式类（card / grid / btn / muted 等）与项目风格
- 不要写后端；不要无关重构`,
        },
        {
          role: 'user',
          content: JSON.stringify(
            {
              instruction,
              summary: editPlan.summary,
              generateFiles: targets,
              currentFiles: currentSnippets,
            },
            null,
            2,
          ),
        },
      ],
      temperature: 0.35,
      maxTokens: 12000,
    })

    const patch = normalizeGeneratedFiles(extractJsonObject(raw))
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
      changed.push(path)
      emit(options.onEvent, { type: 'file', path, content })
    }
    emit(options.onEvent, { type: 'files', files })
  }

  const uniqueChanged = [...new Set(changed)]
  emit(options.onEvent, { type: 'status', status: 'ready' })
  emit(options.onEvent, {
    type: 'step',
    message: uniqueChanged.length
      ? `修改完成（${uniqueChanged.length} 个文件）`
      : '未检测到文件变更',
  })

  return {
    files,
    changed: uniqueChanged,
    deleted: editPlan.delete,
    summary: editPlan.summary,
  }
}

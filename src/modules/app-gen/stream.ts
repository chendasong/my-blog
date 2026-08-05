import { volcanoChatStream, type VolcanoChatMessage } from '@/api/agent'

/**
 * 封装火山方舟流式 Chat：累积 content/reasoning，并通过回调驱动 UI 增量更新。
 */

export type StreamChatResult = {
  content: string
  reasoning: string
}

/**
 * 将火山流式接口包装为 Promise，并透传思考 / 正文增量。
 */
export function streamChatText(
  messages: VolcanoChatMessage[],
  options?: {
    signal?: AbortSignal
    temperature?: number
    maxTokens?: number
    onContent?: (delta: string, full: string) => void
    onReasoning?: (delta: string, full: string) => void
  },
): Promise<StreamChatResult> {
  return new Promise((resolve, reject) => {
    let content = ''
    let reasoning = ''
    let settled = false

    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      fn()
    }

    void volcanoChatStream({
      messages,
      signal: options?.signal,
      temperature: options?.temperature ?? 0.4,
      maxTokens: options?.maxTokens ?? 8192,
      onChunk: (text) => {
        content += text
        options?.onContent?.(text, content)
      },
      onReasoning: (text) => {
        reasoning += text
        options?.onReasoning?.(text, reasoning)
      },
      onDone: () => finish(() => resolve({ content, reasoning })),
      onError: (msg) => finish(() => reject(new Error(msg))),
    })
  })
}

/** pipeline 各阶段在 await 前后检查 signal，统一抛出 AbortError 供页面捕获 */
export function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    const err = new Error('已中断生成')
    err.name = 'AbortError'
    throw err
  }
}

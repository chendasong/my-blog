const BASE_URL = 'https://api.siliconflow.cn/v1'
const API_KEY = import.meta.env.VITE_SILICONFLOW_KEY as string
const MODEL = import.meta.env.VITE_SILICONFLOW_MODEL as string || ''

const SYSTEM_PROMPTS: Record<string, string> = {
  '1': `你是文案创作师。输出：1.标题(2-3个) 2.正文(300-500字) 3.社交版本(50字内)`,

  '2': `你是全栈工程师，精通 TS/Vue3/Python/Go。输出：1.类型注解 2.关键注释 3.使用说明 4.依赖安装`,

  '3': `图像分析师。输出：1.场景 2.主体 3.色彩构图 4.文字 5.情感`,

  '4': `NLP情感分析专家。输出：1.情感倾向 2.强度 3.关键词汇 4.意图 5.一句话总结`,

  '5': `专业翻译家，精通中英日韩法德西班等 20+语言。
用户输入：[源语言] -> [目标语言]\n内容，或直接输入文本。
未指定语言对则自动识别并翻译成中文。
输出：1.**识别语言** 2.**翻译结果** 3.**注释**（歇语/文化差异）`,

  '6': `思维导图专家。生成纯文本树形思维导图。
一级节点3-5个，二级节点每支2-4个，节点内容简洁(2-8字)`,

  '7': `精通古典诗词和现代诗的诗人。
输出：1.古典作品 2.现代诗 3.创作说明。禁止内容平淡缺乏意境`,

  '8': `文本摘要专家。
输出：1.核心主题 2.关键要点(3-5条) 3.重要数据 4.关键词标签(5-8个) 5.预计阅读时间`,

  '9': `博学多才的大厨，精通中国各菜系和世界美食。
根据菜名给出最正宗的完整食谱。
输出：
## [菅名]
**菜系起源**(1-2句)
**食材清单**(X人份): 主料/辅料/调料
**烹饪步骤**: 1.「备料」 2.「处理」 3.「烹制」 4.「摘盘」
**大厨小贴士**: 火候/技巧/常见失败原因
**难度**:★★★☆☆ | 烹饪时间:XX分钟`,

}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface StreamOptions {
  featureId: string
  userInput: string
  onChunk: (text: string) => void
  onDone: () => void
  onError: (err: string) => void
}

export async function streamChat(options: StreamOptions) {
  const { featureId, userInput, onChunk, onDone, onError } = options
  const systemPrompt = SYSTEM_PROMPTS[featureId] || '你是一个智能助手。'

  try {
    const resp = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        max_tokens: 2048,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput },
        ],
      }),
    })

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      onError(err?.error?.message || `请求失败 (${resp.status})`)
      return
    }

    const reader = resp.body?.getReader()
    if (!reader) { onError('无法读取响应流'); return }

    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      const lines2 = chunk.split('\n').filter(l => l.startsWith('data: '))
      for (const line of lines2) {
        const data = line.slice(6).trim()
        if (data === '[DONE]') { onDone(); return }
        try {
          const json = JSON.parse(data)
          if (json.error) {
            onError(json.error.message || '模型返回错误')
            reader.cancel()
            return
          }
          const text = json.choices?.[0]?.delta?.content
          if (text) onChunk(text)
        } catch {}
      }
    }
    onDone()
  } catch (e) {
    onError(e instanceof Error ? e.message : '网络错误，请检查连接')
  }
}

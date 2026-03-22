/**
 * 火山方舟 OpenAPI（与博客编辑器「AI 生成封面」同源）
 * 密钥与模型名见项目根目录 .env.example
 */
export const VOLCANO_ARK_API = 'https://ark.cn-beijing.volces.com/api/v3'

/** 与 VITE_VOLCANO_KEY 一致；未配置时与历史生图逻辑一致，便于本地跑通 */
export function getVolcanoKey(): string {
  const k = (import.meta.env.VITE_VOLCANO_KEY as string | undefined)?.trim()
  return k || ''
}

export function getVolcanoImageModel(): string {
  return (
    (import.meta.env.VITE_VOLCANO_IMAGE_MODEL as string | undefined)?.trim() ||
    'doubao-seedream-5-0-260128'
  )
}

/** AI Agent 等文本对话；默认 doubao-seed-2-0-code-preview-260215 */
export function getVolcanoChatModel(): string {
  return (
    (import.meta.env.VITE_VOLCANO_CHAT_MODEL as string | undefined)?.trim() ||
    'doubao-seed-2-0-code-preview-260215'
  )
}

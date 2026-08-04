/**
 * 火山方舟（OpenAI 兼容数据面）运行时配置读取。
 * 密钥与模型一律来自用户「模型配置」，不再使用 VITE_VOLCANO_* 环境变量。
 * 不直接依赖 Pinia，避免与 auth / modelConfig 形成循环引用。
 */
import { getRuntimeAiModelConfig } from '@/lib/modelConfig'
import {
  DEFAULT_ARK_BASE_URL,
  MODEL_CONFIG_HINT,
  type AiModelKind,
} from '@/types/modelConfig'

function snapshot() {
  return getRuntimeAiModelConfig()
}

export function getVolcanoArkApi(): string {
  return snapshot().baseUrl || DEFAULT_ARK_BASE_URL
}

export function getVolcanoKey(): string {
  return snapshot().apiKey
}

export function getVolcanoChatModel(): string {
  return snapshot().textModel
}

export function getVolcanoImageModel(): string {
  return snapshot().imageModel
}

export function getVolcanoVideoModel(): string {
  return snapshot().videoModel
}

export function assertAiModelReady(kind: AiModelKind): void {
  const c = snapshot()
  if (!c.apiKey.trim()) throw new Error(MODEL_CONFIG_HINT)
  if (kind === 'text' && !c.textModel.trim()) throw new Error(MODEL_CONFIG_HINT)
  if (kind === 'image' && !c.imageModel.trim()) throw new Error(MODEL_CONFIG_HINT)
  if (kind === 'video' && !c.videoModel.trim()) throw new Error(MODEL_CONFIG_HINT)
}

export { MODEL_CONFIG_HINT, DEFAULT_ARK_BASE_URL }

import {
  AI_MODEL_CONFIG_STORAGE_KEY,
  DEFAULT_ARK_BASE_URL,
  EMPTY_AI_MODEL_CONFIG,
  type AiModelConfig,
  type AiModelKind,
} from '@/types/modelConfig'

/** 运行时缓存：由 modelConfig store 写入，volcano API 只读此处，避免 Pinia 循环依赖 */
let runtimeCache: AiModelConfig | null = null

export function setRuntimeAiModelConfig(config: AiModelConfig | null): void {
  runtimeCache = config ? normalizeAiModelConfig(config) : null
}

export function getRuntimeAiModelConfig(): AiModelConfig {
  if (runtimeCache) return runtimeCache
  return readLocalAiModelConfig()
}

export function normalizeBaseUrl(raw: string): string {
  let s = raw.trim().replace(/\/+$/, '')
  if (!s) return DEFAULT_ARK_BASE_URL
  return s
}

export function normalizeAiModelConfig(
  input: Partial<AiModelConfig> | null | undefined,
): AiModelConfig {
  if (!input || typeof input !== 'object') {
    return { ...EMPTY_AI_MODEL_CONFIG }
  }
  return {
    baseUrl: normalizeBaseUrl(
      typeof input.baseUrl === 'string' ? input.baseUrl : DEFAULT_ARK_BASE_URL,
    ),
    apiKey: typeof input.apiKey === 'string' ? input.apiKey.trim() : '',
    textModel: typeof input.textModel === 'string' ? input.textModel.trim() : '',
    imageModel: typeof input.imageModel === 'string' ? input.imageModel.trim() : '',
    videoModel: typeof input.videoModel === 'string' ? input.videoModel.trim() : '',
  }
}

export function readLocalAiModelConfig(): AiModelConfig {
  try {
    const raw = localStorage.getItem(AI_MODEL_CONFIG_STORAGE_KEY)
    if (!raw) return { ...EMPTY_AI_MODEL_CONFIG }
    return normalizeAiModelConfig(JSON.parse(raw) as Partial<AiModelConfig>)
  } catch {
    return { ...EMPTY_AI_MODEL_CONFIG }
  }
}

export function writeLocalAiModelConfig(config: AiModelConfig): void {
  const normalized = normalizeAiModelConfig(config)
  localStorage.setItem(AI_MODEL_CONFIG_STORAGE_KEY, JSON.stringify(normalized))
  setRuntimeAiModelConfig(normalized)
}

export function hasApiKey(config: AiModelConfig): boolean {
  return !!config.apiKey.trim()
}

export function hasModel(config: AiModelConfig, kind: AiModelKind): boolean {
  if (!hasApiKey(config)) return false
  if (kind === 'text') return !!config.textModel.trim()
  if (kind === 'image') return !!config.imageModel.trim()
  return !!config.videoModel.trim()
}

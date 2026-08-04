/** 用户自配的火山方舟（或兼容 OpenAI 数据面）模型配置 */
export interface AiModelConfig {
  /** 数据面 Base URL，如 https://ark.cn-beijing.volces.com/api/v3 */
  baseUrl: string
  /** API Key，请求头 Authorization: Bearer … */
  apiKey: string
  /** 文本 / Chat 模型或推理接入点 ID */
  textModel: string
  /** 图片生成模型 ID */
  imageModel: string
  /** 视频生成模型 ID */
  videoModel: string
}

export type AiModelKind = 'text' | 'image' | 'video'

export const DEFAULT_ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3'

export const EMPTY_AI_MODEL_CONFIG: AiModelConfig = {
  baseUrl: DEFAULT_ARK_BASE_URL,
  apiKey: '',
  textModel: '',
  imageModel: '',
  videoModel: '',
}

export const AI_MODEL_CONFIG_STORAGE_KEY = 'luminary_ai_model_config'

export const MODEL_CONFIG_HINT =
  '请先在模型配置中填写 API Key 与对应模型（头像菜单 → 模型配置）'

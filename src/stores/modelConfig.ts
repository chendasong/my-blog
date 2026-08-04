import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api/auth'
import {
  hasModel,
  normalizeAiModelConfig,
  readLocalAiModelConfig,
  setRuntimeAiModelConfig,
  writeLocalAiModelConfig,
} from '@/lib/modelConfig'
import { useAuthStore } from '@/stores/auth'
import {
  AI_MODEL_CONFIG_STORAGE_KEY,
  EMPTY_AI_MODEL_CONFIG,
  MODEL_CONFIG_HINT,
  type AiModelConfig,
  type AiModelKind,
} from '@/types/modelConfig'

export const useModelConfigStore = defineStore('modelConfig', () => {
  const config = ref<AiModelConfig>({ ...EMPTY_AI_MODEL_CONFIG })
  const loaded = ref(false)
  const saving = ref(false)

  const hasText = computed(() => hasModel(config.value, 'text'))
  const hasImage = computed(() => hasModel(config.value, 'image'))
  const hasVideo = computed(() => hasModel(config.value, 'video'))

  function apply(next: AiModelConfig) {
    const normalized = normalizeAiModelConfig(next)
    config.value = normalized
    setRuntimeAiModelConfig(normalized)
  }

  function clearLocalSecrets() {
    try {
      localStorage.removeItem(AI_MODEL_CONFIG_STORAGE_KEY)
    } catch {
      /* ignore */
    }
    setRuntimeAiModelConfig(null)
  }

  /**
   * 已登录：只读云端（避免把上一访客的本地 Key 绑到账号）。
   * 未登录：读 localStorage。
   */
  async function load() {
    const auth = useAuthStore()
    if (auth.isLoggedIn && auth.user?.id) {
      try {
        const remote = await authApi.getAiModelConfig(auth.user.id)
        apply(remote)
      } catch (e) {
        console.error('加载云端模型配置失败', e)
        apply({ ...EMPTY_AI_MODEL_CONFIG })
      }
    } else {
      apply(readLocalAiModelConfig())
    }
    loaded.value = true
  }

  /**
   * 已登录：写入云端，并同步一份到 localStorage（仅当前会话便利；登出时会清除）。
   * 未登录：只写 localStorage。
   */
  async function save(next: AiModelConfig) {
    saving.value = true
    try {
      const normalized = normalizeAiModelConfig(next)
      const auth = useAuthStore()
      if (auth.isLoggedIn && auth.user?.id) {
        await authApi.updateAiModelConfig(auth.user.id, normalized)
        writeLocalAiModelConfig(normalized)
      } else {
        writeLocalAiModelConfig(normalized)
      }
      apply(normalized)
      return normalized
    } finally {
      saving.value = false
    }
  }

  /** 登出时调用：去掉本机残留的账号密钥，避免下一访客沿用 */
  function resetForGuest() {
    clearLocalSecrets()
    apply({ ...EMPTY_AI_MODEL_CONFIG })
    loaded.value = true
  }

  function requireKind(kind: AiModelKind): void {
    if (!hasModel(config.value, kind)) {
      throw new Error(MODEL_CONFIG_HINT)
    }
  }

  return {
    config,
    loaded,
    saving,
    hasText,
    hasImage,
    hasVideo,
    load,
    save,
    apply,
    resetForGuest,
    requireKind,
  }
})

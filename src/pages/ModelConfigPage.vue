<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { useModelConfigStore } from '@/stores/modelConfig'
import {
  DEFAULT_ARK_BASE_URL,
  type AiModelConfig,
} from '@/types/modelConfig'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const modelConfigStore = useModelConfigStore()

const form = ref<AiModelConfig>({
  baseUrl: DEFAULT_ARK_BASE_URL,
  apiKey: '',
  textModel: '',
  imageModel: '',
  videoModel: '',
})
const showKey = ref(false)

onMounted(async () => {
  await modelConfigStore.load()
  form.value = { ...modelConfigStore.config }
})

async function handleSave() {
  if (!form.value.baseUrl.trim()) {
    toast.warning('请填写 Base URL')
    return
  }
  try {
    await modelConfigStore.save(form.value)
    toast.success(
      authStore.isLoggedIn
        ? '模型配置已保存到云端'
        : '模型配置已保存到本浏览器',
    )
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : '保存失败')
  }
}
</script>

<template>
  <div class="model-config-page">
    <div class="container">
      <div class="page-header">
        <button type="button" class="back-btn" @click="router.back()">← 返回</button>
        <h1 class="page-title">模型配置</h1>
      </div>

      <section class="glass-card config-card">
        <div class="guide">
          <h2 class="guide-title">如何对接火山方舟</h2>
          <ol class="guide-list">
            <li>
              打开
              <a
                href="https://console.volcengine.com/ark/region:cn-beijing/apiKey"
                target="_blank"
                rel="noopener noreferrer"
              >API Key 管理</a>
              ，创建并复制 API Key。
            </li>
            <li>
              在
              <a
                href="https://console.volcengine.com/ark/region:cn-beijing/openManagement"
                target="_blank"
                rel="noopener noreferrer"
              >模型开通 / 推理接入点</a>
              中分别开通文本、图片、视频模型，复制对应的模型 ID 或 Endpoint ID。
            </li>
            <li>
              Base URL 默认使用数据面地址
              <code>{{ DEFAULT_ARK_BASE_URL }}</code>
              （与官方文档一致，可按需修改）。
            </li>
            <li>
              鉴权方式：请求头
              <code>Authorization: Bearer &lt;API Key&gt;</code>。
            </li>
          </ol>
          <p class="guide-note">
            {{
              authStore.isLoggedIn
                ? '当前已登录：保存后写入云端账号；退出登录会清除本浏览器中的密钥缓存，避免他人沿用。'
                : '当前未登录：配置仅保存在本浏览器。登录后请在本页再次保存以同步到云端。'
            }}
            未配置时，全站 AI 功能将无法调用，也不会使用站长额度。
          </p>
        </div>

        <div class="form-grid">
          <div class="form-group form-group--full">
            <label class="form-label">Base URL</label>
            <input
              v-model="form.baseUrl"
              class="form-input"
              type="url"
              :placeholder="DEFAULT_ARK_BASE_URL"
              autocomplete="off"
            />
          </div>

          <div class="form-group form-group--full">
            <label class="form-label">API Key</label>
            <div class="input-wrap">
              <input
                v-model="form.apiKey"
                class="form-input"
                :type="showKey ? 'text' : 'password'"
                placeholder="方舟 API Key"
                autocomplete="off"
              />
              <button type="button" class="eye-btn" @click="showKey = !showKey">
                {{ showKey ? '隐藏' : '显示' }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">文本模型 ID</label>
            <input
              v-model="form.textModel"
              class="form-input"
              placeholder="Chat / 对话接入点 ID"
              autocomplete="off"
            />
            <p class="field-hint">用于 AI 工坊文本、写作 Agent、站内助手、视频提示词扩写等</p>
          </div>

          <div class="form-group">
            <label class="form-label">图片模型 ID</label>
            <input
              v-model="form.imageModel"
              class="form-input"
              placeholder="图片生成接入点 ID"
              autocomplete="off"
            />
            <p class="field-hint">用于工坊生图、漫画成图、文章封面等</p>
          </div>

          <div class="form-group form-group--full">
            <label class="form-label">视频模型 ID</label>
            <input
              v-model="form.videoModel"
              class="form-input"
              placeholder="如 doubao-seedance-1-5-pro-…"
              autocomplete="off"
            />
            <p class="field-hint">用于 AI 工坊视频生成</p>
          </div>
        </div>

        <div class="actions">
          <AppButton :loading="modelConfigStore.saving" @click="handleSave">
            保存配置
          </AppButton>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.model-config-page {
  padding: 32px 0 48px;
}
.container {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 20px;
}
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.back-btn {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  cursor: pointer;
  background: none;
  border: none;
}
.back-btn:hover {
  color: var(--color-primary);
}
.page-title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-primary);
}
.config-card {
  padding: 28px;
}
.guide {
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
}
.guide-title {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 12px;
}
.guide-list {
  margin: 0 0 12px;
  padding-left: 1.25rem;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  line-height: 1.7;
}
.guide-list a {
  color: var(--color-primary);
  text-decoration: underline;
}
.guide-list code,
.field-hint code {
  font-size: 0.85em;
  word-break: break-all;
}
.guide-note {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.6;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 16px;
}
.form-group--full {
  grid-column: 1 / -1;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}
.form-input {
  width: 100%;
  padding: 10px 14px;
  background: var(--color-bg-glass);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.form-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 12%, transparent);
}
.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.input-wrap .form-input {
  width: 100%;
  padding-right: 64px;
}
.eye-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  cursor: pointer;
}
.eye-btn:hover {
  color: var(--color-primary);
}
.field-hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.4;
}
.actions {
  margin-top: 28px;
  display: flex;
  justify-content: flex-end;
}
@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>

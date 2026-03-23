<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  AI_IMAGE_STYLES,
  DEFAULT_AI_IMAGE_STYLE_ID,
  getAiImageStyleById,
  buildCoverImagePrompt,
} from '@/data'
import { generateImages } from '@/api/siliconflow'
import { useToast } from '@/composables/useToast'
import { syncTextareaHeight } from '@/lib/autoResizeTextarea'
import AppButton from '@/components/common/AppButton.vue'
import { isQiniuConfigured, uploadRemoteImageViaServerApi } from '@/lib/qiniuClient'
import { fetchRemoteImageBlob } from '@/lib/fetchRemoteImageBlob'
import type { AIFeature } from '@/types'

defineProps<{ feature: AIFeature }>()

const toast = useToast()
const inputText = ref('')
const selectedImageStyleId = ref(DEFAULT_AI_IMAGE_STYLE_ID)
const imageWatermarkChoice = ref<'off' | 'on'>('off')
const generatedImageUrls = ref<string[]>([])
const isLoading = ref(false)
const mediaAbortController = ref<AbortController | null>(null)
const mirrorSavingIndex = ref<number | null>(null)

const canSaveToQiniu = computed(() => {
  return (
    isQiniuConfigured() &&
    !!(import.meta.env.VITE_QINIU_ADMIN_SECRET as string | undefined)?.trim()
  )
})

const inputRef = ref<HTMLTextAreaElement | null>(null)
const TEXTAREA_MIN = 44
const TEXTAREA_MAX = 300

function resizeInput() {
  nextTick(() =>
    syncTextareaHeight(inputRef.value, TEXTAREA_MIN, TEXTAREA_MAX),
  )
}

watch(inputText, resizeInput)
onMounted(() => resizeInput())

onBeforeUnmount(() => {
  mediaAbortController.value?.abort()
})

async function handleGenerate() {
  if (!inputText.value.trim()) return
  if (isLoading.value) return

  isLoading.value = true
  mediaAbortController.value?.abort()
  const ac = new AbortController()
  mediaAbortController.value = ac
  generatedImageUrls.value = []
  try {
    const style =
      getAiImageStyleById(selectedImageStyleId.value) || AI_IMAGE_STYLES[0]
    const prompt = buildCoverImagePrompt(inputText.value.trim(), style)
    generatedImageUrls.value = await generateImages(prompt, 1, {
      watermark: imageWatermarkChoice.value === 'on',
      signal: ac.signal,
    })
    if (ac.signal.aborted) return
    if (!generatedImageUrls.value.length) toast.error('未返回图片地址')
    else toast.success('生成完成')
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      toast.info('已停止')
      return
    }
    toast.error(e instanceof Error ? e.message : '生图失败')
  } finally {
    if (mediaAbortController.value === ac) mediaAbortController.value = null
    isLoading.value = false
  }
}

function handleStop() {
  mediaAbortController.value?.abort()
  mediaAbortController.value = null
  isLoading.value = false
}

function copyImageUrl(url: string) {
  navigator.clipboard?.writeText(url)
  toast.success('图片链接已复制')
}

function extFromMime(mime: string) {
  if (mime.includes('jpeg')) return 'jpg'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('gif')) return 'gif'
  return 'png'
}

async function saveGeneratedToQiniu(url: string, index: number) {
  mirrorSavingIndex.value = index
  try {
    const newUrl = await uploadRemoteImageViaServerApi(url, 'ai-generated')
    generatedImageUrls.value[index] = newUrl
    toast.success('已转存到七牛')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : '转存失败')
  } finally {
    mirrorSavingIndex.value = null
  }
}

async function downloadGeneratedImage(url: string) {
  const base = `ai-image-${Date.now()}`
  try {
    const blob = await fetchRemoteImageBlob(url)
    const ext = extFromMime(blob.type || '')
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = `${base}.${ext}`
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(href)
    toast.success('已开始下载')
  } catch (e) {
    toast.error(
      e instanceof Error
        ? e.message
        : '下载失败（请确认已部署 /api/image-proxy）',
    )
  }
}
</script>

<template>
  <div data-ai-workshop-panel class="ai-workshop-image">
    <div class="ai-io">
      <div class="ai-input-area">
        <label class="ai-label">输入内容</label>
        <div class="ai-input-row">
          <textarea
            ref="inputRef"
            v-model="inputText"
            class="ai-textarea"
            :placeholder="feature.placeholder"
            rows="1"
            :disabled="isLoading"
          />
        </div>
      </div>
      <div class="ai-button-row">
        <label class="ai-label">
          AI 输出
          <span v-if="isLoading" class="ai-streaming-badge">● 生成中</span>
        </label>
        <div class="ai-input-btns ai-input-btns--image">
          <div class="select-with-label ai-image-gen__style">
            <label class="select-with-label__text" for="ai-image-style-select"
              >风格</label
            >
            <select
              id="ai-image-style-select"
              v-model="selectedImageStyleId"
              class="mode-select ai-style-select"
              :disabled="isLoading"
            >
              <option
                v-for="s in AI_IMAGE_STYLES"
                :key="s.id"
                :value="s.id"
              >
                {{ s.label }}
              </option>
            </select>
          </div>
          <div class="select-with-label ai-image-gen__watermark">
            <label
              class="select-with-label__text"
              for="ai-image-watermark-select"
              >水印</label
            >
            <select
              id="ai-image-watermark-select"
              v-model="imageWatermarkChoice"
              class="mode-select ai-wm-select"
              :disabled="isLoading"
            >
              <option value="off">无</option>
              <option value="on">添加</option>
            </select>
          </div>
          <button
            v-if="isLoading"
            type="button"
            class="stop-btn stop-btn--active"
            @click="handleStop"
          >
            ◼️ 停止
          </button>
          <AppButton v-else :disabled="!inputText.trim()" @click="handleGenerate"
            >✨ 生成</AppButton
          >
        </div>
      </div>
      <div class="ai-output-area">
        <div v-if="isLoading" class="ai-loading">
          <div class="ai-loading__dots"><span /><span /><span /></div>
          <p>AI 正在生成图片，请稍候…</p>
        </div>
        <div v-else-if="generatedImageUrls.length" class="ai-image-output">
          <div
            v-for="(url, i) in generatedImageUrls"
            :key="i"
            class="ai-image-output__cell"
          >
            <img :src="url" alt="AI 生成图" class="ai-image-output__img" />
            <div class="ai-output__actions">
              <button
                v-if="canSaveToQiniu"
                type="button"
                class="tag"
                :disabled="mirrorSavingIndex !== null"
                @click="saveGeneratedToQiniu(url, i)"
              >
                {{
                  mirrorSavingIndex === i ? '转存中…' : '☁️ 转存七牛'
                }}
              </button>
              <button
                type="button"
                class="tag"
                @click="downloadGeneratedImage(url)"
              >
                ⬇️ 下载图片
              </button>
              <a
                :href="url"
                class="tag"
                target="_blank"
                rel="noopener noreferrer"
                >🔗 打开原图</a
              >
              <button
                type="button"
                class="tag"
                @click="copyImageUrl(url)"
              >
                📋 复制链接
              </button>
              <button
                type="button"
                class="tag"
                @click="generatedImageUrls = []"
              >
                清除
              </button>
            </div>
          </div>
        </div>
        <div v-else class="ai-output-empty">
          <p>输入图片描述，选择风格后点击「生成」</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="./ai-panel-common.css"></style>

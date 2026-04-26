<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  AI_IMAGE_STYLES,
  DEFAULT_AI_IMAGE_STYLE_ID,
  getAiImageStyleById,
  buildComicPanelPrompt,
} from '@/data'
import {
  extractComicScenesFromArticle,
  generateImages,
} from '@/api/siliconflow'
import { useToast } from '@/composables/useToast'
import { syncTextareaHeight } from '@/lib/autoResizeTextarea'
import { stitchImagesVertically } from '@/lib/imageStitch'
import AppButton from '@/components/common/AppButton.vue'
import type { AIFeature } from '@/types'

defineProps<{ feature: AIFeature }>()

/** 与视频工坊一致的比例选项；映射为火山生图常用像素（2K 档近似） */
type ComicRatio = '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16'

const COMIC_RATIO_PRESETS: { value: ComicRatio; label: string }[] = [
  { value: '21:9', label: '21:9' },
  { value: '16:9', label: '16:9' },
  { value: '4:3', label: '4:3' },
  { value: '1:1', label: '1:1' },
  { value: '3:4', label: '3:4' },
  { value: '9:16', label: '9:16' },
]

const COMIC_RATIO_TO_SIZE: Record<ComicRatio, string> = {
  '21:9': '2560x1098',
  '16:9': '2560x1440',
  '4:3': '2304x1728',
  '1:1': '2048x2048',
  '3:4': '1728x2304',
  '9:16': '1440x2560',
}

const toast = useToast()
const articleText = ref('')
const selectedImageStyleId = ref(DEFAULT_AI_IMAGE_STYLE_ID)
const panelCount = ref(4)
const comicRatio = ref<ComicRatio>('9:16')
const imageWatermarkChoice = ref<'off' | 'on'>('off')
const comicUrls = ref<string[]>([])
const comicScenes = ref<string[]>([])
const isLoading = ref(false)
const statusLine = ref('')
const mediaAbortController = ref<AbortController | null>(null)
const isStitching = ref(false)

const comicImageSize = computed(() => COMIC_RATIO_TO_SIZE[comicRatio.value])

const inputRef = ref<HTMLTextAreaElement | null>(null)
const TEXTAREA_MIN = 80
const TEXTAREA_MAX = 360

function resizeInput() {
  nextTick(() =>
    syncTextareaHeight(inputRef.value, TEXTAREA_MIN, TEXTAREA_MAX),
  )
}

watch(articleText, resizeInput)
onMounted(() => resizeInput())

onBeforeUnmount(() => {
  mediaAbortController.value?.abort()
})

/** 单格不拉图、不经七牛：新开标签打开官方地址，由浏览器展示或另存为 */
function openComicPanelImage(i: number) {
  const url = comicUrls.value[i]
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
  toast.success('已在新标签打开，可右键另存为或使用浏览器下载')
}

async function downloadStitchedStrip() {
  if (comicUrls.value.length < 2) return
  isStitching.value = true
  try {
    const blob = await stitchImagesVertically(comicUrls.value, {
      gap: 12,
      background: '#ffffff',
    })
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = `ai-comic-strip-${comicUrls.value.length}p-${Date.now()}.png`
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(href)
    toast.success('长图已开始下载')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : '拼接下载失败')
  } finally {
    isStitching.value = false
  }
}

async function handleGenerate() {
  if (!articleText.value.trim()) return
  if (isLoading.value) return

  const style =
    getAiImageStyleById(selectedImageStyleId.value) || AI_IMAGE_STYLES[0]
  const count = Math.min(Math.max(2, panelCount.value), 12)

  isLoading.value = true
  comicUrls.value = []
  comicScenes.value = []
  statusLine.value = ''
  mediaAbortController.value?.abort()
  const ac = new AbortController()
  mediaAbortController.value = ac

  try {
    statusLine.value = `正在从正文提炼分镜…`
    const scenes = await extractComicScenesFromArticle(
      articleText.value.trim(),
      count,
      ac.signal,
    )
    if (ac.signal.aborted) return
    comicScenes.value = scenes

    let prevUrl: string | null = null

    for (let i = 0; i < scenes.length; i++) {
      if (ac.signal.aborted) return
      statusLine.value = `正在生成第 ${i + 1} / ${scenes.length} 格…`
      const prompt = buildComicPanelPrompt(
        scenes[i],
        style,
        i,
        scenes.length,
        !!prevUrl,
      )
      const batch = await generateImages(prompt, 1, {
        watermark: imageWatermarkChoice.value === 'on',
        signal: ac.signal,
        referenceImageUrl: prevUrl,
        size: comicImageSize.value,
      })
      const u = batch[0]
      if (!u) throw new Error(`第 ${i + 1} 格未返回图片地址`)
      comicUrls.value = [...comicUrls.value, u]
      prevUrl = u
    }

    if (ac.signal.aborted) return
    statusLine.value = ''
    toast.success(`已生成 ${comicUrls.value.length} 格漫画`)
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      toast.info('已停止')
      return
    }
    toast.error(e instanceof Error ? e.message : '生成失败')
    statusLine.value = ''
  } finally {
    if (mediaAbortController.value === ac) mediaAbortController.value = null
    isLoading.value = false
  }
}

function handleStop() {
  mediaAbortController.value?.abort()
  mediaAbortController.value = null
  isLoading.value = false
  statusLine.value = ''
}

function clearComicOutput() {
  comicUrls.value = []
  comicScenes.value = []
}
</script>

<template>
  <div data-ai-workshop-panel class="ai-workshop-comic">
    <div class="ai-io">
      <div class="ai-input-area">
        <label class="ai-label">文章 / 故事正文</label>
        <div class="ai-input-row">
          <textarea
            ref="inputRef"
            v-model="articleText"
            class="ai-textarea"
            :placeholder="feature.placeholder"
            rows="3"
            :disabled="isLoading"
          />
        </div>
      </div>
      <div class="ai-button-row">
        <label class="ai-label">
          连载漫画
          <span v-if="isLoading" class="ai-streaming-badge">● 处理中</span>
        </label>
        <div class="ai-input-btns ai-input-btns--image">
          <div class="select-with-label">
            <label class="select-with-label__text" for="comic-style-select"
              >画风</label
            >
            <select
              id="comic-style-select"
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
          <div class="select-with-label">
            <label class="select-with-label__text" for="comic-ratio-select"
              >比例</label
            >
            <select
              id="comic-ratio-select"
              v-model="comicRatio"
              class="mode-select ai-style-select"
              :disabled="isLoading"
            >
              <option
                v-for="r in COMIC_RATIO_PRESETS"
                :key="r.value"
                :value="r.value"
              >
                {{ r.label }}
              </option>
            </select>
          </div>
          <div class="select-with-label">
            <label class="select-with-label__text" for="comic-panels-select"
              >格数</label
            >
            <select
              id="comic-panels-select"
              v-model.number="panelCount"
              class="mode-select ai-style-select"
              :disabled="isLoading"
            >
              <option v-for="n in 11" :key="n + 1" :value="n + 1">
                {{ n + 1 }} 格
              </option>
            </select>
          </div>
          <div class="select-with-label">
            <label class="select-with-label__text" for="comic-wm-select"
              >水印</label
            >
            <select
              id="comic-wm-select"
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
          <AppButton
            v-else
            :disabled="!articleText.trim()"
            @click="handleGenerate"
            >✨ 生成分镜漫画</AppButton
          >
        </div>
      </div>
      <p v-if="statusLine" class="comic-status">{{ statusLine }}</p>
      <details v-if="comicScenes.length" class="comic-scenes">
        <summary>查看分镜文案（{{ comicScenes.length }} 格）</summary>
        <ol>
          <li v-for="(s, i) in comicScenes" :key="i">{{ s }}</li>
        </ol>
      </details>
      <div class="ai-output-area">
        <div v-if="isLoading && !comicScenes.length" class="ai-loading">
          <div class="ai-loading__dots"><span /><span /><span /></div>
          <p>{{ statusLine || '准备中…' }}</p>
        </div>
        <div v-else-if="comicScenes.length" class="comic-strip">
          <div class="comic-strip__toolbar">
            <button
              v-if="comicUrls.length >= 2"
              type="button"
              class="tag tag--primary"
              :disabled="isStitching || isLoading"
              @click="downloadStitchedStrip"
            >
              {{
                isStitching
                  ? '拼接中…'
                  : `📥 一键下载整条漫画（${comicUrls.length} 格）`
              }}
            </button>
            <button type="button" class="tag" @click="clearComicOutput">
              清除结果
            </button>
          </div>
          <div
            v-for="(_, i) in comicScenes"
            :key="i"
            class="comic-strip__item"
          >
            <div class="comic-strip__media">
              <img
                v-if="comicUrls[i]"
                :src="comicUrls[i]"
                :alt="`第${i + 1}格`"
                class="comic-strip__img"
              />
              <div
                v-else-if="isLoading"
                class="comic-strip__skeleton"
                aria-hidden="true"
              >
                <div class="comic-strip__skeleton-shine" />
              </div>
              <div v-else class="comic-strip__missing">本格未生成</div>
              <button
                v-if="comicUrls[i]"
                type="button"
                class="tag tag--primary comic-strip__download-corner"
                @click="openComicPanelImage(i)"
              >
                📥 下载
              </button>
              <div class="comic-strip__index">第 {{ i + 1 }} 格</div>
            </div>
          </div>
        </div>
        <div v-else class="ai-output-empty">
          <p>
            粘贴正文，选择画风、比例与格数后生成。分镜侧重画满细节与角色对白（无旁白）；成图用对白气泡呈现。已完成的格会先显示。第
            2 格起传上一格作参考（需模型支持参考图）。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="./ai-panel-common.css"></style>
<style scoped>
.comic-status {
  margin: 0 0 12px;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
.comic-scenes {
  margin-bottom: 16px;
  padding: 12px 14px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}
.comic-scenes summary {
  cursor: pointer;
  color: var(--color-text-secondary);
  font-weight: 500;
}
.comic-scenes ol {
  margin: 10px 0 0;
  padding-left: 1.25rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}
.comic-strip {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.comic-strip__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-start;
  margin-bottom: 2px;
}
.comic-strip__item {
  position: relative;
}
.comic-strip__media {
  position: relative;
  min-height: 120px;
  background: transparent;
  border-radius: var(--radius-md);
  overflow: hidden;
}
.comic-strip__img {
  display: block;
  width: 100%;
  max-height: min(70vh, 900px);
  object-fit: contain;
  background: var(--color-bg);
}
.comic-strip__index {
  position: absolute;
  left: 8px;
  top: 8px;
  padding: 4px 8px;
  border-radius: var(--radius-full);
  font-size: 11px;
  color: #fff;
  background: rgba(20, 20, 30, 0.45);
  backdrop-filter: blur(3px);
}
.comic-strip__skeleton {
  position: relative;
  min-height: 200px;
  background: linear-gradient(
    135deg,
    var(--color-bg-card),
    var(--color-bg)
  );
  overflow: hidden;
}
.comic-strip__skeleton-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 35%,
    color-mix(in srgb, var(--color-primary) 8%, transparent) 50%,
    transparent 65%
  );
  background-size: 200% 100%;
  animation: comic-skel-shine 1.3s ease-in-out infinite;
}
@keyframes comic-skel-shine {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
.comic-strip__missing {
  padding: 48px 16px;
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
.comic-strip__download-corner {
  position: absolute;
  right: 10px;
  bottom: 10px;
}
.tag--primary {
  border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
  color: var(--color-primary);
  font-weight: 600;
}
</style>

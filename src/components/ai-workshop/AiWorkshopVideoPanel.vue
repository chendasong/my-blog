<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  createSeedanceVideoTask,
  expandVideoPromptWithDoubao,
  waitSeedanceVideoTask,
  withMultiFrameTransitionHint,
  withVideoAudioPromptHint,
  type SeedanceRatio,
  type SeedanceResolution,
  type VideoReferenceFrameRole,
} from '@/api/seedanceVideo'
import { useToast } from '@/composables/useToast'
import { syncTextareaHeight } from '@/lib/autoResizeTextarea'
import AppButton from '@/components/common/AppButton.vue'
import type { AIFeature } from '@/types'

defineProps<{ feature: AIFeature }>()

const toast = useToast()
const inputText = ref('')
const outputText = ref('')
const isLoading = ref(false)
const videoGenAbortController = ref<AbortController | null>(null)
let videoRunSeq = 0

const VIDEO_RATIO_PRESETS: { value: SeedanceRatio; label: string }[] = [
  { value: '21:9', label: '21:9' },
  { value: '16:9', label: '16:9' },
  { value: '4:3', label: '4:3' },
  { value: '1:1', label: '1:1' },
  { value: '3:4', label: '3:4' },
  { value: '9:16', label: '9:16' },
]
const VIDEO_RESOLUTIONS: SeedanceResolution[] = ['480p', '720p', '1080p']
const videoRatio = ref<SeedanceRatio>('16:9')
const videoResolution = ref<SeedanceResolution>('480p')
const videoDurationMode = ref<'seconds' | 'smart'>('seconds')
const videoDurationSec = ref(6)
const videoCount = ref(1)
const videoGenerateAudio = ref(true)
const videoSeedStr = ref('-1')
const videoAutoExpandPrompt = ref(false)
const generatedVideoUrls = ref<string[]>([])
const videoStatusHint = ref('')

const MAX_VIDEO_FRAME_BYTES = 25 * 1024 * 1024
const videoFirstFrameFile = ref<File | null>(null)
const videoLastFrameFile = ref<File | null>(null)
const videoFirstFramePreview = ref('')
const videoLastFramePreview = ref('')
const firstFrameFileInput = ref<HTMLInputElement | null>(null)
const lastFrameFileInput = ref<HTMLInputElement | null>(null)

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

function revokeVideoFramePreviews() {
  if (videoFirstFramePreview.value) {
    URL.revokeObjectURL(videoFirstFramePreview.value)
    videoFirstFramePreview.value = ''
  }
  if (videoLastFramePreview.value) {
    URL.revokeObjectURL(videoLastFramePreview.value)
    videoLastFramePreview.value = ''
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error('读取图片失败'))
    r.readAsDataURL(file)
  })
}

function validateImageFile(file: File): boolean {
  if (!file.type.startsWith('image/')) {
    toast.error('请选择图片文件')
    return false
  }
  if (file.size > MAX_VIDEO_FRAME_BYTES) {
    toast.error('单张图片不超过 25MB')
    return false
  }
  return true
}

function assignVideoFrame(which: 'first' | 'last', file: File | undefined) {
  if (!file) return
  if (!validateImageFile(file)) return
  if (which === 'first') {
    if (videoFirstFramePreview.value)
      URL.revokeObjectURL(videoFirstFramePreview.value)
    videoFirstFrameFile.value = file
    videoFirstFramePreview.value = URL.createObjectURL(file)
  } else {
    if (videoLastFramePreview.value)
      URL.revokeObjectURL(videoLastFramePreview.value)
    videoLastFrameFile.value = file
    videoLastFramePreview.value = URL.createObjectURL(file)
  }
}

function onFirstFrameFileChange(e: Event) {
  const inp = e.target as HTMLInputElement
  assignVideoFrame('first', inp.files?.[0])
  inp.value = ''
}

function onLastFrameFileChange(e: Event) {
  const inp = e.target as HTMLInputElement
  assignVideoFrame('last', inp.files?.[0])
  inp.value = ''
}

function clearVideoFrame(which: 'first' | 'last') {
  if (which === 'first') {
    if (videoFirstFramePreview.value)
      URL.revokeObjectURL(videoFirstFramePreview.value)
    videoFirstFrameFile.value = null
    videoFirstFramePreview.value = ''
  } else {
    if (videoLastFramePreview.value)
      URL.revokeObjectURL(videoLastFramePreview.value)
    videoLastFrameFile.value = null
    videoLastFramePreview.value = ''
  }
}

function openVideoFramePicker(which: 'first' | 'last') {
  if (which === 'first') firstFrameFileInput.value?.click()
  else lastFrameFileInput.value?.click()
}

function onVideoFrameTileClick(which: 'first' | 'last', e: MouseEvent) {
  const el = e.target as HTMLElement
  if (el.closest('.ai-video-frame-tile__clear')) return
  openVideoFramePicker(which)
}

function swapVideoFrames() {
  const tf = videoFirstFrameFile.value
  const tl = videoLastFrameFile.value
  videoFirstFrameFile.value = tl
  videoLastFrameFile.value = tf
  if (videoFirstFramePreview.value)
    URL.revokeObjectURL(videoFirstFramePreview.value)
  if (videoLastFramePreview.value)
    URL.revokeObjectURL(videoLastFramePreview.value)
  videoFirstFramePreview.value = videoFirstFrameFile.value
    ? URL.createObjectURL(videoFirstFrameFile.value)
    : ''
  videoLastFramePreview.value = videoLastFrameFile.value
    ? URL.createObjectURL(videoLastFrameFile.value)
    : ''
}

onBeforeUnmount(() => {
  videoGenAbortController.value?.abort()
  revokeVideoFramePreviews()
  videoFirstFrameFile.value = null
  videoLastFrameFile.value = null
})

function randomizeVideoSeed() {
  videoSeedStr.value = String(Math.floor(Math.random() * 2147483647))
}

function handleStop() {
  videoGenAbortController.value?.abort()
}

function copyVideoUrl(url: string) {
  navigator.clipboard?.writeText(url)
  toast.success('视频链接已复制（临时链，建议尽快下载）')
}

function downloadGeneratedVideo(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
  toast.success('已打开链接，可在新页面播放或另存为')
}

async function handleGenerate() {
  const videoCanRunWithoutText =
    !!videoFirstFrameFile.value || !!videoLastFrameFile.value
  if (!inputText.value.trim() && !videoCanRunWithoutText) return

  if (isLoading.value) {
    videoGenAbortController.value?.abort()
    return
  }

  videoGenAbortController.value?.abort()
  const runId = ++videoRunSeq
  isLoading.value = true
  generatedVideoUrls.value = []
  outputText.value = ''
  videoStatusHint.value = ''
  const ac = new AbortController()
  videoGenAbortController.value = ac
  const vidSig = ac.signal

  try {
    const n = Math.min(4, Math.max(1, Math.round(Number(videoCount.value)) || 1))
    const duration =
      videoDurationMode.value === 'smart'
        ? -1
        : Math.min(12, Math.max(4, Math.round(Number(videoDurationSec.value)) || 6))
    const seedRaw = videoSeedStr.value.trim()
    const seed =
      seedRaw === '' || seedRaw === '-1'
        ? -1
        : (() => {
            const x = parseInt(seedRaw, 10)
            return Number.isFinite(x) ? x : -1
          })()

    if (videoLastFrameFile.value && !videoFirstFrameFile.value) {
      toast.error('使用尾帧时需先上传首帧')
      isLoading.value = false
      return
    }

    const referenceFrames: Array<{
      url: string
      role: VideoReferenceFrameRole
    }> = []
    if (videoFirstFrameFile.value) {
      referenceFrames.push({
        url: await readFileAsDataUrl(videoFirstFrameFile.value),
        role: 'first_frame',
      })
    }
    if (videoLastFrameFile.value && videoFirstFrameFile.value) {
      referenceFrames.push({
        url: await readFileAsDataUrl(videoLastFrameFile.value),
        role: 'last_frame',
      })
    }

    let videoPrompt = inputText.value.trim()
    if (videoAutoExpandPrompt.value) {
      videoStatusHint.value = '正在生成电影级画面提示词…'
      try {
        videoPrompt = await expandVideoPromptWithDoubao(videoPrompt, {
          signal: vidSig,
          referenceImageUrls: referenceFrames.map((r) => r.url),
          generateAudio: videoGenerateAudio.value,
        })
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          throw new Error('已停止')
        }
        videoPrompt = inputText.value.trim()
      }
    }
    videoPrompt = withMultiFrameTransitionHint(
      videoPrompt,
      referenceFrames.length,
    )
    videoPrompt = withVideoAudioPromptHint(
      videoPrompt,
      videoGenerateAudio.value,
    )
    outputText.value = videoPrompt
    if (vidSig.aborted) throw new Error('已停止')

    const urls: string[] = []
    for (let i = 0; i < n; i++) {
      if (vidSig.aborted) break
      videoStatusHint.value = `第 ${i + 1}/${n} 条：创建任务…`
      const taskId = await createSeedanceVideoTask(videoPrompt, {
        ratio: videoRatio.value,
        resolution: videoResolution.value,
        duration,
        generateAudio: videoGenerateAudio.value,
        seed,
        referenceFrames:
          referenceFrames.length > 0 ? referenceFrames : undefined,
      })
      videoStatusHint.value = `第 ${i + 1}/${n} 条：渲染中（通常需数分钟，请勿关闭页面）…`
      const url = await waitSeedanceVideoTask(taskId, () => vidSig.aborted)
      urls.push(url)
    }
    if (videoRunSeq !== runId) return
    generatedVideoUrls.value = urls
    if (urls.length === n) {
      toast.success(n === 1 ? '视频已生成' : `已生成 ${n} 条视频`)
    } else if (urls.length > 0) {
      toast.warning('已停止，仅完成部分视频')
    } else {
      toast.info('已停止')
    }
  } catch (e) {
    if (videoRunSeq !== runId) return
    const msg = e instanceof Error ? e.message : ''
    if (msg === '已停止') toast.info('已停止')
    else toast.error(msg || '视频生成失败')
  } finally {
    if (videoRunSeq === runId) {
      if (videoGenAbortController.value === ac) videoGenAbortController.value = null
      isLoading.value = false
      videoStatusHint.value = ''
    }
  }
}
</script>

<template>
  <div data-ai-workshop-panel class="ai-workshop-video">
    <div class="ai-io">
      <div class="ai-input-area">
        <div class="ai-video-params">
          <input
            ref="firstFrameFileInput"
            type="file"
            class="ai-video-frame-input"
            accept="image/*"
            @change="onFirstFrameFileChange"
          />
          <input
            ref="lastFrameFileInput"
            type="file"
            class="ai-video-frame-input"
            accept="image/*"
            @change="onLastFrameFileChange"
          />
          <div class="ai-video-row ai-video-row--frames">
            <div class="ai-video-frames">
              <div
                role="button"
                tabindex="0"
                class="ai-video-frame-tile"
                @click="onVideoFrameTileClick('first', $event)"
                @keydown.enter.prevent="openVideoFramePicker('first')"
                @keydown.space.prevent="openVideoFramePicker('first')"
              >
                <img
                  v-if="videoFirstFramePreview"
                  :src="videoFirstFramePreview"
                  alt=""
                  class="ai-video-frame-tile__img"
                />
                <template v-else>
                  <span
                    class="ai-video-frame-tile__icon"
                    aria-hidden="true"
                  />
                  <span class="ai-video-frame-tile__label">首帧</span>
                </template>
                <button
                  v-if="videoFirstFrameFile"
                  type="button"
                  class="ai-video-frame-tile__clear"
                  aria-label="清除首帧"
                  @click.stop="clearVideoFrame('first')"
                >
                  ×
                </button>
              </div>
              <button
                type="button"
                class="ai-video-frame-swap"
                title="交换首帧与尾帧"
                aria-label="交换首帧与尾帧"
                :disabled="!videoFirstFrameFile && !videoLastFrameFile"
                @click="swapVideoFrames"
              >
                ⇄
              </button>
              <div
                role="button"
                tabindex="0"
                class="ai-video-frame-tile"
                @click="onVideoFrameTileClick('last', $event)"
                @keydown.enter.prevent="openVideoFramePicker('last')"
                @keydown.space.prevent="openVideoFramePicker('last')"
              >
                <img
                  v-if="videoLastFramePreview"
                  :src="videoLastFramePreview"
                  alt=""
                  class="ai-video-frame-tile__img"
                />
                <template v-else>
                  <span
                    class="ai-video-frame-tile__icon"
                    aria-hidden="true"
                  />
                  <span class="ai-video-frame-tile__label">尾帧</span>
                </template>
                <button
                  v-if="videoLastFrameFile"
                  type="button"
                  class="ai-video-frame-tile__clear"
                  aria-label="清除尾帧"
                  @click.stop="clearVideoFrame('last')"
                >
                  ×
                </button>
              </div>
            </div>
            <p class="ai-video-hint--below ai-video-hint--frames">
              仅首帧、尾帧（尾帧需先有首帧）。有参考图时 Pro 模型一般使用智能比例（adaptive）。默认
              480p；首尾双帧时提示词会加强过渡描述。
            </p>
          </div>
          <div class="ai-video-row ai-video-row--ratio-res">
            <div class="ai-video-field-group">
              <div class="ai-video-block__label">比例</div>
              <div class="ai-pill-row">
                <button
                  v-for="p in VIDEO_RATIO_PRESETS"
                  :key="p.value"
                  type="button"
                  class="ai-pill"
                  :class="{ 'ai-pill--on': videoRatio === p.value }"
                  @click="videoRatio = p.value"
                >
                  {{ p.label }}
                </button>
                <button
                  type="button"
                  class="ai-pill"
                  :class="{ 'ai-pill--on': videoRatio === 'adaptive' }"
                  @click="videoRatio = 'adaptive'"
                >
                  智能比例
                </button>
              </div>
            </div>
            <div class="ai-video-field-group">
              <div class="ai-video-block__label">分辨率</div>
              <div class="ai-pill-row">
                <button
                  v-for="res in VIDEO_RESOLUTIONS"
                  :key="res"
                  type="button"
                  class="ai-pill"
                  :class="{ 'ai-pill--on': videoResolution === res }"
                  @click="videoResolution = res"
                >
                  {{ res }}
                </button>
              </div>
            </div>
          </div>
          <div class="ai-video-row ai-video-row--controls">
            <div class="ai-video-cell ai-video-cell--row">
              <span class="ai-video-inline-label">时长</span>
              <div class="ai-duration-tabs">
                <button
                  type="button"
                  class="ai-duration-tab"
                  :class="{
                    'ai-duration-tab--on': videoDurationMode === 'seconds',
                  }"
                  @click="videoDurationMode = 'seconds'"
                >
                  按秒数
                </button>
                <button
                  type="button"
                  class="ai-duration-tab"
                  :class="{
                    'ai-duration-tab--on': videoDurationMode === 'smart',
                  }"
                  @click="videoDurationMode = 'smart'"
                >
                  智能时长
                </button>
              </div>
              <div
                v-if="videoDurationMode === 'seconds'"
                class="ai-slider-inline ai-slider-inline--nest"
              >
                <input
                  v-model.number="videoDurationSec"
                  type="range"
                  min="4"
                  max="12"
                  step="1"
                  class="ai-range ai-range--thin"
                />
                <span class="ai-slider-val">{{ videoDurationSec }} 秒</span>
              </div>
            </div>
            <div class="ai-video-cell ai-video-cell--row">
              <span class="ai-video-inline-label">条数</span>
              <div class="ai-slider-inline ai-slider-inline--nest">
                <input
                  v-model.number="videoCount"
                  type="range"
                  min="1"
                  max="4"
                  step="1"
                  class="ai-range ai-range--thin"
                />
                <span class="ai-slider-val">{{ videoCount }} 条</span>
              </div>
            </div>
            <div
              class="ai-video-cell ai-video-cell--row ai-video-cell--switch"
            >
              <span class="ai-video-inline-label">输出声音</span>
              <label class="ai-switch">
                <input
                  v-model="videoGenerateAudio"
                  type="checkbox"
                  class="ai-switch__input"
                />
                <span class="ai-switch__track" />
              </label>
            </div>
          </div>
          <div class="ai-video-seed-block">
            <div
              class="ai-video-row ai-video-row--seed ai-video-row--seed-dual"
            >
              <div class="ai-video-seed-cluster">
                <span
                  class="ai-video-block__label ai-video-block__label--inline"
                  >随机种子</span
                >
                <input
                  v-model="videoSeedStr"
                  type="text"
                  class="ai-seed-input"
                  placeholder="-1 为随机"
                  inputmode="numeric"
                />
                <button
                  type="button"
                  class="ai-seed-dice"
                  title="随机种子"
                  @click="randomizeVideoSeed"
                >
                  🎲
                </button>
              </div>
              <div class="ai-video-seed-cluster">
                <span
                  class="ai-video-block__label ai-video-block__label--inline"
                  >自动生成提示词</span
                >
                <label class="ai-switch">
                  <input
                    v-model="videoAutoExpandPrompt"
                    type="checkbox"
                    class="ai-switch__input"
                    :disabled="isLoading"
                  />
                  <span class="ai-switch__track" />
                </label>
              </div>
            </div>
          </div>
        </div>
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
            :disabled="
              !inputText.trim() &&
              !videoFirstFrameFile &&
              !videoLastFrameFile
            "
            @click="handleGenerate"
            >✨ 生成</AppButton
          >
        </div>
      </div>
      <div class="ai-output-area">
        <div v-if="outputText.trim()" class="ai-video-prompt-used">
          <div class="ai-video-prompt-used__label">
            用于生成视频的画面提示词
          </div>
          <pre class="ai-video-prompt-used__text">{{ outputText }}</pre>
        </div>
        <div v-if="isLoading" class="ai-loading">
          <div class="ai-loading__dots"><span /><span /><span /></div>
          <p>
            {{
              videoStatusHint || 'AI 正在生成视频，请稍候（通常需数分钟）…'
            }}
          </p>
        </div>
        <div v-else-if="generatedVideoUrls.length" class="ai-video-output">
          <div
            v-for="(url, i) in generatedVideoUrls"
            :key="i"
            class="ai-video-output__cell"
          >
            <video
              :src="url"
              class="ai-video-output__player"
              controls
              playsinline
              preload="metadata"
            />
            <div class="ai-output__actions">
              <button
                type="button"
                class="tag"
                @click="downloadGeneratedVideo(url)"
              >
                ⬇️ 下载视频
              </button>
              <button type="button" class="tag" @click="copyVideoUrl(url)">
                📋 复制链接
              </button>
              <button
                type="button"
                class="tag"
                @click="generatedVideoUrls = []"
              >
                清除
              </button>
            </div>
          </div>
        </div>
        <div v-else class="ai-output-empty">
          <p>填写参数与画面描述后点击「生成」</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="./ai-panel-common.css"></style>
<style src="./ai-video-panel.css"></style>

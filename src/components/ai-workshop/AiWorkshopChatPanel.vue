<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { streamChat } from '@/api/siliconflow'
import { useToast } from '@/composables/useToast'
import { syncTextareaHeight } from '@/lib/autoResizeTextarea'
import AppButton from '@/components/common/AppButton.vue'
import type { AIFeature } from '@/types'

const props = defineProps<{ feature: AIFeature }>()

const toast = useToast()
const inputText = ref('')
const thinkingMode = ref<'fast' | 'balanced' | 'deep'>('fast')
const outputText = ref('')
const thinkText = ref('')
const thinkExpanded = ref(true)
const isLoading = ref(false)
const isThinking = ref(false)
let abortFlag = false
let streamActive = false

const inputRef = ref<HTMLTextAreaElement | null>(null)
const TEXTAREA_MIN = 44
const TEXTAREA_MAX = 300

const langOptions = [
  '中文',
  'English',
  '日本语',
  '韩语',
  '法语',
  '德语',
  '西班牙语',
  '俄语',
]
const sourceLang = ref('中文')
const targetLang = ref('English')

const thinkingModes = [
  { value: 'fast' as const, label: '⚡ 快速', desc: '快速回答，适合日常对话' },
  { value: 'balanced' as const, label: '⚖️ 平衡', desc: '平衡效率与质量' },
  { value: 'deep' as const, label: '🧠 深思', desc: '深度思考，适合复杂任务' },
]

function swapLangs() {
  const tmp = sourceLang.value
  sourceLang.value = targetLang.value
  targetLang.value = tmp
}

function resizeInput() {
  nextTick(() =>
    syncTextareaHeight(inputRef.value, TEXTAREA_MIN, TEXTAREA_MAX),
  )
}

watch(inputText, resizeInput)

onMounted(() => resizeInput())

onBeforeUnmount(() => {
  streamActive = false
  abortFlag = true
})

async function handleGenerate() {
  if (!inputText.value.trim()) return
  if (isLoading.value) {
    abortFlag = true
    return
  }

  isLoading.value = true
  isThinking.value = false
  abortFlag = false
  streamActive = true
  outputText.value = ''
  thinkText.value = ''
  thinkExpanded.value = true

  const userInput =
    props.feature.id === '5'
      ? `[${sourceLang.value}] -> [${targetLang.value}]\n${inputText.value}`
      : inputText.value

  await streamChat({
    featureId: props.feature.id,
    userInput,
    thinkingMode: thinkingMode.value,
    onThink: (text) => {
      if (!streamActive || abortFlag) return
      isThinking.value = true
      thinkText.value += text
    },
    onChunk: (text) => {
      if (!streamActive || abortFlag) return
      isThinking.value = false
      if (!outputText.value) thinkExpanded.value = false
      outputText.value += text
    },
    onDone: () => {
      if (!streamActive) return
      isLoading.value = false
      thinkExpanded.value = false
    },
    onError: (err) => {
      if (!streamActive) return
      isLoading.value = false
      toast.error(err)
      if (!outputText.value) outputText.value = ''
      thinkText.value = ''
      thinkExpanded.value = true
    },
  })
}

function handleStop() {
  abortFlag = true
  isLoading.value = false
}

function copyOutput() {
  navigator.clipboard?.writeText(outputText.value)
  toast.success('复制成功')
}
</script>

<template>
  <div data-ai-workshop-panel class="ai-workshop-chat">
    <div class="ai-io">
      <div class="ai-input-area">
        <label class="ai-label">输入内容</label>
        <div v-if="feature.id === '5'" class="lang-switcher">
          <select v-model="sourceLang" class="lang-select">
            <option v-for="l in langOptions" :key="l" :value="l">
              {{ l }}
            </option>
          </select>
          <button
            type="button"
            class="lang-swap-btn"
            title="交换语言"
            @click="swapLangs"
          >
            🔄
          </button>
          <select v-model="targetLang" class="lang-select">
            <option v-for="l in langOptions" :key="l" :value="l">
              {{ l }}
            </option>
          </select>
        </div>
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
          <span v-if="isLoading && !isThinking" class="ai-streaming-badge"
            >● 生成中</span
          >
        </label>
        <div class="ai-input-btns">
          <select
            v-model="thinkingMode"
            class="mode-select"
            :disabled="isLoading"
          >
            <option
              v-for="mode in thinkingModes"
              :key="mode.value"
              :value="mode.value"
            >
              {{ mode.label }}
            </option>
          </select>
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
        <div v-if="thinkText" class="ai-think-block">
          <button
            type="button"
            class="ai-think-toggle"
            @click="thinkExpanded = !thinkExpanded"
          >
            <span class="ai-think-icon">🧠</span>
            <span>思考过程</span>
            <span v-if="isThinking" class="ai-streaming-badge">● 思考中</span>
            <span class="ai-think-arrow">{{
              thinkExpanded ? '▲' : '▼'
            }}</span>
          </button>
          <Transition name="think-slide">
            <div v-if="thinkExpanded" class="ai-think-content">
              <pre>{{ thinkText }}</pre>
            </div>
          </Transition>
        </div>
        <div v-if="isLoading && !outputText.trim()" class="ai-loading">
          <div class="ai-loading__dots"><span /><span /><span /></div>
          <p>
            {{ isThinking ? 'AI 正在思考中...' : 'AI 正在生成中...' }}
          </p>
        </div>
        <div v-else-if="outputText" class="ai-output">
          <pre class="ai-output__text"
            >{{ outputText
            }}<span v-if="isLoading" class="cursor-blink">▋</span></pre
          >
          <div v-if="!isLoading" class="ai-output__actions">
            <button type="button" class="tag" @click="copyOutput()">
              📋 复制
            </button>
            <button type="button" class="tag" @click="outputText = ''">
              清除
            </button>
            <button
              type="button"
              class="tag"
              @click="
                inputText = '';
                outputText = '';
              "
            >
              重置
            </button>
          </div>
        </div>
        <div v-else class="ai-output-empty">
          <p>在上方输入内容，点击「开始生成」</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="./ai-panel-common.css"></style>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { runSiteAssistantTurn, type AssistantChatMessage } from '@/api/siteAssistant'
import { useToast } from '@/composables/useToast'
import { syncTextareaHeight } from '@/lib/autoResizeTextarea'
import { snapFabToEdges } from '@/lib/snapFabToEdge'
import { emitMusicCommand } from '@/lib/musicBridge'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const toast = useToast()

const STORAGE_POS = 'ai-assistant-fab-pos'
/** 与下方样式中的宽高一致 */
const FAB = 52

const isOpen = ref(false)
const isDragging = ref(false)
const dragMoved = ref(false)
/** 避免首屏从默认坐标加载存档时触发 left/top 过渡 */
const fabSnapTransitionReady = ref(false)
const position = ref({ x: 24, y: typeof window !== 'undefined' ? window.innerHeight - FAB - 120 : 400 })
const messages = ref<AssistantChatMessage[]>([])
const DEFAULT_INPUT_PLACEHOLDER = '请输入'
/** 无消息时展示在消息区上方的完整说明（与输入框 placeholder 分离） */
const EMPTY_STATE_HINT =
  '在下方输入问题，或使用上方快捷操作。例如：打开首页、搜索 Vue 相关文章…'
const inputText = ref('')
/** 点「搜索文章/笔记…」等快捷项时：占位提示 + 发送时拼在用户输入前 */
const inputPlaceholder = ref(DEFAULT_INPUT_PLACEHOLDER)
const promptPrefix = ref('')
const isLoading = ref(false)
const listRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)
/** 单行：8+8 padding + 1.5×14 字号，与 .ai-assistant__textarea 一致 */
const TEXTAREA_MIN = 37
const TEXTAREA_MAX = 200

let dragStartX = 0
let dragStartY = 0
let posStartX = 0
let posStartY = 0
let dragPointerId: number | null = null
let dragListenersAttached = false
let abortCtl: AbortController | null = null

function removeFabDragListeners() {
  if (!dragListenersAttached) return
  dragListenersAttached = false
  window.removeEventListener('pointermove', onWindowPointerMoveFab, true)
  window.removeEventListener('pointerup', onWindowPointerUpFab, true)
  window.removeEventListener('pointercancel', onWindowPointerUpFab, true)
}

function onWindowPointerMoveFab(e: PointerEvent) {
  if (!isDragging.value || e.pointerId !== dragPointerId) return
  if (e.pointerType === 'touch') e.preventDefault()
  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  if (Math.abs(dx) + Math.abs(dy) > 4) dragMoved.value = true
  let nx = posStartX + dx
  let ny = posStartY + dy
  nx = Math.max(0, Math.min(nx, window.innerWidth - FAB))
  ny = Math.max(0, Math.min(ny, window.innerHeight - FAB))
  position.value = { x: nx, y: ny }
}

function onWindowPointerUpFab(e: PointerEvent) {
  if (!isDragging.value || e.pointerId !== dragPointerId) return
  removeFabDragListeners()
  dragPointerId = null
  isDragging.value = false
  if (!dragMoved.value) return
  const vw = window.innerWidth
  const vh = window.innerHeight
  const snapped = snapFabToEdges(
    position.value.x,
    position.value.y,
    FAB,
    vw,
    vh
  )
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      position.value = snapped
      savePos()
    })
  })
}

/** 面板用 fixed，避免与已 left/top 偏移的父级叠加导致水平错位 */
const panelStyle = computed(() => {
  if (typeof window === 'undefined') {
    return {
      position: 'fixed' as const,
      left: '12px',
      bottom: '120px',
      width: 'min(360px, calc(100vw - 24px))',
      maxHeight: 'min(72vh, 520px)',
      zIndex: '10001',
    }
  }
  const vw = window.innerWidth
  const vh = window.innerHeight
  const fabX = position.value.x
  const fabY = position.value.y
  const panelW = Math.min(360, vw - 24)
  const margin = 12
  const gap = 10
  const fabCenterX = fabX + FAB / 2
  const maxH = Math.min(vh * 0.72, 520)
  // 面板底边与悬浮按钮底边对齐（同一水平线）
  const bottomPx = vh - fabY - FAB

  const base: Record<string, string> = {
    position: 'fixed',
    bottom: `${bottomPx}px`,
    width: `${panelW}px`,
    maxHeight: `${maxH}px`,
    zIndex: '10001',
  }

  if (fabCenterX < vw / 2) {
    let left = fabX + FAB + gap
    if (left + panelW > vw - margin) left = vw - margin - panelW
    if (left < margin) left = margin
    base.left = `${left}px`
    base.right = 'auto'
  } else {
    const panelLeft = fabX - gap - panelW
    if (panelLeft >= margin) {
      base.right = `${vw - fabX + gap}px`
      base.left = 'auto'
    } else {
      base.left = `${margin}px`
      base.right = 'auto'
    }
  }

  return base
})

const canSend = computed(() => {
  const composed = promptPrefix.value
    ? `${promptPrefix.value}${inputText.value}`.trim()
    : inputText.value.trim()
  return !!composed
})

function loadPos() {
  try {
    const s = localStorage.getItem(STORAGE_POS)
    if (s) {
      const { x, y } = JSON.parse(s) as { x: number; y: number }
      if (typeof x === 'number' && typeof y === 'number') {
        position.value = {
          x: Math.max(0, Math.min(x, window.innerWidth - FAB)),
          y: Math.max(0, Math.min(y, window.innerHeight - FAB)),
        }
      }
    }
  } catch {
    /* noop */
  }
}

function savePos() {
  localStorage.setItem(STORAGE_POS, JSON.stringify(position.value))
}

function resizeInput() {
  nextTick(() => syncTextareaHeight(inputRef.value, TEXTAREA_MIN, TEXTAREA_MAX))
}

watch(inputText, resizeInput)
watch(isOpen, (open) => {
  if (open) nextTick(resizeInput)
})

onMounted(() => {
  loadPos()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      fabSnapTransitionReady.value = true
    })
  })
  resizeInput()
})

onUnmounted(() => {
  removeFabDragListeners()
  dragPointerId = null
  isDragging.value = false
  abortCtl?.abort()
})

function onFabPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  isDragging.value = true
  dragMoved.value = false
  dragPointerId = e.pointerId
  dragStartX = e.clientX
  dragStartY = e.clientY
  posStartX = position.value.x
  posStartY = position.value.y
  if (!dragListenersAttached) {
    dragListenersAttached = true
    window.addEventListener('pointermove', onWindowPointerMoveFab, { capture: true, passive: false })
    window.addEventListener('pointerup', onWindowPointerUpFab, true)
    window.addEventListener('pointercancel', onWindowPointerUpFab, true)
  }
}

function togglePanel(e?: MouseEvent) {
  if (e && dragMoved.value) {
    dragMoved.value = false
    return
  }
  isOpen.value = !isOpen.value
  if (isOpen.value) void scrollToBottom()
}

async function scrollToBottom() {
  await nextTick()
  const el = listRef.value
  if (el) el.scrollTop = el.scrollHeight
}

async function sendMessage(text?: string) {
  let t: string
  if (text !== undefined) {
    t = text.trim()
  } else if (promptPrefix.value) {
    t = `${promptPrefix.value}${inputText.value}`.trim()
  } else {
    t = inputText.value.trim()
  }
  if (!t || isLoading.value) return
  inputText.value = ''
  promptPrefix.value = ''
  inputPlaceholder.value = DEFAULT_INPUT_PLACEHOLDER
  resizeInput()
  messages.value.push({ role: 'user', content: t })
  await scrollToBottom()
  isLoading.value = true
  abortCtl?.abort()
  abortCtl = new AbortController()
  try {
    const history = messages.value.slice(0, -1)
    const reply = await runSiteAssistantTurn(history, t, router, { signal: abortCtl.signal })
    messages.value.push({
      role: 'assistant',
      content: reply.content,
      searchBlocks: reply.searchBlocks,
    })
  } catch (e) {
    if ((e as Error).name === 'AbortError') return
    const msg = e instanceof Error ? e.message : '请求失败'
    toast.error(msg)
    messages.value.push({ role: 'assistant', content: `出错了：${msg}` })
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    void sendMessage()
  }
}

function goBlogNew() {
  isOpen.value = false
  router.push('/blog/new')
}

function goNotesNew() {
  isOpen.value = false
  router.push('/notes/new')
}

/** 与 `src/data/ai-features.ts` 中 id 对应 */
function goAiFeature(featureId: string) {
  isOpen.value = false
  router.push({ path: '/ai', query: { feature: featureId } })
}

function fillPrompt(placeholderHint: string) {
  inputText.value = ''
  promptPrefix.value = placeholderHint
  inputPlaceholder.value = placeholderHint
  resizeInput()
}

type QuickChip = { label: string; run: () => void }
type QuickChipGroup = { items: QuickChip[] }

/** 分组：音乐直连播放器；写作/搜索；AI 工坊指定卡片（不经大模型） */
const quickActionGroups: QuickChipGroup[] = [
  {
    items: [
      { label: '播放/暂停音乐', run: () => emitMusicCommand({ type: 'toggle_play' }) },
      { label: '循环播放', run: () => emitMusicCommand({ type: 'set_loop', mode: 'all' }) },
      { label: '上一首', run: () => emitMusicCommand({ type: 'prev' }) },
      { label: '下一首', run: () => emitMusicCommand({ type: 'next' }) },
    ],
  },
  {
    items: [
      { label: '写文章', run: goBlogNew },
      { label: '写笔记', run: goNotesNew },
      { label: '搜索文章…', run: () => fillPrompt('帮我搜索文章，关键词：') },
      { label: '搜索笔记…', run: () => fillPrompt('帮我搜索笔记，关键词：') },
    ],
  },
  {
    items: [
      { label: 'AI 生图', run: () => goAiFeature('11') },
      { label: 'AI 食谱', run: () => goAiFeature('9') },
      { label: 'AI 医生', run: () => goAiFeature('10') },
    ],
  },
]
</script>

<template>
  <div
    class="ai-assistant"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
    :class="{
      'ai-assistant--dragging': isDragging,
      'ai-assistant--snap-ease': fabSnapTransitionReady,
    }"
  >
    <button
      type="button"
      class="ai-assistant__fab"
      aria-label="打开 AI 助手"
      @pointerdown="onFabPointerDown"
      @click="togglePanel"
    >
      <span class="ai-assistant__fab-icon">🤖</span>
    </button>

    <Transition name="ai-asst-pop">
      <div
        v-show="isOpen"
        class="ai-assistant__panel"
        :style="panelStyle"
        :aria-hidden="!isOpen"
        @mousedown.stop
      >
        <div class="ai-assistant__head">
          <h3 class="ai-assistant__title">AI 助手</h3>
          <button type="button" class="ai-assistant__close" aria-label="关闭" @click="isOpen = false">✕</button>
        </div>
        <p class="ai-assistant__hint">需要我为您做些什么？</p>
        <div class="ai-assistant__chip-groups">
          <div
            v-for="(grp, gi) in quickActionGroups"
            :key="gi"
            class="ai-assistant__chip-group"
          >
            <div class="ai-assistant__chips">
              <button
                v-for="(q, qi) in grp.items"
                :key="`${gi}-${qi}`"
                type="button"
                class="ai-assistant__chip"
                :disabled="isLoading"
                @click="q.run()"
              >
                {{ q.label }}
              </button>
            </div>
          </div>
        </div>

        <div ref="listRef" class="ai-assistant__messages">
          <div v-if="messages.length === 0" class="ai-assistant__empty">{{ EMPTY_STATE_HINT }}</div>
          <div
            v-for="(m, idx) in messages"
            :key="idx"
            :class="['ai-assistant__msg', m.role === 'user' ? 'ai-assistant__msg--user' : 'ai-assistant__msg--bot']"
          >
            <span class="ai-assistant__msg-role">{{ m.role === 'user' ? '你' : '助手' }}</span>
            <div class="ai-assistant__msg-body">
              <template v-if="m.role === 'assistant' && m.searchBlocks?.length">
                <div v-if="m.content.trim()" class="ai-assistant__msg-text">{{ m.content }}</div>
                <div
                  v-for="(block, bi) in m.searchBlocks"
                  :key="`${block.kind}-${bi}`"
                  class="ai-assistant__search-block"
                >
                  <p class="ai-assistant__search-label">{{ block.label }}</p>
                  <ol class="ai-assistant__search-list">
                    <li
                      v-for="(it, ii) in block.items"
                      :key="`${it.path}-${ii}`"
                      class="ai-assistant__search-item"
                    >
                      <RouterLink
                        :to="it.path"
                        class="ai-assistant__search-link"
                        @click="isOpen = false"
                      >
                        {{ it.title }}
                      </RouterLink>
                      <span v-if="it.category" class="ai-assistant__search-cat">（{{ it.category }}）</span>
                    </li>
                  </ol>
                </div>
              </template>
              <div v-else class="ai-assistant__msg-text">{{ m.content }}</div>
            </div>
          </div>
          <div v-if="isLoading" class="ai-assistant__typing">思考中…</div>
        </div>

        <div class="ai-assistant__input-row">
          <textarea
            ref="inputRef"
            v-model="inputText"
            class="ai-assistant__textarea"
            rows="1"
            :placeholder="inputPlaceholder"
            :disabled="isLoading"
            @keydown="onKeydown"
          />
          <AppButton :disabled="isLoading || !canSend" @click="sendMessage()">发送</AppButton>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.ai-assistant {
  position: fixed;
  z-index: 10000;
  user-select: none;
}

.ai-assistant.ai-assistant--snap-ease {
  transition:
    left var(--fab-snap-duration) var(--fab-snap-ease),
    top var(--fab-snap-duration) var(--fab-snap-ease);
}

.ai-assistant--dragging {
  cursor: grabbing;
  transition: none;
}
.ai-assistant__fab {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  cursor: grab;
  touch-action: none;
  background: linear-gradient(145deg, #6b9cf5 0%, #8b6fd8 100%);
  box-shadow: 0 6px 20px color-mix(in srgb, var(--color-primary) 45%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}
.ai-assistant__fab:hover {
  transform: scale(1.06);
  box-shadow: 0 8px 26px color-mix(in srgb, var(--color-primary) 50%, transparent);
}
.ai-assistant__fab-icon {
  font-size: 1.45rem;
  line-height: 1;
  pointer-events: none;
}
.ai-assistant__panel {
  /* position / bottom / width / max-height 由 panelStyle（fixed 视口坐标）控制 */
  display: flex;
  flex-direction: column;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  backdrop-filter: var(--blur-lg);
  overflow: hidden;
}
.ai-assistant__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border);
}
.ai-assistant__title {
  margin: 0;
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text-primary);
}
.ai-assistant__close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  color: var(--color-text-muted);
  padding: 4px 8px;
  border-radius: var(--radius-md);
}
.ai-assistant__close:hover {
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  color: var(--color-primary);
}
.ai-assistant__hint {
  margin: 0;
  padding: 8px 14px 4px;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
.ai-assistant__chip-groups {
  border-bottom: 1px solid var(--color-border);
}
.ai-assistant__chip-group + .ai-assistant__chip-group {
  border-top: 1px solid var(--color-border-subtle, var(--color-border));
}
.ai-assistant__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 12px 8px;
}
.ai-assistant__chip {
  padding: 5px 10px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-bg-glass);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.ai-assistant__chip:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.ai-assistant__chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ai-assistant__messages {
  flex: 1;
  min-height: 120px;
  max-height: 240px;
  overflow-y: auto;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ai-assistant__empty {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-align: center;
  padding: 20px 8px;
  line-height: 1.55;
  max-width: 100%;
}
.ai-assistant__msg {
  border-radius: var(--radius-lg);
  padding: 8px 10px;
  font-size: var(--text-sm);
  line-height: 1.55;
  word-break: break-word;
}
.ai-assistant__msg-text {
  white-space: pre-wrap;
}
.ai-assistant__msg--user {
  align-self: flex-end;
  max-width: 92%;
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
}
.ai-assistant__msg--bot {
  align-self: stretch;
  background: var(--color-bg-glass);
  border: 1px solid var(--color-border);
}
.ai-assistant__msg-role {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}
.ai-assistant__msg-body {
  color: var(--color-text-secondary);
}
.ai-assistant__search-block {
  margin-top: 8px;
}
.ai-assistant__search-block:first-child {
  margin-top: 0;
}
.ai-assistant__search-label {
  margin: 0 0 6px;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-muted);
}
.ai-assistant__search-list {
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ai-assistant__search-item {
  padding-left: 2px;
}
.ai-assistant__search-link {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast);
}
.ai-assistant__search-link:hover {
  border-bottom-color: var(--color-primary);
}
.ai-assistant__search-cat {
  margin-left: 6px;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-weight: 400;
}
.ai-assistant__typing {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  padding: 4px 0;
}
.ai-assistant__input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding: 10px 12px 12px;
  border-top: 1px solid var(--color-border);
}
.ai-assistant__textarea {
  flex: 1;
  min-width: 0;
  resize: none;
  min-height: 37px;
  max-height: 200px;
  overflow-y: hidden;
  overflow-x: hidden;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-glass);
  font-size: var(--text-sm);
  line-height: 1.5;
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  outline: none;
  box-sizing: border-box;
}
.ai-assistant__textarea:focus {
  border-color: var(--color-primary);
}
.ai-asst-pop-enter-active,
.ai-asst-pop-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.ai-asst-pop-enter-from,
.ai-asst-pop-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import {
  generateAgentWritingPrompt,
  generateAgentArticleDraft,
  generateAgentNoteDraft,
} from '@/api/agent'
import { articleApi, noteApi } from '@/api'
import { generateImages } from '@/api/siliconflow'
import {
  AI_IMAGE_STYLES,
  DEFAULT_AI_IMAGE_STYLE_ID,
  getAiImageStyleById,
  buildCoverImagePrompt,
} from '@/data'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/common/AppButton.vue'
import type { AgentArticleDraft, AgentNoteDraft } from '@/types'

type TaskMode = 'article' | 'note'
type PipelineStepStatus = 'pending' | 'active' | 'done' | 'error'
type PipelineStepId = 'prompt' | 'draft' | 'cover' | 'save'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const taskMode = ref<TaskMode>('article')
const userInput = ref('')
const isRunning = ref(false)
const writingPrompt = ref('')
const articleDraft = ref<AgentArticleDraft | null>(null)
const noteDraft = ref<AgentNoteDraft | null>(null)
const failedStepId = ref<string | null>(null)
const errorMessage = ref('')
const abortController = ref<AbortController | null>(null)

/** 本轮「执行」仍可从失败步骤续跑 1 次；点击「继续」后耗尽 */
const canResumeOnce = ref(true)
/** 文章：封面生成成功后的 URL，供发布与从「发布」步续跑 */
const pendingCoverUrl = ref('')
/** 全流程成功后用于「前往详情」，不自动跳转 */
const createdId = ref<string | null>(null)
const createdKind = ref<'article' | 'note' | null>(null)

/** 文章流水线：封面生图风格 */
const coverImageStyleId = ref(DEFAULT_AI_IMAGE_STYLE_ID)

/** 当前进行到第几步（0-based），用于高亮进度条 */
const activeIndex = ref(-1)

const showResumeButton = computed(
  () =>
    !!errorMessage.value &&
    !!failedStepId.value &&
    canResumeOnce.value &&
    !isRunning.value
)

const showGoDetailButton = computed(() => !!createdId.value && !!createdKind.value && !isRunning.value)

const steps = computed(() => {
  const base = [
    { id: 'prompt', label: '生成写作提示词', icon: '🧭' },
    { id: 'draft', label: '生成标题、摘要与正文', icon: '✍️' },
  ]
  if (taskMode.value === 'article') {
    base.push({ id: 'cover', label: '火山 AI 生成封面', icon: '🖼️' })
  }
  base.push({ id: 'save', label: '发布', icon: '📤' })
  return base
})

const stepStatuses = ref<Record<string, PipelineStepStatus>>({})

function resetStepStatuses() {
  const m: Record<string, PipelineStepStatus> = {}
  for (const s of steps.value) m[s.id] = 'pending'
  stepStatuses.value = m
}

watch(
  steps,
  () => resetStepStatuses(),
  { immediate: true }
)

function setStepStatus(id: string, status: PipelineStepStatus) {
  stepStatuses.value = { ...stepStatuses.value, [id]: status }
  if (status === 'active') failedStepId.value = null
  if (status === 'error') failedStepId.value = id
}

function stepIndex(id: string): number {
  return steps.value.findIndex((s) => s.id === id)
}

function handleStop() {
  abortController.value?.abort()
  abortController.value = null
  isRunning.value = false
  activeIndex.value = -1
}

function stepOrderList(): PipelineStepId[] {
  const o: PipelineStepId[] = ['prompt', 'draft']
  if (taskMode.value === 'article') o.push('cover')
  o.push('save')
  return o
}

function goToCreatedDetail() {
  const id = createdId.value
  const kind = createdKind.value
  if (!id || !kind) return
  if (kind === 'article') router.push({ name: 'blog-detail', params: { id } })
  else router.push({ name: 'notes-detail', params: { id } })
}

/** 从头执行：清空状态，并允许本轮失败后再续跑 1 次 */
async function runPipeline() {
  if (!userInput.value.trim() || isRunning.value) return
  if (!authStore.isLoggedIn) {
    toast.warning('请先登录管理员账号以创建内容')
    router.push({ name: 'login', query: { redirect: '/ai/agent' } })
    return
  }

  createdId.value = null
  createdKind.value = null
  pendingCoverUrl.value = ''
  errorMessage.value = ''
  writingPrompt.value = ''
  articleDraft.value = null
  noteDraft.value = null
  failedStepId.value = null
  canResumeOnce.value = true
  resetStepStatuses()
  await runPipelineInternal('prompt')
}

/** 从失败步骤再试一次（仅一次机会） */
async function resumeFromFailedStep() {
  if (!failedStepId.value || !canResumeOnce.value || isRunning.value) return
  const from = failedStepId.value as PipelineStepId
  if (!stepOrderList().includes(from)) return

  canResumeOnce.value = false
  errorMessage.value = ''
  failedStepId.value = null
  setStepStatus(from, 'pending')
  await runPipelineInternal(from)
}

async function runPipelineInternal(startFrom: PipelineStepId) {
  if (!authStore.isLoggedIn) return

  isRunning.value = true
  const ac = new AbortController()
  abortController.value = ac
  const signal = ac.signal
  const author = authStore.user?.nickname || '晨光'
  const order = stepOrderList()
  let startIdx = order.indexOf(startFrom)
  if (startIdx === -1) startIdx = 0

  try {
    for (let i = startIdx; i < order.length; i++) {
      const id = order[i]
      if (signal.aborted) throw new Error('已取消')

      if (id === 'prompt') {
        setStepStatus('prompt', 'active')
        activeIndex.value = stepIndex('prompt')
        const wp = await generateAgentWritingPrompt(taskMode.value, userInput.value.trim(), {
          signal,
        })
        writingPrompt.value = wp
        setStepStatus('prompt', 'done')
        continue
      }

      if (id === 'draft') {
        const wp = writingPrompt.value.trim()
        if (!wp) throw new Error('缺少写作提示词，请从头执行')
        pendingCoverUrl.value = ''
        setStepStatus('draft', 'active')
        activeIndex.value = stepIndex('draft')
        if (taskMode.value === 'article') {
          const draft = await generateAgentArticleDraft(userInput.value.trim(), wp, { signal })
          articleDraft.value = draft
          noteDraft.value = null
        } else {
          const draft = await generateAgentNoteDraft(userInput.value.trim(), wp, { signal })
          noteDraft.value = draft
          articleDraft.value = null
        }
        setStepStatus('draft', 'done')
        continue
      }

      if (id === 'cover') {
        const d = articleDraft.value
        if (!d) throw new Error('缺少文章草稿，无法生成封面')
        setStepStatus('cover', 'active')
        activeIndex.value = stepIndex('cover')
        const style = getAiImageStyleById(coverImageStyleId.value) || AI_IMAGE_STYLES[0]
        const imgPrompt = buildCoverImagePrompt(
          (d.coverPrompt || d.title).trim(),
          style,
        )
        try {
          const urls = await generateImages(imgPrompt, 1)
          pendingCoverUrl.value = urls[0] || ''
        } catch (e) {
          const msg = e instanceof Error ? e.message : '封面生成失败'
          errorMessage.value = msg
          setStepStatus('cover', 'error')
          failedStepId.value = 'cover'
          throw new Error(`封面步骤失败：${msg}`)
        }
        setStepStatus('cover', 'done')
        continue
      }

      if (id === 'save') {
        setStepStatus('save', 'active')
        activeIndex.value = stepIndex('save')
        const now = dayjs().format('YYYY-MM-DD')

        if (taskMode.value === 'article' && articleDraft.value) {
          const d = articleDraft.value
          const created = await articleApi.create({
            title: d.title,
            summary: d.summary,
            content: d.content,
            cover: pendingCoverUrl.value,
            category: d.category,
            tags: d.tags,
            author,
            featured: d.featured,
            publishedAt: now,
            updatedAt: now,
            views: 0,
            likes: 0,
            comments: 0,
          })
          createdId.value = created.id
          createdKind.value = 'article'
          setStepStatus('save', 'done')
          toast.success('文章已创建')
        } else if (noteDraft.value) {
          const d = noteDraft.value
          const created = await noteApi.create({
            title: d.title,
            content: d.content,
            category: d.category,
            tags: d.tags,
            color: d.color,
            pinned: d.pinned,
            createdAt: now,
            updatedAt: now,
          })
          createdId.value = created.id
          createdKind.value = 'note'
          setStepStatus('save', 'done')
          toast.success('笔记已创建')
        } else {
          throw new Error('缺少草稿，无法发布')
        }
      }
    }

    activeIndex.value = steps.value.length
  } catch (e) {
    const msg = e instanceof Error ? e.message : '执行失败'
    if (msg === '已取消' || (e instanceof DOMException && e.name === 'AbortError')) {
      toast.info('已停止')
      return
    }
    errorMessage.value = msg
    if (!failedStepId.value) {
      const cur = steps.value[activeIndex.value]
      if (cur) {
        setStepStatus(cur.id, 'error')
        failedStepId.value = cur.id
      }
    }
    toast.error(msg)
  } finally {
    isRunning.value = false
    abortController.value = null
  }
}
</script>

<template>
  <div class="agent-page">
    <section class="agent-hero">
      <div class="agent-hero__bg">
        <div class="agent-blob agent-blob--1" />
        <div class="agent-blob agent-blob--2" />
      </div>
      <div class="agent-hero__inner">
        <div class="agent-hero-title-wrapper">
          <div class="agent-hero__icon animate-float">🤖</div>
          <h1 class="agent-hero__title">写作 Agent</h1>
        </div>
        <p class="agent-hero__subtitle">
          选择任务、描述需求，由火山模型生成提示词与正文，再一键写入文章或笔记。
        </p>
        <div class="agent-hero__stats">
          <span class="agent-stat">🔥 豆包写作模型</span>
          <span class="agent-stat">✍️ 文章 / 笔记</span>
          <span class="agent-stat">🖼️ 文章封面 AI 生成</span>
        </div>
      </div>
    </section>

    <div class="agent-body">
      <div class="agent-container glass-card">
        <div class="agent-header">
          <h2 class="agent-title">任务与描述</h2>
          <p class="agent-desc">选择你要做的事情，输入描述，点击执行，将自动生成与发布</p>
        </div>

        <div class="agent-modes" role="tablist" aria-label="任务类型">
          <button
            type="button"
            role="tab"
            :aria-selected="taskMode === 'article'"
            :class="['agent-mode-chip', { 'agent-mode-chip--active': taskMode === 'article' }]"
            :disabled="isRunning"
            @click="taskMode = 'article'"
          >
            <span class="agent-mode-chip__icon" aria-hidden="true">📝</span>
            <span class="agent-mode-chip__label">写文章</span>
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="taskMode === 'note'"
            :class="['agent-mode-chip', { 'agent-mode-chip--active': taskMode === 'note' }]"
            :disabled="isRunning"
            @click="taskMode = 'note'"
          >
            <span class="agent-mode-chip__icon" aria-hidden="true">📔</span>
            <span class="agent-mode-chip__label">写笔记</span>
          </button>
        </div>

        <div class="agent-field">
          <label class="agent-label">要写什么</label>
          <textarea
            v-model="userInput"
            class="agent-textarea"
            rows="4"
            placeholder="例如：写一篇面向前端初学者的 Vue3 入门教程，语气轻松，带示例代码；或：记录本周项目排期与待办..."
            :disabled="isRunning"
          />
        </div>

        <div v-if="taskMode === 'article'" class="agent-field">
          <div class="select-with-label">
            <span class="select-with-label__text">生图风格</span>
            <select
              v-model="coverImageStyleId"
              class="agent-style-select"
              :disabled="isRunning"
            >
              <option v-for="s in AI_IMAGE_STYLES" :key="s.id" :value="s.id">
                {{ s.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="agent-actions">
          <AppButton
            v-if="!isRunning"
            :disabled="!userInput.trim()"
            @click="runPipeline"
          >
            ✨ 执行
          </AppButton>
          <button v-else type="button" class="agent-stop-btn" @click="handleStop">
            ⏹ 停止
          </button>
        </div>

        <div v-if="writingPrompt" class="agent-preview">
          <h3 class="agent-preview__title">AI 生成的写作提示词</h3>
          <p class="agent-preview__text">{{ writingPrompt }}</p>
        </div>

        <div v-if="articleDraft" class="agent-preview agent-preview--muted">
          <h3 class="agent-preview__title">即将发布的文章</h3>
          <p class="agent-preview__meta">
            <strong>{{ articleDraft.title }}</strong>
            · {{ articleDraft.category }}
            <span v-if="articleDraft.tags.length"> · {{ articleDraft.tags.join(', ') }}</span>
          </p>
          <p class="agent-preview__summary">{{ articleDraft.summary }}</p>
        </div>

        <div v-if="noteDraft" class="agent-preview agent-preview--muted">
          <h3 class="agent-preview__title">即将发布的笔记</h3>
          <p class="agent-preview__meta">
            <strong>{{ noteDraft.title }}</strong>
            · {{ noteDraft.category }}
          </p>
        </div>
      </div>

      <div class="agent-progress glass-card">
        <h3 class="agent-progress__title">执行进度</h3>
        <div v-if="errorMessage" class="agent-progress__error-block">
          <p class="agent-progress__error">
            <span class="agent-progress__error-icon">⚠️</span>
            {{ errorMessage }}
            <span v-if="failedStepId" class="agent-progress__error-step">
              （卡在：{{ steps.find((s) => s.id === failedStepId)?.label }}）
            </span>
          </p>
          <button
            v-if="showResumeButton"
            type="button"
            class="agent-resume-btn"
            @click="resumeFromFailedStep"
          >
            从当前步骤继续（本轮仅剩 1 次）
          </button>
        </div>
        <div class="agent-pipeline" role="list">
          <template v-for="(s, i) in steps" :key="s.id">
            <div
              class="agent-pipeline__step"
              :class="[
                `agent-pipeline__step--${stepStatuses[s.id] || 'pending'}`,
                { 'agent-pipeline__step--current': activeIndex === i && isRunning },
              ]"
              role="listitem"
            >
              <div class="agent-pipeline__node">
                <span
                  v-if="stepStatuses[s.id] === 'done'"
                  class="agent-pipeline__badge agent-pipeline__badge--ok"
                  aria-label="已完成"
                >✓</span>
                <span
                  v-else-if="stepStatuses[s.id] === 'error'"
                  class="agent-pipeline__badge agent-pipeline__badge--err"
                  aria-label="失败"
                >✕</span>
                <span
                  v-else-if="stepStatuses[s.id] === 'active' && isRunning"
                  class="agent-pipeline__badge agent-pipeline__badge--run"
                >{{ s.icon }}</span>
                <span v-else class="agent-pipeline__badge agent-pipeline__badge--idle">{{ s.icon }}</span>
              </div>
              <span class="agent-pipeline__label">{{ s.label }}</span>
            </div>
            <div
              v-if="i < steps.length - 1"
              class="agent-pipeline__link"
              :class="{ 'agent-pipeline__link--passed': stepStatuses[s.id] === 'done' }"
              aria-hidden="true"
            >
              <span class="agent-pipeline__link-line" />
              <span class="agent-pipeline__link-arrow">→</span>
            </div>
          </template>
        </div>
        <div v-if="isRunning" class="agent-progress__loading">
          <div class="agent-progress__dots"><span /><span /><span /></div>
          <span>正在执行当前步骤…</span>
        </div>
        <div v-if="showGoDetailButton" class="agent-progress__done">
          <p class="agent-progress__done-text">已全部执行完成</p>
          <AppButton @click="goToCreatedDetail">
            {{ createdKind === 'article' ? '📄 前往文章详情' : '📔 前往笔记详情' }}
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.agent-hero {
  position: relative;
  padding: 56px 24px 36px;
  text-align: center;
  overflow: hidden;
}
.agent-hero__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.agent-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.35;
}
.agent-blob--1 {
  width: 380px;
  height: 380px;
  background: rgba(91, 138, 240, 0.22);
  top: -90px;
  right: -80px;
  animation: float 8s ease-in-out infinite;
}
.agent-blob--2 {
  width: 320px;
  height: 320px;
  background: rgba(139, 111, 240, 0.15);
  bottom: -50px;
  left: -50px;
  animation: float 10s ease-in-out infinite reverse;
}
.agent-hero__inner {
  position: relative;
  z-index: 1;
  max-width: 640px;
  margin: 0 auto;
}
.agent-hero-title-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}
.agent-hero__icon {
  font-size: 3rem;
  line-height: 1;
}
.agent-hero__title {
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.03em;
  margin-bottom: 8px;
}
.agent-hero__subtitle {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.6;
  margin-bottom: 16px;
}
.agent-hero__stats {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}
.agent-stat {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  background: var(--color-bg-card);
  padding: 6px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
}
.agent-body {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 80px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.agent-container {
  padding: 28px 32px 32px;
}
.agent-header {
  margin-bottom: 20px;
}
.agent-title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 6px;
}
.agent-desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0;
}
.agent-modes {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 12px;
  margin-bottom: 20px;
}
.agent-mode-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  min-width: 148px;
  padding: 12px 20px;
  border-radius: var(--radius-xl);
  border: 1.5px solid var(--color-border);
  background: var(--color-bg-card);
  cursor: pointer;
  transition:
    border-color var(--transition-base),
    background var(--transition-base),
    color var(--transition-base),
    box-shadow var(--transition-base),
    transform var(--transition-fast);
}
.agent-mode-chip__icon {
  font-size: 1.45rem;
  line-height: 1;
  flex-shrink: 0;
}
.agent-mode-chip__label {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}
.agent-mode-chip:hover:not(:disabled) {
  border-color: rgba(91, 138, 240, 0.45);
  box-shadow: var(--shadow-sm);
}
.agent-mode-chip:hover:not(:disabled) .agent-mode-chip__label {
  color: var(--color-primary);
}
.agent-mode-chip--active {
  border-color: var(--color-primary);
  background: rgba(91, 138, 240, 0.08);
  box-shadow: 0 0 0 3px rgba(91, 138, 240, 0.12);
}
.agent-mode-chip--active .agent-mode-chip__label {
  color: var(--color-primary);
}
.agent-mode-chip:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.agent-field {
  margin-bottom: 16px;
}
.agent-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}
.agent-style-select {
  width: auto;
  min-width: 11rem;
  max-width: 260px;
  padding: 8px 14px;
  background-color: var(--color-bg-glass);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  outline: none;
  cursor: pointer;
}
.agent-style-select:focus {
  border-color: var(--color-primary);
}
.agent-style-select:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
.agent-textarea {
  width: 100%;
  padding: 14px 16px;
  background: var(--color-bg-glass);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: border-color var(--transition-fast);
}
.agent-textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(91, 138, 240, 0.1);
}
.agent-textarea:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.agent-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}
.agent-stop-btn {
  height: 40px;
  padding: 0 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.agent-stop-btn:hover {
  border-color: #e8607a;
  color: #e8607a;
}
.agent-preview {
  margin-top: 20px;
  padding: 16px 18px;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(91, 138, 240, 0.2);
  background: rgba(91, 138, 240, 0.04);
}
.agent-preview--muted {
  background: var(--color-bg-glass);
  border-color: var(--color-border);
}
.agent-preview__title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}
.agent-preview__text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.75;
  margin: 0;
  white-space: pre-wrap;
}
.agent-preview__meta {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0 0 8px;
}
.agent-preview__summary {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.6;
}

.agent-progress {
  padding: 22px 24px 26px;
}
.agent-progress__title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 14px;
}
.agent-progress__error-block {
  margin-bottom: 16px;
}
.agent-progress__error {
  font-size: var(--text-sm);
  color: #c45c6a;
  background: rgba(232, 96, 122, 0.08);
  border: 1px solid rgba(232, 96, 122, 0.25);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  margin: 0 0 10px;
  line-height: 1.5;
}
.agent-progress__error-icon {
  margin-right: 4px;
}
.agent-progress__error-step {
  display: block;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin-top: 4px;
}
.agent-resume-btn {
  width: 100%;
  max-width: 320px;
  padding: 10px 16px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-primary);
  background: rgba(91, 138, 240, 0.08);
  color: var(--color-primary);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.agent-resume-btn:hover {
  background: rgba(91, 138, 240, 0.14);
}
.agent-progress__done {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.agent-progress__done-text {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-weight: 600;
}

/* 横向流水线：步骤 → 箭头 → 步骤 */
.agent-pipeline {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0 4px;
  row-gap: 12px;
  width: 100%;
}
.agent-pipeline__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 92px;
  flex-shrink: 0;
  transition: opacity var(--transition-base);
}
.agent-pipeline__step--pending {
  opacity: 0.85;
}
.agent-pipeline__step--pending .agent-pipeline__label {
  color: var(--color-text-muted);
}
.agent-pipeline__step--active .agent-pipeline__label,
.agent-pipeline__step--current .agent-pipeline__label {
  color: var(--color-primary);
  font-weight: 600;
}
.agent-pipeline__step--done .agent-pipeline__label {
  color: var(--color-text-secondary);
}
.agent-pipeline__step--error .agent-pipeline__label {
  color: #c45c6a;
  font-weight: 600;
}
.agent-pipeline__node {
  margin-bottom: 8px;
}
.agent-pipeline__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 1.15rem;
  line-height: 1;
  border: 2px solid var(--color-border);
  background: var(--color-bg-card);
  transition:
    border-color var(--transition-base),
    background var(--transition-base),
    box-shadow var(--transition-base);
}
.agent-pipeline__badge--idle {
  color: var(--color-text-muted);
  font-size: 1.2rem;
}
.agent-pipeline__badge--ok {
  border-color: #4caf82;
  background: linear-gradient(145deg, #5cbf8f 0%, #4caf82 100%);
  color: #fff;
  font-size: 1.15rem;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(76, 175, 130, 0.35);
}
.agent-pipeline__badge--err {
  border-color: #e57373;
  background: linear-gradient(145deg, #ef9a9a 0%, #e57373 100%);
  color: #fff;
  font-size: 1.05rem;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(229, 115, 115, 0.35);
}
.agent-pipeline__badge--run {
  border-color: var(--color-primary);
  background: rgba(91, 138, 240, 0.12);
  box-shadow: 0 0 0 3px rgba(91, 138, 240, 0.15);
  animation: pipeline-pulse 1.4s ease-in-out infinite;
}
.agent-pipeline__label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-align: center;
  line-height: 1.4;
  max-width: 100%;
}
.agent-pipeline__link {
  display: flex;
  align-items: center;
  align-self: center;
  position: relative;
  height: 44px;
  flex: 1 1 28px;
  min-width: 24px;
  max-width: 56px;
  margin: 0 2px;
  margin-bottom: 28px;
}
.agent-pipeline__link-line {
  position: absolute;
  left: 0;
  right: 1.1rem;
  top: 50%;
  height: 2px;
  margin-top: -1px;
  background: linear-gradient(90deg, var(--color-border) 0%, var(--color-border) 100%);
  border-radius: 1px;
  transition: background 0.35s ease;
}
.agent-pipeline__link--passed .agent-pipeline__link-line {
  background: linear-gradient(90deg, #4caf82 0%, rgba(91, 138, 240, 0.55) 100%);
}
.agent-pipeline__link-arrow {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.1rem;
  color: var(--color-text-muted);
  font-weight: 600;
  line-height: 1;
  transition: color 0.35s ease;
}
.agent-pipeline__link--passed .agent-pipeline__link-arrow {
  color: var(--color-primary);
}
@keyframes pipeline-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 3px rgba(91, 138, 240, 0.15);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(91, 138, 240, 0.08);
  }
}
.agent-progress__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
.agent-progress__dots {
  display: flex;
  gap: 5px;
}
.agent-progress__dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: bounce 1.2s ease-in-out infinite;
}
.agent-progress__dots span:nth-child(2) {
  animation-delay: 0.2s;
}
.agent-progress__dots span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.15);
    opacity: 1;
  }
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}
.animate-float {
  animation: float 3s ease-in-out infinite;
}
@media (max-width: 768px) {
  .agent-pipeline {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
  }
  .agent-pipeline__step {
    width: 100%;
    flex-direction: row;
    justify-content: flex-start;
    gap: 14px;
    max-width: 360px;
    margin: 0 auto;
  }
  .agent-pipeline__node {
    margin-bottom: 0;
    flex-shrink: 0;
  }
  .agent-pipeline__label {
    text-align: left;
    padding-top: 10px;
    font-size: var(--text-sm);
  }
  .agent-pipeline__link {
    width: 2px;
    min-width: 0;
    max-width: none;
    height: 20px;
    flex: none;
    margin: 4px auto 4px 21px;
    align-self: flex-start;
  }
  .agent-pipeline__link-line {
    left: 50%;
    right: auto;
    top: 0;
    bottom: 0;
    width: 2px;
    height: 100%;
    margin-top: 0;
    margin-left: -1px;
    background: var(--color-border);
  }
  .agent-pipeline__link--passed .agent-pipeline__link-line {
    background: linear-gradient(180deg, #4caf82 0%, rgba(91, 138, 240, 0.55) 100%);
  }
  .agent-pipeline__link-arrow {
    display: none;
  }
}
</style>

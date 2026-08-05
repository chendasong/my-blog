<script setup lang="ts">
/**
 * 知识库正文阅读面板：渲染 Markdown/HTML、右侧大纲、滚动高亮。
 * 正文与目录树分离加载，避免元数据未就绪时误报「文章不存在」。
 */
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useAuthStore } from '@/stores/auth'
import { useAiKnowledgeStore } from '@/stores/aiKnowledge'
import AppButton from '@/components/common/AppButton.vue'
import AiKnowledgeArticleSkeleton from '@/pages/ai-knowledge/AiKnowledgeArticleSkeleton.vue'
import {
  KNOWLEDGE_HEADING_SCROLL_OFFSET,
  syncTocWithRenderedHeadings,
  type KnowledgeTocItem,
} from '@/lib/aiKnowledgeMarkdown'
import { isStoredArticleHtml } from '@/lib/articleContent'

const props = defineProps<{ articleId: string }>()
const emit = defineEmits<{ addFolder: [] }>()

const router = useRouter()
const authStore = useAuthStore()
const store = useAiKnowledgeStore()

/** Suspense 子组件：等待父级 DOM 就绪后再挂载，避免 bodyRef 取不到 */
await nextTick()

/** 正文 prose 容器，用于提取标题生成大纲 */
const bodyRef = ref<HTMLElement | null>(null)
/** 从渲染后 DOM 同步出的大纲项列表 */
const tocItems = ref<KnowledgeTocItem[]>([])
/** 当前滚动位置对应的高亮大纲项 ID */
const activeTocId = ref<string | null>(null)
/** 点击大纲跳转后短暂锁定滚动监听，防止高亮来回跳动 */
let tocScrollLockUntil = 0

/** 文章元数据（标题、更新时间等），不含正文内容 */
const articleSummary = computed(() => {
  const id = props.articleId
  if (!id) return null
  return store.getArticle(id) ?? null
})

/** 目录树未就绪：有 articleId 但元数据尚未入 store，应显示骨架而非「不存在」 */
const articleMetaLoading = computed(() => {
  if (!props.articleId) return false
  return !store.libraryHydrated || store.loading
})

/** 目录树已加载且确认无此文 */
const articleNotFound = computed(() => {
  if (!props.articleId) return false
  if (articleMetaLoading.value) return false
  return !articleSummary.value
})

/** 正文是否已拉取并写入 store */
const contentReady = computed(() => {
  const id = props.articleId
  if (!id) return false
  return store.isArticleContentLoaded(id)
})

/** 正文加载中：含 idle/loading 状态及 store 层 loading 标记 */
const contentLoading = computed(() => {
  const id = props.articleId
  if (!id) return false
  if (!store.libraryHydrated) return true
  const status = store.contentStatus[id]
  if (status === 'idle' || status === 'loading') return true
  return store.isArticleContentLoading(id)
})

const contentError = computed(() => {
  const id = props.articleId
  if (!id) return null
  return store.getArticleContentError(id)
})

/** 将正文转为安全 HTML：已是 HTML 则直接净化，否则 Markdown 解析后净化 */
const htmlBody = computed(() => {
  const a = articleSummary.value
  if (!a || !contentReady.value) return ''
  if (isStoredArticleHtml(a.content)) {
    return DOMPurify.sanitize(a.content, { USE_PROFILES: { html: true } })
  }
  const raw = marked.parse(a.content) as string
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
})

/** 后台刷新目录时，在已有正文上方叠一层骨架，避免整页闪烁 */
const showRefetchOverlay = computed(
  () => store.loading && store.libraryHydrated && !!articleSummary.value && contentReady.value,
)

/** 滚动高亮：主栏滚动容器顶栏下的参考线 */
const TOC_ACTIVE_PAD = 28
/** 大纲滚动监听：缓存各标题 DOM 节点，避免每次 scroll 都 querySelector */
let tocHeadingEls: { id: string; el: HTMLElement }[] = []
let tocScrollRaf = 0
let tocScrollTarget: HTMLElement | Window | null = null
let tocMq: MediaQueryList | null = null

const TOC_DESKTOP_MQ = '(min-width: 1101px)'

/** 确定实际滚动容器：宽屏用 .ak-main，窄屏内容撑开时改用 window */
function getMainScroller(): HTMLElement | null {
  const el = bodyRef.value?.closest('.ak-main') as HTMLElement | null
  if (!el) return null
  // 宽屏锁视口时由 .ak-main 滚动；窄屏壳高随内容撑开时改由 window 滚动
  if (window.matchMedia(TOC_DESKTOP_MQ).matches) return el
  if (el.scrollHeight > el.clientHeight + 1) return el
  return null
}

function getScrollLineTop(scroller: HTMLElement | null): number {
  if (scroller) return scroller.getBoundingClientRect().top + TOC_ACTIVE_PAD
  return KNOWLEDGE_HEADING_SCROLL_OFFSET + 12
}

function findHeadingInBody(id: string): HTMLElement | null {
  if (!bodyRef.value) return null
  return bodyRef.value.querySelector<HTMLElement>(`#${CSS.escape(id)}`)
}

function rebuildTocHeadingCache() {
  tocHeadingEls = tocItems.value
    .map((item) => {
      const el = findHeadingInBody(item.id)
      return el ? { id: item.id, el } : null
    })
    .filter((x): x is { id: string; el: HTMLElement } => x != null)
}

/** 根据参考线位置更新 activeTocId：参考线以下的最后一个标题即为当前章节 */
function updateActiveTocFromScroll() {
  if (performance.now() < tocScrollLockUntil) return
  if (tocHeadingEls.length === 0) return

  const scroller = getMainScroller()
  const line = getScrollLineTop(scroller)

  let nextId = tocHeadingEls[0].id
  for (const { id, el } of tocHeadingEls) {
    if (el.getBoundingClientRect().top <= line) nextId = id
    else break
  }
  if (activeTocId.value !== nextId) activeTocId.value = nextId
}

function onTocScroll() {
  if (tocScrollRaf) return
  tocScrollRaf = requestAnimationFrame(() => {
    tocScrollRaf = 0
    updateActiveTocFromScroll()
  })
}

function setupTocScrollSpy() {
  teardownTocScrollSpy()
  const items = tocItems.value
  if (!bodyRef.value || items.length === 0) {
    activeTocId.value = null
    return
  }
  rebuildTocHeadingCache()
  if (!activeTocId.value && items[0]) activeTocId.value = items[0].id
  updateActiveTocFromScroll()
  const scroller = getMainScroller()
  tocScrollTarget = scroller ?? window
  tocScrollTarget.addEventListener('scroll', onTocScroll, { passive: true })
  tocMq = window.matchMedia(TOC_DESKTOP_MQ)
  tocMq.addEventListener('change', onTocViewportChange)
}

function onTocViewportChange() {
  // 断点切换时重新绑定滚动容器（.ak-main ↔ window）
  setupTocScrollSpy()
}

function teardownTocScrollSpy() {
  if (tocScrollTarget) {
    tocScrollTarget.removeEventListener('scroll', onTocScroll)
    tocScrollTarget = null
  }
  if (tocMq) {
    tocMq.removeEventListener('change', onTocViewportChange)
    tocMq = null
  }
  if (tocScrollRaf) {
    cancelAnimationFrame(tocScrollRaf)
    tocScrollRaf = 0
  }
  tocHeadingEls = []
}

/** 正文或大纲变化后，重新扫描 DOM 生成大纲并绑定滚动监听 */
async function refreshBodyAndToc() {
  const id = props.articleId
  if (!id || !contentReady.value) {
    tocItems.value = []
    activeTocId.value = null
    teardownTocScrollSpy()
    return
  }

  await nextTick()
  for (let i = 0; i < 8 && !bodyRef.value; i += 1) {
    await nextTick()
  }
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
  if (!bodyRef.value) return

  tocItems.value = syncTocWithRenderedHeadings(bodyRef.value)
  if (tocItems.value[0]) activeTocId.value = tocItems.value[0].id
  setupTocScrollSpy()
}

watch(
  () => props.articleId,
  () => {
    activeTocId.value = null
    tocScrollLockUntil = 0
    tocItems.value = []
    teardownTocScrollSpy()
    void refreshBodyAndToc()
  },
)

watch(
  () => [props.articleId, contentReady.value, htmlBody.value] as const,
  () => {
    void refreshBodyAndToc()
  },
  { flush: 'post', immediate: true },
)

watch(bodyRef, (el) => {
  if (el && props.articleId && contentReady.value) void refreshBodyAndToc()
})

/** 点击大纲项：滚动到对应标题，并短暂锁定高亮更新 */
function scrollToHeading(id: string) {
  const el = findHeadingInBody(id)
  if (!el) return
  activeTocId.value = id
  tocScrollLockUntil = performance.now() + 900
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  const scroller = getMainScroller()
  if (scroller) {
    const top = Math.max(
      0,
      el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - TOC_ACTIVE_PAD,
    )
    scroller.scrollTo({ top, behavior })
    return
  }
  const top = Math.max(
    0,
    el.getBoundingClientRect().top + window.scrollY - KNOWLEDGE_HEADING_SCROLL_OFFSET,
  )
  window.scrollTo({ top, behavior })
}

/** 正文加载失败后强制重新拉取 */
function retryContent() {
  const id = props.articleId
  if (!id) return
  void store.ensureArticleContent(id, { force: true })
}

onUnmounted(() => {
  teardownTocScrollSpy()
})
</script>

<template>
  <AiKnowledgeArticleSkeleton v-if="articleMetaLoading" />

  <div v-else class="ak-article-grid-host">
    <main
      class="ak-main"
      :class="{
        'ak-main--empty': !props.articleId || articleNotFound,
        'ak-main--rel': !!articleSummary,
      }"
    >
      <div v-if="showRefetchOverlay" class="ak-local-loading ak-local-loading--article" aria-hidden="true">
        <div class="ak-skeleton-line ak-skeleton-line--lg" style="max-width: 55%" />
        <div class="ak-skeleton-line" />
        <div class="ak-skeleton-line" style="max-width: 80%" />
      </div>

      <div :class="{ 'ak-sidebar-dim': showRefetchOverlay }" class="ak-article-main-body">
        <template v-if="!props.articleId">
          <div class="ak-empty-centered">
            <div class="ak-empty-visual" aria-hidden="true">📚</div>
            <p class="ak-empty-title">暂无文章</p>
            <p class="ak-empty-desc">可在左侧目录浏览，或登录后新建目录与文章。</p>
            <AppButton v-if="authStore.isLoggedIn" variant="primary" @click="emit('addFolder')">新建目录</AppButton>
          </div>
        </template>
        <template v-else-if="articleNotFound">
          <div class="ak-empty-centered">
            <div class="ak-empty-visual" aria-hidden="true">📄</div>
            <p class="ak-empty-title">文章不存在</p>
            <p class="ak-empty-desc">该链接可能已失效，请从左侧目录重新选择。</p>
            <AppButton variant="secondary" @click="router.push({ name: 'ai-knowledge-index' })">返回知识库</AppButton>
          </div>
        </template>
        <template v-else>
          <div class="ak-article-reading">
            <header class="ak-main__header">
              <h1 class="ak-main__title">{{ articleSummary.title }}</h1>
              <div class="ak-main__meta">
                <span>更新于 {{ articleSummary.updatedAt }}</span>
              </div>
            </header>

            <div v-if="contentError" class="ak-body ak-body--status">
              <p class="ak-muted">正文加载失败：{{ contentError }}</p>
              <AppButton variant="secondary" size="sm" @click="retryContent">重试</AppButton>
            </div>
            <div v-else-if="contentLoading" class="ak-body ak-skeleton">
              <div class="ak-skeleton-line ak-skeleton-line--lg" />
              <div class="ak-skeleton-line" />
              <div class="ak-skeleton-line" />
              <div class="ak-skeleton-line ak-skeleton-line--short" />
            </div>
            <div v-else ref="bodyRef" class="ak-body">
              <div class="prose" v-html="htmlBody" />
            </div>
          </div>
        </template>
      </div>
    </main>

    <aside v-if="articleSummary && contentReady" class="ak-outline" aria-label="大纲">
      <div class="ak-outline__title">大纲</div>
      <p v-if="!tocItems.length" class="ak-muted ak-outline__empty">本文暂无标题大纲</p>
      <ul v-else class="ak-outline__list">
        <li v-for="item in tocItems" :key="item.id">
          <button
            type="button"
            class="ak-outline__link"
            :class="[
              `ak-outline__link--h${item.level}`,
              { 'ak-outline__link--active': activeTocId === item.id },
            ]"
            @click="scrollToHeading(item.id)"
          >
            {{ item.text }}
          </button>
        </li>
      </ul>
    </aside>
  </div>
</template>

<style scoped>
.ak-article-main-body {
  position: relative;
  z-index: 0;
  width: 100%;
}

.ak-body--status {
  text-align: center;
  padding: var(--space-8) var(--space-4);
}
</style>

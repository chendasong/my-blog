<script setup lang="ts">
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

await nextTick()

const bodyRef = ref<HTMLElement | null>(null)
const tocItems = ref<KnowledgeTocItem[]>([])
const activeTocId = ref<string | null>(null)
let tocScrollLockUntil = 0

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

const contentReady = computed(() => {
  const id = props.articleId
  if (!id) return false
  return store.isArticleContentLoaded(id)
})

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

const htmlBody = computed(() => {
  const a = articleSummary.value
  if (!a || !contentReady.value) return ''
  if (isStoredArticleHtml(a.content)) {
    return DOMPurify.sanitize(a.content, { USE_PROFILES: { html: true } })
  }
  const raw = marked.parse(a.content) as string
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
})

const showRefetchOverlay = computed(
  () => store.loading && store.libraryHydrated && !!articleSummary.value && contentReady.value,
)

/** 滚动高亮：已越过顶栏参考线的最后一个标题（比 IO 稳定，不会来回跳） */
const TOC_ACTIVE_LINE = KNOWLEDGE_HEADING_SCROLL_OFFSET + 12
let tocHeadingEls: { id: string; el: HTMLElement }[] = []
let tocScrollRaf = 0

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

function updateActiveTocFromScroll() {
  if (performance.now() < tocScrollLockUntil) return
  if (tocHeadingEls.length === 0) return

  let nextId = tocHeadingEls[0].id
  for (const { id, el } of tocHeadingEls) {
    if (el.getBoundingClientRect().top <= TOC_ACTIVE_LINE) nextId = id
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
  window.addEventListener('scroll', onTocScroll, { passive: true })
  window.addEventListener('resize', onTocScroll, { passive: true })
}

function teardownTocScrollSpy() {
  window.removeEventListener('scroll', onTocScroll)
  window.removeEventListener('resize', onTocScroll)
  if (tocScrollRaf) {
    cancelAnimationFrame(tocScrollRaf)
    tocScrollRaf = 0
  }
  tocHeadingEls = []
}

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

function scrollToHeading(id: string) {
  const el = findHeadingInBody(id)
  if (!el) return
  activeTocId.value = id
  tocScrollLockUntil = performance.now() + 900
  const top = Math.max(
    0,
    el.getBoundingClientRect().top + window.scrollY - KNOWLEDGE_HEADING_SCROLL_OFFSET,
  )
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  window.scrollTo({ top, behavior })
}

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

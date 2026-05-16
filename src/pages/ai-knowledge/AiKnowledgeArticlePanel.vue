<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useAuthStore } from '@/stores/auth'
import { useAiKnowledgeStore } from '@/stores/aiKnowledge'
import AppButton from '@/components/common/AppButton.vue'
import {
  buildTocFromArticleBody,
  applyHeadingIdsFromToc,
  type KnowledgeTocItem,
} from '@/lib/aiKnowledgeMarkdown'
import { isStoredArticleHtml } from '@/lib/articleContent'

const props = defineProps<{ articleId: string }>()
const emit = defineEmits<{ addFolder: [] }>()

const router = useRouter()
const authStore = useAuthStore()
const store = useAiKnowledgeStore()

await store.ensureLibraryLoaded()
await nextTick()
await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))

const bodyRef = ref<HTMLElement | null>(null)
const activeTocId = ref<string | null>(null)

const currentArticle = computed(() => {
  const id = props.articleId
  if (!id) return null
  return store.getArticle(id) ?? null
})

const htmlBody = computed(() => {
  const a = currentArticle.value
  if (!a) return ''
  if (isStoredArticleHtml(a.content)) {
    return DOMPurify.sanitize(a.content, { USE_PROFILES: { html: true } })
  }
  const raw = marked.parse(a.content) as string
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
})

const toc = computed(() => {
  const a = currentArticle.value
  if (!a) return [] as KnowledgeTocItem[]
  return buildTocFromArticleBody(a.content)
})

const showRefetchOverlay = computed(() => store.loading && store.libraryHydrated && !!currentArticle.value)

let io: IntersectionObserver | null = null

function setupTocObserver() {
  io?.disconnect()
  io = null
  if (!bodyRef.value || toc.value.length === 0) {
    activeTocId.value = null
    return
  }
  const rootMargin = '-15% 0px -60% 0px'
  io = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]?.target?.id) activeTocId.value = visible[0].target.id
    },
    { root: null, rootMargin, threshold: [0, 0.25, 0.5, 1] },
  )
  for (const item of toc.value) {
    const el = document.getElementById(item.id)
    if (el) io.observe(el)
  }
  if (!activeTocId.value && toc.value[0]) activeTocId.value = toc.value[0].id
}

async function refreshBodyAndToc() {
  await nextTick()
  applyHeadingIdsFromToc(bodyRef.value, toc.value)
  setupTocObserver()
}

watch(
  () => props.articleId,
  async (id, prev) => {
    if (!id) return
    if (id !== prev) {
      await nextTick()
      await new Promise<void>((r) => requestAnimationFrame(() => r()))
    }
    await refreshBodyAndToc()
  },
  { immediate: true },
)

watch([htmlBody, toc], refreshBodyAndToc, { flush: 'post' })

function scrollToHeading(id: string) {
  const el = document.getElementById(id)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onUnmounted(() => {
  io?.disconnect()
  io = null
})
</script>

<template>
  <div class="ak-article-grid-host">
    <main class="ak-main" :class="{ 'ak-main--empty': !props.articleId || !currentArticle, 'ak-main--rel': !!currentArticle }">
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
        <template v-else-if="!currentArticle">
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
              <h1 class="ak-main__title">{{ currentArticle.title }}</h1>
              <div class="ak-main__meta">
                <span>更新于 {{ currentArticle.updatedAt }}</span>
              </div>
            </header>
            <div ref="bodyRef" class="ak-body">
              <div class="prose" v-html="htmlBody" />
            </div>
          </div>
        </template>
      </div>
    </main>

    <aside v-if="currentArticle" class="ak-outline" aria-label="大纲">
      <div class="ak-outline__title">大纲</div>
      <p v-if="!toc.length" class="ak-muted ak-outline__empty">本文暂无标题大纲</p>
      <ul v-else class="ak-outline__list">
        <li v-for="item in toc" :key="item.id">
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
  height: 100%;
}
</style>

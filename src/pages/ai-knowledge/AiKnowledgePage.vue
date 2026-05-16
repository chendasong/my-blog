<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAiKnowledgeStore } from '@/stores/aiKnowledge'
import AppButton from '@/components/common/AppButton.vue'
import type { KnowledgeArticle } from '@/types/aiKnowledge'
import AiKnowledgeSidebarPanel from '@/pages/ai-knowledge/AiKnowledgeSidebarPanel.vue'
import AiKnowledgeSidebarSkeleton from '@/pages/ai-knowledge/AiKnowledgeSidebarSkeleton.vue'
import AiKnowledgeArticlePanel from '@/pages/ai-knowledge/AiKnowledgeArticlePanel.vue'
import AiKnowledgeArticleSkeleton from '@/pages/ai-knowledge/AiKnowledgeArticleSkeleton.vue'

defineOptions({ name: 'AiKnowledgePage' })

const SIDEBAR_COLLAPSED_KEY = 'ak-sidebar-collapsed'

const route = useRoute()
const router = useRouter()
const store = useAiKnowledgeStore()

const articleIdParam = computed(() => (route.params.articleId as string) || '')

const currentArticle = computed(() => {
  const id = articleIdParam.value
  if (!id) return null
  return store.getArticle(id) ?? null
})

const shellThree = computed(() => !!currentArticle.value)

const sidebarCollapsed = ref(
  typeof localStorage !== 'undefined' && localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1',
)

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed.value ? '1' : '0')
}

function redirectFromIndexToFirstArticle() {
  if (!store.libraryHydrated || store.loading) return
  if (route.name !== 'ai-knowledge-index') return
  if (articleIdParam.value) return
  const first = store.firstArticleId()
  if (first) router.replace({ name: 'ai-knowledge-article', params: { articleId: first }, replace: true })
}

watch(currentArticle, (a) => {
  if (route.name !== 'ai-knowledge-article') return
  if (!articleIdParam.value) return
  if (!store.libraryHydrated || store.loading) return
  if (a) return
  const nextId = store.firstArticleId()
  if (nextId) router.replace({ name: 'ai-knowledge-article', params: { articleId: nextId } })
  else router.replace({ name: 'ai-knowledge-index' })
})

watch(
  () =>
    [
      store.libraryHydrated,
      store.loading,
      route.name,
      articleIdParam.value,
      store.folders.length,
      store.allArticleList.length,
    ] as const,
  redirectFromIndexToFirstArticle,
  { flush: 'post', immediate: true },
)

/** 目录树就绪后再拉正文，避免竞态误报「文章不存在」 */
watch(
  () => [articleIdParam.value, store.libraryHydrated] as const,
  ([id, hydrated]) => {
    if (!id || !hydrated) return
    void store.ensureArticleContent(id)
  },
  { immediate: true },
)

onMounted(() => {
  void nextTick().then(() => {
    redirectFromIndexToFirstArticle()
  })
})

const folderModal = ref<'add' | 'rename' | null>(null)
const folderModalTargetId = ref<string | null>(null)
const folderModalInput = ref('')

function openAddFolder() {
  folderModal.value = 'add'
  folderModalTargetId.value = null
  folderModalInput.value = ''
}

function openRenameFolder(folderId: string, title: string) {
  folderModal.value = 'rename'
  folderModalTargetId.value = folderId
  folderModalInput.value = title
}

function closeFolderModal() {
  folderModal.value = null
  folderModalTargetId.value = null
  folderModalInput.value = ''
}

async function submitFolderModal() {
  const t = folderModalInput.value.trim()
  try {
    if (folderModal.value === 'add') {
      await store.addFolder(t || '未命名目录')
    } else if (folderModal.value === 'rename' && folderModalTargetId.value) {
      await store.renameFolder(folderModalTargetId.value, t)
    }
  } catch (e) {
    window.alert(e instanceof Error ? e.message : String(e))
  }
  closeFolderModal()
}

const deleteFolderConfirm = ref<string | null>(null)
function confirmDeleteFolder(folderId: string) {
  deleteFolderConfirm.value = folderId
}
async function doDeleteFolder() {
  const id = deleteFolderConfirm.value
  if (!id) return
  try {
    await store.deleteFolder(id)
  } catch (e) {
    window.alert(e instanceof Error ? e.message : String(e))
    return
  }
  deleteFolderConfirm.value = null
  const viewing = articleIdParam.value
  if (viewing && !store.getArticle(viewing)) {
    const n = store.firstArticleId()
    if (n) router.replace({ name: 'ai-knowledge-article', params: { articleId: n } })
    else router.replace({ name: 'ai-knowledge-index' })
  }
}

async function tryDeleteArticle(article: KnowledgeArticle) {
  if (!window.confirm(`确定删除文章「${article.title}」？此操作不可恢复。`)) return
  const id = article.id
  try {
    await store.deleteArticle(id)
  } catch (e) {
    window.alert(e instanceof Error ? e.message : String(e))
    return
  }
  if (articleIdParam.value === id) {
    const n = store.firstArticleId()
    if (n) router.replace({ name: 'ai-knowledge-article', params: { articleId: n } })
    else router.replace({ name: 'ai-knowledge-index' })
  }
}
</script>

<template>
  <div class="ak-page">
    <div
      class="ak-shell"
      :class="{
        'ak-shell--three': shellThree,
        'ak-shell--sidebar-collapsed': sidebarCollapsed,
      }"
    >
      <div class="ak-sidebar-rail" :class="{ 'ak-sidebar-rail--collapsed': sidebarCollapsed }">
        <aside v-show="!sidebarCollapsed" class="ak-sidebar">
          <Suspense>
            <AiKnowledgeSidebarPanel
            @add-folder="openAddFolder"
            @rename-folder="openRenameFolder"
            @confirm-delete-folder="confirmDeleteFolder"
            @delete-article="tryDeleteArticle"
            />
            <template #fallback>
              <AiKnowledgeSidebarSkeleton />
            </template>
          </Suspense>
        </aside>
        <button
          type="button"
          class="ak-sidebar-rail-toggle"
          :aria-label="sidebarCollapsed ? '展开目录' : '收起目录'"
          :title="sidebarCollapsed ? '展开目录' : '收起目录'"
          :aria-expanded="!sidebarCollapsed"
          @click="toggleSidebar"
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M10 4L6 8l4 4"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <Suspense>
        <AiKnowledgeArticlePanel :article-id="articleIdParam" @add-folder="openAddFolder" />
        <template #fallback>
          <AiKnowledgeArticleSkeleton />
        </template>
      </Suspense>
    </div>

    <div v-if="folderModal" class="ak-overlay" role="dialog" aria-modal="true" @click.self="closeFolderModal">
      <div class="ak-dialog glass-card">
        <h3 class="ak-dialog__title">{{ folderModal === 'add' ? '新建目录' : '重命名目录' }}</h3>
        <input v-model="folderModalInput" type="text" class="ak-input" placeholder="目录名称" @keyup.enter="submitFolderModal" />
        <div class="ak-dialog__actions">
          <AppButton variant="ghost" @click="closeFolderModal">取消</AppButton>
          <AppButton variant="primary" @click="submitFolderModal">确定</AppButton>
        </div>
      </div>
    </div>

    <div v-if="deleteFolderConfirm" class="ak-overlay" role="dialog" aria-modal="true" @click.self="deleteFolderConfirm = null">
      <div class="ak-dialog glass-card">
        <h3 class="ak-dialog__title">删除目录？</h3>
        <p class="ak-muted">将同时删除该目录下全部文章，且不可恢复。</p>
        <div class="ak-dialog__actions">
          <AppButton variant="ghost" @click="deleteFolderConfirm = null">取消</AppButton>
          <AppButton variant="warm" @click="doDeleteFolder">删除</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ak-page {
  min-height: calc(100vh - 64px);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  margin: 0;
  background: var(--color-bg);
  padding-bottom: var(--space-12);
}

.ak-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: var(--color-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.ak-dialog {
  width: 100%;
  max-width: 400px;
  padding: var(--space-6);
  border-radius: var(--radius-xl);
}

.ak-dialog__title {
  margin: 0 0 var(--space-4);
  font-size: var(--text-lg);
}

.ak-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  margin-bottom: var(--space-5);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}

.ak-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

.ak-muted {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  margin: 0 0 var(--space-4);
}
</style>

<style>
@import './aiKnowledgeShared.css';
</style>

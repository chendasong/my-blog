<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAiKnowledgeStore } from '@/stores/aiKnowledge'
import AppButton from '@/components/common/AppButton.vue'
import type { KnowledgeArticle, KnowledgeFolder } from '@/types/aiKnowledge'

const emit = defineEmits<{
  addFolder: []
  renameFolder: [folderId: string, title: string]
  confirmDeleteFolder: [folderId: string]
  deleteArticle: [article: KnowledgeArticle]
}>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const store = useAiKnowledgeStore()

await store.ensureLibraryLoaded()
await nextTick()
await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))

const searchQuery = ref('')

const folderList = computed(() => [...store.folders])
const searchResults = computed(() => store.search(searchQuery.value))
const isSearchMode = computed(() => searchQuery.value.trim().length > 0)

const showRefetchOverlay = computed(() => store.loading && store.libraryHydrated)

function articlesInFolder(folder: KnowledgeFolder): KnowledgeArticle[] {
  return folder.articleIds.map((id) => store.articles[id]).filter(Boolean) as KnowledgeArticle[]
}

function goArticle(id: string) {
  searchQuery.value = ''
  store.expandFolderForArticle(id)
  router.push({ name: 'ai-knowledge-article', params: { articleId: id } })
}

function onFolderHeadClick(folderId: string) {
  store.toggleFolder(folderId)
}

const articleIdParam = computed(() => (route.params.articleId as string) || '')

watch(
  articleIdParam,
  (id) => {
    if (id) store.expandFolderForArticle(id)
  },
  { immediate: true },
)
</script>

<template>
  <div class="ak-sidebar-inner">
    <div v-if="store.error" class="ak-sidebar-error-banner">
      <p>{{ store.error }}</p>
      <AppButton size="sm" variant="secondary" @click="store.fetchLibrary()">重试</AppButton>
    </div>

    <div v-if="showRefetchOverlay" class="ak-local-loading ak-local-loading--sidebar" aria-hidden="true">
      <div class="ak-skel-sidebar__search" />
      <div class="ak-skel-sidebar__rows">
        <div class="ak-skel-sidebar__folder" />
        <div class="ak-skel-sidebar__folder" />
        <div class="ak-skel-sidebar__folder" />
      </div>
    </div>

    <div :class="{ 'ak-sidebar-dim': showRefetchOverlay }" class="ak-sidebar-body">
      <div class="ak-search-wrap">
        <input
          v-model="searchQuery"
          type="search"
          class="ak-search"
          placeholder="请输入关键词搜索相关内容"
          autocomplete="off"
        />
      </div>
      <div class="ak-sidebar-tools">
        <div class="ak-sidebar-tools__expand">
          <button type="button" class="ak-tree-ctrl" @click="store.expandAllFolders()">全部展开</button>
          <span class="ak-tree-ctrl-sep" aria-hidden="true">·</span>
          <button type="button" class="ak-tree-ctrl" @click="store.collapseAllFolders()">全部收起</button>
        </div>
        <AppButton v-if="authStore.isLoggedIn" size="sm" variant="secondary" @click="emit('addFolder')">
          新建目录
        </AppButton>
      </div>

      <div v-if="isSearchMode" class="ak-tree ak-tree--search">
        <p v-if="!searchResults.length" class="ak-muted">未找到匹配内容</p>
        <button
          v-for="row in searchResults"
          :key="row.article.id"
          type="button"
          class="ak-search-hit"
          @click="goArticle(row.article.id)"
        >
          <span class="ak-search-hit__title">{{ row.article.title }}</span>
          <span class="ak-search-hit__folder">{{ row.folderTitle }}</span>
        </button>
      </div>

      <nav v-else class="ak-tree" aria-label="知识库目录">
        <div v-for="folder in folderList" :key="folder.id" class="ak-folder">
          <div
            class="ak-folder__head"
            role="button"
            tabindex="0"
            :aria-expanded="store.isFolderExpanded(folder.id)"
            @click="onFolderHeadClick(folder.id)"
            @keydown.enter.prevent="onFolderHeadClick(folder.id)"
            @keydown.space.prevent="onFolderHeadClick(folder.id)"
          >
            <span
              class="ak-folder__chevron"
              :class="{ 'ak-folder__chevron--open': store.isFolderExpanded(folder.id) }"
              aria-hidden="true"
            >
              <svg class="ak-folder__chevron-svg" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6 5l4 3-4 3"
                  stroke="currentColor"
                  stroke-width="1.35"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <span class="ak-folder__icon">{{ folder.icon || '📁' }}</span>
            <span class="ak-folder__title">{{ folder.title }}</span>
            <span v-if="authStore.isLoggedIn" class="ak-folder__actions" @click.stop>
              <button
                type="button"
                class="ak-icon-btn"
                title="在此目录新建文章"
                @click="router.push({ name: 'ai-knowledge-new', query: { folderId: folder.id } })"
              >
                ＋
              </button>
              <button
                type="button"
                class="ak-icon-btn"
                title="重命名目录"
                @click="emit('renameFolder', folder.id, folder.title)"
              >
                ✎
              </button>
              <button
                type="button"
                class="ak-icon-btn ak-icon-btn--danger"
                title="删除目录"
                @click="emit('confirmDeleteFolder', folder.id)"
              >
                🗑
              </button>
            </span>
          </div>
          <ul v-show="store.isFolderExpanded(folder.id)" class="ak-articles">
            <li
              v-for="art in articlesInFolder(folder)"
              :key="art.id"
              class="ak-article-row"
              :class="{ 'ak-article-row--active': art.id === articleIdParam }"
            >
              <button type="button" class="ak-article-link" @click="goArticle(art.id)">
                {{ art.title }}
              </button>
              <span v-if="authStore.isLoggedIn" class="ak-article-actions" @click.stop>
                <button
                  type="button"
                  class="ak-icon-btn ak-icon-btn--tiny"
                  title="编辑"
                  @click="router.push({ name: 'ai-knowledge-edit', params: { articleId: art.id } })"
                >
                  ✎
                </button>
                <button
                  type="button"
                  class="ak-icon-btn ak-icon-btn--tiny ak-icon-btn--danger"
                  title="删除文章"
                  @click="emit('deleteArticle', art)"
                >
                  🗑
                </button>
              </span>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.ak-sidebar-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchKnowledgeLibrary,
  insertFolder,
  updateFolder,
  removeFolder,
  insertArticle,
  updateArticleRow,
  removeArticle,
} from '@/api/knowledgeLibrary'
import type { KnowledgeArticle, KnowledgeFolder } from '@/types/aiKnowledge'

export const useAiKnowledgeStore = defineStore('aiKnowledge', () => {
  const folders = ref<KnowledgeFolder[]>([])
  const articles = ref<Record<string, KnowledgeArticle>>({})
  const expandedFolderIds = ref<Set<string>>(new Set())
  const loading = ref(false)
  const error = ref<string | null>(null)
  /** 至少完成过一次拉取（成功或失败） */
  const libraryHydrated = ref(false)
  let loadSeq = 0
  let currentFetch: Promise<void> | null = null

  function mergeExpandedFromFolders(list: KnowledgeFolder[]) {
    const next = new Set(expandedFolderIds.value)
    for (const f of list) next.add(f.id)
    expandedFolderIds.value = next
  }

  function fetchLibrary(): Promise<void> {
    if (currentFetch) return currentFetch

    const seq = ++loadSeq
    loading.value = true
    error.value = null

    const p = (async (): Promise<void> => {
      try {
        const data = await fetchKnowledgeLibrary()
        if (seq !== loadSeq) return
        folders.value = data.folders
        articles.value = data.articles
        mergeExpandedFromFolders(data.folders)
      } catch (e) {
        if (seq !== loadSeq) return
        error.value = e instanceof Error ? e.message : String(e)
        console.error('[aiKnowledge]', e)
      } finally {
        if (seq === loadSeq) {
          loading.value = false
          libraryHydrated.value = true
        }
      }
    })()

    currentFetch = p.finally(() => {
      currentFetch = null
    })
    return currentFetch
  }

  /** 首屏与并发：与 fetchLibrary 共享同一 in-flight Promise */
  async function ensureLibraryLoaded() {
    if (libraryHydrated.value && !loading.value) return
    await fetchLibrary()
  }

  const allArticleList = computed(() => Object.values(articles.value))

  function getArticle(id: string): KnowledgeArticle | undefined {
    return articles.value[id]
  }

  function firstArticleId(): string | null {
    for (const f of folders.value) {
      const aid = f.articleIds[0]
      if (aid && articles.value[aid]) return aid
    }
    return null
  }

  function folderById(id: string): KnowledgeFolder | undefined {
    return folders.value.find((f) => f.id === id)
  }

  function toggleFolder(id: string) {
    const s = expandedFolderIds.value
    if (s.has(id)) s.delete(id)
    else s.add(id)
    expandedFolderIds.value = new Set(s)
  }

  function isFolderExpanded(id: string) {
    return expandedFolderIds.value.has(id)
  }

  function search(query: string): { article: KnowledgeArticle; folderTitle: string }[] {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const out: { article: KnowledgeArticle; folderTitle: string }[] = []
    for (const a of allArticleList.value) {
      const folder = folderById(a.folderId)
      const hay = `${a.title}\n${a.content}`.toLowerCase()
      if (hay.includes(q)) {
        out.push({ article: a, folderTitle: folder?.title ?? '' })
      }
    }
    return out
  }

  async function addFolder(title: string, icon = '📁') {
    const id = `folder-${crypto.randomUUID().slice(0, 8)}`
    await insertFolder(id, title.trim() || '未命名目录', icon)
    await fetchLibrary()
    expandedFolderIds.value = new Set(expandedFolderIds.value).add(id)
  }

  async function renameFolder(folderId: string, title: string) {
    const f = folderById(folderId)
    const t = title.trim() || f?.title || '未命名目录'
    await updateFolder(folderId, { title: t })
    await fetchLibrary()
  }

  async function deleteFolder(folderId: string) {
    await removeFolder(folderId)
    await fetchLibrary()
  }

  async function addArticle(folderId: string, title: string, content = '# 新文章\n\n') {
    const folder = folderById(folderId)
    if (!folder) return null
    const id = `art-${crypto.randomUUID().slice(0, 8)}`
    await insertArticle({
      id,
      folderId,
      title: title.trim() || '未命名文章',
      content,
    })
    await fetchLibrary()
    return id
  }

  async function updateArticle(patch: Partial<KnowledgeArticle> & { id: string }) {
    const cur = articles.value[patch.id]
    if (!cur) return
    await updateArticleRow({
      id: patch.id,
      title: patch.title,
      content: patch.content,
      folderId: patch.folderId,
      previousFolderId: cur.folderId,
    })
    await fetchLibrary()
  }

  async function deleteArticle(articleId: string) {
    await removeArticle(articleId)
    await fetchLibrary()
  }

  return {
    folders,
    articles,
    expandedFolderIds,
    loading,
    error,
    libraryHydrated,
    allArticleList,
    fetchLibrary,
    ensureLibraryLoaded,
    getArticle,
    firstArticleId,
    folderById,
    toggleFolder,
    isFolderExpanded,
    search,
    addFolder,
    renameFolder,
    deleteFolder,
    addArticle,
    updateArticle,
    deleteArticle,
  }
})

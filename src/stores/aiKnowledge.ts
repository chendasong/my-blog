import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchKnowledgeTree,
  fetchArticleContentById,
  insertFolder,
  updateFolder,
  removeFolder,
  insertArticle,
  updateArticleRow,
  removeArticle,
} from '@/api/knowledgeLibrary'
import type { ArticleContentStatus, KnowledgeArticle, KnowledgeFolder } from '@/types/aiKnowledge'

export const useAiKnowledgeStore = defineStore('aiKnowledge', () => {
  const folders = ref<KnowledgeFolder[]>([])
  const articles = ref<Record<string, KnowledgeArticle>>({})
  const contentStatus = ref<Record<string, ArticleContentStatus>>({})
  const contentError = ref<Record<string, string | null>>({})
  const expandedFolderIds = ref<Set<string>>(new Set())
  const loading = ref(false)
  const error = ref<string | null>(null)
  const libraryHydrated = ref(false)
  let loadSeq = 0
  let currentFetch: Promise<void> | null = null
  const contentInflight = new Map<string, Promise<void>>()

  function syncExpandedFolders(list: KnowledgeFolder[]) {
    const valid = new Set(list.map((f) => f.id))
    const next = new Set([...expandedFolderIds.value].filter((id) => valid.has(id)))
    if (next.size === 0 && list.length > 0) {
      for (const f of list) next.add(f.id)
    }
    expandedFolderIds.value = next
  }

  function expandFolder(id: string) {
    if (!id) return
    const next = new Set(expandedFolderIds.value)
    next.add(id)
    expandedFolderIds.value = next
  }

  function expandAllFolders() {
    expandedFolderIds.value = new Set(folders.value.map((f) => f.id))
  }

  function collapseAllFolders() {
    expandedFolderIds.value = new Set()
  }

  function expandFolderForArticle(articleId: string) {
    const article = articles.value[articleId]
    if (article?.folderId) expandFolder(article.folderId)
  }

  function applyTree(data: { folders: KnowledgeFolder[]; articles: Record<string, KnowledgeArticle> }) {
    const prev = articles.value
    const prevStatus = contentStatus.value
    const nextArticles: Record<string, KnowledgeArticle> = {}

    for (const [id, summary] of Object.entries(data.articles)) {
      const hadContent = prevStatus[id] === 'loaded' && prev[id]
      nextArticles[id] = {
        ...summary,
        content: hadContent ? prev[id].content : '',
      }
    }

    articles.value = nextArticles
    folders.value = data.folders

    const nextStatus: Record<string, ArticleContentStatus> = {}
    for (const id of Object.keys(nextArticles)) {
      nextStatus[id] = prevStatus[id] === 'loaded' ? 'loaded' : 'idle'
    }
    contentStatus.value = nextStatus
    syncExpandedFolders(data.folders)
  }

  function fetchLibrary(): Promise<void> {
    if (currentFetch) return currentFetch

    const seq = ++loadSeq
    loading.value = true
    error.value = null

    const p = (async (): Promise<void> => {
      try {
        const data = await fetchKnowledgeTree()
        if (seq !== loadSeq) return
        applyTree(data)
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

  async function ensureLibraryLoaded() {
    if (libraryHydrated.value && !loading.value) return
    await fetchLibrary()
  }

  function isArticleContentLoaded(id: string): boolean {
    return contentStatus.value[id] === 'loaded'
  }

  function isArticleContentLoading(id: string): boolean {
    return contentStatus.value[id] === 'loading'
  }

  function getArticleContentError(id: string): string | null {
    return contentError.value[id] ?? null
  }

  function setArticleContent(id: string, article: KnowledgeArticle) {
    const cur = articles.value[id]
    articles.value = {
      ...articles.value,
      [id]: {
        ...(cur ?? article),
        ...article,
        content: article.content,
      },
    }
    contentStatus.value = { ...contentStatus.value, [id]: 'loaded' }
    contentError.value = { ...contentError.value, [id]: null }
  }

  async function ensureArticleContent(id: string, options?: { force?: boolean }): Promise<void> {
    if (!id) return
    if (!options?.force && contentStatus.value[id] === 'loaded') return

    const existing = contentInflight.get(id)
    if (existing && !options?.force) return existing

    const p = (async () => {
      await ensureLibraryLoaded()
      if (!options?.force && contentStatus.value[id] === 'loaded') return

      const summary = articles.value[id]
      if (!summary) {
        contentStatus.value = { ...contentStatus.value, [id]: 'error' }
        contentError.value = { ...contentError.value, [id]: '文章不存在' }
        return
      }

      contentStatus.value = { ...contentStatus.value, [id]: 'loading' }
      contentError.value = { ...contentError.value, [id]: null }

      try {
        const body = await fetchArticleContentById(id)
        setArticleContent(id, {
          ...summary,
          content: body.content,
          updatedAt: body.updatedAt,
        })
      } catch (e) {
        contentStatus.value = { ...contentStatus.value, [id]: 'error' }
        contentError.value = {
          ...contentError.value,
          [id]: e instanceof Error ? e.message : String(e),
        }
        throw e
      }
    })()

    contentInflight.set(id, p)
    return p.finally(() => {
      contentInflight.delete(id)
    })
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
      if (a.title.toLowerCase().includes(q)) {
        out.push({ article: a, folderTitle: folder?.title ?? '' })
      }
    }
    return out
  }

  async function addFolder(title: string, icon = '📁') {
    const id = `folder-${crypto.randomUUID().slice(0, 8)}`
    await insertFolder(id, title.trim() || '未命名目录', icon)
    await fetchLibrary()
    expandFolder(id)
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
    setArticleContent(id, {
      id,
      folderId,
      title: title.trim() || '未命名文章',
      content,
      updatedAt: new Date().toISOString().slice(0, 10),
    })
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
    if (patch.content !== undefined) {
      setArticleContent(patch.id, {
        ...articles.value[patch.id],
        ...patch,
        content: patch.content,
      } as KnowledgeArticle)
    } else if (contentStatus.value[patch.id] === 'loaded') {
      await ensureArticleContent(patch.id, { force: true })
    }
  }

  async function deleteArticle(articleId: string) {
    await removeArticle(articleId)
    await fetchLibrary()
  }

  return {
    folders,
    articles,
    contentStatus,
    loading,
    error,
    libraryHydrated,
    allArticleList,
    fetchLibrary,
    ensureLibraryLoaded,
    ensureArticleContent,
    isArticleContentLoaded,
    isArticleContentLoading,
    getArticleContentError,
    getArticle,
    firstArticleId,
    folderById,
    toggleFolder,
    isFolderExpanded,
    expandFolder,
    expandFolderForArticle,
    expandAllFolders,
    collapseAllFolders,
    search,
    addFolder,
    renameFolder,
    deleteFolder,
    addArticle,
    updateArticle,
    deleteArticle,
  }
})

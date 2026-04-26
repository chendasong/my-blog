import { defineStore } from 'pinia'
import { ref } from 'vue'
import { articleApi } from '@/api'
import type { Article } from '@/types'

export const useArticleStore = defineStore('article', () => {
  const articles = ref<Article[]>([])
  /** 当前筛选条件下的总条数（分页用） */
  const listTotal = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchList(params: {
    category?: string
    q?: string
    limit: number
    offset: number
  }) {
    loading.value = true
    error.value = null
    try {
      const { items, total } = await articleApi.getPage(params)
      articles.value = items
      listTotal.value = total
    } catch {
      error.value = '加载失败'
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string) {
    await articleApi.remove(id)
    articles.value = articles.value.filter(a => a.id !== id)
    listTotal.value = Math.max(0, listTotal.value - 1)
  }

  async function like(article: Article) {
    const updated = await articleApi.like(article.id, article.likes)
    const idx = articles.value.findIndex(a => a.id === article.id)
    if (idx !== -1) articles.value[idx] = updated
  }

  return { articles, listTotal, loading, error, fetchList, remove, like }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { articleApi } from '@/api'
import type { Article } from '@/types'

export const useArticleStore = defineStore('article', () => {
  const articles = ref<Article[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchList(params?: { category?: string; q?: string }) {
    loading.value = true
    error.value = null
    try {
      articles.value = await articleApi.getList(params)
    } catch (e) {
      error.value = '加载失败'
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string) {
    await articleApi.remove(id)
    articles.value = articles.value.filter(a => a.id !== id)
  }

  async function like(article: Article) {
    const updated = await articleApi.like(article.id, article.likes)
    const idx = articles.value.findIndex(a => a.id === article.id)
    if (idx !== -1) articles.value[idx] = updated
  }

  return { articles, loading, error, fetchList, remove, like }
})

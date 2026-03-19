<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useArticleStore } from '@/stores/article'
import { useAuthStore } from '@/stores/auth'
import { categories } from '@/data'
import ArticleCard from '@/components/blog/ArticleCard.vue'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const store = useArticleStore()
const authStore = useAuthStore()

const activeCategory = ref('all')
const searchQuery = ref('')
const currentPage = ref(1)
const PAGE_SIZE = 6

const categoryColors: Record<string, string> = {
  '技术': '#6C8EBF', '生活': '#82B366', '设计': '#B85450', '思考': '#9673A6',
}
const categoryIcons: Record<string, string> = {
  all: '📋', '技术': '💻', '生活': '🌿', '设计': '🎨', '思考': '💡',
}

onMounted(() => store.fetchList())

const pagedArticles = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return store.articles.slice(start, start + PAGE_SIZE)
})
const totalPages = computed(() => Math.ceil(store.articles.length / PAGE_SIZE))

function doSearch() {
  currentPage.value = 1
  const params: Record<string, string> = {}
  if (activeCategory.value !== 'all') params.category = activeCategory.value
  if (searchQuery.value.trim()) params.q = searchQuery.value.trim()
  store.fetchList(params)
}

function handleCategoryChange(cat: string) {
  activeCategory.value = cat
  currentPage.value = 1
  doSearch()
}

async function handleDelete(id: string) {
  if (!confirm('确定删除这篇文章吗？')) return
  await store.remove(id)
}
</script>

<template>
  <div class="article-list">
    <div class="list-hero">
      <div class="container">
        <div class="list-hero__inner">
          <h1 class="list-title"><span class="title-icon">📝</span>文章</h1>
          <p class="list-subtitle">记录技术探索、生活感悟，以及那些值得留存的思考。</p>
          <div class="search-row">
            <input v-model="searchQuery" class="search-input" placeholder="搜索文章..." @keydown.enter="doSearch" />
            <button class="search-btn" @click="doSearch">🔍 搜索</button>
            <AppButton v-if="authStore.isLoggedIn" @click="router.push('/blog/new')">✏️ 写文章</AppButton>
          </div>
          <div class="category-filter">
            <button :class="['cat-btn', { 'cat-btn--active': activeCategory === 'all' }]" @click="handleCategoryChange('all')">{{ categoryIcons['all'] }} 全部</button>
            <button v-for="cat in categories" :key="cat.id"
              :class="['cat-btn', { 'cat-btn--active': activeCategory === cat.name }]"
              :style="activeCategory === cat.name ? { background: categoryColors[cat.name] + '18', color: categoryColors[cat.name], borderColor: categoryColors[cat.name] + '40' } : {}"
              @click="handleCategoryChange(cat.name)"
            >{{ categoryIcons[cat.name] || '📄' }} {{ cat.name }}</button>
          </div>
        </div>
      </div>
    </div>
    <div class="container list-body">
      <div v-if="store.loading" class="loading-state">
        <div class="loading-dots"><span/><span/><span/></div>
        <p>加载中...</p>
      </div>
      <div v-else-if="store.error" class="empty-state">
        <span>😕 {{ store.error }}</span>
        <AppButton variant="secondary" @click="store.fetchList()">重试</AppButton>
      </div>
      <template v-else>
        <div v-if="!store.articles.length" class="empty-state">
          <span class="empty-state__icon">📝</span>
          <p>还没有文章，去写第一篇吧！</p>
          <AppButton v-if="authStore.isLoggedIn" @click="router.push('/blog/new')">✏️ 写文章</AppButton>
        </div>
        <template v-else>
          <div class="articles-grid">
            <div v-for="(article, i) in pagedArticles" :key="article.id" class="article-wrap animate-fade-in-up" :class="`delay-${Math.min(i * 100, 500)}`">
              <ArticleCard
                :article="article"
                :featured="article.featured"
                :editable="authStore.isLoggedIn"
                @edit="router.push(`/blog/${$event}/edit`)"
                @delete="handleDelete"
              />
            </div>
          </div>
          <div v-if="totalPages > 1" class="pagination">
            <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">← 上一页</button>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">下一页 →</button>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.list-hero { padding: 60px 0 28px; border-bottom: 1px solid var(--color-border); margin-bottom: 32px; }
.list-hero__inner { text-align: left; max-width: 100%; }
.list-title { font-size: clamp(2rem,4vw,3rem); font-weight: 700; color: var(--color-text-primary); letter-spacing: -0.03em; margin-bottom: 6px; }
.list-subtitle { font-size: var(--text-base); color: var(--color-text-muted); font-family: var(--font-serif); margin-bottom: 20px; }
.search-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; justify-content: flex-start; }
.search-input { flex: 1; padding: 11px 18px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-full); font-size: var(--text-sm); color: var(--color-text-primary); outline: none; transition: all var(--transition-fast); }
.search-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(91,138,240,0.12); }
.search-input::placeholder { color: var(--color-text-muted); }
.search-btn { flex-shrink: 0; padding: 11px 18px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: var(--text-sm); cursor: pointer; transition: all var(--transition-fast); color: var(--color-text-secondary); white-space: nowrap; }
.search-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.category-filter { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-start; }
.cat-btn { padding: 6px 16px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: var(--text-sm); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast); }
.cat-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.cat-btn--active { background: rgba(91,138,240,0.10); color: var(--color-primary); border-color: rgba(91,138,240,0.3); font-weight: 600; }
.list-body { padding-bottom: 80px; }
.articles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
.article-wrap { position: relative; }
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 24px; color: var(--color-text-muted); }
.loading-dots { display: flex; gap: 6px; }
.loading-dots span { width: 10px; height: 10px; border-radius: 50%; background: var(--color-primary); animation: bounce 1.2s ease-in-out infinite; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.5}40%{transform:scale(1.2);opacity:1} }
.empty-state { text-align: center; padding: 80px 24px; color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center; gap: 16px; }
.empty-state__icon { font-size: 3rem; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 40px; }
.page-btn { padding: 8px 20px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: var(--text-sm); cursor: pointer; transition: all var(--transition-fast); color: var(--color-text-secondary); }
.page-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { font-size: var(--text-sm); color: var(--color-text-muted); min-width: 60px; text-align: center; }
</style>

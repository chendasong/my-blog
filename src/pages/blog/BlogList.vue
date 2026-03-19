<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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

const categoryColors: Record<string, string> = {
  '技术': '#6C8EBF', '生活': '#82B366', '设计': '#B85450', '思考': '#9673A6',
}

onMounted(() => store.fetchList())

watch([activeCategory, searchQuery], () => {
  const params: Record<string, string> = {}
  if (activeCategory.value !== 'all') params.category = activeCategory.value
  if (searchQuery.value.trim()) params.q = searchQuery.value.trim()
  store.fetchList(params)
}, { debounce: 300 } as any)

async function handleDelete(id: string) {
  if (!confirm('确定删除这篇文章吗？')) return
  await store.remove(id)
}
</script>
\u003ctemplate\u003e
  \u003cdiv class="article-list"\u003e
    \u003cdiv class="list-hero"\u003e
      \u003cdiv class="container"\u003e
        \u003ch1 class="list-title"\u003e\u6587\u7ae0\u003c/h1\u003e
        \u003cp class="list-subtitle"\u003e\u8bb0\u5f55\u6280\u672f\u63a2\u7d22\u3001\u751f\u6d3b\u611f\u609f\uff0c\u4ee5\u53ca\u90a3\u4e9b\u503c\u5f97\u7559\u5b58\u7684\u601d\u8003\u3002\u003c/p\u003e
        \u003cdiv class="search-row"\u003e
          \u003cinput v-model="searchQuery" class="search-input" placeholder="\u641c\u7d22\u6587\u7ae0\u6807\u9898\u3001\u6458\u8981\u6216\u6807\u7b7e..." /\u003e
          \u003cAppButton v-if="authStore.isLoggedIn" @click="router.push('/blog/new')"\u003e\u270f\ufe0f \u5199\u6587\u7ae0\u003c/AppButton\u003e
        \u003c/div\u003e
        \u003cdiv class="category-filter"\u003e
          \u003cbutton :class="['cat-btn', { 'cat-btn--active': activeCategory === 'all' }]" @click="activeCategory = 'all'"\u003e\u5168\u90e8\u003c/button\u003e
          \u003cbutton v-for="cat in categories" :key="cat.id"
            :class="['cat-btn', { 'cat-btn--active': activeCategory === cat.name }]"
            :style="activeCategory === cat.name ? { background: categoryColors[cat.name] + '18', color: categoryColors[cat.name], borderColor: categoryColors[cat.name] + '40' } : {}"
            @click="activeCategory = cat.name"
          \u003e{{ cat.name }}\u003c/button\u003e
        \u003c/div\u003e
      \u003c/div\u003e
    \u003c/div\u003e
    \u003cdiv class="container list-body"\u003e
      \u003cdiv v-if="store.loading" class="loading-state"\u003e
        \u003cdiv class="loading-dots"\u003e\u003cspan/\u003e\u003cspan/\u003e\u003cspan/\u003e\u003c/div\u003e
        \u003cp\u003e\u52a0\u8f7d\u4e2d...\u003c/p\u003e
      \u003c/div\u003e
      \u003cdiv v-else-if="store.error" class="empty-state"\u003e
        \u003cspan\u003e\ud83d\ude15 {{ store.error }}\u003c/span\u003e
        \u003cAppButton variant="secondary" @click="store.fetchList()"\u003e\u91cd\u8bd5\u003c/AppButton\u003e
      \u003c/div\u003e
      \u003cdiv v-else-if="store.articles.length" class="articles-grid"\u003e
        \u003cdiv v-for="(article, i) in store.articles" :key="article.id" class="article-wrap animate-fade-in-up" :class="\delay-\\"\u003e
          \u003cArticleCard :article="article" :featured="article.featured" /\u003e
          \u003cdiv v-if="authStore.isLoggedIn" class="article-actions"\u003e
            \u003cbutton class="action-btn action-btn--edit" @click.stop="router.push(\/blog/\/edit\)"\u003e\u270f\ufe0f \u7f16\u8f91\u003c/button\u003e
            \u003cbutton class="action-btn action-btn--delete" @click.stop="handleDelete(article.id)"\u003e\ud83d\uddd1\ufe0f \u5220\u9664\u003c/button\u003e
          \u003c/div\u003e
        \u003c/div\u003e
      \u003c/div\u003e
      \u003cdiv v-else class="empty-state"\u003e
        \u003cspan class="empty-state__icon"\u003e\ud83d\udcdd\u003c/span\u003e
        \u003cp\u003e\u8fd8\u6ca1\u6709\u6587\u7ae0\uff0c\u53bb\u5199\u7b2c\u4e00\u7bc7\u5427\uff01\u003c/p\u003e
        \u003cAppButton v-if="authStore.isLoggedIn" @click="router.push('/blog/new')"\u003e\u270f\ufe0f \u5199\u6587\u7ae0\u003c/AppButton\u003e
      \u003c/div\u003e
    \u003c/div\u003e
  \u003c/div\u003e
\u003c/template\u003e

\u003cstyle scoped\u003e
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.list-hero { padding: 48px 0 20px; border-bottom: 1px solid var(--color-border); margin-bottom: 32px; }
.list-title { font-size: clamp(2rem,4vw,3rem); font-weight: 700; color: var(--color-text-primary); letter-spacing: -0.03em; margin-bottom: 6px; }
.list-subtitle { font-size: var(--text-base); color: var(--color-text-muted); font-family: var(--font-serif); margin-bottom: 16px; }
.search-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.search-input { flex: 1; padding: 11px 18px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-full); font-size: var(--text-sm); color: var(--color-text-primary); outline: none; transition: all var(--transition-fast); }
.search-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(91,138,240,0.12); }
.search-input::placeholder { color: var(--color-text-muted); }
.category-filter { display: flex; flex-wrap: wrap; gap: 8px; padding-bottom: 4px; }
.cat-btn { padding: 6px 16px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: var(--text-sm); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast); }
.cat-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.cat-btn--active { background: rgba(91,138,240,0.10); color: var(--color-primary); border-color: rgba(91,138,240,0.3); font-weight: 600; }
.list-body { padding-bottom: 80px; }
.articles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
.article-wrap { position: relative; }
.article-actions { display: flex; gap: 8px; margin-top: 8px; justify-content: flex-end; }
.action-btn { padding: 5px 12px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: var(--text-xs); cursor: pointer; transition: all var(--transition-fast); }
.action-btn--edit:hover { border-color: var(--color-primary); color: var(--color-primary); }
.action-btn--delete:hover { border-color: var(--color-error, #E8607A); color: var(--color-error, #E8607A); }
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 24px; color: var(--color-text-muted); }
.loading-dots { display: flex; gap: 6px; }
.loading-dots span { width: 10px; height: 10px; border-radius: 50%; background: var(--color-primary); animation: bounce 1.2s ease-in-out infinite; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.5}40%{transform:scale(1.2);opacity:1} }
.empty-state { text-align: center; padding: 80px 24px; color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center; gap: 16px; }
.empty-state__icon { font-size: 3rem; }
\u003c/style\u003e

<template>
  <div class="article-list">
    <div class="list-hero">
      <div class="container">
        <h1 class="list-title">文章</h1>
        <p class="list-subtitle">记录技术探索、生活感悟，以及那些值得留存的思考。</p>
        <div class="search-row">
          <input v-model="searchQuery" class="search-input" placeholder="搜索文章标题、摘要或标签..." />
          <AppButton v-if="authStore.isLoggedIn" @click="router.push('/blog/new')">✏️ 写文章</AppButton>
        </div>
        <div class="category-filter">
          <button :class="['cat-btn', { 'cat-btn--active': activeCategory === 'all' }]" @click="activeCategory = 'all'">全部</button>
          <button v-for="cat in categories" :key="cat.id"
            :class="['cat-btn', { 'cat-btn--active': activeCategory === cat.name }]"
            :style="activeCategory === cat.name ? { background: categoryColors[cat.name] + '18', color: categoryColors[cat.name], borderColor: categoryColors[cat.name] + '40' } : {}"
            @click="activeCategory = cat.name"
          >{{ cat.name }}</button>
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
      <div v-else-if="store.articles.length" class="articles-grid">
        <div v-for="(article, i) in store.articles" :key="article.id" class="article-wrap animate-fade-in-up" :class="`delay-${Math.min(i * 100, 500)}`">
          <ArticleCard :article="article" :featured="article.featured" />
          <div v-if="authStore.isLoggedIn" class="article-actions">
            <button class="action-btn action-btn--edit" @click.stop="router.push(`/blog/${article.id}/edit`)">✏️ 编辑</button>
            <button class="action-btn action-btn--delete" @click.stop="handleDelete(article.id)">🗑️ 删除</button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <span class="empty-state__icon">📝</span>
        <p>还没有文章，去写第一篇吧！</p>
        <AppButton v-if="authStore.isLoggedIn" @click="router.push('/blog/new')">✏️ 写文章</AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.list-hero { padding: 48px 0 20px; border-bottom: 1px solid var(--color-border); margin-bottom: 32px; }
.list-title { font-size: clamp(2rem,4vw,3rem); font-weight: 700; color: var(--color-text-primary); letter-spacing: -0.03em; margin-bottom: 6px; }
.list-subtitle { font-size: var(--text-base); color: var(--color-text-muted); font-family: var(--font-serif); margin-bottom: 16px; }
.search-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.search-input { flex: 1; padding: 11px 18px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-full); font-size: var(--text-sm); color: var(--color-text-primary); outline: none; transition: all var(--transition-fast); }
.search-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(91,138,240,0.12); }
.search-input::placeholder { color: var(--color-text-muted); }
.category-filter { display: flex; flex-wrap: wrap; gap: 8px; padding-bottom: 4px; }
.cat-btn { padding: 6px 16px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: var(--text-sm); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast); }
.cat-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.cat-btn--active { background: rgba(91,138,240,0.10); color: var(--color-primary); border-color: rgba(91,138,240,0.3); font-weight: 600; }
.list-body { padding-bottom: 80px; }
.articles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
.article-wrap { position: relative; }
.article-actions { display: flex; gap: 8px; margin-top: 8px; justify-content: flex-end; }
.action-btn { padding: 5px 12px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: var(--text-xs); cursor: pointer; transition: all var(--transition-fast); }
.action-btn--edit:hover { border-color: var(--color-primary); color: var(--color-primary); }
.action-btn--delete:hover { border-color: #E8607A; color: #E8607A; }
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 24px; color: var(--color-text-muted); }
.loading-dots { display: flex; gap: 6px; }
.loading-dots span { width: 10px; height: 10px; border-radius: 50%; background: var(--color-primary); animation: bounce 1.2s ease-in-out infinite; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.5}40%{transform:scale(1.2);opacity:1} }
.empty-state { text-align: center; padding: 80px 24px; color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center; gap: 16px; }
.empty-state__icon { font-size: 3rem; }
</style>

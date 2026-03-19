<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useArticleStore } from '@/stores/article'
import { categories } from '@/data'
import ArticleCard from '@/components/blog/ArticleCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import SectionTitle from '@/components/common/SectionTitle.vue'

const router = useRouter()
const store = useArticleStore()

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

<template>
  <div class="blog-list">
    <div class="blog-list__hero">
      <div class="container">
        <SectionTitle title="博客" subtitle="记录技术探索、生活感悟，以及那些值得留存的思考。" align="center" />
        <div class="blog-list__search">
          <input v-model="searchQuery" class="search-input" placeholder="搜索文章标题、摘要或标签..." />
        </div>
        <div class="blog-list__actions">
          <AppButton @click="router.push('/blog/new')">✏️ 写文章</AppButton>
        </div>
      </div>
    </div>

    <div class="container" style="padding-top: 40px; padding-bottom: 80px;">
      <div class="category-filter">
        <button :class="['cat-btn', { 'cat-btn--active': activeCategory === 'all' }]" @click="activeCategory = 'all'">全部</button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          :class="['cat-btn', { 'cat-btn--active': activeCategory === cat.name }]"
          :style="activeCategory === cat.name ? { background: categoryColors[cat.name] + '18', color: categoryColors[cat.name], borderColor: categoryColors[cat.name] + '40' } : {}"
          @click="activeCategory = cat.name"
        >{{ cat.name }}</button>
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="loading-state">
        <div class="loading-dots"><span/><span/><span/></div>
        <p>加载中...</p>
      </div>

      <!-- Error -->
      <div v-else-if="store.error" class="error-state">
        <span>😕 {{ store.error }}</span>
        <AppButton variant="secondary" @click="store.fetchList()">重试</AppButton>
      </div>

      <!-- Results -->
      <div v-else-if="store.articles.length" class="articles-grid">
        <div v-for="(article, i) in store.articles" :key="article.id" class="article-wrap animate-fade-in-up" :class="`delay-${Math.min(i * 100, 500)}`">
          <ArticleCard :article="article" :featured="article.featured" />
          <div class="article-actions">
            <button class="action-btn action-btn--edit" @click.stop="router.push(`/blog/${article.id}/edit`)">✏️ 编辑</button>
            <button class="action-btn action-btn--delete" @click.stop="handleDelete(article.id)">🗑️ 删除</button>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <span class="empty-state__icon">📝</span>
        <p>还没有文章，去写第一篇吧！</p>
        <AppButton @click="router.push('/blog/new')">✏️ 写文章</AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.blog-list__hero { padding: 60px 0 40px; text-align: center; }
.blog-list__search { max-width: 540px; margin: 24px auto 0; }
.blog-list__actions { display: flex; justify-content: center; margin-top: 16px; }
.search-input { width: 100%; padding: 14px 20px; background: var(--color-bg-card); backdrop-filter: var(--blur-md); border: 1px solid var(--color-border); border-radius: var(--radius-full); font-size: var(--text-base); color: var(--color-text-primary); outline: none; transition: all var(--transition-fast); box-shadow: var(--shadow-sm); }
.search-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(91,138,240,0.12); }
.search-input::placeholder { color: var(--color-text-muted); }
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.category-filter { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 32px; }
.cat-btn { padding: 8px 18px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: var(--text-sm); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast); }
.cat-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.cat-btn--active { background: rgba(91,138,240,0.10); color: var(--color-primary); border-color: rgba(91,138,240,0.3); font-weight: 600; }
.articles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
.article-wrap { position: relative; }
.article-actions { display: flex; gap: 8px; margin-top: 8px; justify-content: flex-end; }
.action-btn { padding: 5px 12px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: var(--text-xs); cursor: pointer; transition: all var(--transition-fast); }
.action-btn--edit:hover { border-color: var(--color-primary); color: var(--color-primary); }
.action-btn--delete:hover { border-color: var(--color-error); color: var(--color-error); }
.loading-state, .error-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 24px; color: var(--color-text-muted); }
.loading-dots { display: flex; gap: 6px; }
.loading-dots span { width: 10px; height: 10px; border-radius: 50%; background: var(--color-primary); animation: bounce 1.2s ease-in-out infinite; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.5}40%{transform:scale(1.2);opacity:1} }
.empty-state { text-align: center; padding: 80px 24px; color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center; gap: 16px; }
.empty-state__icon { font-size: 3rem; }
</style>

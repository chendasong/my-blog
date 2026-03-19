<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { articles } from '@/data'
import AppBadge from '@/components/common/AppBadge.vue'
import AppButton from '@/components/common/AppButton.vue'

const route = useRoute()
const router = useRouter()

const article = computed(() => articles.find(a => a.id === route.params.id))

const categoryColors: Record<string, string> = {
  '技术': '#6C8EBF', '生活': '#82B366', '设计': '#B85450', '思考': '#9673A6',
}

function renderMarkdown(content: string) {
  return content
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/^\n/gm, '<br>')
    .replace(/^(?![<#]).+$/gm, (line) => line.trim() ? `<p>${line}</p>` : '')
}
</script>

<template>
  <div class="blog-detail">
    <div v-if="article" class="container">
      <button class="back-btn" @click="router.push('/blog')">← 返回列表</button>

      <header class="article-header animate-fade-in-up">
        <div class="article-header__cover">
          <img :src="article.cover" :alt="article.title" />
        </div>
        <div class="article-header__meta">
          <AppBadge :color="categoryColors[article.category]">{{ article.category }}</AppBadge>
          <span class="meta-text">📅 {{ article.publishedAt }}</span>
          <span class="meta-text">👁 {{ article.views }} 次阅读</span>
          <span class="meta-text">❤️ {{ article.likes }} 点赞</span>
        </div>
        <h1 class="article-header__title">{{ article.title }}</h1>
        <p class="article-header__summary">{{ article.summary }}</p>
        <div class="article-header__tags">
          <span v-for="tag in article.tags" :key="tag" class="tag"># {{ tag }}</span>
        </div>
      </header>

      <main class="article-body glass-card animate-fade-in-up delay-200">
        <div class="prose" v-html="renderMarkdown(article.content)" />
      </main>

      <div class="article-footer animate-fade-in-up delay-300">
        <AppButton variant="secondary" @click="router.push('/blog')">← 返回博客列表</AppButton>
      </div>
    </div>
    <div v-else class="not-found">
      <span>😕 文章未找到</span>
      <AppButton @click="router.push('/blog')">返回列表</AppButton>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 860px;
  margin: 0 auto;
  padding: 40px 24px 80px;
}
.back-btn {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  cursor: pointer;
  margin-bottom: 32px;
  display: inline-block;
  transition: color var(--transition-fast);
}
.back-btn:hover { color: var(--color-primary); }
.article-header { margin-bottom: 32px; }
.article-header__cover {
  border-radius: var(--radius-xl);
  overflow: hidden;
  aspect-ratio: 21/9;
  margin-bottom: 24px;
  background: var(--gradient-hero);
}
.article-header__cover img {
  width: 100%; height: 100%; object-fit: cover;
}
.article-header__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.meta-text { font-size: var(--text-sm); color: var(--color-text-muted); }
.article-header__title {
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.25;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
}
.article-header__summary {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  font-family: var(--font-serif);
  line-height: 1.7;
  margin-bottom: 16px;
}
.article-header__tags { display: flex; flex-wrap: wrap; gap: 8px; }
.article-body { padding: 40px 48px; margin-bottom: 32px; }
.article-footer { display: flex; gap: 12px; }
.not-found {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 60vh; gap: 20px;
  font-size: 1.5rem; color: var(--color-text-muted);
}
@media (max-width: 640px) {
  .article-body { padding: 24px 20px; }
}
</style>

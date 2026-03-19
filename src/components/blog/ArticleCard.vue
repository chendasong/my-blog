<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Article } from '@/types'
import AppBadge from '@/components/common/AppBadge.vue'

interface Props {
  article: Article
  featured?: boolean
}
const props = withDefaults(defineProps<Props>(), { featured: false })
const router = useRouter()

const categoryColors: Record<string, string> = {
  '技术': '#6C8EBF',
  '生活': '#82B366',
  '设计': '#B85450',
  '思考': '#9673A6',
}
</script>

<template>
  <article
    :class="['article-card', { 'article-card--featured': props.featured }]"
    @click="router.push(`/blog/${props.article.id}`)"
  >
    <div class="article-card__cover">
      <img :src="props.article.cover" :alt="props.article.title" />
      <div class="article-card__category-badge">
        <AppBadge :color="categoryColors[props.article.category]">{{ props.article.category }}</AppBadge>
      </div>
    </div>
    <div class="article-card__body">
      <div class="article-card__tags">
        <span v-for="tag in props.article.tags.slice(0, 3)" :key="tag" class="tag"># {{ tag }}</span>
      </div>
      <h3 class="article-card__title">{{ props.article.title }}</h3>
      <p class="article-card__summary">{{ props.article.summary }}</p>
      <div class="article-card__meta">
        <span class="meta-item">📅 {{ props.article.publishedAt }}</span>
        <span class="meta-item">👁 {{ props.article.views }}</span>
        <span class="meta-item">❤️ {{ props.article.likes }}</span>
        <span class="meta-item">💬 {{ props.article.comments }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.article-card {
  background: var(--color-bg-card);
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}
.article-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-border-strong);
}
.article-card__cover {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
  background: var(--gradient-hero);
}
.article-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}
.article-card:hover .article-card__cover img {
  transform: scale(1.05);
}
.article-card__category-badge {
  position: absolute;
  top: 12px;
  left: 12px;
}
.article-card__body {
  padding: 20px;
}
.article-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.article-card__title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.article-card--featured .article-card__title {
  font-size: var(--text-xl);
}
.article-card__summary {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 14px;
}
.article-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.meta-item {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
</style>

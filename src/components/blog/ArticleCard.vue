<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import type { Article } from '@/types'
import AppBadge from '@/components/common/AppBadge.vue'

interface Props {
  article: Article
  featured?: boolean
  editable?: boolean
}
const props = withDefaults(defineProps<Props>(), { featured: false, editable: false })
const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
}>()
const router = useRouter()

const categoryColors: Record<string, string> = {
  '技术': '#6C8EBF',
  '生活': '#82B366',
  '设计': '#B85450',
  '思考': '#9673A6',
}

function handleEdit(e: Event) {
  e.stopPropagation()
  emit('edit', props.article.id)
}

function handleDelete(e: Event) {
  e.stopPropagation()
  emit('delete', props.article.id)
}

const displayDate = computed(() => {
  const raw = props.article.publishedAt || props.article.updatedAt
  if (!raw || typeof raw !== 'string') return ''
  const d = dayjs(raw)
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm') : raw
})
</script>

<template>
  <article
    :class="['article-card', { 'article-card--featured': props.featured }]"
    @click="router.push(`/blog/${props.article.id}`)"
  >
    <span v-if="props.featured" class="article-card__featured-pill" aria-hidden="true">精选</span>
    <div class="article-card__cover">
      <img :src="props.article.cover" :alt="props.article.title" />
      <div class="article-card__category-badge">
        <AppBadge :color="categoryColors[props.article.category]">{{ props.article.category }}</AppBadge>
      </div>
      <div v-if="props.editable" class="article-card__actions" @click.stop>
        <button class="card-action-btn card-action-btn--edit" @click="handleEdit">✏️ 编辑</button>
        <button class="card-action-btn card-action-btn--delete" @click="handleDelete">🗑️ 删除</button>
      </div>
    </div>
    <div class="article-card__body">
      <div class="article-card__tags">
        <span v-for="tag in props.article.tags.slice(0, 2)" :key="tag" class="tag"># {{ tag }}</span>
      </div>
      <h3 class="article-card__title">{{ props.article.title }}</h3>
      <p class="article-card__summary">{{ props.article.summary }}</p>
      <div class="article-card__meta">
        <span class="meta-item meta-item--date" :title="props.article.publishedAt">📅 {{ displayDate }}</span>
        <span class="meta-item">👁 {{ props.article.views }}</span>
        <span class="meta-item">❤️ {{ props.article.likes }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.article-card {
  position: relative;
  background: var(--color-bg-card);
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}
.article-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-strong);
}
.article-card--featured {
  border-color: rgba(91, 138, 240, 0.35);
  box-shadow: 0 0 0 1px rgba(91, 138, 240, 0.12);
}
.article-card__featured-pill {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #fff;
  background: linear-gradient(135deg, #5b8af0, #8b6ff0);
  border-radius: var(--radius-full);
  pointer-events: none;
}
.article-card__cover {
  position: relative;
  aspect-ratio: 16 / 10;
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
  transform: scale(1.04);
}
.article-card__category-badge {
  position: absolute;
  top: 8px;
  left: 8px;
}
.article-card__actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 6px;
  padding: 8px 10px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.72) 0%, transparent 100%);
  opacity: 0;
  transition: opacity var(--transition-fast);
}
.article-card:hover .article-card__actions {
  opacity: 1;
}
.card-action-btn {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(8px);
  transition: all var(--transition-fast);
  color: white;
  background: rgba(255, 255, 255, 0.12);
}
.card-action-btn--edit:hover {
  background: rgba(91, 138, 240, 0.85);
  border-color: rgba(91, 138, 240, 0.5);
}
.card-action-btn--delete:hover {
  background: rgba(232, 96, 122, 0.85);
  border-color: rgba(232, 96, 122, 0.5);
}
.article-card__body {
  padding: 12px 14px 14px;
}
.article-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}
.tag {
  font-size: 10px;
  color: var(--color-primary);
  background: rgba(91, 138, 240, 0.1);
  padding: 2px 6px;
  border-radius: var(--radius-full);
  line-height: 1.3;
}
.article-card__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.35;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.article-card__summary {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 10px;
}
.article-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  row-gap: 4px;
}
.meta-item {
  font-size: 10px;
  color: var(--color-text-muted);
  white-space: nowrap;
}
.meta-item--date {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

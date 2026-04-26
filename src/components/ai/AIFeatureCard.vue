<script setup lang="ts">
import type { AIFeature } from '@/types'
import AppBadge from '@/components/common/AppBadge.vue'

const props = defineProps<{ feature: AIFeature; active?: boolean }>()
defineEmits<{ select: [feature: AIFeature] }>()

const categoryIconBackground: Record<string, string> = {
  writing: 'color-mix(in srgb, var(--color-info) 12%, transparent)',
  vision: 'color-mix(in srgb, var(--color-ui-gradient-mid) 12%, transparent)',
  analysis: 'color-mix(in srgb, #4caf82 12%, transparent)',
  creative: 'color-mix(in srgb, #f0a05b 12%, transparent)',
}

const categoryBadgeStyle: Record<string, { background: string; color: string }> = {
  writing: {
    background: 'color-mix(in srgb, var(--color-info) 18%, transparent)',
    color: 'var(--color-info)',
  },
  vision: {
    background: 'color-mix(in srgb, var(--color-ui-gradient-mid) 18%, transparent)',
    color: 'var(--color-ui-gradient-mid)',
  },
  analysis: { background: 'color-mix(in srgb, #4caf82 18%, transparent)', color: '#4caf82' },
  creative: { background: 'color-mix(in srgb, #f0a05b 18%, transparent)', color: '#f0a05b' },
}

const categoryLabels: Record<string, string> = {
  writing: '写作',
  vision: '视觉',
  analysis: '分析',
  creative: '创意',
}
</script>

<template>
  <div
    :class="['ai-card', { 'ai-card--active': props.active }]"
    @click="$emit('select', props.feature)"
  >
    <div
      class="ai-card__icon"
      :style="{ background: categoryIconBackground[props.feature.category] || categoryIconBackground.writing }"
    >
      <span style="font-size: 1.5rem;">{{ props.feature.emoji }}</span>
    </div>
    <div class="ai-card__content">
      <div class="ai-card__header">
        <h4 class="ai-card__name">{{ props.feature.name }}</h4>
        <div class="ai-card__badges">
          <AppBadge v-if="props.feature.isNew" color="#4CAF82" size="sm">New</AppBadge>
          <AppBadge v-if="props.feature.isPro" color="#F0A05B" size="sm">Pro</AppBadge>
        </div>
      </div>
      <p class="ai-card__desc">{{ props.feature.description }}</p>
      <div class="ai-card__footer">
        <span class="ai-card__cat" :style="categoryBadgeStyle[props.feature.category] || categoryBadgeStyle.writing">
          {{ categoryLabels[props.feature.category] }}
        </span>
        <div class="ai-card__tags">
          <span v-for="tag in props.feature.tags.slice(0,2)" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-card {
  display: flex;
  gap: 16px;
  padding: 18px;
  background: var(--color-bg-card);
  backdrop-filter: var(--blur-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all var(--transition-base);
}
.ai-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-strong);
}
.ai-card--active {
  background: color-mix(in srgb, var(--color-primary) 6%, transparent);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}
.ai-card__icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ai-card__content { flex: 1; min-width: 0; }
.ai-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 6px;
}
.ai-card__name {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text-primary);
}
.ai-card__badges { display: flex; gap: 4px; flex-shrink: 0; }
.ai-card__desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ai-card__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ai-card__cat {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
  white-space: nowrap;
}
.ai-card__tags { display: flex; gap: 4px; }
</style>

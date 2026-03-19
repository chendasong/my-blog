<script setup lang="ts">
import type { AIFeature } from '@/types'
import AppBadge from '@/components/common/AppBadge.vue'

const props = defineProps<{ feature: AIFeature; active?: boolean }>()
defineEmits<{ select: [feature: AIFeature] }>()

const categoryColors: Record<string, string> = {
  writing: '#5B8AF0',
  vision: '#8B6FF0',
  analysis: '#4CAF82',
  creative: '#F0A05B',
  productivity: '#E8607A',
}

const categoryLabels: Record<string, string> = {
  writing: '写作',
  vision: '视觉',
  analysis: '分析',
  creative: '创意',
  productivity: '效率',
}
</script>

<template>
  <div
    :class="['ai-card', { 'ai-card--active': props.active }]"
    @click="$emit('select', props.feature)"
  >
    <div class="ai-card__icon" :style="{ background: categoryColors[props.feature.category] + '18' }">
      <span style="font-size: 1.5rem;">{{ props.feature.icon.includes('mdi') ? '🤖' : props.feature.icon }}</span>
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
        <AppBadge :color="categoryColors[props.feature.category]" size="sm">
          {{ categoryLabels[props.feature.category] }}
        </AppBadge>
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
  background: rgba(91,138,240,0.06);
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
.ai-card__tags { display: flex; gap: 4px; }
</style>

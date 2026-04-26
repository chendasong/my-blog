<script setup lang="ts">
import type { Note } from '@/types'

const props = defineProps<{ note: Note; active?: boolean }>()
defineEmits<{ select: [note: Note] }>()

const categoryLabels: Record<string, string> = {
  work: '工作',
  life: '生活',
  study: '学习',
  idea: '想法',
  todo: '待办',
}
</script>

<template>
  <div
    :class="['note-card', { 'note-card--active': props.active }]"
    :style="{ borderLeftColor: props.note.color }"
    @click="$emit('select', props.note)"
  >
    <div class="note-card__header">
      <span class="note-card__category">{{ categoryLabels[props.note.category] }}</span>
      <span v-if="props.note.pinned" class="note-card__pin">📌</span>
    </div>
    <h4 class="note-card__title">{{ props.note.title }}</h4>
    <p class="note-card__preview">{{ props.note.content.replace(/[#*`\[\]]/g, '').slice(0, 80) }}...</p>
    <div class="note-card__footer">
      <span class="note-card__date">{{ props.note.updatedAt }}</span>
      <div class="note-card__tags">
        <span v-for="tag in props.note.tags.slice(0, 2)" :key="tag" class="tag">{{ tag }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.note-card {
  padding: 16px 18px;
  background: var(--color-bg-card);
  backdrop-filter: var(--blur-sm);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-primary);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.note-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateX(3px);
}
.note-card--active {
  background: color-mix(in srgb, var(--color-primary) 6%, transparent);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}
.note-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.note-card__category {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.note-card__title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 6px;
  line-height: 1.4;
}
.note-card__preview {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-bottom: 10px;
}
.note-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.note-card__date {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
.note-card__tags {
  display: flex;
  gap: 4px;
}
</style>

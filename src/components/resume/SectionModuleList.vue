<script setup lang="ts">
import { ref } from 'vue'
import type { ResumeSection } from '@/types/resume'

interface Props {
  sections: ResumeSection[]
  selectedId: string | null
}

interface Emits {
  (e: 'select', id: string): void
  (e: 'toggle', id: string, visible: boolean): void
  (e: 'reorder', sections: ResumeSection[]): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const draggedItem = ref<string | null>(null)
const dragOverItem = ref<string | null>(null)

const sectionIcons: Record<string, string> = {
  basic: '👤',
  education: '🎓',
  experience: '💼',
  skills: '🛠️',
  projects: '🚀',
  awards: '🏆',
  languages: '🌐',
  certifications: '📜',
}

const sectionLabels: Record<string, string> = {
  basic: '基本信息',
  education: '教育背景',
  experience: '工作经历',
  skills: '技能',
  projects: '项目',
  awards: '奖项',
  languages: '语言',
  certifications: '证书',
}

const handleDragStart = (e: DragEvent, sectionId: string) => {
  draggedItem.value = sectionId
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}

const handleDragOver = (e: DragEvent, sectionId: string) => {
  e.preventDefault()
  dragOverItem.value = sectionId
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
}

const handleDragLeave = () => {
  dragOverItem.value = null
}

const handleDrop = (e: DragEvent, sections: ResumeSection[]) => {
  e.preventDefault()
  if (!draggedItem.value || !dragOverItem.value || draggedItem.value === dragOverItem.value) {
    draggedItem.value = null
    dragOverItem.value = null
    return
  }

  const draggedIndex = sections.findIndex(s => s.id === draggedItem.value)
  const targetIndex = sections.findIndex(s => s.id === dragOverItem.value)

  if (draggedIndex !== -1 && targetIndex !== -1) {
    const newSections = [...sections]
    const [draggedSection] = newSections.splice(draggedIndex, 1)
    newSections.splice(targetIndex, 0, draggedSection)
    
    newSections.forEach((section, index) => {
      section.order = index
    })
    
    emit('reorder', newSections)
  }

  draggedItem.value = null
  dragOverItem.value = null
}
</script>

<template>
  <div class="module-list">
    <h3 class="module-list__title">模块</h3>
    <div class="module-list__items">
      <div
        v-for="section in sections"
        :key="section.id"
        class="module-item"
        :class="{
          'module-item--selected': section.id === selectedId,
          'module-item--dragging': section.id === draggedItem,
          'module-item--drag-over': section.id === dragOverItem,
        }"
        draggable="true"
        @click="emit('select', section.id)"
        @dragstart="handleDragStart($event, section.id)"
        @dragover="handleDragOver($event, section.id)"
        @dragleave="handleDragLeave"
        @drop="handleDrop($event, sections)"
      >
        <div class="module-item__content">
          <span class="module-item__icon">{{ sectionIcons[section.type] }}</span>
          <span class="module-item__label">{{ sectionLabels[section.type] }}</span>
        </div>
        <button
          class="module-item__toggle"
          :class="{ 'module-item__toggle--active': section.visible }"
          @click.stop="emit('toggle', section.id, !section.visible)"
          :title="section.visible ? '隐藏' : '显示'"
        >
          <span v-if="section.visible">👁️</span>
          <span v-else>🚫</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.module-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.module-list__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
  padding: 0 8px;
}

.module-list__items {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.module-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: move;
  transition: all 0.2s ease;
  user-select: none;
}

.module-item:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
}

.module-item--selected {
  background: rgba(91, 138, 240, 0.1);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(91, 138, 240, 0.1);
}

.module-item--dragging {
  opacity: 0.5;
  background: rgba(91, 138, 240, 0.05);
}

.module-item--drag-over {
  border-top: 2px solid var(--color-primary);
  padding-top: 10px;
}

.module-item__content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.module-item__icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.module-item__label {
  font-size: 0.875rem;
  color: var(--color-text-primary);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.module-item__toggle {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
}

.module-item__toggle:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
}

.module-item__toggle--active {
  background: rgba(76, 175, 130, 0.1);
  border-color: #4CAF82;
  color: #4CAF82;
}
</style>

<script setup lang="ts">
import { ref, nextTick } from "vue"
import type { ResumeTemplate } from "@/types/resume"

defineProps<{
  templates: ResumeTemplate[]
  activeTemplateId: string
  defaultTemplateId: string
  switching?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  add: []
  delete: [id: string]
  rename: [id: string, name: string]
}>()

const editingId = ref<string | null>(null)
const editingName = ref("")
/** v-for 内同名 ref 在 Vue 3 中为元素数组，需取单个再 focus */
const inputRef = ref<HTMLInputElement | HTMLInputElement[] | null>(null)

function focusRenameInput() {
  const raw = inputRef.value
  const el = Array.isArray(raw) ? raw[0] : raw
  if (el && typeof el.focus === "function") {
    el.focus()
    el.select()
  }
}

function onSelect(id: string) {
  if (editingId.value === id) return
  editingId.value = null
  emit("select", id)
}

function onDblClick(t: ResumeTemplate, e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  editingId.value = t.id
  editingName.value = t.name
  void nextTick(() => {
    focusRenameInput()
  })
}

function commitRename() {
  if (!editingId.value) return
  const name = editingName.value.trim()
  if (name) emit("rename", editingId.value, name)
  editingId.value = null
}

function onRenameKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault()
    commitRename()
  } else if (e.key === "Escape") {
    editingId.value = null
  }
}

function onAdd(e: MouseEvent) {
  e.stopPropagation()
  editingId.value = null
  emit("add")
}

function onDelete(id: string, e: MouseEvent) {
  e.stopPropagation()
  editingId.value = null
  emit("delete", id)
}
</script>

<template>
  <div
    class="template-tabs"
    :class="{ 'template-tabs--busy': switching }"
    role="tablist"
    aria-label="简历模板"
  >
    <div class="template-tabs__scroll">
      <button
        v-for="t in templates"
        :key="t.id"
        type="button"
        role="tab"
        :aria-selected="t.id === activeTemplateId"
        :class="['template-tab', { 'template-tab--active': t.id === activeTemplateId }]"
        @click="onSelect(t.id)"
        @dblclick="onDblClick(t, $event)"
      >
        <template v-if="editingId === t.id">
          <input
            ref="inputRef"
            v-model="editingName"
            class="template-tab__input"
            maxlength="64"
            @blur="commitRename"
            @keydown="onRenameKeydown"
            @click.stop
          />
        </template>
        <span v-else class="template-tab__label">{{ t.name }}</span>
        <button
          v-if="templates.length > 1 && t.id !== defaultTemplateId"
          type="button"
          class="template-tab__del"
          aria-label="删除模板"
          title="删除"
          @click="onDelete(t.id, $event)"
        >
          ×
        </button>
      </button>
      <button type="button" class="template-tab template-tab--add" title="新建模板" @click="onAdd">
        +
      </button>
    </div>
  </div>
</template>

<style scoped>
.template-tabs {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.template-tabs__scroll {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0;
  scrollbar-width: thin;
}

.template-tabs--busy {
  opacity: 0.65;
  pointer-events: none;
}

.template-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  max-width: 200px;
  padding: 6px 10px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast);
}

.template-tab:hover {
  border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
  color: var(--color-text-primary);
}

.template-tab--active {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-text-primary);
}

.template-tab--add {
  width: 32px;
  height: 32px;
  padding: 0;
  justify-content: center;
  font-size: 1.125rem;
  line-height: 1;
}

.template-tab__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-tab__input {
  width: 120px;
  max-width: 100%;
  padding: 2px 6px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  font: inherit;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
}

.template-tab__del {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  margin-left: 2px;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
}

.template-tab__del:hover {
  background: color-mix(in srgb, var(--color-danger, #e11d48) 15%, transparent);
  color: var(--color-danger, #e11d48);
}
</style>

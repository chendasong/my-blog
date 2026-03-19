<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNoteStore } from '@/stores/note'
import NoteCard from '@/components/notes/NoteCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import type { Note, NoteCategory } from '@/types'

const store = useNoteStore()
const selectedNote = ref<Note | null>(null)
const activeCategory = ref<NoteCategory | 'all'>('all')
const searchQuery = ref('')
const showEditor = ref(false)
const editingNote = ref<Partial<Note>>({})
const saving = ref(false)

const categoryLabels: Record<string, string> = {
  all: '全部', work: '工作', life: '生活', study: '学习', idea: '想法', todo: '待办',
}
const categoryIcons: Record<string, string> = {
  all: '📋', work: '💼', life: '🌿', study: '📚', idea: '💡', todo: '✅',
}
const colorOptions = ['#6C8EBF', '#82B366', '#D6B656', '#9673A6', '#B85450', '#4CAF82']

onMounted(() => store.fetchList())

const filtered = computed(() => {
  let list = [...store.notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
  if (activeCategory.value !== 'all') list = list.filter(n => n.category === activeCategory.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
  }
  return list
})

function openNew() {
  editingNote.value = { title: '', content: '', category: 'idea', tags: [], color: '#6C8EBF', pinned: false }
  showEditor.value = true
  selectedNote.value = null
}

function openEdit(note: Note) {
  editingNote.value = { ...note, tags: [...note.tags] }
  showEditor.value = true
}

async function handleSave() {
  if (!editingNote.value.title?.trim()) { alert('标题不能为空'); return }
  saving.value = true
  try {
    if (editingNote.value.id) {
      const updated = await store.update(editingNote.value.id, editingNote.value)
      selectedNote.value = updated
    } else {
      const created = await store.create(editingNote.value as Omit<Note, 'id'>)
      selectedNote.value = created
    }
    showEditor.value = false
  } finally {
    saving.value = false
  }
}

async function handleDelete(note: Note) {
  if (!confirm('确定删除这条笔记吗？')) return
  await store.remove(note.id)
  if (selectedNote.value?.id === note.id) selectedNote.value = null
}

async function handleTogglePin(note: Note) {
  await store.togglePin(note)
}

function renderContent(content: string) {
  return content
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- \[(x| )\] (.+)$/gm, (_: string, c: string, t: string) =>
      `<label class="todo-item"><input type="checkbox" ${c === 'x' ? 'checked' : ''} disabled /> ${t}</label>`)
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^(?![<#\-]).+$/gm, (l: string) => l.trim() ? `<p>${l}</p>` : '')
}

function tagsInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  editingNote.value.tags = val.split(',').map(t => t.trim()).filter(Boolean)
}
</script>
<template>
  <div class="notes-page">
    <aside class="notes-sidebar">
      <div class="notes-sidebar__header">
        <div class="notes-sidebar__top">
          <h2 class="notes-sidebar__title">我的笔记</h2>
          <button class="new-note-btn" @click="openNew">+ 新建</button>
        </div>
        <p class="notes-sidebar__count">{{ store.notes.length }} 条记录</p>
      </div>
      <div class="notes-search">
        <input v-model="searchQuery" class="notes-search__input" placeholder="搜索笔记..." />
      </div>
      <div class="notes-categories">
        <button v-for="(label, key) in categoryLabels" :key="key"
          :class="['cat-chip', { 'cat-chip--active': activeCategory === key }]"
          @click="activeCategory = key as NoteCategory | 'all'"
        >{{ categoryIcons[key] }} {{ label }}</button>
      </div>
      <div v-if="store.loading" class="notes-loading">加载中...</div>
      <div v-else class="notes-list">
        <NoteCard v-for="note in filtered" :key="note.id" :note="note" :active="selectedNote?.id === note.id"
          @select="selectedNote = $event; showEditor = false" />
        <div v-if="!filtered.length" class="notes-empty">没有找到笔记</div>
      </div>
    </aside>

    <main class="notes-main">
      <Transition name="note-fade" mode="out-in">
        <div v-if="showEditor" key="editor" class="note-editor glass-card">
          <div class="note-editor__header">
            <h3>{{ editingNote.id ? '编辑笔记' : '新建笔记' }}</h3>
            <div class="note-editor__actions">
              <button class="tag" @click="showEditor = false">取消</button>
              <AppButton size="sm" :loading="saving" @click="handleSave">保存</AppButton>
            </div>
          </div>
          <div class="note-editor__form">
            <input v-model="editingNote.title" class="ne-title-input" placeholder="笔记标题..." />
            <div class="ne-row">
              <select v-model="editingNote.category" class="ne-select">
                <option value="work">工作</option><option value="life">生活</option><option value="study">学习</option><option value="idea">想法</option><option value="todo">待办</option>
              </select>
              <input class="ne-input" placeholder="标签（逗号分隔）"
                :value="Array.isArray(editingNote.tags) ? editingNote.tags.join(', ') : ''"
                @input="tagsInput" />
            </div>
            <div class="ne-colors">
              <span class="ne-label">颜色：</span>
              <button v-for="c in colorOptions" :key="c" class="color-dot"
                :style="{ background: c, outline: editingNote.color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }"
                @click="editingNote.color = c" />
            </div>
            <textarea v-model="editingNote.content" class="ne-content" rows="16" placeholder="开始写笔记...（支持 Markdown）" />
          </div>
        </div>

        <div v-else-if="selectedNote" :key="selectedNote.id" class="note-detail">
          <div class="note-detail__header">
            <div class="note-detail__header-top">
              <span class="note-detail__category-dot" :style="{ background: selectedNote.color }" />
              <span class="note-detail__category">{{ categoryLabels[selectedNote.category] }}</span>
              <span v-if="selectedNote.pinned">📌</span>
              <div class="note-detail__ops">
                <button class="op-btn" @click="handleTogglePin(selectedNote)">{{ selectedNote.pinned ? '取消置顶' : '置顶' }}</button>
                <button class="op-btn" @click="openEdit(selectedNote)">✏️ 编辑</button>
                <button class="op-btn op-btn--danger" @click="handleDelete(selectedNote)">🗑️ 删除</button>
              </div>
            </div>
            <h1 class="note-detail__title">{{ selectedNote.title }}</h1>
            <div class="note-detail__meta">
              <span>创建 {{ selectedNote.createdAt }}</span>
              <span>更新 {{ selectedNote.updatedAt }}</span>
            </div>
            <div class="note-detail__tags">
              <span v-for="tag in selectedNote.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
          <div class="note-detail__body prose" v-html="renderContent(selectedNote.content)" />
        </div>

        <div v-else key="empty" class="note-detail-empty">
          <span>📔</span>
          <p>选择笔记查看，或新建一条</p>
          <AppButton variant="secondary" @click="openNew">+ 新建笔记</AppButton>
        </div>
      </Transition>
    </main>
  </div>
</template>

<style scoped>
.notes-page { display: flex; min-height: calc(100vh - 64px); max-width: 1200px; margin: 0 auto; padding: 0 24px; gap: 24px; }
.notes-sidebar { width: 320px; flex-shrink: 0; padding: 32px 0; display: flex; flex-direction: column; gap: 16px; position: sticky; top: 80px; max-height: calc(100vh - 80px); overflow-y: auto; }
.notes-sidebar__top { display: flex; align-items: center; justify-content: space-between; }
.notes-sidebar__title { font-size: var(--text-xl); font-weight: 700; color: var(--color-text-primary); }
.new-note-btn { padding: 6px 14px; border-radius: var(--radius-full); background: var(--gradient-primary); color: white; font-size: var(--text-sm); cursor: pointer; border: none; }
.new-note-btn:hover { opacity: 0.85; }
.notes-sidebar__count { font-size: var(--text-sm); color: var(--color-text-muted); }
.notes-search__input { width: 100%; padding: 10px 16px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-full); font-size: var(--text-sm); color: var(--color-text-primary); outline: none; }
.notes-search__input:focus { border-color: var(--color-primary); }
.notes-categories { display: flex; flex-wrap: wrap; gap: 6px; }
.cat-chip { display: flex; align-items: center; gap: 4px; padding: 5px 12px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: var(--text-xs); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast); }
.cat-chip:hover { border-color: var(--color-primary); color: var(--color-primary); }
.cat-chip--active { background: rgba(91,138,240,0.10); border-color: rgba(91,138,240,0.3); color: var(--color-primary); font-weight: 600; }
.notes-list { display: flex; flex-direction: column; gap: 8px; }
.notes-loading, .notes-empty { text-align: center; color: var(--color-text-muted); font-size: var(--text-sm); padding: 20px; }
.notes-main { flex: 1; min-width: 0; padding: 32px 0 80px; }
.note-editor { padding: 32px; }
.note-editor__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--color-border); }
.note-editor__header h3 { font-size: var(--text-lg); font-weight: 700; color: var(--color-text-primary); }
.note-editor__actions { display: flex; gap: 8px; align-items: center; }
.note-editor__form { display: flex; flex-direction: column; gap: 14px; }
.ne-title-input { width: 100%; padding: 12px 0; background: transparent; border: none; border-bottom: 2px solid var(--color-border); font-size: var(--text-xl); font-weight: 600; color: var(--color-text-primary); outline: none; font-family: var(--font-sans); }
.ne-title-input:focus { border-color: var(--color-primary); }
.ne-row { display: flex; gap: 12px; }
.ne-select, .ne-input { flex: 1; padding: 9px 12px; background: var(--color-bg-glass); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--color-text-primary); outline: none; font-family: var(--font-sans); }
.ne-select:focus, .ne-input:focus { border-color: var(--color-primary); }
.ne-colors { display: flex; align-items: center; gap: 8px; }
.ne-label { font-size: var(--text-xs); color: var(--color-text-muted); }
.color-dot { width: 20px; height: 20px; border-radius: 50%; border: none; cursor: pointer; transition: transform var(--transition-fast); }
.color-dot:hover { transform: scale(1.2); }
.ne-content { width: 100%; padding: 14px; background: var(--color-bg-glass); border: 1px solid var(--color-border); border-radius: var(--radius-lg); font-size: var(--text-sm); color: var(--color-text-primary); font-family: var(--font-mono); line-height: 1.7; resize: vertical; outline: none; }
.ne-content:focus { border-color: var(--color-primary); }
.note-detail { background: var(--color-bg-card); backdrop-filter: var(--blur-md); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 40px; box-shadow: var(--shadow-md); }
.note-detail__header { margin-bottom: 28px; border-bottom: 1px solid var(--color-border); padding-bottom: 24px; }
.note-detail__header-top { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.note-detail__category-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.note-detail__category { font-size: var(--text-xs); font-weight: 600; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.05em; }
.note-detail__ops { display: flex; gap: 6px; margin-left: auto; }
.op-btn { padding: 4px 10px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: var(--text-xs); cursor: pointer; transition: all var(--transition-fast); }
.op-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.op-btn--danger:hover { border-color: var(--color-error); color: var(--color-error); }
.note-detail__title { font-size: var(--text-2xl); font-weight: 700; color: var(--color-text-primary); margin-bottom: 10px; }
.note-detail__meta { display: flex; gap: 16px; font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: 12px; }
.note-detail__tags { display: flex; flex-wrap: wrap; gap: 6px; }
.note-detail__body { line-height: 1.8; }
.note-detail-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 16px; color: var(--color-text-muted); font-size: 3rem; }
.note-detail-empty p { font-size: var(--text-base); }
.note-fade-enter-active, .note-fade-leave-active { transition: all 0.25s ease; }
.note-fade-enter-from, .note-fade-leave-to { opacity: 0; transform: translateY(8px); }
@media (max-width: 768px) { .notes-page { flex-direction: column; } .notes-sidebar { width: 100%; position: static; max-height: none; } .note-detail { padding: 20px; } }
</style>

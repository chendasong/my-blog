<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNoteStore } from '@/stores/note'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/common/AppButton.vue'
import type { Note, NoteCategory } from '@/types'

const store = useNoteStore()
const authStore = useAuthStore()
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
    <div class="notes-hero">
      <div class="container">
        <h1 class="notes-title">笔记</h1>
        <p class="notes-subtitle">记录灵感、工作与生活，随时查阅。</p>
        <div class="search-row">
          <input v-model="searchQuery" class="search-input" placeholder="搜索笔记标题或内容..." />
          <button v-if="authStore.isLoggedIn" class="new-note-btn" @click="openNew">+ 新建笔记</button>
        </div>
        <div class="category-filter">
          <button v-for="(label, key) in categoryLabels" :key="key"
            :class="['cat-btn', {'cat-btn--active': activeCategory === key}]"
            @click="activeCategory = key as NoteCategory | 'all'"
          >{{ categoryIcons[key] }} {{ label }}</button>
        </div>
      </div>
    </div>
    <div class="container notes-body">
      <div v-if="store.loading" class="loading-state"><div class="loading-dots"><span/><span/><span/></div><p>加载中...</p></div>
      <div v-else-if="filtered.length" class="notes-grid">
        <div v-for="note in filtered" :key="note.id" class="note-wrap">
          <div class="note-card glass-card" :style="{borderLeftColor: note.color}" @click="selectedNote = note; showEditor = false">
            <div class="note-card__header">
              <span v-if="note.pinned">📌</span>
              <span class="note-card__cat" :style="{color: note.color}">{{ categoryIcons[note.category] }} {{ categoryLabels[note.category] }}</span>
            </div>
            <h3 class="note-card__title">{{ note.title }}</h3>
            <p class="note-card__preview">{{ note.content.slice(0,80) }}...</p>
            <div class="note-card__footer">
              <span class="note-card__date">{{ note.updatedAt }}</span>
              <div v-if="authStore.isLoggedIn" class="note-card__ops" @click.stop>
                <button class="op-btn" @click="handleTogglePin(note)">{{ note.pinned ? '取消置顶' : '置顶' }}</button>
                <button class="op-btn" @click="openEdit(note)">✏️</button>
                <button class="op-btn op-btn--danger" @click="handleDelete(note)">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state"><span class="empty-icon">📔</span><p>还没有笔记，新建一条吧！</p><button v-if="authStore.isLoggedIn" class="new-note-btn" @click="openNew">+ 新建笔记</button></div>
    </div>
    <Transition name="overlay">
      <div v-if="selectedNote || showEditor" class="overlay" @click.self="selectedNote = null; showEditor = false">
        <div class="modal glass-card" @click.stop>
          <div v-if="showEditor">
            <div class="modal-header">
              <h3>{{ editingNote.id ? '编辑笔记' : '新建笔记' }}</h3>
              <div class="modal-actions"><button class="tag" @click="showEditor=false;selectedNote=null">取消</button><AppButton size="sm" :loading="saving" @click="handleSave">保存</AppButton></div>
            </div>
            <div class="note-editor__form">
              <input v-model="editingNote.title" class="ne-title-input" placeholder="笔记标题..." />
              <div class="ne-row">
                <select v-model="editingNote.category" class="ne-select"><option value="work">工作</option><option value="life">生活</option><option value="study">学习</option><option value="idea">想法</option><option value="todo">待办</option></select>
                <input class="ne-input" placeholder="标签(逗号分隔)" :value="Array.isArray(editingNote.tags)?editingNote.tags.join(', '):''" @input="tagsInput" />
              </div>
              <div class="ne-colors"><span class="ne-label">颜色：</span><button v-for="c in colorOptions" :key="c" class="color-dot" :style="{background:c,outline:editingNote.color===c?`3px solid ${c}`:'none',outlineOffset:'2px'}" @click="editingNote.color=c" /></div>
              <textarea v-model="editingNote.content" class="ne-content" rows="14" placeholder="开始写笔记...（支持 Markdown）" />
            </div>
          </div>
          <div v-else-if="selectedNote">
            <div class="modal-header">
              <div style="display:flex;align-items:center;gap:8px"><span :style="{color:selectedNote.color}">{{ categoryIcons[selectedNote.category] }} {{ categoryLabels[selectedNote.category] }}</span><span v-if="selectedNote.pinned">📌</span></div>
              <div class="modal-actions">
                <div v-if="authStore.isLoggedIn" style="display:flex;gap:6px">
                  <button class="op-btn" @click="handleTogglePin(selectedNote)">{{ selectedNote.pinned ? '取消置顶' : '置顶' }}</button>
                  <button class="op-btn" @click="openEdit(selectedNote)">✏️ 编辑</button>
                  <button class="op-btn op-btn--danger" @click="handleDelete(selectedNote)">🗑️ 删除</button>
                </div>
                <button class="close-btn" @click="selectedNote=null">✕</button>
              </div>
            </div>
            <h1 class="note-detail__title">{{ selectedNote.title }}</h1>
            <div class="note-detail__dates"><span>创建 {{ selectedNote.createdAt }}</span><span>更新 {{ selectedNote.updatedAt }}</span></div>
            <div class="note-detail__tags"><span v-for="tag in selectedNote.tags" :key="tag" class="tag">{{ tag }}</span></div>
            <div class="prose" v-html="renderContent(selectedNote.content)" />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.notes-page { min-height: calc(100vh - 64px); }
.notes-hero { padding: 48px 0 20px; border-bottom: 1px solid var(--color-border); margin-bottom: 32px; }
.notes-title { font-size: clamp(2rem,4vw,3rem); font-weight: 700; color: var(--color-text-primary); letter-spacing: -0.03em; margin-bottom: 6px; }
.notes-subtitle { font-size: var(--text-base); color: var(--color-text-muted); font-family: var(--font-serif); margin-bottom: 16px; }
.search-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.search-input { flex: 1; padding: 11px 18px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-full); font-size: var(--text-sm); color: var(--color-text-primary); outline: none; transition: all var(--transition-fast); }
.search-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(91,138,240,0.12); }
.search-input::placeholder { color: var(--color-text-muted); }
.new-note-btn { flex-shrink: 0; padding: 10px 20px; border-radius: var(--radius-full); background: var(--gradient-primary); color: white; font-size: var(--text-sm); font-weight: 600; cursor: pointer; border: none; white-space: nowrap; }
.new-note-btn:hover { opacity: 0.88; }
.category-filter { display: flex; flex-wrap: wrap; gap: 8px; }
.cat-btn { padding: 6px 14px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: var(--text-sm); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast); }
.cat-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.cat-btn--active { background: rgba(91,138,240,0.10); color: var(--color-primary); border-color: rgba(91,138,240,0.3); font-weight: 600; }
.notes-body { padding-bottom: 80px; }
.notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.note-card { padding: 20px; cursor: pointer; border-left: 4px solid var(--color-primary); transition: all var(--transition-base); }
.note-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
.note-card__header { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
.note-card__cat { font-size: var(--text-xs); font-weight: 600; }
.note-card__title { font-size: var(--text-base); font-weight: 700; color: var(--color-text-primary); margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.note-card__preview { font-size: var(--text-xs); color: var(--color-text-muted); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 12px; }
.note-card__footer { display: flex; align-items: center; justify-content: space-between; }
.note-card__date { font-size: var(--text-xs); color: var(--color-text-muted); }
.note-card__ops { display: flex; gap: 4px; }
.op-btn { padding: 3px 8px; border-radius: var(--radius-sm); border: 1px solid var(--color-border); background: var(--color-bg-glass); font-size: var(--text-xs); cursor: pointer; transition: all var(--transition-fast); }
.op-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.op-btn--danger:hover { border-color: #E8607A; color: #E8607A; }
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 24px; color: var(--color-text-muted); }
.loading-dots { display: flex; gap: 6px; }
.loading-dots span { width: 10px; height: 10px; border-radius: 50%; background: var(--color-primary); animation: bounce 1.2s ease-in-out infinite; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.5}40%{transform:scale(1.2);opacity:1} }
.empty-state { text-align: center; padding: 80px 24px; display: flex; flex-direction: column; align-items: center; gap: 16px; color: var(--color-text-muted); }
.empty-icon { font-size: 3rem; }
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; }
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }
.modal { width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto; padding: 32px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--color-border); }
.modal-header h3 { font-size: var(--text-lg); font-weight: 700; color: var(--color-text-primary); }
.modal-actions { display: flex; gap: 8px; align-items: center; }
.close-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--color-border); background: var(--color-bg-glass); cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; }
.close-btn:hover { background: rgba(232,96,122,0.1); color: #E8607A; }
.note-editor__form { display: flex; flex-direction: column; gap: 14px; }
.ne-title-input { width: 100%; padding: 12px 0; background: transparent; border: none; border-bottom: 2px solid var(--color-border); font-size: var(--text-xl); font-weight: 600; color: var(--color-text-primary); outline: none; font-family: var(--font-sans); }
.ne-title-input:focus { border-color: var(--color-primary); }
.ne-row { display: flex; gap: 12px; }
.ne-select, .ne-input { flex: 1; padding: 9px 12px; background: var(--color-bg-glass); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--color-text-primary); outline: none; font-family: var(--font-sans); }
.ne-colors { display: flex; align-items: center; gap: 8px; }
.ne-label { font-size: var(--text-xs); color: var(--color-text-muted); }
.color-dot { width: 20px; height: 20px; border-radius: 50%; border: none; cursor: pointer; transition: transform var(--transition-fast); }
.color-dot:hover { transform: scale(1.2); }
.ne-content { width: 100%; padding: 14px; background: var(--color-bg-glass); border: 1px solid var(--color-border); border-radius: var(--radius-lg); font-size: var(--text-sm); color: var(--color-text-primary); font-family: var(--font-mono); line-height: 1.7; resize: vertical; outline: none; }
.ne-content:focus { border-color: var(--color-primary); }
.note-detail__title { font-size: clamp(1.4rem,3vw,2rem); font-weight: 700; color: var(--color-text-primary); margin: 12px 0 8px; line-height: 1.3; }
.note-detail__dates { display: flex; gap: 16px; font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: 12px; }
.note-detail__tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
</style>

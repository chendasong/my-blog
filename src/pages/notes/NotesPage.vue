<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import { useToast } from '@/composables/useToast'
import { useNoteStore } from '@/stores/note'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/common/AppButton.vue'
import type { Note, NoteCategory } from '@/types'

const router = useRouter()
const store = useNoteStore()
const toast = useToast()
const authStore = useAuthStore()
const selectedNote = ref<Note | null>(null)
const activeCategory = ref<NoteCategory | 'all'>('all')
const searchQuery = ref('')

const categoryLabels: Record<string, string> = {
  all: '全部', work: '工作', life: '生活', study: '学习', idea: '想法', todo: '待办',
}
const categoryIcons: Record<string, string> = {
  all: '📋', work: '💼', life: '🌿', study: '📚', idea: '💡', todo: '✅',
}

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

function doSearch() {}

async function handleDelete(note: Note) {
  if (!confirm('确定删除这条笔记吗？')) return
  await store.remove(note.id)
  if (selectedNote.value?.id === note.id) selectedNote.value = null
  toast.success('笔记已删除')
}

async function handleTogglePin(note: Note) {
  await store.togglePin(note)
  if (selectedNote.value?.id === note.id) selectedNote.value = { ...note, pinned: !note.pinned }
}

function renderContent(content: string) {
  return marked(content) as string
}
</script>

<template>
  <div class="notes-page">
    <div class="notes-hero">
      <div class="container">
        <div class="notes-hero__inner">
          <h1 class="notes-title"><span class="title-icon">📔</span>笔记</h1>
          <p class="notes-subtitle">记录灵感、工作与生活，随时查阅。</p>
          <div class="search-row">
            <input v-model="searchQuery" class="search-input" placeholder="搜索笔记标题或内容..." @keydown.enter="doSearch" />
            <button class="search-btn" @click="doSearch">🔍 搜索</button>
            <AppButton v-if="authStore.isLoggedIn" @click="router.push('/notes/new')">✏️ 写笔记</AppButton>
          </div>
          <div class="category-filter">
            <button v-for="(label, key) in categoryLabels" :key="key"
              :class="['cat-btn', {'cat-btn--active': activeCategory === key}]"
              @click="activeCategory = key as NoteCategory | 'all'"
            >{{ categoryIcons[key] }} {{ label }}</button>
          </div>
        </div>
      </div>
    </div>
    <div class="container notes-body">
      <div v-if="store.loading" class="loading-state">
        <div class="loading-dots"><span/><span/><span/></div><p>加载中...</p>
      </div>
      <div v-else class="notes-layout">
        <div class="notes-grid">
          <div v-if="!filtered.length" class="empty-state">
            <span class="empty-icon">📔</span><p>还没有笔记，新建一条吧！</p>
            <AppButton v-if="authStore.isLoggedIn" @click="router.push('/notes/new')">✏️ 写笔记</AppButton>
          </div>
          <div v-for="note in filtered" :key="note.id"
            :class="['note-card glass-card', { 'note-card--active': selectedNote?.id === note.id }]"
            :style="{ borderLeftColor: note.color }"
            @click="selectedNote = selectedNote?.id === note.id ? null : note"
          >
            <div class="note-card__header">
              <span v-if="note.pinned">📌</span>
              <span class="note-card__cat" :style="{ color: note.color }">{{ categoryIcons[note.category] }} {{ categoryLabels[note.category] }}</span>
            </div>
            <h3 class="note-card__title">{{ note.title }}</h3>
            <p class="note-card__preview">{{ note.content.slice(0, 80) }}...</p>
            <div class="note-card__footer">
              <span class="note-card__date">{{ note.updatedAt }}</span>
              <div v-if="authStore.isLoggedIn" class="note-card__ops" @click.stop>
                <button class="op-btn" @click="handleTogglePin(note)">{{ note.pinned ? '取消置顶' : '置顶' }}</button>
                <button class="op-btn" @click="router.push(`/notes/${note.id}/edit`)">✏️</button>
                <button class="op-btn op-btn--danger" @click="handleDelete(note)">🗑️</button>
              </div>
            </div>
          </div>
        </div>
        <Transition name="detail-slide">
          <div v-if="selectedNote" :key="selectedNote.id" class="note-detail glass-card">
            <div class="note-detail__topbar">
              <div style="display:flex;align-items:center;gap:8px">
                <span :style="{ color: selectedNote.color }">{{ categoryIcons[selectedNote.category] }} {{ categoryLabels[selectedNote.category] }}</span>
                <span v-if="selectedNote.pinned">📌</span>
              </div>
              <div style="display:flex;gap:6px;align-items:center">
                <template v-if="authStore.isLoggedIn">
                  <button class="op-btn" @click="handleTogglePin(selectedNote)">{{ selectedNote.pinned ? '取消置顶' : '置顶' }}</button>
                  <button class="op-btn" @click="router.push(`/notes/${selectedNote.id}/edit`)">✏️ 编辑</button>
                  <button class="op-btn op-btn--danger" @click="handleDelete(selectedNote)">🗑️</button>
                </template>
                <button class="close-btn" @click="selectedNote = null">✕</button>
              </div>
            </div>
            <h1 class="note-detail__title">{{ selectedNote.title }}</h1>
            <div class="note-detail__meta"><span>创建 {{ selectedNote.createdAt }}</span><span>更新 {{ selectedNote.updatedAt }}</span></div>
            <div class="note-detail__tags"><span v-for="tag in selectedNote.tags" :key="tag" class="tag">{{ tag }}</span></div>
            <div class="prose" v-html="renderContent(selectedNote.content)" />
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.notes-page { min-height: calc(100vh - 64px); }
.notes-hero { padding: 60px 0 28px; border-bottom: 1px solid var(--color-border); margin-bottom: 32px; }
.notes-hero__inner { text-align: left; }
.notes-title { font-size: clamp(2rem,4vw,3rem); font-weight: 700; color: var(--color-text-primary); letter-spacing: -0.03em; margin-bottom: 6px; }
.notes-subtitle { font-size: var(--text-base); color: var(--color-text-muted); font-family: var(--font-serif); margin-bottom: 20px; }
.search-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; justify-content: flex-start; }
.search-input { flex: 1; padding: 11px 18px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-full); font-size: var(--text-sm); color: var(--color-text-primary); outline: none; transition: all var(--transition-fast); }
.search-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(91,138,240,0.12); }
.search-input::placeholder { color: var(--color-text-muted); }
.search-btn { flex-shrink: 0; padding: 10px 18px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: var(--text-sm); cursor: pointer; transition: all var(--transition-fast); color: var(--color-text-secondary); white-space: nowrap; }
.search-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.category-filter { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-start; }
.cat-btn { padding: 6px 14px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: var(--text-sm); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast); }
.cat-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.cat-btn--active { background: rgba(91,138,240,0.10); color: var(--color-primary); border-color: rgba(91,138,240,0.3); font-weight: 600; }
.notes-body { padding-bottom: 80px; }
.notes-layout { display: flex; flex-direction: column; gap: 24px; }
.notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.note-card { padding: 16px 18px; cursor: pointer; border-left: 4px solid var(--color-primary); transition: all var(--transition-base); }
.note-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
.note-card--active { box-shadow: 0 0 0 2px rgba(91,138,240,0.25) !important; }
.note-card__header { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.note-card__cat { font-size: var(--text-xs); font-weight: 600; }
.note-card__title { font-size: var(--text-sm); font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.note-card__preview { font-size: var(--text-xs); color: var(--color-text-muted); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 8px; }
.note-card__footer { display: flex; align-items: center; justify-content: space-between; }
.note-card__date { font-size: var(--text-xs); color: var(--color-text-muted); }
.note-card__ops { display: flex; gap: 3px; }
.op-btn { padding: 3px 8px; border-radius: var(--radius-sm); border: 1px solid var(--color-border); background: var(--color-bg-glass); font-size: var(--text-xs); cursor: pointer; transition: all var(--transition-fast); }
.op-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.op-btn--danger:hover { border-color: #E8607A; color: #E8607A; }
.note-detail { padding: 28px 32px; max-height: 70vh; overflow-y: auto; }
.note-detail__topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid var(--color-border); }
.note-detail__title { font-size: clamp(1.4rem,3vw,2rem); font-weight: 700; color: var(--color-text-primary); margin-bottom: 10px; line-height: 1.3; }
.note-detail__meta { display: flex; gap: 16px; font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: 12px; }
.note-detail__tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
.close-btn { width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--color-border); background: var(--color-bg-glass); cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; transition: all var(--transition-fast); }
.close-btn:hover { background: rgba(232,96,122,0.1); color: #E8607A; }
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 24px; color: var(--color-text-muted); }
.loading-dots { display: flex; gap: 6px; }
.loading-dots span { width: 10px; height: 10px; border-radius: 50%; background: var(--color-primary); animation: bounce 1.2s ease-in-out infinite; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.5}40%{transform:scale(1.2);opacity:1} }
.empty-state { text-align: center; padding: 40px 24px; display: flex; flex-direction: column; align-items: center; gap: 16px; color: var(--color-text-muted); }
.empty-icon { font-size: 3rem; }
.detail-slide-enter-active { transition: all 0.2s ease; }
.detail-slide-enter-from { opacity: 0; transform: translateX(16px); }
@media (max-width: 900px) { .notes-layout { grid-template-columns: 1fr; } }
</style>

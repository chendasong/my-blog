<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { noteApi } from '@/api/notes'
import { useToast } from '@/composables/useToast'
import { marked } from 'marked'
import type { Note } from '@/types'
import AppButton from '@/components/common/AppButton.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const note = ref<Note | null>(null)
const loading = ref(true)
const notFound = ref(false)

const categoryLabels: Record<string, string> = {
  work: '工作', life: '生活', study: '学习', idea: '想法', todo: '待办',
}
const categoryIcons: Record<string, string> = {
  work: '💼', life: '🌿', study: '📚', idea: '💡', todo: '✅',
}

onMounted(async () => {
  try {
    note.value = await noteApi.getById(route.params.id as string)
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

function renderContent(content: string) {
  return marked(content) as string
}

async function handleDelete() {
  if (!note.value) return
  if (!confirm('确定删除这条笔记吗？')) return
  await noteApi.remove(note.value.id)
  toast.success('笔记已删除')
  router.push('/notes')
}

async function handleTogglePin() {
  if (!note.value) return
  note.value = await noteApi.togglePin(note.value.id, note.value.pinned)
}
</script>

<template>
  <div class="note-detail-page">
    <div v-if="loading" class="loading-state">
      <div class="loading-dots"><span/><span/><span/></div>
      <p>加载中...</p>
    </div>
    <div v-else-if="note" class="container">
      <div class="detail-topbar">
        <button class="back-btn" @click="router.push('/notes')">← 返回笔记列表</button>
        <div v-if="authStore.isLoggedIn" class="detail-ops">
          <button class="op-btn" @click="handleTogglePin">{{ note.pinned ? '取消置顶' : '📌 置顶' }}</button>
          <button class="op-btn" @click="router.push(`/notes/${note.id}/edit`)">✏️ 编辑</button>
          <button class="op-btn op-btn--danger" @click="handleDelete">🗑️ 删除</button>
        </div>
      </div>

      <header class="note-header animate-fade-in-up">
        <div class="note-header__meta">
          <span class="note-cat" :style="{ color: note.color }">
            {{ categoryIcons[note.category] }} {{ categoryLabels[note.category] }}
          </span>
          <span v-if="note.pinned" class="note-pinned">📌 置顶</span>
          <span class="meta-text">📅 {{ note.updatedAt }}</span>
        </div>
        <h1 class="note-header__title">{{ note.title }}</h1>
        <div class="note-header__tags">
          <span v-for="tag in note.tags" :key="tag" class="tag"># {{ tag }}</span>
        </div>
      </header>

      <main class="note-body glass-card animate-fade-in-up delay-200" :style="{ borderLeftColor: note.color }">
        <div class="prose" v-html="renderContent(note.content)" />
      </main>

      <div class="note-footer animate-fade-in-up delay-300">
        <AppButton variant="secondary" @click="router.push('/notes')">← 返回笔记列表</AppButton>
      </div>
    </div>
    <div v-else class="not-found">
      <span>😕 笔记未找到</span>
      <AppButton @click="router.push('/notes')">返回列表</AppButton>
    </div>
  </div>
</template>

<style scoped>
.container { max-width: 860px; margin: 0 auto; padding: 40px 24px 80px; }
.detail-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; flex-wrap: wrap; gap: 12px; }
.back-btn { color: var(--color-text-muted); font-size: var(--text-sm); cursor: pointer; transition: color var(--transition-fast); background: none; border: none; }
.back-btn:hover { color: var(--color-primary); }
.detail-ops { display: flex; gap: 8px; }
.op-btn { padding: 6px 14px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: var(--text-sm); cursor: pointer; transition: all var(--transition-fast); }
.op-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.op-btn--danger:hover { border-color: #E8607A; color: #E8607A; }
.note-header { margin-bottom: 28px; }
.note-header__meta { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 14px; }
.note-cat { font-size: var(--text-sm); font-weight: 600; }
.note-pinned { font-size: var(--text-xs); color: var(--color-text-muted); }
.meta-text { font-size: var(--text-sm); color: var(--color-text-muted); }
.note-header__title { font-size: clamp(1.8rem,4vw,2.8rem); font-weight: 700; color: var(--color-text-primary); line-height: 1.25; letter-spacing: -0.02em; margin-bottom: 14px; }
.note-header__tags { display: flex; flex-wrap: wrap; gap: 8px; }
.note-body { padding: 40px 48px; margin-bottom: 32px; border-left: 4px solid var(--color-primary); }
.note-footer { display: flex; align-items: center; gap: 16px; }
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 120px 24px; color: var(--color-text-muted); }
.loading-dots { display: flex; gap: 6px; }
.loading-dots span { width: 10px; height: 10px; border-radius: 50%; background: var(--color-primary); animation: bounce 1.2s ease-in-out infinite; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.5}40%{transform:scale(1.2);opacity:1} }
.not-found { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 20px; font-size: 1.5rem; color: var(--color-text-muted); }
@media (max-width: 640px) { .note-body { padding: 24px 20px; } }
</style>

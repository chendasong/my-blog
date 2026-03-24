<script setup lang="ts">
import { watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "@/composables/useToast";
import { useNoteStore } from "@/stores/note";
import { useAuthStore } from "@/stores/auth";
import AppButton from "@/components/common/AppButton.vue";
import type { Note, NoteCategory } from "@/types";

const PAGE_SIZE = 9;

const props = defineProps<{
  activeCategory: NoteCategory | "all";
  searchQuery: string;
  currentPage: number;
}>();

const router = useRouter();
const store = useNoteStore();
const toast = useToast();
const authStore = useAuthStore();

const categoryLabels: Record<string, string> = {
  all: "全部",
  work: "工作",
  life: "生活",
  study: "学习",
  idea: "想法",
  todo: "待办",
};
const categoryIcons: Record<string, string> = {
  all: "📋",
  work: "💼",
  life: "🌿",
  study: "📚",
  idea: "💡",
  todo: "✅",
};

function listParams() {
  return {
    ...(props.activeCategory !== "all"
      ? { category: props.activeCategory }
      : {}),
    ...(props.searchQuery.trim()
      ? { q: props.searchQuery.trim() }
      : {}),
  };
}

async function fetchNotesPage() {
  await store.fetchList({
    ...listParams(),
    limit: PAGE_SIZE,
    offset: (props.currentPage - 1) * PAGE_SIZE,
  });
}

await fetchNotesPage();

watch(
  () =>
    [props.activeCategory, props.searchQuery, props.currentPage] as const,
  () => {
    fetchNotesPage();
  },
);

async function handleDelete(note: Note) {
  if (!confirm("确定删除这条笔记吗？")) return;
  await store.remove(note.id);
  toast.success("笔记已删除");
}

async function handleTogglePin(note: Note) {
  await store.togglePin(note);
}
</script>

<template>
  <div class="notes-list-results">
    <div v-if="store.error" class="empty-state">
      <span>😕 {{ store.error }}</span>
      <AppButton variant="secondary" @click="fetchNotesPage()">重试</AppButton>
    </div>
    <template v-else>
      <div v-if="!store.listTotal" class="empty-state">
        <span class="empty-icon">📔</span>
        <p>还没有笔记，新建一条吧！</p>
        <AppButton
          @click="router.push('/notes/new')"
          >✏️ 写笔记</AppButton
        >
      </div>
      <div v-else class="notes-grid">
        <div
          v-for="note in store.notes"
          :key="note.id"
          class="note-card glass-card"
          :style="{ borderLeftColor: note.color }"
          @click="router.push(`/notes/${note.id}`)"
        >
          <div class="note-card__header">
            <span v-if="note.pinned">📌</span>
            <span class="note-card__cat" :style="{ color: note.color }"
              >{{ categoryIcons[note.category] }}
              {{ categoryLabels[note.category] }}</span
            >
          </div>
          <h3 class="note-card__title">{{ note.title }}</h3>
          <p class="note-card__preview">{{ note.content.slice(0, 80) }}...</p>
          <div class="note-card__footer">
            <span class="note-card__date">{{ note.updatedAt }}</span>
            <div
              v-if="authStore.isLoggedIn"
              class="note-card__ops"
              @click.stop
            >
              <button type="button" class="op-btn" @click="handleTogglePin(note)">
                {{ note.pinned ? "取消置顶" : "置顶" }}
              </button>
              <button
                type="button"
                class="op-btn"
                @click="router.push(`/notes/${note.id}/edit`)"
              >
                ✏️
              </button>
              <button
                type="button"
                class="op-btn op-btn--danger"
                @click="handleDelete(note)"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.notes-list-results {
  position: relative;
  min-height: 120px;
}
.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.note-card {
  padding: 16px 18px;
  cursor: pointer;
  border-left: 4px solid var(--color-primary);
  transition: all var(--transition-base);
}
.note-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}
.note-card__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.note-card__cat {
  font-size: var(--text-xs);
  font-weight: 600;
}
.note-card__title {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.note-card__preview {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 8px;
}
.note-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.note-card__date {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
.note-card__ops {
  display: flex;
  gap: 3px;
}
.op-btn {
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-glass);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.op-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.op-btn--danger:hover {
  border-color: #e8607a;
  color: #e8607a;
}
.empty-state {
  text-align: center;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--color-text-muted);
}
.empty-icon {
  font-size: 3rem;
}
@media (max-width: 640px) {
  .notes-grid {
    grid-template-columns: 1fr;
  }
}
</style>

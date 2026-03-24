<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useNoteStore } from "@/stores/note";
import NotesListResults from "@/components/notes/NotesListResults.vue";
import AppButton from "@/components/common/AppButton.vue";
import type { NoteCategory } from "@/types";

const router = useRouter();
const store = useNoteStore();

const activeCategory = ref<NoteCategory | "all">("all");
const searchQuery = ref("");
const appliedSearch = ref("");
const currentPage = ref(1);
const PAGE_SIZE = 9;

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

const totalPages = computed(() =>
  Math.max(1, Math.ceil(store.listTotal / PAGE_SIZE)),
);

function doSearch() {
  appliedSearch.value = searchQuery.value.trim();
  currentPage.value = 1;
}

function setCategory(cat: NoteCategory | "all") {
  activeCategory.value = cat;
  currentPage.value = 1;
}

function prevPage() {
  if (currentPage.value <= 1) return;
  currentPage.value--;
}

function nextPage() {
  if (currentPage.value >= totalPages.value) return;
  currentPage.value++;
}
</script>

<template>
  <div class="notes-page">
    <div class="notes-hero">
      <div class="container">
        <div class="notes-hero__inner">
          <h1 class="notes-title">
            <div class="title-icon animate-float">📔</div>笔记
          </h1>
          <p class="notes-subtitle">记录灵感、工作与生活，随时查阅。</p>
          <div class="search-row">
            <input
              v-model="searchQuery"
              type="search"
              class="search-input"
              placeholder="搜索笔记标题或内容..."
              enterkeyhint="search"
              autocomplete="off"
              @keydown.enter.prevent="doSearch"
            />
            <button type="button" class="search-btn" @click="doSearch">
              🔍 搜索
            </button>
            <AppButton
              @click="router.push('/notes/new')"
              >✏️ 写笔记</AppButton
            >
          </div>
          <div class="category-filter">
            <button
              v-for="(label, key) in categoryLabels"
              :key="key"
              type="button"
              :class="[
                'cat-btn',
                { 'cat-btn--active': activeCategory === key },
              ]"
              @click="setCategory(key as NoteCategory | 'all')"
            >
              {{ categoryIcons[key] }} {{ label }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="container notes-body">
      <Suspense>
        <template #default>
          <NotesListResults
            :active-category="activeCategory"
            :search-query="appliedSearch"
            :current-page="currentPage"
          />
        </template>
        <template #fallback>
          <div
            class="notes-suspense-fallback"
            aria-busy="true"
            aria-label="加载笔记列表"
          >
            <p class="notes-suspense-fallback__title">正在加载笔记列表…</p>
            <div class="skeleton-grid">
              <div v-for="n in 9" :key="n" class="skeleton-card">
                <div class="skeleton-card__shine" />
                <div class="skeleton-card__line skeleton-card__line--wide" />
                <div class="skeleton-card__line" />
                <div class="skeleton-card__line" />
                <div class="skeleton-card__line skeleton-card__line--short" />
              </div>
            </div>
          </div>
        </template>
      </Suspense>
      <div
        v-if="store.listTotal > 0 && totalPages > 1"
        class="pagination"
      >
        <button
          type="button"
          class="page-btn"
          :disabled="currentPage === 1"
          @click="prevPage"
        >
          ← 上一页
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button
          type="button"
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="nextPage"
        >
          下一页 →
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}
.notes-page {
  min-height: calc(100vh - 64px);
}
.notes-hero {
  padding: 60px 0 28px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 32px;
}
.notes-hero__inner {
  text-align: left;
}
.notes-title {
  display: flex;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.03em;
  margin-bottom: 6px;
  text-align: center;
  justify-content: center;
}
.notes-subtitle {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  font-family: var(--font-serif);
  margin-bottom: 20px;
  text-align: center;
}
.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.search-input {
  flex: 1;
  padding: 11px 18px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  outline: none;
  transition: all var(--transition-fast);
}
.search-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(91, 138, 240, 0.12);
}
.search-input::placeholder {
  color: var(--color-text-muted);
}
.search-input::-webkit-search-cancel-button {
  cursor: pointer;
  opacity: 0.65;
}
.search-input::-webkit-search-cancel-button:hover {
  opacity: 1;
}
.search-btn {
  flex-shrink: 0;
  padding: 10px 18px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--color-text-secondary);
  white-space: nowrap;
}
.search-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.cat-btn {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.cat-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.cat-btn--active {
  background: rgba(91, 138, 240, 0.1);
  color: var(--color-primary);
  border-color: rgba(91, 138, 240, 0.3);
  font-weight: 600;
}
.notes-body {
  padding-bottom: 80px;
}
.notes-suspense-fallback {
  padding: 24px 0 48px;
}
.notes-suspense-fallback__title {
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-bottom: 24px;
}
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.skeleton-card {
  position: relative;
  overflow: hidden;
  min-height: 160px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-left-width: 4px;
  border-left-color: var(--color-border);
}
.skeleton-card__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(91, 138, 240, 0.06) 50%,
    transparent 60%
  );
  background-size: 200% 100%;
  animation: skeleton-shine 1.4s ease-in-out infinite;
  pointer-events: none;
}
.skeleton-card__line {
  height: 10px;
  border-radius: var(--radius-sm);
  background: var(--color-border);
  opacity: 0.55;
  width: 70%;
}
.skeleton-card__line--wide {
  width: 40%;
  height: 12px;
}
.skeleton-card__line--short {
  width: 50%;
}
@keyframes skeleton-shine {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 40px;
}
.page-btn {
  padding: 8px 20px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--color-text-secondary);
}
.page-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-info {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  min-width: 60px;
  text-align: center;
}
@media (max-width: 640px) {
  .skeleton-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useArticleStore } from "@/stores/article";
import { categories } from "@/data";
import BlogListResults from "@/components/blog/BlogListResults.vue";
import AppButton from "@/components/common/AppButton.vue";

const router = useRouter();
const store = useArticleStore();

const activeCategory = ref("all");
/** 输入框草稿，不参与请求；点击「搜索」后写入 appliedSearchQuery */
const searchDraft = ref("");
/** 已生效的搜索关键词，传给列表接口 */
const appliedSearchQuery = ref("");
const currentPage = ref(1);
const PAGE_SIZE = 8;

const categoryColors: Record<string, string> = {
  技术: "#6C8EBF",
  生活: "#82B366",
  设计: "#B85450",
  思考: "#9673A6",
};
const categoryIcons: Record<string, string> = {
  all: "📋",
  技术: "💻",
  生活: "🌿",
  设计: "🎨",
  思考: "💡",
};

const totalPages = computed(() =>
  Math.max(1, Math.ceil(store.listTotal / PAGE_SIZE)),
);

function doSearch() {
  appliedSearchQuery.value = searchDraft.value.trim();
  currentPage.value = 1;
}

function handleCategoryChange(cat: string) {
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
  <div class="article-list">
    <div class="list-hero">
      <div class="container">
        <div class="list-hero__inner">
          <h1 class="list-title">
            <div class="title-icon animate-float">📝</div>文章
          </h1>
          <p class="list-subtitle">
            记录技术探索、生活感悟，以及那些值得留存的思考。
          </p>
          <div class="search-row">
            <input
              v-model="searchDraft"
              type="search"
              class="search-input"
              placeholder="搜索文章..."
              enterkeyhint="search"
              autocomplete="off"
              @keydown.enter.prevent="doSearch"
            />
            <button type="button" class="search-btn" @click="doSearch">
              🔍 搜索
            </button>
            <AppButton
              @click="router.push('/blog/new')"
              >✏️ 写文章</AppButton
            >
          </div>
          <div class="category-filter">
            <button
              :class="[
                'cat-btn',
                { 'cat-btn--active': activeCategory === 'all' },
              ]"
              @click="handleCategoryChange('all')"
            >
              {{ categoryIcons["all"] }} 全部
            </button>
            <button
              v-for="cat in categories"
              :key="cat.id"
              :class="[
                'cat-btn',
                { 'cat-btn--active': activeCategory === cat.name },
              ]"
              :style="
                activeCategory === cat.name
                  ? {
                      background: categoryColors[cat.name] + '18',
                      color: categoryColors[cat.name],
                      borderColor: categoryColors[cat.name] + '40',
                    }
                  : {}
              "
              @click="handleCategoryChange(cat.name)"
            >
              {{ categoryIcons[cat.name] || "📄" }} {{ cat.name }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="container list-body">
      <!-- 首屏列表数据：子组件 top-level await，Suspense 在就绪前只显示 fallback -->
      <Suspense>
        <template #default>
          <BlogListResults
            :active-category="activeCategory"
            :search-query="appliedSearchQuery"
            :current-page="currentPage"
          />
        </template>
        <template #fallback>
          <div class="list-suspense-fallback" aria-busy="true" aria-label="加载文章列表">
            <p class="list-suspense-fallback__title">正在加载文章列表…</p>
            <div class="skeleton-grid">
              <div v-for="n in 8" :key="n" class="skeleton-card">
                <div class="skeleton-card__shine" />
                <div class="skeleton-card__line skeleton-card__line--wide" />
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
          class="page-btn"
          :disabled="currentPage === 1"
          @click="prevPage"
        >
          ← 上一页
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button
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
.list-hero {
  padding: 60px 0 28px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 32px;
}
.list-hero__inner {
  text-align: left;
  max-width: 100%;
}
.list-title {
  display: flex;
  justify-content: center;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.03em;
  margin-bottom: 6px;
  text-align: center;
}
.list-subtitle {
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
  justify-content: flex-start;
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
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 12%, transparent);
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
  padding: 11px 18px;
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
  justify-content: flex-start;
}
.cat-btn {
  padding: 6px 16px;
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
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
  font-weight: 600;
}
.list-body {
  padding-bottom: 80px;
}
.list-suspense-fallback {
  padding: 24px 0 48px;
}
.list-suspense-fallback__title {
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-bottom: 24px;
}
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
}
.skeleton-card {
  position: relative;
  overflow: hidden;
  min-height: 200px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.skeleton-card__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 40%,
    color-mix(in srgb, var(--color-primary) 6%, transparent) 50%,
    transparent 60%
  );
  background-size: 200% 100%;
  animation: skeleton-shine 1.4s ease-in-out infinite;
  pointer-events: none;
}
.skeleton-card__line {
  height: 12px;
  border-radius: var(--radius-sm);
  background: var(--color-border);
  opacity: 0.55;
  width: 72%;
}
.skeleton-card__line--wide {
  width: 88%;
  height: 18px;
}
.skeleton-card__line--short {
  width: 45%;
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
</style>

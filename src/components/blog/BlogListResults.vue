<script setup lang="ts">
import { watch } from "vue";
import { useRouter } from "vue-router";
import { useArticleStore } from "@/stores/article";
import { useAuthStore } from "@/stores/auth";
import ArticleCard from "@/components/blog/ArticleCard.vue";
import AppButton from "@/components/common/AppButton.vue";

const PAGE_SIZE = 8;

const props = defineProps<{
  activeCategory: string;
  searchQuery: string;
  currentPage: number;
}>();

const router = useRouter();
const store = useArticleStore();
const authStore = useAuthStore();

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

async function fetchArticlesPage() {
  await store.fetchList({
    ...listParams(),
    limit: PAGE_SIZE,
    offset: (props.currentPage - 1) * PAGE_SIZE,
  });
}

/** 首屏：Suspense 会等到该 Promise 完成再替换 #fallback */
await fetchArticlesPage();

/** 筛选 / 翻页 / 搜索：再次请求（不再插顶部 loading 条，避免布局跳动） */
watch(
  () =>
    [props.activeCategory, props.searchQuery, props.currentPage] as const,
  () => {
    fetchArticlesPage();
  },
);

async function handleDelete(id: string) {
  if (!confirm("确定删除这篇文章吗？")) return;
  await store.remove(id);
}
</script>

<template>
  <div class="list-results">
    <div v-if="store.error" class="empty-state">
      <span>😕 {{ store.error }}</span>
      <AppButton variant="secondary" @click="fetchArticlesPage()"
        >重试</AppButton
      >
    </div>
    <template v-else>
      <div v-if="!store.listTotal" class="empty-state">
        <span class="empty-state__icon">📝</span>
        <p>还没有文章，去写第一篇吧！</p>
        <AppButton
          @click="router.push('/blog/new')"
          >✏️ 写文章</AppButton
        >
      </div>
      <template v-else>
        <div class="articles-grid">
          <div
            v-for="(article, i) in store.articles"
            :key="article.id"
            class="article-wrap animate-fade-in-up"
            :class="`delay-${Math.min(i * 100, 500)}`"
          >
            <ArticleCard
              :article="article"
              :featured="article.featured"
              :editable="authStore.isLoggedIn"
              @edit="router.push(`/blog/${$event}/edit`)"
              @delete="handleDelete"
            />
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.list-results {
  position: relative;
  min-height: 120px;
}
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
}
.article-wrap {
  position: relative;
}
.empty-state {
  text-align: center;
  padding: 80px 24px;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.empty-state__icon {
  font-size: 3rem;
}
</style>

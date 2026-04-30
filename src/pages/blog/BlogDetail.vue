<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/auth";
import { articleApi } from "@/api";
import type { Article } from "@/types";
import { pickRelatedArticles } from "@/lib/recommendArticles";
import AppBadge from "@/components/common/AppBadge.vue";
import AppButton from "@/components/common/AppButton.vue";
import { useArticleStore } from "@/stores/article";
import { marked } from "marked";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const articleStore = useArticleStore();

const article = ref<Article | null>(null);
const recommended = ref<Article[]>([]);
const loading = ref(true);
const notFound = ref(false);

const likeLoading = ref(false);

const categoryColors: Record<string, string> = {
  技术: "#6C8EBF",
  生活: "#82B366",
  设计: "#B85450",
  思考: "#9673A6",
};


async function loadArticle() {
  const id = route.params.id as string;
  if (!id) return;
  loading.value = true;
  notFound.value = false;
  article.value = null;
  recommended.value = [];
  try {
    article.value = await articleApi.getById(id);
    try {
      const all = await articleApi.getList();
      if (article.value) {
        recommended.value = pickRelatedArticles(article.value, all, 6);
      }
    } catch {
      recommended.value = [];
    }
  } catch {
    notFound.value = true;
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.id, loadArticle, { immediate: true });

function renderMarkdown(content: string) {
  return marked(content) as string;
}

const isLiked = computed(() => {
  return !!article.value && articleStore.likingIds.has(article.value.id);
});

async function handleLike() {
  if (!article.value || likeLoading.value || articleStore.likingIds.has(article.value.id)) return;
  article.value.likes = article.value.likes + 1;
  likeLoading.value = true;
  const currentId = article.value.id;
  articleStore.addLikingId(currentId);
  try {
    article.value = await articleApi.like(currentId, article.value.likes);
  } catch {
    article.value.likes--;
    articleStore.removeLikingId(currentId);
  } finally {
    likeLoading.value = false;
  }
}

const displayDate = computed(() => {
  const a = article.value;
  if (!a) return "";
  const raw = a.publishedAt || a.updatedAt;
  if (!raw || typeof raw !== "string") return "";
  const d = dayjs(raw);
  return d.isValid() ? d.format("YYYY-MM-DD HH:mm") : raw;
});
</script>

<template>
  <div class="blog-detail">
    <div v-if="loading" class="container">
      <div class="detail-layout detail-layout--skeleton">
        <div class="detail-main">
          <div class="skeleton-hero glass-card">
            <div class="detail-topbar">
              <div class="skeleton skeleton-text skeleton-text--sm" style="width: 132px" />
              <div class="skeleton skeleton-pill" style="width: 72px" />
            </div>
            <header class="article-header">
              <div class="article-header__meta">
                <div class="skeleton skeleton-pill" style="width: 64px" />
                <div class="skeleton skeleton-text skeleton-text--sm" style="width: 140px" />
                <div class="skeleton skeleton-text skeleton-text--sm" style="width: 92px" />
              </div>
              <div class="skeleton skeleton-text skeleton-text--title" style="width: 68%" />
              <div class="skeleton skeleton-text skeleton-text--lg" style="width: 92%" />
              <div class="skeleton skeleton-text skeleton-text--lg" style="width: 78%" />
              <div class="skeleton skeleton-media" />
              <div class="article-header__tags">
                <div class="skeleton skeleton-pill" style="width: 78px" />
                <div class="skeleton skeleton-pill" style="width: 64px" />
                <div class="skeleton skeleton-pill" style="width: 88px" />
              </div>
            </header>
          </div>

          <main class="article-body glass-card">
            <div class="skeleton skeleton-text" style="width: 100%" />
            <div class="skeleton skeleton-text" style="width: 96%" />
            <div class="skeleton skeleton-text" style="width: 98%" />
            <div class="skeleton skeleton-text" style="width: 90%" />
            <div class="skeleton skeleton-text" style="width: 94%" />
            <div class="skeleton skeleton-text" style="width: 82%" />
          </main>

          <div class="article-footer">
            <div class="skeleton skeleton-pill" style="width: 112px" />
            <div class="skeleton skeleton-pill" style="width: 132px" />
          </div>
        </div>

        <aside class="detail-sidebar" aria-hidden="true">
          <div class="sidebar-card glass-card">
            <div class="skeleton skeleton-text skeleton-text--lg" style="width: 84px" />
            <div class="skeleton skeleton-text skeleton-text--sm" style="width: 100%; margin-top: 12px" />
            <div class="skeleton skeleton-text skeleton-text--sm" style="width: 88%" />
            <div class="rec-list">
              <div v-for="i in 3" :key="i" class="rec-item__link">
                <div class="skeleton skeleton-thumb" />
                <div class="rec-item__body">
                  <div class="skeleton skeleton-text skeleton-text--xs" style="width: 56px" />
                  <div class="skeleton skeleton-text skeleton-text--sm" style="width: 100%; margin-top: 6px" />
                  <div class="skeleton skeleton-text skeleton-text--sm" style="width: 82%" />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
    <div v-else-if="article" class="container">
      <div class="detail-layout">
        <div class="detail-main">
          <div class="detail-topbar">
            <button class="back-btn" @click="router.push('/blog')">
              ← 返回文章列表
            </button>
            <div v-if="authStore.isLoggedIn" class="detail-ops">
              <button class="op-btn" @click="router.push(`/blog/${article.id}/edit`)">
                ✏️ 编辑
              </button>
            </div>
          </div>
          <header class="article-header animate-fade-in-up">
            <div class="article-header__meta">
              <AppBadge :color="categoryColors[article.category]">{{
                article.category
              }}</AppBadge>
              <span class="meta-text" :title="article.publishedAt || article.updatedAt">📅 {{ displayDate }}</span>
              <span class="meta-text">👁 {{ article.views }} 次阅读</span>
            </div>
            <h1 class="article-header__title">{{ article.title }}</h1>
            <p class="article-header__summary">{{ article.summary }}</p>
            <div v-if="article.cover" class="article-header__cover">
              <img :src="article.cover" :alt="article.title" />
            </div>
            <div class="article-header__tags">
              <span v-for="tag in article.tags" :key="tag" class="tag"># {{ tag }}</span>
            </div>
          </header>

          <main class="article-body glass-card animate-fade-in-up delay-200">
            <div class="prose" v-html="renderMarkdown(article.content)" />
          </main>

          <div class="article-footer animate-fade-in-up delay-300">
            <button class="like-btn" :class="{ 'like-btn--liked': isLiked }" :disabled="isLiked || likeLoading"
              @click="handleLike">
              {{ isLiked ? "💖 已点赞" : "❤️ 点赞" }} {{ article.likes }}
            </button>
            <AppButton variant="secondary" @click="router.push('/blog')">← 返回文章列表</AppButton>
          </div>
        </div>

        <aside v-if="recommended.length" class="detail-sidebar" aria-label="推荐阅读">
          <div class="sidebar-card glass-card animate-fade-in">
            <h2 class="sidebar-card__title">推荐阅读</h2>
            <p class="sidebar-card__hint">
              同分类与标签重合加分，再结合阅读量与发布时间排序；已尽量避免标题几乎相同的重复篇目。
            </p>
            <ul class="rec-list">
              <li v-for="item in recommended" :key="item.id" class="rec-item">
                <router-link :to="`/blog/${item.id}`" class="rec-item__link">
                  <div v-if="item.cover" class="rec-item__thumb">
                    <img :src="item.cover" :alt="item.title" loading="lazy"
                      @error="($event.target as HTMLImageElement).style.display = 'none'" />
                  </div>
                  <div class="rec-item__body">
                    <span class="rec-item__cat" :style="{
                      color: categoryColors[item.category] || 'var(--color-primary)',
                    }">{{ item.category }}</span>
                    <h3 class="rec-item__title">{{ item.title }}</h3>
                    <div class="rec-item__meta">
                      <span>👁 {{ item.views }}</span>
                      <span v-if="item.tags?.length">· {{ item.tags.slice(0, 2).join(' · ') }}</span>
                    </div>
                  </div>
                </router-link>
              </li>
            </ul>
            <router-link to="/blog" class="sidebar-card__more">更多文章 →</router-link>
          </div>
        </aside>
      </div>
    </div>
    <div v-else class="not-found">
      <span>😕 文章未找到</span>
      <AppButton @click="router.push('/blog')">返回列表</AppButton>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 40px 24px 80px;
}

.detail-layout {
  display: flex;
  align-items: flex-start;
  gap: 36px;
}

.detail-main {
  flex: 1;
  min-width: 0;
}

.detail-sidebar {
  width: 300px;
  flex-shrink: 0;
}

.sidebar-card {
  padding: 20px 18px;
  border-radius: var(--radius-lg);
}

.sidebar-card__title {
  margin: 0 0 6px;
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.sidebar-card__hint {
  margin: 0 0 16px;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: 1.45;
}

.rec-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rec-item__link {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 10px;
  margin: 0 -10px;
  border-radius: var(--radius-md);
  text-decoration: none;
  color: inherit;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.rec-item__link:hover {
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.rec-item__thumb {
  width: 72px;
  height: 52px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--gradient-hero);
}

.rec-item__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rec-item__body {
  min-width: 0;
  flex: 1;
}

.rec-item__cat {
  display: block;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 4px;
  letter-spacing: 0.02em;
}

.rec-item__title {
  margin: 0 0 6px;
  font-size: var(--text-sm);
  font-weight: 600;
  line-height: 1.45;
  color: var(--color-text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rec-item__meta {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-card__more {
  display: block;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
  text-align: center;
  transition: opacity 0.2s ease;
}

.sidebar-card__more:hover {
  opacity: 0.85;
}

/* 侧栏与主栏等高（stretch），sticky 才能在整页滚动时相对视口吸附；勿在侧栏父级使用 transform 动画 */
@media (min-width: 961px) {
  .detail-layout {
    align-items: stretch;
  }

  .detail-sidebar {
    display: flex;
    flex-direction: column;
  }

  .sidebar-card {
    position: sticky;
    top: 80px;
    align-self: flex-start;
    width: 100%;
    max-height: calc(100vh - 96px);
    overflow-y: auto;
  }
}

@media (max-width: 960px) {
  .detail-layout {
    flex-direction: column;
  }

  .detail-sidebar {
    width: 100%;
  }

  .sidebar-card {
    position: static;
    max-height: none;
    overflow-y: visible;
  }
}

.detail-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.back-btn {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: color var(--transition-fast);
  background: none;
  border: none;
}

.back-btn:hover {
  color: var(--color-primary);
}

.detail-ops {
  display: flex;
  gap: 8px;
}

.op-btn {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.op-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.article-header {
  margin-bottom: 32px;
}

.article-header__cover {
  border-radius: var(--radius-xl);
  overflow: hidden;
  aspect-ratio: 16/9;
  margin-top: 8px;
  margin-bottom: 20px;
  background: var(--gradient-hero);
}

.article-header__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-header__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.meta-text {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.article-header__title {
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.25;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
}

.article-header__summary {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  font-family: var(--font-serif);
  line-height: 1.7;
  margin-bottom: 20px;
}

.article-header__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.article-body {
  padding: 40px 48px;
  margin-bottom: 32px;
}

.article-footer {
  display: flex;
  align-items: center;
  gap: 16px;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.like-btn:hover {
  border-color: #e8607a;
  color: #e8607a;
  transform: scale(1.05);
}

.like-btn--liked {
  border-color: #e8607a;
  color: #e8607a;
  background: color-mix(in srgb, #e8607a 12%, transparent);
}

.like-btn:disabled {
  cursor: not-allowed;
  transform: none;
}

.detail-layout--skeleton {
  align-items: flex-start;
}

.skeleton-hero {
  padding: 24px;
  margin-bottom: 24px;
}

.skeleton {
  position: relative;
  overflow: hidden;
  background: color-mix(in srgb, var(--color-text-muted) 12%, var(--color-bg-card));
  border-radius: var(--radius-md);
}

.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}

.skeleton-text {
  height: 14px;
  margin-bottom: 12px;
}

.skeleton-text--xs {
  height: 10px;
  margin-bottom: 8px;
}

.skeleton-text--sm {
  height: 12px;
}

.skeleton-text--lg {
  height: 18px;
}

.skeleton-text--title {
  height: 40px;
  margin-bottom: 18px;
}

.skeleton-pill {
  height: 34px;
  border-radius: var(--radius-full);
}

.skeleton-media {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: var(--radius-xl);
  margin: 8px 0 20px;
}

.skeleton-thumb {
  width: 72px;
  height: 52px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

@keyframes skeleton-shimmer {

  0%,
  100% {
    transform: translateX(-100%);
  }

  50% {
    transform: translateX(100%);
  }
}

.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 20px;
  font-size: 1.5rem;
  color: var(--color-text-muted);
}

@media (max-width: 640px) {
  .article-body {
    padding: 24px 20px;
  }
}
</style>

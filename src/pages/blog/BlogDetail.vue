<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { articleApi } from "@/api";
import type { Article } from "@/types";
import AppBadge from "@/components/common/AppBadge.vue";
import AppButton from "@/components/common/AppButton.vue";

import { marked } from "marked";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const article = ref<Article | null>(null);
const loading = ref(true);
const notFound = ref(false);

const categoryColors: Record<string, string> = {
  技术: "#6C8EBF",
  生活: "#82B366",
  设计: "#B85450",
  思考: "#9673A6",
};

onMounted(async () => {
  try {
    article.value = await articleApi.getById(route.params.id as string);
  } catch {
    notFound.value = true;
  } finally {
    loading.value = false;
  }
});

function renderMarkdown(content: string) {
  return marked(content) as string;
}

async function handleLike() {
  if (!article.value) return;
  article.value = await articleApi.like(article.value.id, article.value.likes);
}
</script>

<template>
  <div class="blog-detail">
    <div v-if="loading" class="loading-state">
      <div class="loading-dots"><span /><span /><span /></div>
      <p>加载中...</p>
    </div>
    <div v-else-if="article" class="container">
      <div class="detail-topbar">
        <button class="back-btn" @click="router.push('/blog')">
          ← 返回文章列表
        </button>
        <div v-if="authStore.isLoggedIn" class="detail-ops">
          <button
            class="op-btn"
            @click="router.push(`/blog/${article.id}/edit`)"
          >
            ✏️ 编辑
          </button>
        </div>
      </div>

      <header class="article-header animate-fade-in-up">
        <div class="article-header__cover">
          <img :src="article.cover" :alt="article.title" />
        </div>
        <div class="article-header__meta">
          <AppBadge :color="categoryColors[article.category]">{{
            article.category
          }}</AppBadge>
          <span class="meta-text">📅 {{ article.publishedAt }}</span>
          <span class="meta-text">👁 {{ article.views }} 次阅读</span>
        </div>
        <h1 class="article-header__title">{{ article.title }}</h1>
        <p class="article-header__summary">{{ article.summary }}</p>
        <div class="article-header__tags">
          <span v-for="tag in article.tags" :key="tag" class="tag"
            ># {{ tag }}</span
          >
        </div>
      </header>

      <main class="article-body glass-card animate-fade-in-up delay-200">
        <div class="prose" v-html="renderMarkdown(article.content)" />
      </main>

      <div class="article-footer animate-fade-in-up delay-300">
        <button class="like-btn" @click="handleLike">
          ❤️ {{ article.likes }} 点赞
        </button>
        <AppButton variant="secondary" @click="router.push('/blog')"
          >← 返回文章列表</AppButton
        >
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
  max-width: 860px;
  margin: 0 auto;
  padding: 40px 24px 80px;
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
  margin-bottom: 24px;
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
  margin-bottom: 16px;
}
.article-header__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 120px 24px;
  color: var(--color-text-muted);
}
.loading-dots {
  display: flex;
  gap: 6px;
}
.loading-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: bounce 1.2s ease-in-out infinite;
}
.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}
.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
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

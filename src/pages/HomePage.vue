<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { articleApi } from '@/api'
import { noteApi } from '@/api/notes'
import dayjs from 'dayjs'
import { aiFeatures } from '@/data'
import type { Article } from '@/types'
import ArticleCard from '@/components/blog/ArticleCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import SectionTitle from '@/components/common/SectionTitle.vue'

const router = useRouter()
const authStore = useAuthStore()

const featuredArticles = ref<Article[]>([])
const recentArticles = ref<Article[]>([])
const panelArticlesLoaded = ref(false)
const topAI = aiFeatures.filter((i) => i.isNew && !i.hidden).slice(0, 5)
const stats = ref({ articles: 0, notes: 0, views: 0 })

const siteName = computed(() => authStore.siteSettings?.site_name?.trim() || '个人博客')
const heroAccentLine = computed(() => authStore.siteSettings?.owner_nickname?.trim() || '来访者您好')
const heroBadgeText = computed(() => {
  const sub = authStore.siteSettings?.site_subtitle?.trim()
  if (sub) return sub
  return '博客 · 笔记 · 工具'
})
const panelCenterLine = computed(() => {
  const s = authStore.siteSettings
  const sub = s?.site_subtitle?.trim()
  if (sub) return sub
  const d = s?.site_description?.trim()
  if (!d) return '写自己想写的内容。'
  if (d.length <= 88) return d
  return `${d.slice(0, 88).trimEnd()}…`
})

/** 侧栏：有精选则单篇焦点，否则最近几条标题，再无则摘要文案 */
const panelSpotlightArticle = computed(() => featuredArticles.value[0] ?? null)
const panelFeedArticles = computed(() => recentArticles.value.slice(0, 3))

function formatPanelArticleDate(article: Article) {
  const raw = article.publishedAt || article.updatedAt
  if (!raw || typeof raw !== 'string') return ''
  const d = dayjs(raw)
  return d.isValid() ? d.format('YYYY-MM-DD') : raw
}

onMounted(async () => {
  try {
    await authStore.fetchSiteSettings()
  } catch {}
  try {
    const allArticles = await articleApi.getList()
    featuredArticles.value = allArticles.filter(a => a.featured).slice(0, 4)
    recentArticles.value = allArticles.slice(0, 4)
    stats.value.articles = allArticles.length
    stats.value.views = allArticles.reduce((sum, a) => sum + (a.views || 0), 0)
  } catch {
  } finally {
    panelArticlesLoaded.value = true
  }
  try {
    const allNotes = await noteApi.getList()
    stats.value.notes = allNotes.length
  } catch {}
})
</script>

<template>
  <div class="home">
    <section class="hero" aria-label="站点介绍">
      <div class="hero__ambient" aria-hidden="true">
        <div class="hero__grid" />
        <div class="hero__orb hero__orb--primary" />
        <div class="hero__orb hero__orb--mid" />
        <div class="hero__noise" />
      </div>

      <div class="hero__shell">
        <div class="hero__columns">
          <div class="hero__content">
            <div class="hero__badge">
              <span class="hero__badge-dot" aria-hidden="true" />
              <span>{{ heroBadgeText }}</span>
            </div>

            <h1 class="hero__title">
              <span class="hero__title-line">{{ siteName }}</span>
              <span class="hero__title-gradient text-gradient">{{ heroAccentLine }}</span>
            </h1>

            <p class="hero__bio">
              {{ authStore.siteSettings?.site_description || '记录生活与技术的小角落' }}
            </p>

            <div class="hero__meta-row">
              <span class="hero__meta-pill">
                <span class="hero__meta-glow" aria-hidden="true" />
                {{ authStore.siteSettings?.owner_nickname || '晨光' }}
              </span>
              <span class="hero__meta-sep" aria-hidden="true" />
              <span class="hero__meta-muted">📍 {{ authStore.siteSettings?.owner_location || '深圳' }}</span>
              <span class="hero__meta-sep" aria-hidden="true" />
              <span class="hero__meta-status">在线</span>
            </div>

            <div class="hero__actions">
              <AppButton size="lg" class="hero__btn-primary" @click="router.push('/blog')">探索文章</AppButton>
              <AppButton variant="secondary" size="lg" class="hero__btn-secondary" @click="router.push('/notes')">浏览笔记</AppButton>
            </div>

            <div class="hero__stats-grid">
              <div class="stat-card">
                <div class="stat-card__num">{{ stats.articles }}</div>
                <div class="stat-card__label">篇文章</div>
              </div>
              <div class="stat-card">
                <div class="stat-card__num">{{ stats.notes }}</div>
                <div class="stat-card__label">条笔记</div>
              </div>
              <div class="stat-card">
                <div class="stat-card__num">{{ stats.views > 999 ? (stats.views / 1000).toFixed(1) + 'K' : stats.views }}</div>
                <div class="stat-card__label">次阅读</div>
              </div>
            </div>
          </div>

          <aside class="hero__panel" aria-label="站点概览">
            <div class="hero__panel-top">
              <span class="hero__panel-tag">快速入口</span>
              <div class="hero__panel-chips">
                <button type="button" class="hero__chip" @click="router.push('/blog')">
                  <span class="hero__chip-dot hero__chip-dot--primary" aria-hidden="true" />文章
                </button>
                <button type="button" class="hero__chip" @click="router.push('/notes')">
                  <span class="hero__chip-dot hero__chip-dot--secondary" aria-hidden="true" />笔记
                </button>
                <button type="button" class="hero__chip" @click="router.push('/ai')">
                  <span class="hero__chip-dot hero__chip-dot--mid" aria-hidden="true" />AI
                </button>
              </div>
            </div>
            <div class="hero__panel-stage">
              <p class="hero__panel-stage-label">
                {{
                  !panelArticlesLoaded
                    ? '加载中'
                    : panelSpotlightArticle
                      ? '推荐阅读'
                      : panelFeedArticles.length
                        ? '最近更新'
                        : '站点摘要'
                }}
              </p>
              <div
                class="hero__panel-stage-inner"
                :class="{
                  'hero__panel-stage-inner--skeleton': !panelArticlesLoaded,
                  'hero__panel-stage-inner--spotlight': panelArticlesLoaded && panelSpotlightArticle,
                  'hero__panel-stage-inner--feed':
                    panelArticlesLoaded && !panelSpotlightArticle && panelFeedArticles.length,
                }"
              >
                <div class="hero__panel-pulse" />
                <template v-if="!panelArticlesLoaded">
                  <div class="hero__panel-skeleton" aria-busy="true" aria-live="polite">
                    <span class="hero__sr-only">内容加载中</span>
                    <div class="hero__sk-cover" />
                    <div class="hero__sk-body">
                      <div class="hero__sk-line hero__sk-line--title" />
                      <div class="hero__sk-line hero__sk-line--meta" />
                    </div>
                  </div>
                </template>
                <template v-else-if="panelSpotlightArticle">
                  <button
                    type="button"
                    class="hero__spotlight"
                    @click="router.push(`/blog/${panelSpotlightArticle.id}`)"
                  >
                    <div class="hero__spotlight-cover">
                      <img :src="panelSpotlightArticle.cover" alt="" />
                    </div>
                    <div class="hero__spotlight-body">
                      <h3 class="hero__spotlight-title">{{ panelSpotlightArticle.title }}</h3>
                      <p class="hero__spotlight-meta">
                        {{ formatPanelArticleDate(panelSpotlightArticle) }}
                        <template v-if="panelSpotlightArticle.category">
                          <span class="hero__spotlight-meta-sep" aria-hidden="true" />· {{ panelSpotlightArticle.category }}
                        </template>
                      </p>
                    </div>
                  </button>
                </template>
                <template v-else-if="panelFeedArticles.length">
                  <ul class="hero__panel-feed">
                    <li v-for="a in panelFeedArticles" :key="a.id">
                      <button type="button" class="hero__panel-feed-row" @click="router.push(`/blog/${a.id}`)">
                        <span class="hero__panel-feed-title">{{ a.title }}</span>
                        <span class="hero__panel-feed-date">{{ formatPanelArticleDate(a) }}</span>
                      </button>
                    </li>
                  </ul>
                </template>
                <p v-else class="hero__panel-stage-text">{{ panelCenterLine }}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section__header">
          <SectionTitle title="精选文章" subtitle="记录技术探索与生活感悟" />
          <AppButton variant="ghost" @click="router.push('/blog')">查看全部 →</AppButton>
        </div>
        <div v-if="featuredArticles.length" class="featured-grid">
          <ArticleCard v-for="article in featuredArticles" :key="article.id" :article="article" :featured="true" class="animate-fade-in-up" />
        </div>
        <div v-else class="empty-articles"><p>还没有精选文章</p></div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container">
        <div class="section__header">
          <SectionTitle title="最新动态" subtitle="持续更新，记录每一个值得记录的时刻" />
          <AppButton variant="ghost" @click="router.push('/blog')">更多文章 →</AppButton>
        </div>
        <div v-if="recentArticles.length" class="recent-grid">
          <ArticleCard v-for="(article, i) in recentArticles" :key="article.id" :article="article" class="animate-fade-in-up" :class="`delay-${(i+1)*100}`" />
        </div>
        <div v-else class="empty-articles"><p>还没有文章</p></div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section__header">
          <SectionTitle title="AI 工坊" subtitle="智能工具，让创作更高效" />
          <AppButton variant="ghost" @click="router.push('/ai')">探索全部 →</AppButton>
        </div>
        <div class="ai-preview">
          <div v-for="(feat, i) in topAI" :key="feat.id" class="ai-preview-card animate-fade-in-up" :class="`delay-${(i+1)*100}`" @click="router.push('/ai')" style="cursor: pointer;">
            <div class="ai-preview-card__head">
              <span class="ai-preview-card__icon" aria-hidden="true">{{ feat.emoji }}</span>
              <h4 class="ai-preview-card__name">{{ feat.name }}</h4>
            </div>
            <p class="ai-preview-card__desc">{{ feat.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--entry-banners section--alt">
      <div class="container entry-banners">
        <div class="resume-entry-banner" @click="router.push('/resume')">
          <div class="resume-entry-banner__content">
            <div class="resume-entry-banner__emoji">📄</div>
            <div>
              <h3 class="resume-entry-banner__title">我的简历</h3>
              <p class="resume-entry-banner__desc">在线简历编辑器，支持多种模块和实时预览 ✨</p>
            </div>
          </div>
          <AppButton variant="warm">查看简历 →</AppButton>
        </div>
        <div class="couple-entry-banner" @click="router.push('/couple')">
          <div class="couple-entry-banner__content">
            <div class="couple-entry-banner__emoji">💑</div>
            <div>
              <h3 class="couple-entry-banner__title">情侣空间</h3>
              <p class="couple-entry-banner__desc">一个属于我们两个人的小世界，需要密码才能进入 🔒</p>
            </div>
          </div>
          <AppButton variant="warm">进入空间 →</AppButton>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 首页布局与玻璃质感；颜色全部继承 html[data-theme] 下的全局变量 */
.home {
  background:
    radial-gradient(ellipse 100% 70% at 12% -8%, var(--body-grad-1), transparent 52%),
    radial-gradient(ellipse 80% 55% at 88% 12%, var(--body-grad-2), transparent 48%),
    radial-gradient(ellipse 60% 45% at 50% 100%, var(--body-grad-3), transparent 55%),
    var(--color-bg);
}

/* —— Hero —— */
.hero {
  position: relative;
  min-height: max(640px, calc(100vh - 64px));
  display: flex;
  align-items: center;
  overflow: clip;
  padding: 48px 0 72px;
}

.hero__ambient {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.hero__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(color-mix(in srgb, var(--color-primary) 7%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--color-primary) 7%, transparent) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse 75% 70% at 50% 40%, black 15%, transparent 72%);
  opacity: 0.55;
}

.hero__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(72px);
  opacity: 0.55;
  animation: float 14s ease-in-out infinite;
}

.hero__orb--primary {
  width: min(520px, 90vw);
  height: min(520px, 90vw);
  background: color-mix(in srgb, var(--color-primary) 22%, transparent);
  top: -12%;
  right: -8%;
}

.hero__orb--mid {
  width: min(420px, 80vw);
  height: min(420px, 80vw);
  background: color-mix(in srgb, var(--color-ui-gradient-mid) 18%, transparent);
  bottom: -18%;
  left: -6%;
  animation-delay: -4s;
  animation-direction: reverse;
}

.hero__noise {
  position: absolute;
  inset: 0;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  pointer-events: none;
}

.hero__shell {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px;
}

.hero__columns {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.88fr);
  gap: clamp(32px, 5vw, 64px);
  align-items: stretch;
}

.hero__content {
  text-align: left;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px 8px 12px;
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-bg-glass);
  border: 1px solid var(--color-border);
  margin-bottom: 28px;
  animation: fade-in-down 0.55s ease-out both;
}

.hero__badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
  box-shadow: 0 0 12px color-mix(in srgb, var(--color-success) 55%, transparent);
  flex-shrink: 0;
}

.hero__title {
  margin: 0 0 20px;
  font-family: var(--font-sans);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.08;
  font-size: clamp(2.25rem, 4.2vw + 1rem, 3.65rem);
  animation: fade-in-up 0.65s ease-out 0.06s both;
}

.hero__title-line {
  display: block;
  color: var(--color-text-primary);
}

.hero__title-gradient {
  display: block;
  margin-top: 4px;
  font-size: clamp(2.05rem, 3.8vw + 0.85rem, 3.35rem);
  filter: drop-shadow(0 0 22px color-mix(in srgb, var(--color-primary) 42%, transparent));
}

.hero__bio {
  max-width: 34rem;
  margin: 0 0 24px;
  font-size: clamp(1rem, 0.35vw + 0.95rem, 1.125rem);
  line-height: 1.75;
  color: var(--color-text-secondary);
  animation: fade-in-up 0.65s ease-out 0.12s both;
}

.hero__meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  margin-bottom: 28px;
  font-size: var(--text-sm);
  animation: fade-in-up 0.65s ease-out 0.18s both;
}

.hero__meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  background: var(--color-bg-glass);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  font-weight: 600;
  position: relative;
  overflow: hidden;
}

.hero__meta-glow {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 0 10px var(--color-primary);
}

.hero__meta-muted {
  color: var(--color-text-muted);
}

.hero__meta-sep {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-text-primary) 18%, transparent);
}

.hero__meta-status {
  color: var(--color-success);
  font-weight: 500;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 32px;
  animation: fade-in-up 0.65s ease-out 0.24s both;
}

.hero__btn-primary :deep(.btn--primary) {
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--color-primary) 28%, transparent),
    0 4px 22px color-mix(in srgb, var(--color-primary) 28%, transparent);
}

.hero__btn-secondary :deep(.btn--secondary) {
  background: var(--color-bg-glass);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.hero__btn-secondary :deep(.btn--secondary:hover) {
  border-color: var(--color-border-strong);
  background: color-mix(in srgb, var(--color-primary) 10%, var(--color-bg) 90%);
  color: var(--color-text-primary);
}

.hero__stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  max-width: 420px;
  animation: fade-in-up 0.65s ease-out 0.3s both;
}

.stat-card {
  text-align: center;
  padding: 18px 12px;
  border-radius: 18px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition:
    transform var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base);
}

.stat-card:hover {
  transform: translateY(-3px);
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md), 0 0 24px color-mix(in srgb, var(--color-primary) 14%, transparent);
}

.stat-card__num {
  font-size: var(--text-2xl);
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.stat-card__label {
  margin-top: 6px;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

/* 右侧玻璃面板 */
.hero__panel {
  border-radius: 24px;
  padding: 22px 22px 20px;
  background: var(--color-bg-glass);
  border: 1px solid var(--color-border);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  box-shadow:
    var(--shadow-lg),
    0 0 0 1px color-mix(in srgb, var(--color-primary) 8%, transparent);
  animation: fade-in-up 0.75s ease-out 0.15s both;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.hero__panel-top {
  margin-bottom: 18px;
}

.hero__panel-tag {
  display: inline-block;
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 12px;
}

.hero__panel-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hero__chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-text-primary) 5%, var(--color-bg) 95%);
  border: 1px solid var(--color-border);
  font: inherit;
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast),
    color var(--transition-fast);
}

.hero__chip:hover {
  color: var(--color-primary);
  border-color: color-mix(in srgb, var(--color-primary) 35%, transparent);
  background: color-mix(in srgb, var(--color-primary) 10%, var(--color-bg) 90%);
}

.hero__chip:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.hero__chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.hero__chip-dot--primary {
  background: var(--color-primary);
  box-shadow: 0 0 8px color-mix(in srgb, var(--color-primary) 55%, transparent);
}

.hero__chip-dot--secondary {
  background: var(--color-secondary);
  box-shadow: 0 0 8px color-mix(in srgb, var(--color-secondary) 50%, transparent);
}

.hero__chip-dot--mid {
  background: var(--color-ui-gradient-mid);
  box-shadow: 0 0 8px color-mix(in srgb, var(--color-ui-gradient-mid) 45%, transparent);
}

.hero__panel-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin-bottom: 0;
}

.hero__panel-stage-label {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0 0 10px;
  flex-shrink: 0;
}

.hero__panel-stage-inner {
  position: relative;
  min-height: 140px;
  border-radius: 18px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background:
    radial-gradient(ellipse 90% 85% at 50% 45%, color-mix(in srgb, var(--color-primary) 16%, transparent) 0%, transparent 62%),
    linear-gradient(
      155deg,
      color-mix(in srgb, var(--color-surface) 94%, var(--color-primary) 6%) 0%,
      color-mix(in srgb, var(--color-bg) 92%, var(--color-ui-gradient-mid) 8%) 100%
    );
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.hero__panel-pulse {
  position: absolute;
  width: 140%;
  height: 140%;
  left: -20%;
  top: -20%;
  background: conic-gradient(
    from 118deg,
    transparent,
    color-mix(in srgb, var(--color-primary) 14%, transparent),
    transparent 38%,
    color-mix(in srgb, var(--color-ui-gradient-mid) 12%, transparent),
    transparent 72%
  );
  animation: spin-slow 22s linear infinite;
  pointer-events: none;
}

.hero__panel-stage-text {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: var(--text-sm);
  color: color-mix(in srgb, var(--color-text-primary) 82%, transparent);
  line-height: 1.65;
  max-width: 16rem;
}

.hero__panel-stage-inner--spotlight,
.hero__panel-stage-inner--feed,
.hero__panel-stage-inner--skeleton {
  align-items: stretch;
  justify-content: flex-start;
  text-align: left;
  flex: 1;
  min-height: 0;
}

.hero__panel-skeleton {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
}

.hero__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.hero__sk-cover {
  flex: 1;
  min-height: 120px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-text-primary) 6%, transparent) 0%,
    color-mix(in srgb, var(--color-text-primary) 14%, transparent) 45%,
    color-mix(in srgb, var(--color-text-primary) 6%, transparent) 90%
  );
  background-size: 200% 100%;
  animation: hero-sk-shimmer 1.5s ease-in-out infinite;
}

.hero__sk-body {
  flex-shrink: 0;
  padding-top: 10px;
  min-width: 0;
}

.hero__sk-line {
  border-radius: 6px;
  height: 14px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-text-primary) 6%, transparent) 0%,
    color-mix(in srgb, var(--color-text-primary) 14%, transparent) 45%,
    color-mix(in srgb, var(--color-text-primary) 6%, transparent) 90%
  );
  background-size: 200% 100%;
  animation: hero-sk-shimmer 1.5s ease-in-out infinite;
}

.hero__sk-line--title {
  width: 88%;
  max-width: 100%;
}

.hero__sk-line--meta {
  width: 42%;
  max-width: 100%;
  height: 10px;
  margin-top: 10px;
  animation-delay: 0.12s;
}

.hero__spotlight {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: left;
  border-radius: 12px;
  overflow: hidden;
  transition:
    box-shadow var(--transition-base),
    transform var(--transition-base);
}

.hero__spotlight:hover {
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-primary) 28%, transparent);
}

.hero__spotlight:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.hero__spotlight-cover {
  position: relative;
  flex: 1;
  min-height: 120px;
  border-radius: 12px;
  overflow: hidden;
  background: color-mix(in srgb, var(--color-text-primary) 6%, transparent);
}

.hero__spotlight-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hero__spotlight-body {
  flex-shrink: 0;
  padding-top: 10px;
  min-width: 0;
}

.hero__spotlight-title {
  margin: 0 0 6px;
  font-size: var(--text-base);
  font-weight: 700;
  line-height: 1.35;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero__spotlight-meta {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.hero__spotlight-meta-sep {
  margin: 0 0.25em;
}

.hero__panel-feed {
  position: relative;
  z-index: 1;
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}

.hero__panel-feed li + li {
  border-top: 1px solid var(--color-border);
}

.hero__panel-feed-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 10px 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: left;
  color: inherit;
  transition: color var(--transition-fast);
}

.hero__panel-feed-row:hover {
  color: var(--color-primary);
}

.hero__panel-feed-row:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.hero__panel-feed-title {
  flex: 1;
  min-width: 0;
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero__panel-feed-date {
  flex-shrink: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

/* —— 内容区块 —— */
.section {
  padding: 56px 24px 20px;
}

@media (min-width: 900px) {
  .section {
    padding-left: max(24px, calc((100vw - 1180px) / 2 + 24px));
    padding-right: max(24px, calc((100vw - 1180px) / 2 + 24px));
  }
}

.section--alt {
  background: color-mix(in srgb, var(--color-primary) 4%, var(--color-bg) 96%);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.section--entry-banners {
  padding-top: 48px;
  padding-bottom: 72px;
}

.entry-banners {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.container {
  max-width: 1180px;
  margin: 0 auto;
}

.section__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.section__header :deep(.btn--ghost) {
  color: var(--color-text-muted);
  border: 1px solid transparent;
}

.section__header :deep(.btn--ghost:hover) {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 22%, transparent);
}

.featured-grid,
.recent-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.featured-grid :deep(.article-card__body),
.recent-grid :deep(.article-card__body) {
  padding: 10px 12px 12px;
}

.featured-grid :deep(.article-card__summary),
.recent-grid :deep(.article-card__summary) {
  margin-bottom: 8px;
}

.empty-articles {
  text-align: center;
  padding: 56px 24px;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-xl);
  background: color-mix(in srgb, var(--color-primary) 3%, var(--color-bg) 97%);
}

.ai-preview {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.ai-preview-card {
  padding: 16px 14px;
  background: var(--color-bg-card);
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition:
    transform var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base);
  min-width: 0;
}

.ai-preview-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-lg), 0 0 24px color-mix(in srgb, var(--color-primary) 12%, transparent);
}

.ai-preview-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  min-width: 0;
}

.ai-preview-card__icon {
  font-size: 1.45rem;
  line-height: 1;
  flex-shrink: 0;
}

.ai-preview-card__name {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.25;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-preview-card__desc {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.resume-entry-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 36px;
  border-radius: 22px;
  cursor: pointer;
  flex-wrap: wrap;
  gap: 20px;
  background: linear-gradient(
    125deg,
    color-mix(in srgb, var(--color-primary) 12%, transparent) 0%,
    color-mix(in srgb, var(--color-ui-gradient-mid) 10%, transparent) 100%
  );
  border: 1px solid var(--color-border-strong);
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base),
    border-color var(--transition-base);
}

.resume-entry-banner:hover {
  transform: translateY(-3px);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-lg), 0 0 32px color-mix(in srgb, var(--color-primary) 16%, transparent);
}

.resume-entry-banner__content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.resume-entry-banner__emoji {
  font-size: 2.75rem;
  filter: drop-shadow(0 0 12px color-mix(in srgb, var(--color-primary) 35%, transparent));
}

.resume-entry-banner__title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 6px;
}

.resume-entry-banner__desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.couple-entry-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 36px;
  border-radius: 22px;
  cursor: pointer;
  flex-wrap: wrap;
  gap: 20px;
  background: linear-gradient(
    125deg,
    color-mix(in srgb, var(--color-accent) 11%, transparent) 0%,
    color-mix(in srgb, var(--color-secondary) 9%, transparent) 100%
  );
  border: 1px solid color-mix(in srgb, var(--color-accent) 26%, transparent);
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base),
    border-color var(--transition-base);
}

.couple-entry-banner:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--color-accent) 45%, transparent);
  box-shadow: var(--shadow-lg), 0 0 28px color-mix(in srgb, var(--color-accent) 14%, transparent);
}

.couple-entry-banner__content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.couple-entry-banner__emoji {
  font-size: 2.75rem;
  filter: drop-shadow(0 0 12px color-mix(in srgb, var(--color-accent) 35%, transparent));
}

.couple-entry-banner__title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 6px;
}

.couple-entry-banner__desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

@keyframes hero-sk-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__sk-cover,
  .hero__sk-line {
    animation: none;
  }
}

@keyframes fade-in-down {
  from {
    opacity: 0;
    transform: translateY(-14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(16px) scale(1.03);
  }
}

@keyframes spin-slow {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1100px) {
  .featured-grid,
  .recent-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .ai-preview {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .hero__columns {
    grid-template-columns: 1fr;
  }

  .hero__panel {
    max-width: 480px;
  }
}

@media (max-width: 720px) {
  .ai-preview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .featured-grid,
  .recent-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 440px) {
  .ai-preview {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 32px 0 48px;
    min-height: auto;
  }

  .hero__stats-grid {
    max-width: none;
  }

  .hero__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .hero__actions :deep(.btn) {
    width: 100%;
  }

  .resume-entry-banner,
  .couple-entry-banner {
    flex-direction: column;
    text-align: center;
    padding: 24px 22px;
  }

  .resume-entry-banner__content,
  .couple-entry-banner__content {
    flex-direction: column;
    text-align: center;
  }
}

</style>

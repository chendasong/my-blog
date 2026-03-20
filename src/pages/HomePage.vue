<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { articleApi } from '@/api'
import { noteApi } from '@/api/notes'
import { aiFeatures } from '@/data'
import type { Article } from '@/types'
import ArticleCard from '@/components/blog/ArticleCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import SectionTitle from '@/components/common/SectionTitle.vue'
import DraggableMusicPlayer from '@/components/common/DraggableMusicPlayer.vue'

const router = useRouter()
const authStore = useAuthStore()

const featuredArticles = ref<Article[]>([])
const recentArticles = ref<Article[]>([])
const topAI = aiFeatures.slice(0, 3)
const stats = ref({ articles: 0, notes: 0, views: 0 })

const heroStyle = computed(() => {
  const bgImage = authStore.siteSettings?.hero_background_image
  const opacity = authStore.siteSettings?.hero_background_opacity ?? 0.7
  
  if (bgImage) {
    return {
      backgroundImage: `url('${bgImage}')`,
    }
  }
  return {
    background: 'linear-gradient(135deg, #F4F6FB 0%, #F5F0FF 50%, #FFF0F5 100%)',
  }
})

const heroOverlayStyle = computed(() => {
  const opacity = authStore.siteSettings?.hero_background_opacity ?? 0.7
  return {
    background: `rgba(244, 246, 251, ${opacity})`,
  }
})

const aiIcons: Record<string, string> = {
  'AI 文案创作': '✍️',
  'AI 代码助手': '💻',
  'AI 图片识别': '🔍',
  'AI 情感分析': '💡',
  'AI 翻译润色': '🌐',
  'AI 思维导图': '🗺️',
  'AI 诗词创作': '🪶',
  'AI 摘要提取': '📋',
}

onMounted(async () => {
  await authStore.fetchSiteSettings()
  try {
    const allArticles = await articleApi.getList()
    featuredArticles.value = allArticles.filter(a => a.featured).slice(0, 3)
    recentArticles.value = allArticles.slice(0, 3)
    stats.value.articles = allArticles.length
    stats.value.views = allArticles.reduce((sum, a) => sum + (a.views || 0), 0)
  } catch {}
  try {
    const allNotes = await noteApi.getList()
    stats.value.notes = allNotes.length
  } catch {}
})
</script>

<template>
  <div class="home">
    <DraggableMusicPlayer :music-urls="authStore.siteSettings?.music_urls" />
    
    <section class="hero" :style="heroStyle">
      <div class="hero__overlay" :style="heroOverlayStyle" />
      <div class="hero__bg">
        <div class="hero__grid" />
        <div class="hero__blob hero__blob--1" />
        <div class="hero__blob hero__blob--2" />
      </div>
      <div class="hero__inner">
        <div class="hero__content animate-fade-in-up">
          <div class="hero__badge">欢迎来访</div>
          <h1 class="hero__name">
            <span class="text-gradient">{{ authStore.siteSettings?.owner_nickname || '晨光' }}</span>
            <span class="hero__name-emoji">✨</span>
          </h1>
          <p class="hero__bio">{{ authStore.siteSettings?.site_description || '记录生活与技术的小角落' }}</p>
          
          <div class="hero__meta-row">
            <span class="hero__location">📍 {{ authStore.siteSettings?.owner_location || '深圳' }}</span>
            <span class="hero__divider">•</span>
            <span class="hero__status">持续创作中</span>
          </div>

          <div class="hero__stats-grid">
            <div class="stat-card">
              <div class="stat-card__icon">📝</div>
              <div class="stat-card__content">
                <div class="stat-card__num">{{ stats.articles }}</div>
                <div class="stat-card__label">篇文章</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card__icon">📌</div>
              <div class="stat-card__content">
                <div class="stat-card__num">{{ stats.notes }}</div>
                <div class="stat-card__label">条笔记</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card__icon">👁️</div>
              <div class="stat-card__content">
                <div class="stat-card__num">{{ stats.views > 999 ? (stats.views / 1000).toFixed(1) + 'K' : stats.views }}</div>
                <div class="stat-card__label">次阅读</div>
              </div>
            </div>
          </div>

          <div class="hero__actions">
            <AppButton size="lg" @click="router.push('/blog')">探索文章</AppButton>
            <AppButton variant="secondary" size="lg" @click="router.push('/notes')">我的笔记</AppButton>
          </div>
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
          <div v-for="(feat, i) in topAI" :key="feat.id" class="ai-preview-card animate-fade-in-up" :class="`delay-${(i+1)*100}`" @click="router.push('/ai')">
            <div class="ai-preview-card__icon">{{ aiIcons[feat.name] || '🤖' }}</div>
            <h4 class="ai-preview-card__name">{{ feat.name }}</h4>
            <p class="ai-preview-card__desc">{{ feat.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container">
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
.hero {
  position: relative;
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

.hero__overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.hero__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.hero__grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(91, 138, 240, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(91, 138, 240, 0.05) 1px, transparent 1px);
  background-size: 60px 60px;
  opacity: 0.5;
}

.hero__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.hero__blob--1 {
  width: 600px;
  height: 600px;
  background: rgba(91, 138, 240, 0.12);
  top: -200px;
  right: -100px;
  animation: float 12s ease-in-out infinite;
}

.hero__blob--2 {
  width: 500px;
  height: 500px;
  background: rgba(139, 111, 240, 0.10);
  bottom: -150px;
  left: -100px;
  animation: float 14s ease-in-out infinite reverse;
}

.hero__inner {
  max-width: 900px;
  margin: 0 auto;
  padding: 100px 24px;
  width: 100%;
  position: relative;
  z-index: 2;
}

.hero__content {
  text-align: center;
}

.hero__badge {
  display: inline-block;
  padding: 8px 16px;
  background: rgba(91, 138, 240, 0.1);
  border: 1px solid rgba(91, 138, 240, 0.2);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: var(--color-primary);
  font-weight: 500;
  margin-bottom: 24px;
  animation: fade-in-down 0.6s ease-out;
}

.hero__name {
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin-bottom: 16px;
  animation: fade-in-up 0.8s ease-out 0.1s both;
}

.hero__name-emoji {
  display: inline-block;
  margin-left: 12px;
  animation: bounce 2s ease-in-out infinite;
}

.hero__bio {
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: var(--color-text-secondary);
  line-height: 1.8;
  margin-bottom: 24px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  animation: fade-in-up 0.8s ease-out 0.2s both;
}

.hero__meta-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-bottom: 48px;
  animation: fade-in-up 0.8s ease-out 0.3s both;
}

.hero__divider {
  opacity: 0.3;
}

.hero__status {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(76, 175, 130, 0.1);
  border-radius: var(--radius-full);
  color: #4CAF82;
  font-weight: 500;
}

.hero__stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 48px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  animation: fade-in-up 0.8s ease-out 0.4s both;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(91, 138, 240, 0.1);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
}

.stat-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(91, 138, 240, 0.2);
  box-shadow: 0 4px 16px rgba(91, 138, 240, 0.08);
}

.stat-card__icon {
  font-size: 1.75rem;
}

.stat-card__content {
  text-align: left;
}

.stat-card__num {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1;
}

.stat-card__label {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin-top: 4px;
}

.hero__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  animation: fade-in-up 0.8s ease-out 0.5s both;
}

.section {
  padding: 80px 0;
}

.section--alt {
  background: rgba(91, 138, 240, 0.02);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.section__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 48px;
  flex-wrap: wrap;
  gap: 16px;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.recent-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.empty-articles {
  text-align: center;
  padding: 60px 24px;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.ai-preview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.ai-preview-card {
  padding: 28px;
  background: var(--color-bg-card);
  backdrop-filter: var(--blur-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all var(--transition-base);
}

.ai-preview-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-border-strong);
}

.ai-preview-card__icon {
  font-size: 2.5rem;
  margin-bottom: 14px;
}

.ai-preview-card__name {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.ai-preview-card__desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.6;
}

.couple-entry-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px 40px;
  background: linear-gradient(135deg, rgba(232, 96, 122, 0.08) 0%, rgba(240, 160, 91, 0.08) 100%);
  border: 1px solid rgba(232, 96, 122, 0.18);
  border-radius: var(--radius-2xl);
  cursor: pointer;
  transition: all var(--transition-base);
  flex-wrap: wrap;
  gap: 20px;
}

.couple-entry-banner:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 32px rgba(232, 96, 122, 0.15);
  border-color: rgba(232, 96, 122, 0.3);
}

.couple-entry-banner__content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.couple-entry-banner__emoji {
  font-size: 3rem;
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

@keyframes fade-in-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(20px);
  }
}

@media (max-width: 900px) {
  .featured-grid,
  .recent-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero__inner {
    padding: 60px 24px;
  }

  .hero__name {
    font-size: 2rem;
  }

  .hero__bio {
    font-size: 1rem;
  }

  .hero__stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .stat-card {
    flex-direction: column;
    text-align: center;
    padding: 12px;
  }

  .stat-card__content {
    text-align: center;
  }

  .hero__actions {
    flex-direction: column;
  }

  .couple-entry-banner {
    flex-direction: column;
    text-align: center;
  }
}
</style>

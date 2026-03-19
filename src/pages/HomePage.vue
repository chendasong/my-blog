<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { articles, userProfile, aiFeatures } from '@/data'
import ArticleCard from '@/components/blog/ArticleCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import SectionTitle from '@/components/common/SectionTitle.vue'

const router = useRouter()
const featuredArticles = computed(() => articles.filter(a => a.featured).slice(0, 2))
const recentArticles = computed(() => articles.slice(0, 4))
const topAI = computed(() => aiFeatures.slice(0, 3))

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
</script>
<template>
  <div class="home">
    <section class="hero">
      <div class="hero__bg">
        <div class="hero__blob hero__blob--1" />
        <div class="hero__blob hero__blob--2" />
        <div class="hero__blob hero__blob--3" />
      </div>
      <div class="hero__inner">
        <div class="hero__content animate-fade-in-up">
          <div class="hero__greeting">你好，我是</div>
          <h1 class="hero__name"><span class="text-gradient">{{ userProfile.nickname }}</span></h1>
          <p class="hero__bio">{{ userProfile.bio }}</p>
          <div class="hero__meta"><span class="hero__location">📍 {{ userProfile.location }}</span></div>
          <div class="hero__actions">
            <AppButton size="lg" @click="router.push('/blog')">探索博客</AppButton>
            <AppButton variant="secondary" size="lg" @click="router.push('/notes')">我的笔记</AppButton>
          </div>
          <div class="hero__stats">
            <div class="stat"><span class="stat__num">{{ userProfile.stats.articles }}</span><span class="stat__label">篇文章</span></div>
            <div class="stat"><span class="stat__num">{{ userProfile.stats.notes }}</span><span class="stat__label">条笔记</span></div>
            <div class="stat"><span class="stat__num">{{ (userProfile.stats.views / 1000).toFixed(1) }}K</span><span class="stat__label">次阅读</span></div>
            <div class="stat"><span class="stat__num">{{ userProfile.stats.followers }}</span><span class="stat__label">位关注</span></div>
          </div>
        </div>
        <div class="hero__avatar-wrap animate-fade-in delay-300">
          <div class="hero__avatar-ring" />
          <img :src="userProfile.avatar" :alt="userProfile.nickname" class="hero__avatar" />
          <div class="hero__avatar-glow" />
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section__header">
          <SectionTitle title="精选文章" subtitle="记录技术探索与生活感悟" />
          <AppButton variant="ghost" @click="router.push('/blog')">查看全部 →</AppButton>
        </div>
        <div class="featured-grid">
          <ArticleCard v-for="article in featuredArticles" :key="article.id" :article="article" :featured="true" class="animate-fade-in-up" />
        </div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container">
        <div class="section__header">
          <SectionTitle title="最新动态" subtitle="持续更新，记录每一个值得记录的时刻" />
          <AppButton variant="ghost" @click="router.push('/blog')">更多文章 →</AppButton>
        </div>
        <div class="recent-grid">
          <ArticleCard v-for="(article, i) in recentArticles" :key="article.id" :article="article" class="animate-fade-in-up" :class="`delay-${(i+1)*100}`" />
        </div>
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
.hero { position: relative; min-height: calc(100vh - 64px); display: flex; align-items: center; overflow: hidden; }
.hero__bg { position: absolute; inset: 0; pointer-events: none; }
.hero__blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.5; }
.hero__blob--1 { width: 500px; height: 500px; background: rgba(91,138,240,0.15); top: -100px; left: -100px; animation: float 8s ease-in-out infinite; }
.hero__blob--2 { width: 400px; height: 400px; background: rgba(139,111,240,0.12); bottom: -80px; right: -80px; animation: float 10s ease-in-out infinite reverse; }
.hero__blob--3 { width: 300px; height: 300px; background: rgba(240,160,91,0.10); top: 50%; left: 50%; transform: translate(-50%,-50%); animation: float 12s ease-in-out infinite 2s; }
.hero__inner { max-width: 1200px; margin: 0 auto; padding: 80px 24px; width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 48px; }
.hero__content { flex: 1; max-width: 560px; }
.hero__greeting { font-size: var(--text-lg); color: var(--color-text-muted); margin-bottom: 8px; font-family: var(--font-serif); }
.hero__name { font-size: clamp(3rem,6vw,5rem); font-weight: 700; letter-spacing: -0.03em; line-height: 1.05; margin-bottom: 20px; }
.hero__bio { font-size: var(--text-lg); color: var(--color-text-secondary); line-height: 1.7; margin-bottom: 16px; font-family: var(--font-serif); }
.hero__meta { margin-bottom: 32px; }
.hero__location { font-size: var(--text-sm); color: var(--color-text-muted); }
.hero__actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 40px; }
.hero__stats { display: flex; gap: 32px; flex-wrap: wrap; }
.stat { display: flex; flex-direction: column; gap: 2px; }
.stat__num { font-size: var(--text-2xl); font-weight: 700; color: var(--color-text-primary); line-height: 1; }
.stat__label { font-size: var(--text-xs); color: var(--color-text-muted); }
.hero__avatar-wrap { position: relative; flex-shrink: 0; }
.hero__avatar { width: 320px; height: 320px; border-radius: 40% 60% 60% 40% / 40% 40% 60% 60%; object-fit: cover; border: 3px solid var(--color-border-strong); position: relative; z-index: 1; animation: float 6s ease-in-out infinite; }
.hero__avatar-ring { position: absolute; inset: -12px; border-radius: 40% 60% 60% 40% / 40% 40% 60% 60%; border: 2px dashed rgba(91,138,240,0.3); animation: float 6s ease-in-out infinite reverse; }
.hero__avatar-glow { position: absolute; inset: 20px; background: var(--gradient-primary); border-radius: 50%; filter: blur(40px); opacity: 0.2; z-index: 0; }
.section { padding: 80px 0; }
.section--alt { background: rgba(91,138,240,0.03); }
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.section__header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
.featured-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 24px; }
.recent-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.ai-preview { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
.ai-preview-card { padding: 28px; background: var(--color-bg-card); backdrop-filter: var(--blur-md); border: 1px solid var(--color-border); border-radius: var(--radius-xl); cursor: pointer; transition: all var(--transition-base); }
.ai-preview-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--color-border-strong); }
.ai-preview-card__icon { font-size: 2.5rem; margin-bottom: 14px; }
.ai-preview-card__name { font-size: var(--text-lg); font-weight: 600; color: var(--color-text-primary); margin-bottom: 8px; }
.ai-preview-card__desc { font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.6; }
.couple-entry-banner { display: flex; align-items: center; justify-content: space-between; padding: 32px 40px; background: linear-gradient(135deg,rgba(232,96,122,0.08) 0%,rgba(240,160,91,0.08) 100%); border: 1px solid rgba(232,96,122,0.18); border-radius: var(--radius-2xl); cursor: pointer; transition: all var(--transition-base); flex-wrap: wrap; gap: 20px; }
.couple-entry-banner:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(232,96,122,0.15); border-color: rgba(232,96,122,0.3); }
.couple-entry-banner__content { display: flex; align-items: center; gap: 20px; }
.couple-entry-banner__emoji { font-size: 3rem; }
.couple-entry-banner__title { font-size: var(--text-xl); font-weight: 700; color: var(--color-text-primary); margin-bottom: 6px; }
.couple-entry-banner__desc { font-size: var(--text-sm); color: var(--color-text-muted); }
@media (max-width: 768px) {
  .hero__inner { flex-direction: column; padding: 60px 24px; text-align: center; }
  .hero__actions { justify-content: center; }
  .hero__stats { justify-content: center; }
  .hero__avatar { width: 220px; height: 220px; }
  .couple-entry-banner { flex-direction: column; text-align: center; }
}
</style>

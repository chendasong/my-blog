<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/auth'
import { articleApi } from '@/api'
import { noteApi } from '@/api/notes'
import { getDailyEmotionalQuote, peekDailyQuoteCache } from '@/api/dailyQuote'
import { aiFeatures } from '@/data'
import type { Article } from '@/types'
import ArticleCard from '@/components/blog/ArticleCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import SectionTitle from '@/components/common/SectionTitle.vue'

const router = useRouter()
const authStore = useAuthStore()

/** 首页「精选文章」区块：仅展示 featured 标记的文章，最多 4 篇 */
const featuredArticles = ref<Article[]>([])
/** 首页「最新动态」区块：按列表顺序取前 4 篇 */
const recentArticles = ref<Article[]>([])
/** AI 工坊预览：静态配置里取标记为 new 且未隐藏的功能，最多 5 个入口 */
const topAI = aiFeatures.filter((i) => i.isNew && !i.hidden).slice(0, 5)
/** 首屏统计卡片：文章总数、笔记总数、全站阅读量汇总 */
const stats = ref({ articles: 0, notes: 0, views: 0 })
/** 左侧品牌/统计/最近更新：等站点配置与文章列表就绪后再展示，避免文案闪烁 */
const heroLeftLoading = ref(true)

/** 右侧每日语录正文，由 AI 生成或走本地兜底文案 */
const quoteText = ref('')
/** 语录卡片加载态：无当日缓存时需等待接口 */
const quoteLoading = ref(true)
/** 语录附带的城市天气，用于增强「今日感」 */
const quoteWeather = ref<{ location: string; tempC: number; label: string; emoji: string } | null>(
  null,
)
/** 语录卡片标题行：固定展示当天日期 */
const quoteDateLabel = computed(() => dayjs().format('M月D日 · 每日语录'))
/** 天气一行文案：有数据时拼地点 + 图标 + 描述 + 气温 */
const weatherLine = computed(() => {
  const w = quoteWeather.value
  if (!w) return ''
  const place = w.location ? `${w.location} · ` : ''
  return `${place}${w.emoji} ${w.label} ${w.tempC}°C`
})

/** 站点主标题，后台可配，缺省为「个人博客」 */
const siteName = computed(() => authStore.siteSettings?.site_name?.trim() || '个人博客')
/** 副标题行：优先用站长昵称作问候语 */
const heroAccentLine = computed(() => authStore.siteSettings?.owner_nickname?.trim() || '来访者您好')
/** 站点简介，展示在标题下方 */
const siteBio = computed(
  () => authStore.siteSettings?.site_description?.trim() || '记录生活与技术的小角落',
)
/** 角标文案：有独立副标题且与简介不重复时用副标题，否则用固定导航关键词 */
const heroBadgeText = computed(() => {
  const sub = authStore.siteSettings?.site_subtitle?.trim()
  if (sub && sub !== siteBio.value) return sub
  return '博客 · 笔记 · AI'
})
/** 阅读量展示：超过 999 压缩为 K 单位，节省卡片宽度 */
const viewsLabel = computed(() => {
  const v = stats.value.views
  return v > 999 ? `${(v / 1000).toFixed(1)}K` : String(v)
})

/** 首屏「最近更新」列表：从最新文章中再截取 3 条 */
const spotlightArticles = computed(() => recentArticles.value.slice(0, 3))

/** 首屏日期简写：优先 publishedAt，无则 updatedAt */
function formatShortDate(raw?: string) {
  if (!raw) return ''
  const d = dayjs(raw)
  return d.isValid() ? d.format('YYYY.M.D') : ''
}

onMounted(async () => {
  // 当天已有语录缓存则同步填充，避免刷新后长时间骨架屏
  const peek = peekDailyQuoteCache()
  if (peek) {
    quoteText.value = peek.text
    quoteWeather.value = peek.weather ?? null
    quoteLoading.value = false
  }

  // 站点文案依赖后台配置，失败时 computed 会走默认值
  try {
    await authStore.fetchSiteSettings()
  } catch {
    /* ignore */
  }
  // 语录与左侧数据并行拉取，不阻塞首屏左侧
  void loadDailyQuote()
  try {
    const allArticles = await articleApi.getList()
    featuredArticles.value = allArticles.filter((a) => a.featured).slice(0, 4)
    recentArticles.value = allArticles.slice(0, 4)
    stats.value.articles = allArticles.length
    stats.value.views = allArticles.reduce((sum, a) => sum + (a.views || 0), 0)
  } catch {
    /* ignore */
  } finally {
    heroLeftLoading.value = false
  }
  // 笔记数单独请求，失败不影响文章区展示
  try {
    const allNotes = await noteApi.getList()
    stats.value.notes = allNotes.length
  } catch {
    /* ignore */
  }
})

/** 拉取当日情感语录：按站长所在地查天气，接口失败时用固定兜底文案 */
async function loadDailyQuote() {
  const peek = peekDailyQuoteCache()
  // 无缓存才显示加载态；有缓存时后台静默刷新
  if (!peek) quoteLoading.value = true
  try {
    const place = authStore.siteSettings?.owner_location?.trim() || '南昌'
    const res = await getDailyEmotionalQuote(place)
    quoteText.value = res.text
    quoteWeather.value = res.weather
  } catch {
    // 模型或天气服务不可用时仍保证右侧卡片有可读内容
    quoteText.value =
      '慢下来，并不是落后，而是把心安放回自己身上。窗外风声起伏，日子仍旧往前走；你只要把眼前这一杯水喝完，把这一口气呼匀。不必急着证明什么，温柔地对待未完成的事，也温柔地对待还在努力的自己。光会一点点亮起来，你也会。'
    quoteWeather.value = null
  } finally {
    quoteLoading.value = false
  }
}
</script>

<template>
  <div class="home">
    <section class="hero" aria-label="站点介绍">
      <div class="hero__ambient" aria-hidden="true">
        <div class="hero__grid" />
        <div class="hero__orb hero__orb--primary" />
        <div class="hero__orb hero__orb--mid" />
        <div class="hero__orb hero__orb--warm" />
        <div class="hero__noise" />
      </div>

      <div class="hero__shell">
        <div class="hero__columns">
          <div class="hero__content">
            <template v-if="heroLeftLoading">
              <div class="hero-skel" aria-busy="true" aria-label="内容加载中">
                <div class="hero-skel__badge quote-skel" />
                <div class="hero-skel__title quote-skel" />
                <div class="hero-skel__title hero-skel__title--sub quote-skel" />
                <div class="hero-skel__bio quote-skel" />
                <div class="hero-skel__bio hero-skel__bio--short quote-skel" />
                <div class="hero-skel__stats">
                  <div v-for="n in 3" :key="n" class="hero-skel__stat">
                    <div class="quote-skel hero-skel__stat-num" />
                    <div class="quote-skel hero-skel__stat-label" />
                  </div>
                </div>
                <div class="hero-skel__updates">
                  <div class="quote-skel hero-skel__updates-label" />
                  <div v-for="n in 3" :key="`u-${n}`" class="hero-skel__update-row">
                    <div class="quote-skel hero-skel__update-title" />
                    <div class="quote-skel hero-skel__update-date" />
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="hero__badge">
                <span class="hero__badge-dot" aria-hidden="true" />
                <span>{{ heroBadgeText }}</span>
              </div>

              <h1 class="hero__title">
                <span class="hero__title-line">{{ siteName }}</span>
                <span class="hero__title-gradient text-gradient">{{ heroAccentLine }}</span>
              </h1>

              <p class="hero__bio">{{ siteBio }}</p>

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
                  <div class="stat-card__num">{{ viewsLabel }}</div>
                  <div class="stat-card__label">次阅读</div>
                </div>
              </div>

              <div v-if="spotlightArticles.length" class="hero__updates">
                <p class="hero__updates-label">最近更新</p>
                <ul class="hero__updates-list">
                  <li v-for="article in spotlightArticles" :key="article.id">
                    <RouterLink :to="`/blog/${article.id}`" class="hero__updates-link">
                      <span class="hero__updates-title">{{ article.title }}</span>
                      <span class="hero__updates-date">{{
                        formatShortDate(article.publishedAt || article.updatedAt)
                      }}</span>
                    </RouterLink>
                  </li>
                </ul>
              </div>
            </template>
          </div>

          <aside class="quote-card" aria-label="每日情感语录">
            <div class="quote-card__glow" aria-hidden="true" />
            <div class="quote-card__top">
              <h2 class="quote-card__title">💭 {{ quoteDateLabel }}</h2>
              <span v-if="weatherLine" class="quote-card__weather">{{ weatherLine }}</span>
            </div>

            <div v-if="quoteLoading" class="quote-card__loading" aria-busy="true">
              <div class="quote-skel quote-skel--a" />
              <div class="quote-skel quote-skel--b" />
              <div class="quote-skel quote-skel--c" />
              <p class="quote-card__hint">正在为你写今日语录…</p>
            </div>
            <blockquote v-else class="quote-card__body">
              <p class="quote-card__text">{{ quoteText }}</p>
            </blockquote>

            <p class="quote-card__foot">每天更新一次 · 愿你被温柔以待</p>
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
          <ArticleCard
            v-for="article in featuredArticles"
            :key="article.id"
            :article="article"
            :featured="true"
            class="animate-fade-in-up"
          />
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
          <ArticleCard
            v-for="(article, i) in recentArticles"
            :key="article.id"
            :article="article"
            class="animate-fade-in-up"
            :class="`delay-${(i + 1) * 100}`"
          />
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
          <button
            v-for="(feat, i) in topAI"
            :key="feat.id"
            type="button"
            class="ai-preview-card animate-fade-in-up"
            :class="`delay-${(i + 1) * 100}`"
            @click="router.push({ path: '/ai', query: { feature: feat.id } })"
          >
            <div class="ai-preview-card__head">
              <span class="ai-preview-card__icon" aria-hidden="true">{{ feat.emoji }}</span>
              <h4 class="ai-preview-card__name">{{ feat.name }}</h4>
            </div>
            <p class="ai-preview-card__desc">{{ feat.description }}</p>
          </button>
        </div>
      </div>
    </section>

    <section
      v-if="authStore.isLoggedIn"
      class="section section--entry-banners section--alt"
    >
      <div class="container entry-banners">
        <div class="resume-entry-banner" @click="router.push('/resume')">
          <div class="resume-entry-banner__content">
            <div class="resume-entry-banner__emoji" aria-hidden="true">📄</div>
            <div>
              <h3 class="resume-entry-banner__title">我的简历</h3>
              <p class="resume-entry-banner__desc">在线简历编辑器，支持多种模块和实时预览</p>
            </div>
          </div>
          <AppButton variant="warm">查看简历 →</AppButton>
        </div>
        <div class="couple-entry-banner" @click="router.push('/couple')">
          <div class="couple-entry-banner__content">
            <div class="couple-entry-banner__emoji" aria-hidden="true">💑</div>
            <div>
              <h3 class="couple-entry-banner__title">情侣空间</h3>
              <p class="couple-entry-banner__desc">一个属于我们两个人的小世界，需要密码才能进入</p>
            </div>
          </div>
          <AppButton variant="warm">进入空间 →</AppButton>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  background:
    radial-gradient(ellipse 100% 70% at 12% -8%, var(--body-grad-1), transparent 52%),
    radial-gradient(ellipse 80% 55% at 88% 12%, var(--body-grad-2), transparent 48%),
    radial-gradient(ellipse 60% 45% at 50% 100%, var(--body-grad-3), transparent 55%),
    var(--color-bg);
}

/* 首屏单独占一页 */
.hero {
  position: relative;
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  overflow: clip;
  padding: 48px 0 56px;
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
    linear-gradient(color-mix(in srgb, var(--color-primary) 8%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--color-primary) 8%, transparent) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 30%, black 20%, transparent 75%);
  opacity: 0.5;
}

.hero__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.55;
  animation: float 14s ease-in-out infinite;
}

.hero__orb--primary {
  width: min(420px, 70vw);
  height: min(420px, 70vw);
  background: color-mix(in srgb, var(--color-primary) 28%, transparent);
  top: -20%;
  right: 8%;
}

.hero__orb--mid {
  width: min(320px, 55vw);
  height: min(320px, 55vw);
  background: color-mix(in srgb, var(--color-ui-gradient-mid) 22%, transparent);
  bottom: -30%;
  left: -4%;
  animation-delay: -4s;
  animation-direction: reverse;
}

.hero__orb--warm {
  width: min(240px, 40vw);
  height: min(240px, 40vw);
  background: color-mix(in srgb, var(--color-secondary) 20%, transparent);
  top: 40%;
  right: -4%;
  animation-delay: -7s;
}

.hero__noise {
  position: absolute;
  inset: 0;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
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
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.95fr);
  gap: clamp(24px, 4vw, 48px);
  align-items: start;
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
  margin-bottom: 20px;
  animation: fade-in-up 0.5s ease-out both;
}

.hero__badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
  box-shadow: 0 0 12px color-mix(in srgb, var(--color-success) 55%, transparent);
}

.hero__title {
  margin: 0 0 16px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.08;
  font-size: clamp(2.2rem, 4vw + 1rem, 3.4rem);
  animation: fade-in-up 0.55s ease-out 0.05s both;
}

.hero__title-line {
  display: block;
  color: var(--color-text-primary);
}

.hero__title-gradient {
  display: block;
  margin-top: 4px;
  font-size: clamp(1.9rem, 3.4vw + 0.85rem, 3rem);
  filter: drop-shadow(0 0 20px color-mix(in srgb, var(--color-primary) 40%, transparent));
}

.hero__bio {
  max-width: 34rem;
  margin: 0 0 22px;
  font-size: clamp(0.98rem, 0.3vw + 0.92rem, 1.1rem);
  line-height: 1.7;
  color: var(--color-text-secondary);
  animation: fade-in-up 0.55s ease-out 0.1s both;
}

.hero-skel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 34rem;
  animation: fade-in-up 0.35s ease-out both;
}

.hero-skel__badge {
  width: 140px;
  height: 28px;
  border-radius: 999px;
}

.hero-skel__title {
  width: 72%;
  height: 42px;
  border-radius: 14px;
  margin-top: 4px;
}

.hero-skel__title--sub {
  width: 58%;
  height: 36px;
}

.hero-skel__bio {
  width: 92%;
  height: 14px;
  margin-top: 4px;
}

.hero-skel__bio--short {
  width: 68%;
  margin-bottom: 8px;
}

.hero-skel__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  max-width: 420px;
  margin: 6px 0 8px;
}

.hero-skel__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 12px;
  border-radius: 18px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
}

.hero-skel__stat-num {
  width: 42%;
  height: 28px;
  border-radius: 10px;
}

.hero-skel__stat-label {
  width: 52%;
  height: 12px;
}

.hero-skel__updates {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

.hero-skel__updates-label {
  width: 72px;
  height: 12px;
}

.hero-skel__update-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
}

.hero-skel__update-title {
  flex: 1;
  height: 14px;
  max-width: 70%;
}

.hero-skel__update-date {
  width: 72px;
  height: 12px;
  flex-shrink: 0;
}

.hero__stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  max-width: 420px;
  margin-bottom: 22px;
  animation: fade-in-up 0.55s ease-out 0.14s both;
}

.stat-card {
  text-align: center;
  padding: 18px 12px;
  border-radius: 18px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  backdrop-filter: blur(16px);
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
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.stat-card__label {
  margin-top: 6px;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.hero__updates {
  max-width: 440px;
  animation: fade-in-up 0.55s ease-out 0.22s both;
}

.hero__updates-label {
  margin: 0 0 10px;
  font-size: var(--text-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.hero__updates-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--color-border);
}

.hero__updates-link {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: baseline;
  padding: 11px 0;
  border-bottom: 1px solid var(--color-border);
  color: inherit;
  transition: opacity var(--transition-fast);
}

.hero__updates-link:hover {
  opacity: 0.72;
}

.hero__updates-link:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--color-primary) 65%, transparent);
  outline-offset: 2px;
}

.hero__updates-title {
  font-size: var(--text-sm);
  font-weight: 600;
  line-height: 1.4;
  min-width: 0;
}

.hero__updates-date {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-muted);
}

/* 右侧每日语录 */
.quote-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  padding: 22px 24px 18px;
  border-radius: 28px;
  overflow: hidden;
  background:
    linear-gradient(
      160deg,
      color-mix(in srgb, var(--color-accent) 10%, var(--color-surface)),
      color-mix(in srgb, var(--color-primary) 8%, var(--color-surface)) 55%,
      var(--color-surface)
    );
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(18px);
  animation: fade-in-up 0.65s ease-out 0.14s both;
}

.quote-card__glow {
  position: absolute;
  width: 180px;
  height: 180px;
  right: -40px;
  top: -40px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-accent) 22%, transparent);
  filter: blur(40px);
  pointer-events: none;
}

.quote-card__top {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 0;
}

.quote-card__title {
  margin: 0;
  font-size: clamp(1.15rem, 0.6vw + 1rem, 1.35rem);
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
  line-height: 1.35;
}

.quote-card__weather {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  background: color-mix(in srgb, var(--color-surface) 78%, transparent);
  border: 1px solid var(--color-border);
  white-space: nowrap;
  flex-shrink: 0;
}

.quote-card__body {
  position: relative;
  z-index: 1;
  margin: 0;
  flex: 0 1 auto;
  display: block;
}

.quote-card__text {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(1.15rem, 1.2vw + 0.9rem, 1.35rem);
  line-height: 1.85;
  color: var(--color-text-primary);
  letter-spacing: 0.02em;
  text-indent: 2em;
}

.quote-card__foot {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.quote-card__loading {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quote-card__hint {
  margin: 8px 0 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.quote-skel {
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-text-primary) 5%, transparent),
    color-mix(in srgb, var(--color-text-primary) 10%, transparent),
    color-mix(in srgb, var(--color-text-primary) 5%, transparent)
  );
  background-size: 200% 100%;
  animation: quote-shimmer 1.2s ease-in-out infinite;
}

.quote-skel--a {
  width: 92%;
}
.quote-skel--b {
  width: 78%;
}
.quote-skel--c {
  width: 64%;
}

@keyframes quote-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

.section {
  padding: 64px 24px 24px;
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
  padding-top: 40px;
  padding-bottom: 64px;
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
}

.section__header :deep(.btn--ghost:hover) {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.featured-grid,
.recent-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.featured-grid :deep(.article-card__body),
.recent-grid :deep(.article-card__body) {
  min-height: 0;
}

.empty-articles {
  padding: 40px;
  text-align: center;
  color: var(--color-text-muted);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--color-border);
}

.ai-preview {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.ai-preview-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: 18px;
  text-align: left;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  color: inherit;
  cursor: pointer;
  transition:
    transform var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base);
}

.ai-preview-card:hover {
  transform: translateY(-3px);
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md);
}

.ai-preview-card:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--color-primary) 65%, transparent);
  outline-offset: 2px;
}

.ai-preview-card__head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-preview-card__icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 1.15rem;
  background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
}

.ai-preview-card__name {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 700;
}

.ai-preview-card__desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--color-text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.entry-banners {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.resume-entry-banner,
.couple-entry-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  border-radius: 20px;
  cursor: pointer;
  border: 1px solid var(--color-border);
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base);
}

.resume-entry-banner {
  background: linear-gradient(
    120deg,
    color-mix(in srgb, var(--color-primary) 12%, var(--color-surface)),
    var(--color-surface)
  );
}

.couple-entry-banner {
  background: linear-gradient(
    120deg,
    color-mix(in srgb, var(--color-accent) 12%, var(--color-surface)),
    var(--color-surface)
  );
}

.resume-entry-banner:hover,
.couple-entry-banner:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.resume-entry-banner__content,
.couple-entry-banner__content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.resume-entry-banner__emoji,
.couple-entry-banner__emoji {
  font-size: 2rem;
}

.resume-entry-banner__title,
.couple-entry-banner__title {
  margin: 0 0 4px;
  font-size: var(--text-lg);
  font-weight: 700;
}

.resume-entry-banner__desc,
.couple-entry-banner__desc {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

@media (prefers-reduced-motion: reduce) {
  .hero__orb,
  .hero__badge,
  .hero__title,
  .hero__bio,
  .hero__stats-grid,
  .hero__updates,
  .quote-card,
  .quote-skel {
    animation: none !important;
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
  .hero {
    min-height: auto;
    align-items: stretch;
  }

  .hero__columns {
    grid-template-columns: 1fr;
  }

  .quote-card {
    min-height: 0;
  }
}

@media (max-width: 720px) {
  .ai-preview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .featured-grid,
  .recent-grid,
  .ai-preview,
  .hero__stats-grid {
    grid-template-columns: 1fr;
  }

  .quote-card__top {
    flex-direction: column;
    align-items: flex-start;
  }

  .quote-card__weather {
    white-space: normal;
  }

  .resume-entry-banner,
  .couple-entry-banner {
    flex-direction: column;
    text-align: center;
  }

  .resume-entry-banner__content,
  .couple-entry-banner__content {
    flex-direction: column;
  }
}
</style>

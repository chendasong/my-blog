<script setup lang="ts">
import { ref, computed, watch, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { aiFeatures } from '@/data'
import { getVolcanoVideoModel } from '@/api/volcano'
import AiWorkshopChatPanel from '@/components/ai-workshop/AiWorkshopChatPanel.vue'
import AiWorkshopImagePanel from '@/components/ai-workshop/AiWorkshopImagePanel.vue'
import AiWorkshopVideoPanel from '@/components/ai-workshop/AiWorkshopVideoPanel.vue'
import type { AIFeature, AICategory } from '@/types'

const route = useRoute()
const selectedFeature = ref<AIFeature | null>(aiFeatures[0])
const activeCategory = ref<AICategory | 'all'>('all')

function queryFeatureId(): string | null {
  const q = route.query.feature
  if (Array.isArray(q)) return (q[0] as string)?.trim() || null
  return typeof q === 'string' && q.trim() ? q.trim() : null
}

function applyFeatureFromRouteQuery() {
  const fid = queryFeatureId()
  if (!fid) return
  const f = aiFeatures.find((x) => x.id === fid && !x.hidden)
  if (f) {
    selectedFeature.value = f
    activeCategory.value = 'all'
  }
}

watch(
  () => route.query.feature,
  () => applyFeatureFromRouteQuery(),
  { immediate: true },
)

const categoryLabels: Record<string, string> = {
  all: '全部',
  writing: '写作',
  vision: '视觉',
  analysis: '分析',
  creative: '创意',
}
const categoryIcons: Record<string, string> = {
  all: '✨',
  writing: '✍️',
  vision: '🔍',
  analysis: '💡',
  creative: '🎨',
}

const filteredFeatures = computed(() => {
  const visible = aiFeatures.filter((f) => !f.hidden)
  if (activeCategory.value === 'all') return visible
  return visible.filter((f) => f.category === activeCategory.value)
})

const videoModelDisplay = computed(() => {
  const m = getVolcanoVideoModel()
  return m || '未配置 VITE_VOLCANO_VIDEO_MODEL'
})

const workspaceSubtitle = computed(() => {
  const f = selectedFeature.value
  if (!f) return ''
  if (f.id === '12') {
    return `${f.description} 接入模型 ${videoModelDisplay.value}；可选首帧、尾帧参考图（适合 Seedance 1.5 Pro 等）；生成链接约 24h 有效，请及时下载。`
  }
  return f.description
})

const workshopPanel = computed<Component>(() => {
  const id = selectedFeature.value?.id
  if (id === '11') return AiWorkshopImagePanel
  if (id === '12') return AiWorkshopVideoPanel
  return AiWorkshopChatPanel
})

function handleSelect(feature: AIFeature) {
  selectedFeature.value = feature
}
</script>

<template>
  <div class="ai-page">
    <section class="ai-hero">
      <div class="ai-hero__bg">
        <div class="ai-blob ai-blob--1" />
        <div class="ai-blob ai-blob--2" />
      </div>
      <div class="ai-hero__inner">
        <div class="ai-hero-title-wrapper">
          <div class="ai-hero__icon animate-float">✨</div>
          <h1 class="ai-hero__title">AI 工坊</h1>
        </div>
        <p class="ai-hero__subtitle">
          集成多种 AI 能力，让创作、分析、开发更高效。
        </p>
      </div>
    </section>

    <div class="ai-body">
      <div class="ai-cats">
        <button
          v-for="(label, key) in categoryLabels"
          :key="key"
          :class="[
            'ai-cat-btn',
            { 'ai-cat-btn--active': activeCategory === key },
          ]"
          type="button"
          @click="activeCategory = key as AICategory | 'all'"
        >
          {{ categoryIcons[key] }} {{ label }}
        </button>
      </div>

      <div class="ai-grid">
        <div
          v-for="feature in filteredFeatures"
          :key="feature.id"
          :class="[
            'ai-tool-card',
            { 'ai-tool-card--active': selectedFeature?.id === feature.id },
          ]"
          @click="handleSelect(feature)"
        >
          <div class="ai-tool-card__icon">
            {{ feature.emoji }}
          </div>
          <div class="ai-tool-card__info">
            <h4 class="ai-tool-card__name">{{ feature.name }}</h4>
            <p class="ai-tool-card__desc">{{ feature.description }}</p>
          </div>
          <span v-if="feature.isNew" class="ai-tool-card__badge">NEW</span>
        </div>
      </div>

      <Transition name="ai-fade" mode="out-in">
        <div
          v-if="selectedFeature"
          :key="selectedFeature.id"
          class="ai-workspace glass-card"
        >
          <div class="ai-workspace__header">
            <span class="ai-ws-icon">{{ selectedFeature.emoji }}</span>
            <div>
              <h3 class="ai-ws-title">{{ selectedFeature.name }}</h3>
              <p class="ai-ws-desc">{{ workspaceSubtitle }}</p>
            </div>
          </div>
          <component
            :is="workshopPanel"
            :feature="selectedFeature"
            class="ai-workspace-panel-host"
          />
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.ai-hero {
  position: relative;
  padding: 60px 24px 40px;
  text-align: center;
  overflow: hidden;
}
.ai-hero__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.ai-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.35;
}
.ai-blob--1 {
  width: 400px;
  height: 400px;
  background: rgba(91, 138, 240, 0.2);
  top: -100px;
  right: -100px;
  animation: float 8s ease-in-out infinite;
}
.ai-blob--2 {
  width: 350px;
  height: 350px;
  background: rgba(139, 111, 240, 0.15);
  bottom: -60px;
  left: -60px;
  animation: float 10s ease-in-out infinite reverse;
}
.ai-hero__inner {
  position: relative;
  z-index: 1;
  max-width: 640px;
  margin: 0 auto;
}
.ai-hero-title-wrapper {
  display: flex;
  justify-content: center;
  gap: 6px;
}
.ai-hero__icon {
  font-size: 3.5rem;
  margin-bottom: 16px;
  display: block;
}
.ai-hero__title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.03em;
  margin-bottom: 8px;
}
.ai-hero__subtitle {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  margin-bottom: 16px;
}
.ai-body {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 80px;
}
.ai-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}
.ai-cat-btn {
  padding: 7px 16px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.ai-cat-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.ai-cat-btn--active {
  background: rgba(91, 138, 240, 0.1);
  border-color: rgba(91, 138, 240, 0.3);
  color: var(--color-primary);
  font-weight: 600;
}
.ai-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
  margin-bottom: 32px;
}
.ai-tool-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 20px;
  background: var(--color-bg-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}
.ai-tool-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-strong);
}
.ai-tool-card--active {
  border-color: var(--color-primary);
  background: rgba(91, 138, 240, 0.06);
  box-shadow: 0 0 0 3px rgba(91, 138, 240, 0.12);
}
.ai-tool-card__icon {
  font-size: 1.8rem;
  flex-shrink: 0;
  line-height: 1;
}
.ai-tool-card__info {
  flex: 1;
  min-width: 0;
}
.ai-tool-card__name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}
.ai-tool-card__desc {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ai-tool-card__badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--gradient-primary);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-full);
}
.ai-workspace {
  padding: 32px;
}
.ai-workspace__header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
}
.ai-ws-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}
.ai-ws-title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}
.ai-ws-desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.ai-fade-enter-active,
.ai-fade-leave-active {
  transition: all 0.25s ease;
}
.ai-fade-enter-from,
.ai-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
@media (max-width: 768px) {
  .ai-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCoupleStore } from '@/stores/couple'
import AppButton from '@/components/common/AppButton.vue'
import type { CoupleMemory } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useCoupleStore()

const loading = ref(true)
const memory = ref<CoupleMemory | null>(null)
const carouselIndex = ref(0)

const images = computed(() => {
  if (!memory.value) return []
  if (memory.value.images && memory.value.images.length > 0) return memory.value.images
  return memory.value.image ? [memory.value.image] : []
})

const typeLabels: Record<string, string> = { photo: '相册', milestone: '里程碑', wish: '心愿', diary: '日记' }
const typeIcons: Record<string, string> = { photo: '📸', milestone: '🏆', wish: '🌠', diary: '📖' }
const emotionColors: Record<string, string> = { happy: '#F0A05B', romantic: '#E8607A', sweet: '#8B6FF0', funny: '#4CAF82' }
const emotionLabels: Record<string, string> = { happy: '快乐', romantic: '浪漫', sweet: '甜蜜', funny: '搞笑' }

onMounted(async () => {
  await store.fetchMemories()
  const id = route.params.id as string
  memory.value = store.memories.find(m => m.id === id) || null
  loading.value = false
})

function prev() {
  if (images.value.length <= 1) return
  carouselIndex.value = (carouselIndex.value - 1 + images.value.length) % images.value.length
}
function next() {
  if (images.value.length <= 1) return
  carouselIndex.value = (carouselIndex.value + 1) % images.value.length
}
function goEdit() {
  router.push(`/couple/memory/${memory.value?.id}/edit`)
}
</script>

<template>
  <div class="memory-detail-page">
    <div class="md-header">
      <button class="back-btn" @click="router.push('/couple/space')">← 返回</button>
      <AppButton v-if="memory" variant="secondary" size="sm" @click="goEdit">✏️ 编辑</AppButton>
    </div>

    <div v-if="loading" class="md-loading">加载中...</div>
    <div v-else-if="!memory" class="md-loading">记忆不存在</div>

    <div v-else class="md-body">
      <!-- 图片轮播 -->
      <div v-if="images.length" class="md-carousel">
        <div class="md-carousel__main">
          <img :src="images[carouselIndex]" :alt="memory.title" class="md-carousel__img" />
          <template v-if="images.length > 1">
            <button class="md-carousel__btn md-carousel__btn--prev" @click="prev">‹</button>
            <button class="md-carousel__btn md-carousel__btn--next" @click="next">›</button>
            <div class="md-carousel__dots">
              <span
                v-for="(_, i) in images" :key="i"
                :class="['md-dot', { 'md-dot--active': carouselIndex === i }]"
                @click="carouselIndex = i"
              />
            </div>
            <div class="md-carousel__count">{{ carouselIndex + 1 }} / {{ images.length }}</div>
          </template>
        </div>
        <!-- 缩略图条 -->
        <div v-if="images.length > 1" class="md-thumbs">
          <img
            v-for="(src, i) in images" :key="i"
            :src="src"
            :class="['md-thumb', { 'md-thumb--active': carouselIndex === i }]"
            @click="carouselIndex = i"
          />
        </div>
      </div>

      <!-- 内容 -->
      <div class="md-content">
        <div class="md-meta">
          <span class="md-type">{{ typeIcons[memory.type] }} {{ typeLabels[memory.type] }}</span>
          <span class="md-emotion" :style="{ background: emotionColors[memory.emotion] }">{{ emotionLabels[memory.emotion] }}</span>
          <span class="md-date">📅 {{ memory.date }}</span>
        </div>
        <h1 class="md-title">{{ memory.title }}</h1>
        <p v-if="memory.description" class="md-desc">{{ memory.description }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.memory-detail-page { max-width: 860px; margin: 0 auto; padding: 32px 24px 80px; }
.md-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
.back-btn { background: none; border: none; color: var(--color-text-muted); font-size: var(--text-sm); cursor: pointer; transition: color var(--transition-fast); padding: 0; }
.back-btn:hover { color: #E8607A; }
.md-loading { text-align: center; padding: 80px; color: var(--color-text-muted); }

/* Carousel */
.md-carousel { margin-bottom: 28px; }
.md-carousel__main { position: relative; border-radius: var(--radius-xl); overflow: hidden; aspect-ratio: 16/9; background: var(--color-bg-glass); }
.md-carousel__img { width: 100%; height: 100%; object-fit: cover; }
.md-carousel__btn { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.4); color: white; border: none; cursor: pointer; font-size: 2rem; line-height: 1; padding: 8px 14px; border-radius: var(--radius-md); transition: background var(--transition-fast); z-index: 2; }
.md-carousel__btn:hover { background: rgba(0,0,0,0.65); }
.md-carousel__btn--prev { left: 12px; }
.md-carousel__btn--next { right: 12px; }
.md-carousel__dots { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 2; }
.md-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.5); cursor: pointer; transition: background var(--transition-fast); }
.md-dot--active { background: white; }
.md-carousel__count { position: absolute; top: 12px; right: 14px; background: rgba(0,0,0,0.45); color: white; font-size: 12px; padding: 3px 10px; border-radius: var(--radius-full); }

/* Thumbnails */
.md-thumbs { display: flex; gap: 8px; margin-top: 10px; overflow-x: auto; padding-bottom: 4px; }
.md-thumb { width: 72px; height: 54px; object-fit: cover; border-radius: var(--radius-md); cursor: pointer; border: 2px solid transparent; transition: border-color var(--transition-fast); flex-shrink: 0; }
.md-thumb--active { border-color: #E8607A; }

/* Content */
.md-content { }
.md-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.md-type { font-size: var(--text-sm); color: var(--color-text-muted); }
.md-emotion { padding: 3px 12px; border-radius: var(--radius-full); font-size: var(--text-xs); color: white; font-weight: 600; }
.md-date { font-size: var(--text-sm); color: var(--color-text-muted); }
.md-title { font-size: clamp(1.5rem, 4vw, 2.2rem); font-weight: 700; color: var(--color-text-primary); margin-bottom: 16px; line-height: 1.3; }
.md-desc { font-size: var(--text-base); color: var(--color-text-secondary); line-height: 1.9; white-space: pre-wrap; }
</style>

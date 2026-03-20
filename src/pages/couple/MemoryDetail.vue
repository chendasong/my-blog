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
const showCarousel = ref(false)

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
      <!-- 图片缩略图条 -->
      <div v-if="images.length" class="md-thumbs-container">
        <div class="md-thumbs">
          <img
            v-for="(src, i) in images" :key="i"
            :src="src"
            :class="['md-thumb', { 'md-thumb--active': carouselIndex === i }]"
            @click="carouselIndex = i; showCarousel = true"
          />
        </div>
      </div>

      <!-- 全屏轮播预览 -->
      <transition name="fade">
        <div v-if="showCarousel" class="md-carousel-modal" @click="showCarousel = false">
          <div class="md-carousel-modal__content" @click.stop>
            <button class="md-carousel-modal__close" @click="showCarousel = false">✕</button>
            <div class="md-carousel-modal__main">
              <img :src="images[carouselIndex]" :alt="memory.title" class="md-carousel-modal__img" />
              <template v-if="images.length > 1">
                <button class="md-carousel-modal__btn md-carousel-modal__btn--prev" @click="prev">‹</button>
                <button class="md-carousel-modal__btn md-carousel-modal__btn--next" @click="next">›</button>
                <div class="md-carousel-modal__dots">
                  <span
                    v-for="(_, i) in images" :key="i"
                    :class="['md-carousel-modal__dot', { 'md-carousel-modal__dot--active': carouselIndex === i }]"
                    @click="carouselIndex = i"
                  />
                </div>
                <div class="md-carousel-modal__count">{{ carouselIndex + 1 }} / {{ images.length }}</div>
              </template>
            </div>
          </div>
        </div>
      </transition>

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

/* Thumbnails Container */
.md-thumbs-container { margin-bottom: 28px; }
.md-thumbs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
.md-thumb { width: 100px; height: 75px; object-fit: cover; border-radius: var(--radius-md); cursor: pointer; border: 2px solid transparent; transition: all var(--transition-fast); flex-shrink: 0; }
.md-thumb:hover { transform: scale(1.05); }
.md-thumb--active { border-color: #E8607A; box-shadow: 0 2px 8px rgba(232, 96, 122, 0.3); }

/* Full Screen Carousel Modal */
.md-carousel-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.md-carousel-modal__content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.md-carousel-modal__close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
  z-index: 10;
}

.md-carousel-modal__close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.md-carousel-modal__main {
  position: relative;
  width: 100%;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.md-carousel-modal__img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: var(--radius-lg);
}

.md-carousel-modal__btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 2.5rem;
  line-height: 1;
  padding: 12px 18px;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
  z-index: 5;
}

.md-carousel-modal__btn:hover {
  background: rgba(255, 255, 255, 0.35);
}

.md-carousel-modal__btn--prev {
  left: 20px;
}

.md-carousel-modal__btn--next {
  right: 20px;
}

.md-carousel-modal__dots {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 5;
}

.md-carousel-modal__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.md-carousel-modal__dot:hover {
  background: rgba(255, 255, 255, 0.6);
}

.md-carousel-modal__dot--active {
  background: white;
}

.md-carousel-modal__count {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 14px;
  padding: 6px 14px;
  border-radius: var(--radius-full);
}

/* Content */
.md-content { }
.md-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.md-type { font-size: var(--text-sm); color: var(--color-text-muted); }
.md-emotion { padding: 3px 12px; border-radius: var(--radius-full); font-size: var(--text-xs); color: white; font-weight: 600; }
.md-date { font-size: var(--text-sm); color: var(--color-text-muted); }
.md-title { font-size: clamp(1.5rem, 4vw, 2.2rem); font-weight: 700; color: var(--color-text-primary); margin-bottom: 16px; line-height: 1.3; }
.md-desc { font-size: var(--text-base); color: var(--color-text-secondary); line-height: 1.9; white-space: pre-wrap; }

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-base);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .md-carousel-modal {
    padding: 10px;
  }

  .md-carousel-modal__btn {
    font-size: 1.8rem;
    padding: 8px 12px;
  }

  .md-carousel-modal__btn--prev {
    left: 10px;
  }

  .md-carousel-modal__btn--next {
    right: 10px;
  }

  .md-carousel-modal__close {
    top: 10px;
    right: 10px;
    width: 36px;
    height: 36px;
    font-size: 1.2rem;
  }
}
</style>

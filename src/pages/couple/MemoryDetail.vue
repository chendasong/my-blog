<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCoupleStore } from '@/stores/couple'
import AppButton from '@/components/common/AppButton.vue'
import type { CoupleMemory } from '@/types'
import { ensureHttpUrlForAssets } from '@/lib/qiniuClient'

const route = useRoute()
const router = useRouter()
const store = useCoupleStore()

const loading = ref(true)
const memory = ref<CoupleMemory | null>(null)
const carouselIndex = ref(0)
const showCarousel = ref(false)
const mainStageVideoRef = ref<HTMLVideoElement | null>(null)

type MediaKind = 'image' | 'video'
type MediaItem = { kind: MediaKind; url: string }

const images = computed(() => {
  if (!memory.value) return []
  if (memory.value.images && memory.value.images.length > 0) return memory.value.images
  return memory.value.image ? [memory.value.image] : []
})

const videos = computed(() => {
  if (!memory.value?.videos?.length) return []
  return memory.value.videos.filter((u) => typeof u === 'string' && u.trim())
})

/** 先图片后视频，详情页与全屏统一翻页 */
const mediaItems = computed<MediaItem[]>(() => {
  const out: MediaItem[] = []
  for (const url of images.value) out.push({ kind: 'image', url })
  for (const url of videos.value) out.push({ kind: 'video', url })
  return out
})

const typeLabels: Record<string, string> = { photo: '相册', milestone: '里程碑', wish: '心愿', diary: '日记' }
const typeIcons: Record<string, string> = { photo: '📸', milestone: '🏆', wish: '🌠', diary: '📖' }
const emotionColors: Record<string, string> = { happy: '#F0A05B', romantic: '#E8607A', sweet: '#8B6FF0', funny: '#4CAF82' }
const emotionLabels: Record<string, string> = { happy: '快乐', romantic: '浪漫', sweet: '甜蜜', funny: '搞笑' }

async function loadMemory() {
  const id = route.params.id as string
  await store.fetchMemories()
  memory.value = store.memories.find(m => m.id === id) || null
  carouselIndex.value = 0
  loading.value = false
}

onMounted(async () => {
  await loadMemory()
  window.addEventListener('keydown', onCarouselKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onCarouselKeydown)
})

watch(
  () => route.params.id,
  async () => {
    loading.value = true
    await loadMemory()
  },
)

function onCarouselKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && showCarousel.value) {
    e.preventDefault()
    showCarousel.value = false
    return
  }
  if (mediaItems.value.length <= 1) return
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    prev()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    next()
  }
}

function prev() {
  const n = mediaItems.value.length
  if (n <= 1) return
  carouselIndex.value = (carouselIndex.value - 1 + n) % n
}
function next() {
  const n = mediaItems.value.length
  if (n <= 1) return
  carouselIndex.value = (carouselIndex.value + 1) % n
}

function mediaUrl(item: MediaItem) {
  return ensureHttpUrlForAssets(item.url)
}

/** 无 hash 时追加 #t=0.001，促使浏览器解码并显示首帧（缩略图用） */
function videoThumbSrc(url: string) {
  const u = ensureHttpUrlForAssets(url)
  if (!u || u.includes('#')) return u
  return `${u}#t=0.001`
}

function onCarouselStageClick(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('video')) return
  showCarousel.value = true
}

function selectThumb(i: number, item: MediaItem) {
  carouselIndex.value = i
  if (item.kind === 'video') {
    void nextTick(() => {
      void mainStageVideoRef.value?.play().catch(() => {})
    })
  }
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
      <!-- 主区域：内联轮播 -->
      <div v-if="mediaItems.length" class="md-carousel">
        <div
          class="md-carousel__stage"
          role="region"
          aria-roledescription="carousel"
          :aria-label="`${memory.title} 配图与视频`"
        >
          <button
            type="button"
            class="md-carousel__zoom"
            :title="mediaItems.length > 1 ? '全屏查看（支持左右键翻页）' : '全屏查看'"
            @click="onCarouselStageClick"
          >
            <template v-if="mediaItems[carouselIndex]?.kind === 'image'">
              <img
                :src="mediaUrl(mediaItems[carouselIndex])"
                :alt="memory.title"
                class="md-carousel__img"
              />
            </template>
            <video
              v-else
              :key="mediaItems[carouselIndex]?.url"
              ref="mainStageVideoRef"
              class="md-carousel__video"
              :src="mediaUrl(mediaItems[carouselIndex])"
              controls
              playsinline
              preload="auto"
              @click.stop
            />
          </button>
          <template v-if="mediaItems.length > 1">
            <button
              type="button"
              class="md-carousel__nav md-carousel__nav--prev"
              aria-label="上一项"
              @click.stop="prev"
            >
              ‹
            </button>
            <button
              type="button"
              class="md-carousel__nav md-carousel__nav--next"
              aria-label="下一项"
              @click.stop="next"
            >
              ›
            </button>
          </template>
        </div>
        <div v-if="mediaItems.length > 1" class="md-carousel__footer">
          <div class="md-carousel__dots" role="tablist" aria-label="选择媒体">
            <button
              v-for="(_, i) in mediaItems"
              :key="i"
              type="button"
              role="tab"
              :aria-selected="carouselIndex === i"
              :class="['md-carousel__dot', { 'md-carousel__dot--active': carouselIndex === i }]"
              :aria-label="`第 ${i + 1} 项`"
              @click="carouselIndex = i"
            />
          </div>
          <span class="md-carousel__count">{{ carouselIndex + 1 }} / {{ mediaItems.length }}</span>
        </div>
        <div v-if="mediaItems.length > 1" class="md-carousel__thumbs">
          <button
            v-for="(item, i) in mediaItems"
            :key="i"
            type="button"
            :class="[
              'md-carousel__thumb',
              { 'md-carousel__thumb--active': carouselIndex === i, 'md-carousel__thumb--video': item.kind === 'video' },
            ]"
            :aria-label="item.kind === 'video' ? `播放第 ${i + 1} 个视频` : `查看第 ${i + 1} 张图`"
            @click="selectThumb(i, item)"
          >
            <img v-if="item.kind === 'image'" :src="mediaUrl(item)" alt="" />
            <span v-else class="md-carousel__thumb-video-wrap">
              <video
                class="md-carousel__thumb-video-el"
                :src="videoThumbSrc(item.url)"
                muted
                playsinline
                preload="metadata"
                disablePictureInPicture
                controlsList="nodownload noremoteplayback noplaybackrate"
              />
              <span class="md-carousel__thumb-play" aria-hidden="true">▶</span>
            </span>
          </button>
        </div>
      </div>

      <!-- 全屏轮播 -->
      <transition name="fade">
        <div v-if="showCarousel" class="md-carousel-modal" @click="showCarousel = false">
          <div class="md-carousel-modal__content" @click.stop>
            <button class="md-carousel-modal__close" @click="showCarousel = false">✕</button>
            <div class="md-carousel-modal__main">
              <template v-if="mediaItems[carouselIndex]?.kind === 'image'">
                <img
                  :src="mediaUrl(mediaItems[carouselIndex])"
                  :alt="memory.title"
                  class="md-carousel-modal__img"
                />
              </template>
              <video
                v-else-if="mediaItems[carouselIndex]"
                :key="'fs-' + mediaItems[carouselIndex].url"
                class="md-carousel-modal__video"
                :src="mediaUrl(mediaItems[carouselIndex])"
                controls
                playsinline
                preload="auto"
                autoplay
                @click.stop
              />
              <template v-if="mediaItems.length > 1">
                <button class="md-carousel-modal__btn md-carousel-modal__btn--prev" @click="prev">‹</button>
                <button class="md-carousel-modal__btn md-carousel-modal__btn--next" @click="next">›</button>
                <div class="md-carousel-modal__dots">
                  <span
                    v-for="(_, i) in mediaItems" :key="i"
                    :class="['md-carousel-modal__dot', { 'md-carousel-modal__dot--active': carouselIndex === i }]"
                    @click="carouselIndex = i"
                  />
                </div>
                <div class="md-carousel-modal__count">{{ carouselIndex + 1 }} / {{ mediaItems.length }}</div>
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

/* 内联轮播 */
.md-carousel {
  margin-bottom: 28px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-surface-muted, rgba(0, 0, 0, 0.04));
  box-shadow: 0 8px 32px rgba(232, 96, 122, 0.08);
}
.md-carousel__stage {
  position: relative;
  aspect-ratio: 16 / 10;
  max-height: min(56vh, 520px);
  background: linear-gradient(145deg, rgba(232, 96, 122, 0.06), rgba(139, 111, 240, 0.06));
}
.md-carousel__zoom {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  cursor: zoom-in;
  background: transparent;
}
.md-carousel__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  vertical-align: middle;
}
.md-carousel__video {
  width: 100%;
  height: 100%;
  max-height: min(56vh, 520px);
  object-fit: contain;
  vertical-align: middle;
  background: #0a0a0c;
  pointer-events: auto;
}
.md-carousel__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border: none;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.92);
  color: var(--color-text-primary);
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transition: background var(--transition-fast), transform var(--transition-fast);
  z-index: 2;
}
.md-carousel__nav:hover {
  background: white;
  transform: translateY(-50%) scale(1.05);
}
.md-carousel__nav--prev { left: 12px; }
.md-carousel__nav--next { right: 12px; }
.md-carousel__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px 16px 8px;
  flex-wrap: wrap;
}
.md-carousel__dots {
  display: flex;
  gap: 8px;
  align-items: center;
}
.md-carousel__dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--color-border-strong, #ddd);
  cursor: pointer;
  opacity: 0.45;
  transition: opacity var(--transition-fast), transform var(--transition-fast), background var(--transition-fast);
}
.md-carousel__dot:hover {
  opacity: 0.85;
}
.md-carousel__dot--active {
  opacity: 1;
  background: #E8607A;
  transform: scale(1.25);
}
.md-carousel__count {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}
.md-carousel__thumbs {
  display: flex;
  gap: 10px;
  padding: 0 16px 16px;
  overflow-x: auto;
  scrollbar-width: thin;
}
.md-carousel__thumb {
  flex: 0 0 auto;
  width: 72px;
  height: 54px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  overflow: hidden;
  background: var(--color-surface, #fff);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.md-carousel__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.md-carousel__thumb--video {
  background: #0f0f12;
}
.md-carousel__thumb-video-wrap {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
}
.md-carousel__thumb-video-el {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
  vertical-align: middle;
}
.md-carousel__thumb-play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  font-size: 1.2rem;
  line-height: 1;
  padding-left: 0.15em;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.55);
  background: rgba(0, 0, 0, 0.22);
  transition:
    background 0.2s ease,
    opacity 0.2s ease;
  opacity: 0.92;
}
.md-carousel__thumb--video:hover .md-carousel__thumb-play,
.md-carousel__thumb--video:focus-visible .md-carousel__thumb-play {
  opacity: 1;
  background: rgba(0, 0, 0, 0.38);
}
.md-carousel__thumb--active {
  border-color: #E8607A;
  box-shadow: 0 2px 10px rgba(232, 96, 122, 0.35);
}

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

.md-carousel-modal__video {
  max-width: 100%;
  max-height: 85vh;
  width: 100%;
  border-radius: var(--radius-lg);
  background: #000;
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
  .md-carousel__stage {
    aspect-ratio: 4 / 3;
    max-height: 48vh;
  }
  .md-carousel__nav {
    width: 38px;
    height: 38px;
    font-size: 1.5rem;
  }
  .md-carousel__nav--prev { left: 8px; }
  .md-carousel__nav--next { right: 8px; }
  .md-carousel__thumb {
    width: 64px;
    height: 48px;
  }

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

@media (max-width: 480px) {
  .md-carousel__thumb {
    width: 56px;
    height: 42px;
  }
}
</style>

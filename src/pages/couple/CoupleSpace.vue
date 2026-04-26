<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { coupleInfo } from '@/data'
import { useCoupleStore } from '@/stores/couple'
import { useAuthStore } from '@/stores/auth'
import DayCounter from '@/components/common/DayCounter.vue'
import AppButton from '@/components/common/AppButton.vue'
import type { CoupleMemory } from '@/types'
import { ensureHttpUrlForAssets } from '@/lib/qiniuClient'

const router = useRouter()
const authStore = useAuthStore()
const store = useCoupleStore()
const activeFilter = ref('all')

const person1 = computed(() => ({
  name: authStore.siteSettings?.person1_name || coupleInfo.person1.name,
  nickname: authStore.siteSettings?.person1_name || coupleInfo.person1.nickname,
  avatar: authStore.siteSettings?.person1_avatar || coupleInfo.person1.avatar,
}))

const person2 = computed(() => ({
  name: authStore.siteSettings?.person2_name || coupleInfo.person2.name,
  nickname: authStore.siteSettings?.person2_name || coupleInfo.person2.nickname,
  avatar: authStore.siteSettings?.person2_avatar || coupleInfo.person2.avatar,
}))

const typeLabels: Record<string, string> = { all: '全部', photo: '相册', milestone: '里程碑', wish: '心愿', diary: '日记' }
const typeIcons: Record<string, string> = { all: '💝', photo: '📸', milestone: '🏆', wish: '🌠', diary: '📖' }
const emotionColors: Record<string, string> = { happy: '#F0A05B', romantic: '#E8607A', sweet: '#8B6FF0', funny: '#4CAF82' }
const emotionLabels: Record<string, string> = { happy: '快乐', romantic: '浪漫', sweet: '甜蜜', funny: '搞笑' }




onMounted(async () => {
  if (!authStore.siteSettings) await authStore.fetchSiteSettings()
  store.fetchMemories()
})

const startDate = computed(() => authStore.siteSettings?.couple_since || coupleInfo.startDate)

async function handleFilter(type: string) {
  activeFilter.value = type
  await store.fetchMemories(type)
}

/** 列表封面：主图 → 首张相册图 */
function getCoverUrl(mem: CoupleMemory): string {
  const raw = mem.image?.trim() ? mem.image : mem.images?.length ? mem.images[0] : ''
  return ensureHttpUrlForAssets(raw)
}

/** 首段视频的封面图（保存时截取），列表用 img 加载、不拉整段视频 */
function getVideoPosterUrl(mem: CoupleMemory): string {
  const p = mem.videoPosters?.[0]?.trim()
  return p ? ensureHttpUrlForAssets(p) : ''
}

function firstVideoUrl(mem: CoupleMemory): string {
  const v = mem.videos?.[0]?.trim()
  return v ? ensureHttpUrlForAssets(v) : ''
}

/** 无静态图封面时，用视频 metadata 拉首帧兜底（旧数据）；详情页再播放完整视频 */
function useVideoStillInList(mem: CoupleMemory): boolean {
  return !getCoverUrl(mem) && !getVideoPosterUrl(mem) && !!firstVideoUrl(mem)
}
function openNew() {
  router.push('/couple/memory/new')
}

function openEdit(m: CoupleMemory) {
  router.push(`/couple/memory/${m.id}/edit`)
}


async function handleDelete(id: string) {
  if (!confirm('确定删除这条记忆吗？')) return
  await store.remove(id)
}
</script>

<template>
  <div class="couple-space">
    <section class="couple-hero">
      <div class="couple-hero__bg">
        <div class="ch-blob ch-blob--1" />
        <div class="ch-blob ch-blob--2" />
      </div>
      <div class="couple-hero__inner">
        <div class="couple-hero__avatars animate-scale-in">
          <div class="couple-avatar"><img :src="person1.avatar" :alt="person1.nickname" /><span
              class="couple-avatar__name">{{ person1.nickname }}</span></div>
          <div class="couple-heart animate-float">💗</div>
          <div class="couple-avatar"><img :src="ensureHttpUrlForAssets(person2.avatar)" :alt="person2.nickname" /><span
              class="couple-avatar__name">{{ person2.nickname }}</span></div>
        </div>
        <div class="couple-hero__info animate-fade-in-up delay-200">
          <!-- <p class="couple-hero__motto">「{{ coupleInfo.motto }}」</p> -->
          <div class="couple-hero__counter">
            <p class="couple-hero__counter-label">我们在一起已经</p>
            <DayCounter :start-date="startDate" />
          </div>
          <p class="couple-hero__since">自 {{ startDate }} 起 ✨</p>
        </div>
      </div>
    </section>

    <section class="couple-memories">
      <div class="container">
        <div class="memories-header">
          <div class="memories-header__left">
            <h2 class="memories-title">我们的故事 📖</h2>
            <div class="memories-filter">
              <button v-for="(label, key) in typeLabels" :key="key"
                :class="['mem-filter-btn', { 'mem-filter-btn--active': activeFilter === key }]"
                @click="handleFilter(key)">{{ typeIcons[key] }} {{ label }}</button>
            </div>
          </div>
          <AppButton variant="warm" size="sm" @click="openNew">💭 添加记忆</AppButton>
        </div>
        <div v-if="store.loading" class="memories-loading">加载中...</div>
        <div v-else-if="store.memories.length === 0" class="empty-memories">
          <div class="empty-memories__icon">📝</div>
          <p class="empty-memories__text">还没有记忆呢</p>
          <p class="empty-memories__hint">点击右上角的"添加记忆"按钮，记录我们的故事吧 💕</p>
        </div>
        <div v-else class="memories-grid">
          <div v-for="mem in store.memories" :key="mem.id" class="memory-card animate-fade-in-up"
            @click="router.push(`/couple/memory/${mem.id}`)">
            <div class="memory-card__cover">
              <img
                v-if="getCoverUrl(mem)"
                :src="getCoverUrl(mem)"
                :alt="mem.title"
                loading="lazy"
              />
              <img
                v-else-if="getVideoPosterUrl(mem)"
                :src="getVideoPosterUrl(mem)"
                :alt="`${mem.title} 视频封面`"
                loading="lazy"
              />
              <div
                v-else-if="useVideoStillInList(mem)"
                class="memory-card__cover-video-wrap"
              >
                <video
                  class="memory-card__cover-video"
                  :src="firstVideoUrl(mem)"
                  preload="metadata"
                  muted
                  playsinline
                  disablepictureinpicture
                  disableremoteplayback
                  aria-hidden="true"
                />
                <span class="memory-card__cover-video-badge" aria-hidden="true"
                  >🎬</span
                >
              </div>
              <div v-else class="memory-card__cover-placeholder" aria-hidden="true">📷</div>
              <div class="memory-card__emotion" :style="{ background: emotionColors[mem.emotion] }">
                {{ emotionLabels[mem.emotion] }}
              </div>
              <div class="memory-card__actions" @click.stop>
                <button type="button" class="memory-card__action-btn memory-card__action-btn--edit"
                  @click="openEdit(mem)">✏️ 编辑</button>
                <button type="button" class="memory-card__action-btn memory-card__action-btn--delete"
                  @click="handleDelete(mem.id)">🗑️ 删除</button>
              </div>
            </div>
            <div class="memory-card__body">
              <h4 class="memory-card__title">{{ mem.title }}</h4>
              <p class="memory-card__desc">{{ mem.description }}</p>
              <div class="memory-card__meta-row">
                <span class="memory-card__type">{{ typeIcons[mem.type] }} {{ typeLabels[mem.type] }}</span>
                <span class="memory-card__date" :title="mem.date">📅 {{ mem.date }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.couple-hero {
  position: relative;
  padding: 30px 24px 20px;
  overflow: hidden;
  text-align: center;
}

.couple-hero__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ch-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: .4;
}

.ch-blob--1 {
  width: 400px;
  height: 400px;
  background: rgba(232, 96, 122, .2);
  top: -80px;
  left: -80px;
  animation: float 8s ease-in-out infinite;
}

.ch-blob--2 {
  width: 350px;
  height: 350px;
  background: rgba(240, 160, 91, .15);
  bottom: -60px;
  right: -60px;
  animation: float 10s ease-in-out infinite reverse;
}

.couple-hero__inner {
  position: relative;
  z-index: 1;
  max-width: 600px;
  margin: 0 auto;
}

.couple-hero__info {
  text-align: center;
}

.couple-hero__avatars {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 8px;
}

.couple-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.couple-avatar img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid rgba(232, 96, 122, .4);
  object-fit: cover;
}

.couple-avatar__name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.couple-heart {
  font-size: 2.5rem;
}

.couple-hero__motto {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  margin: 0 0 24px;
  line-height: 1.5;
}

.couple-hero__counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.couple-hero__counter-label {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.couple-hero__since {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.couple-memories {
  padding: 40px 0 80px;
}

.memories-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 16px;
}

.memories-header__left {
  flex: 1;
}

.memories-title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 16px;
}

.memories-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mem-filter-btn {
  padding: 7px 16px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.mem-filter-btn:hover {
  border-color: #E8607A;
  color: #E8607A;
}

.mem-filter-btn--active {
  background: rgba(232, 96, 122, .10);
  border-color: rgba(232, 96, 122, .3);
  color: #E8607A;
  font-weight: 600;
}

.memories-loading {
  text-align: center;
  padding: 60px;
  color: var(--color-text-muted);
}

.empty-memories {
  text-align: center;
  padding: 80px 24px;
}

.empty-memories__icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.empty-memories__text {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.empty-memories__hint {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.6;
}

/* ---- inline form ---- */
.memory-form {
  margin-bottom: 28px;
  overflow: hidden;
}

.mf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--color-border);
}

.mf-header h3 {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text-primary);
}

.mf-close {
  font-size: 1.1rem;
  cursor: pointer;
  color: var(--color-text-muted);
  background: none;
  border: none;
  padding: 4px 8px;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.mf-close:hover {
  background: var(--color-bg-glass);
}

.mf-body {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 24px;
  padding: 20px 24px;
}

.mf-left {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mf-right {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mf-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 24px 20px;
  border-top: 1px solid var(--color-border);
}

.cancel-btn {
  padding: 8px 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: transparent;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.cancel-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.img-preview-box {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  aspect-ratio: 4/3;
  background: var(--color-bg-glass);
  margin-bottom: 8px;
}

.img-preview-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(232, 96, 122, .85);
  color: white;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: var(--radius-full);
}

.upload-btn {
  display: block;
  text-align: center;
  padding: 8px 12px;
  border-radius: var(--radius-lg);
  border: 1.5px dashed var(--color-border);
  background: var(--color-bg-glass);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: 8px;
}

.upload-btn:hover {
  border-color: #E8607A;
  color: #E8607A;
}

.img-label {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}

.image-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.img-option {
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  aspect-ratio: 4/3;
  transition: border-color var(--transition-fast);
}

.img-option img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-option--active {
  border-color: #E8607A;
}

.form-slide-enter-active,
.form-slide-leave-active {
  transition: all .3s ease;
  max-height: 800px;
}

.form-slide-enter-from,
.form-slide-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-12px);
}

/* ---- cards（约一行 4 张，与文章列表密度接近）---- */
.memories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
}

.memory-card {
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-base);
  background: var(--color-bg-card);
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}

.memory-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: rgba(232, 96, 122, 0.28);
}

.memory-card__cover {
  position: relative;
  flex-shrink: 0;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: linear-gradient(135deg, #fff0f5, #fff8f0);
}

.memory-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.memory-card:hover .memory-card__cover img {
  transform: scale(1.04);
}

.memory-card__cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  opacity: 0.35;
}

.memory-card__cover-video-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.memory-card__cover-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
  transition: transform var(--transition-slow);
}

.memory-card:hover .memory-card__cover-video {
  transform: scale(1.04);
}

.memory-card__cover-video-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: 1.25rem;
  opacity: 0.85;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
}

.memory-card__emotion {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 10px;
  color: white;
  font-weight: 600;
}

.memory-card__actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 6px;
  padding: 8px 10px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.72) 0%, transparent 100%);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.memory-card:hover .memory-card__actions {
  opacity: 1;
}

.memory-card__action-btn {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(8px);
  transition: all var(--transition-fast);
  color: white;
  background: rgba(255, 255, 255, 0.12);
}

.memory-card__action-btn--edit:hover {
  background: rgba(232, 96, 122, 0.88);
  border-color: rgba(255, 255, 255, 0.45);
}

.memory-card__action-btn--delete:hover {
  background: rgba(180, 40, 60, 0.9);
  border-color: rgba(255, 255, 255, 0.45);
}

.memory-card__body {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.memory-card__meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 10px;
  margin-bottom: 0;
  border-top: 1px solid var(--color-border);
  min-width: 0;
}

.memory-card__type {
  font-size: 10px;
  color: var(--color-text-muted);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.memory-card__date {
  font-size: 10px;
  color: var(--color-text-muted);
  flex-shrink: 0;
  white-space: nowrap;
  opacity: 0.9;
}

.memory-card__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.35;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.memory-card__desc {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-bottom: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.memory-card__detail {
  padding: 8px 0;
  border-top: 1px solid var(--color-border);
  margin-top: 4px;
}

.memory-card__desc-full {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.8;
  white-space: pre-wrap;
  margin-bottom: 8px;
}

.memory-card__meta {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.detail-slide-enter-active,
.detail-slide-leave-active {
  transition: all .2s ease;
  overflow: hidden;
  max-height: 300px;
}

.detail-slide-enter-from,
.detail-slide-leave-to {
  opacity: 0;
  max-height: 0;
}

.couple-logout {
  text-align: center;
  padding: 0 0 60px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.form-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.form-input,
.form-textarea,
.form-select {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  outline: none;
  width: 100%;
}

.form-input,
.form-textarea {
  background: rgba(255, 255, 255, .5);
}

.form-select {
  background-color: rgba(255, 255, 255, .5);
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: #E8607A;
}

.form-textarea {
  resize: vertical;
}

@media (max-width: 700px) {
  .mf-body {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

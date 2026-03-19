<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useRouter } from 'vue-router'
import { coupleInfo } from '@/data'
import { useCoupleStore } from '@/stores/couple'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import DayCounter from '@/components/common/DayCounter.vue'
import AppButton from '@/components/common/AppButton.vue'
import type { CoupleMemory } from '@/types'

const router = useRouter()
const toast = useToast()
const appStore = useAppStore()
const authStore = useAuthStore()
const store = useCoupleStore()
const activeFilter = ref('all')
const carouselIndexes = ref<Record<string, number>>({})

const typeLabels: Record<string, string> = { all:'全部',photo:'相册',milestone:'里程碑',wish:'心愿',diary:'日记' }
const typeIcons: Record<string, string> = { all:'💝',photo:'📸',milestone:'🏆',wish:'🌠',diary:'📖' }
const emotionColors: Record<string, string> = { happy:'#F0A05B',romantic:'#E8607A',sweet:'#8B6FF0',funny:'#4CAF82' }
const emotionLabels: Record<string, string> = { happy:'快乐',romantic:'浪漫',sweet:'甜蜜',funny:'搞笑' }




onMounted(async () => {
  if (!authStore.siteSettings) await authStore.fetchSiteSettings()
  store.fetchMemories()
})

const startDate = computed(() => authStore.siteSettings?.couple_since || coupleInfo.startDate)

async function handleFilter(type: string) {
  activeFilter.value = type
  await store.fetchMemories(type)
}

function getCarouselImages(mem: CoupleMemory): string[] {
  if (mem.images && mem.images.length > 0) return mem.images
  return mem.image ? [mem.image] : []
}
function carouselNext(mem: CoupleMemory, e: Event) {
  e.stopPropagation()
  const imgs = getCarouselImages(mem)
  if (imgs.length <= 1) return
  const cur = carouselIndexes.value[mem.id] || 0
  carouselIndexes.value[mem.id] = (cur + 1) % imgs.length
}
function carouselPrev(mem: CoupleMemory, e: Event) {
  e.stopPropagation()
  const imgs = getCarouselImages(mem)
  if (imgs.length <= 1) return
  const cur = carouselIndexes.value[mem.id] || 0
  carouselIndexes.value[mem.id] = (cur - 1 + imgs.length) % imgs.length
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

function handleLogout() { appStore.setCoupleAuth(false); router.push('/') }
</script>

<template>
  <div class="couple-space">
    <section class="couple-hero">
      <div class="couple-hero__bg"><div class="ch-blob ch-blob--1" /><div class="ch-blob ch-blob--2" /></div>
      <div class="couple-hero__inner">
        <div class="couple-hero__avatars animate-scale-in">
          <div class="couple-avatar"><img :src="coupleInfo.person1.avatar" :alt="coupleInfo.person1.nickname" /><span class="couple-avatar__name">{{ coupleInfo.person1.nickname }}</span></div>
          <div class="couple-heart animate-float">💗</div>
          <div class="couple-avatar"><img :src="coupleInfo.person2.avatar" :alt="coupleInfo.person2.nickname" /><span class="couple-avatar__name">{{ coupleInfo.person2.nickname }}</span></div>
        </div>
        <div class="couple-hero__info animate-fade-in-up delay-200">
          <p class="couple-hero__motto">「{{ coupleInfo.motto }}」</p>
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
          <h2 class="memories-title">我们的故事 📖</h2>
          <div class="memories-header__right">
            <div class="memories-filter">
              <button v-for="(label, key) in typeLabels" :key="key"
                :class="['mem-filter-btn', { 'mem-filter-btn--active': activeFilter === key }]"
                @click="handleFilter(key)">{{ typeIcons[key] }} {{ label }}</button>
            </div>
            <AppButton variant="warm" size="sm" @click="openNew">+ 添加记忆</AppButton>
          </div>
        </div>
        <div v-if="store.loading" class="memories-loading">加载中...</div>
        <div v-else class="memories-grid">
          <div v-for="mem in store.memories" :key="mem.id" class="memory-card glass-card animate-fade-in-up" style="cursor:pointer" @click="openEdit(mem)">
            <div class="memory-card__cover">
              <img :src="getCarouselImages(mem)[carouselIndexes[mem.id] || 0] || mem.image" :alt="mem.title" />
              <div class="memory-card__emotion" :style="{ background: emotionColors[mem.emotion] }">{{ emotionLabels[mem.emotion] }}</div>
              <template v-if="getCarouselImages(mem).length > 1">
                <button class="carousel-btn carousel-btn--prev" @click="carouselPrev(mem, $event)">‹</button>
                <button class="carousel-btn carousel-btn--next" @click="carouselNext(mem, $event)">›</button>
                <div class="carousel-dots">
                  <span v-for="(_, i) in getCarouselImages(mem)" :key="i"
                    :class="['carousel-dot', { 'carousel-dot--active': (carouselIndexes[mem.id] || 0) === i }]"
                    @click.stop="carouselIndexes[mem.id] = i"
                  />
                </div>
              </template>
            </div>
            <div class="memory-card__body">
              <div class="memory-card__type">{{ typeIcons[mem.type] }} {{ typeLabels[mem.type] }}</div>
              <h4 class="memory-card__title">{{ mem.title }}</h4>
              <p class="memory-card__desc">{{ mem.description }}</p>
              <div class="memory-card__footer">
                <span class="memory-card__date">📅 {{ mem.date }}</span>
                <div class="memory-card__ops">
                  <button class="op-btn" @click.stop="openEdit(mem)">✏️</button>
                  <button class="op-btn op-btn--danger" @click.stop="handleDelete(mem.id)">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <div class="couple-logout"><AppButton variant="ghost" @click="handleLogout">🔒 退出空间</AppButton></div>
  </div>
</template>

<style scoped>
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.couple-hero { position: relative; padding: 80px 24px 60px; overflow: hidden; text-align: center; }
.couple-hero__bg { position: absolute; inset: 0; pointer-events: none; }
.ch-blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: .4; }
.ch-blob--1 { width: 400px; height: 400px; background: rgba(232,96,122,.2); top: -80px; left: -80px; animation: float 8s ease-in-out infinite; }
.ch-blob--2 { width: 350px; height: 350px; background: rgba(240,160,91,.15); bottom: -60px; right: -60px; animation: float 10s ease-in-out infinite reverse; }
.couple-hero__inner { position: relative; z-index: 1; max-width: 600px; margin: 0 auto; }
.couple-hero__avatars { display: flex; align-items: center; justify-content: center; gap: 24px; margin-bottom: 32px; }
.couple-avatar { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.couple-avatar img { width: 100px; height: 100px; border-radius: 50%; border: 3px solid rgba(232,96,122,.4); object-fit: cover; }
.couple-avatar__name { font-size: var(--text-sm); font-weight: 600; color: var(--color-text-secondary); }
.couple-heart { font-size: 2.5rem; }
.couple-hero__motto { font-family: var(--font-serif); font-size: var(--text-lg); color: var(--color-text-secondary); margin-bottom: 24px; }
.couple-hero__counter { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 8px; }
.couple-hero__counter-label, .couple-hero__since { font-size: var(--text-sm); color: var(--color-text-muted); }
.couple-memories { padding: 40px 0 80px; }
.memories-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 16px; }
.memories-title { font-size: var(--text-2xl); font-weight: 700; color: var(--color-text-primary); }
.memories-header__right { display: flex; flex-direction: column; gap: 10px; align-items: flex-end; }
.memories-filter { display: flex; flex-wrap: wrap; gap: 8px; }
.mem-filter-btn { padding: 7px 16px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: var(--text-sm); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast); }
.mem-filter-btn:hover { border-color: #E8607A; color: #E8607A; }
.mem-filter-btn--active { background: rgba(232,96,122,.10); border-color: rgba(232,96,122,.3); color: #E8607A; font-weight: 600; }
.memories-loading { text-align: center; padding: 60px; color: var(--color-text-muted); }

/* ---- inline form ---- */
.memory-form { margin-bottom: 28px; overflow: hidden; }
.mf-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 16px; border-bottom: 1px solid var(--color-border); }
.mf-header h3 { font-size: var(--text-lg); font-weight: 700; color: var(--color-text-primary); }
.mf-close { font-size: 1.1rem; cursor: pointer; color: var(--color-text-muted); background: none; border: none; padding: 4px 8px; border-radius: var(--radius-md); transition: background var(--transition-fast); }
.mf-close:hover { background: var(--color-bg-glass); }
.mf-body { display: grid; grid-template-columns: 1fr 280px; gap: 24px; padding: 20px 24px; }
.mf-left { display: flex; flex-direction: column; gap: 14px; }
.mf-right { display: flex; flex-direction: column; gap: 10px; }
.mf-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 24px 20px; border-top: 1px solid var(--color-border); }
.cancel-btn { padding: 8px 18px; border-radius: var(--radius-lg); border: 1px solid var(--color-border); background: transparent; font-size: var(--text-sm); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast); }
.cancel-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }

.img-preview-box { position: relative; border-radius: var(--radius-lg); overflow: hidden; aspect-ratio: 4/3; background: var(--color-bg-glass); margin-bottom: 8px; }
.img-preview-box img { width: 100%; height: 100%; object-fit: cover; }
.img-badge { position: absolute; bottom: 8px; left: 8px; background: rgba(232,96,122,.85); color: white; font-size: 11px; padding: 3px 8px; border-radius: var(--radius-full); }
.upload-btn { display: block; text-align: center; padding: 8px 12px; border-radius: var(--radius-lg); border: 1.5px dashed var(--color-border); background: var(--color-bg-glass); font-size: var(--text-xs); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast); margin-bottom: 8px; }
.upload-btn:hover { border-color: #E8607A; color: #E8607A; }
.img-label { font-size: 11px; color: var(--color-text-muted); margin-bottom: 6px; }
.image-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.img-option { border-radius: var(--radius-md); overflow: hidden; cursor: pointer; border: 2px solid transparent; aspect-ratio: 4/3; transition: border-color var(--transition-fast); }
.img-option img { width: 100%; height: 100%; object-fit: cover; }
.img-option--active { border-color: #E8607A; }

.form-slide-enter-active, .form-slide-leave-active { transition: all .3s ease; max-height: 800px; }
.form-slide-enter-from, .form-slide-leave-to { opacity: 0; max-height: 0; transform: translateY(-12px); }

/* ---- cards ---- */
.memories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.memory-card { overflow: hidden; transition: all var(--transition-base); }
.memory-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
.memory-card__cover { position: relative; aspect-ratio: 4/3; overflow: hidden; background: linear-gradient(135deg,#FFF0F5,#FFF8F0); cursor: pointer; }
.memory-card__cover img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s ease; }
.memory-card__cover:hover img { transform: scale(1.03); }
.memory-card__emotion { position: absolute; top: 10px; right: 10px; padding: 3px 10px; border-radius: var(--radius-full); font-size: var(--text-xs); color: white; font-weight: 600; }
.memory-card__expand-hint { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,.4)); color: white; font-size: 11px; text-align: center; padding: 16px 0 6px; opacity: 0; transition: opacity var(--transition-fast); }
.memory-card__cover:hover .memory-card__expand-hint { opacity: 1; }
.memory-card__body { padding: 14px 16px; }
.memory-card__type { font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: 4px; }
.memory-card__title { font-size: var(--text-base); font-weight: 600; color: var(--color-text-primary); margin-bottom: 8px; }
.memory-card__desc { font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.memory-card__detail { padding: 8px 0; border-top: 1px solid var(--color-border); margin-top: 4px; }
.memory-card__desc-full { font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.8; white-space: pre-wrap; margin-bottom: 8px; }
.memory-card__meta { font-size: var(--text-xs); color: var(--color-text-muted); }
.memory-card__footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--color-border); }
.memory-card__date { font-size: var(--text-xs); color: var(--color-text-muted); }
.memory-card__ops { display: flex; gap: 4px; }
.op-btn { padding: 4px 8px; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: .8rem; cursor: pointer; transition: all var(--transition-fast); }
.op-btn:hover { border-color: var(--color-primary); }
.op-btn--danger:hover { border-color: var(--color-error); }
.detail-slide-enter-active, .detail-slide-leave-active { transition: all .2s ease; overflow: hidden; max-height: 300px; }
.detail-slide-enter-from, .detail-slide-leave-to { opacity: 0; max-height: 0; }
.couple-logout { text-align: center; padding: 0 0 60px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
.form-label { font-size: var(--text-sm); font-weight: 600; color: var(--color-text-secondary); }
.form-input, .form-textarea, .form-select { padding: 10px 12px; background: rgba(255,255,255,.5); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--color-text-primary); font-family: var(--font-sans); outline: none; width: 100%; }
.form-input:focus, .form-textarea:focus, .form-select:focus { border-color: #E8607A; }
.form-textarea { resize: vertical; }
@media (max-width: 700px) { .mf-body { grid-template-columns: 1fr; } .form-row { grid-template-columns: 1fr; } }

.carousel-btn { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.35); color: white; border: none; cursor: pointer; font-size: 1.2rem; line-height: 1; padding: 4px 8px; border-radius: var(--radius-md); opacity: 0; transition: opacity var(--transition-fast); z-index: 2; }
.memory-card__cover:hover .carousel-btn { opacity: 1; }
.carousel-btn--prev { left: 6px; }
.carousel-btn--next { right: 6px; }
.carousel-dots { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); display: flex; gap: 4px; z-index: 2; }
.carousel-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.5); cursor: pointer; transition: background var(--transition-fast); }
.carousel-dot--active { background: white; }
</style>

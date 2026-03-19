<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useRouter } from 'vue-router'
import { coupleInfo } from '@/data'
import { useCoupleStore } from '@/stores/couple'
import { useAppStore } from '@/stores/app'
import DayCounter from '@/components/common/DayCounter.vue'
import AppButton from '@/components/common/AppButton.vue'
import type { CoupleMemory } from '@/types'

const router = useRouter()
const toast = useToast()
const appStore = useAppStore()
const store = useCoupleStore()
const activeFilter = ref('all')
const showForm = ref(false)
const saving = ref(false)
const editingMemory = ref<Partial<CoupleMemory>>({})

const typeLabels: Record<string, string> = {
  all: '全部', photo: '相册', milestone: '里程碑', wish: '心愿', diary: '日记',
}
const typeIcons: Record<string, string> = {
  all: '💝', photo: '📸', milestone: '🏆', wish: '🌠', diary: '📖',
}
const emotionColors: Record<string, string> = {
  happy: '#F0A05B', romantic: '#E8607A', sweet: '#8B6FF0', funny: '#4CAF82',
}
const emotionLabels: Record<string, string> = {
  happy: '快乐', romantic: '浪漫', sweet: '甜蜜', funny: '搞笑',
}
const imageOptions = [
  '/images/memory-1.svg', '/images/memory-2.svg', '/images/memory-3.svg',
  '/images/memory-4.svg', '/images/memory-5.svg', '/images/memory-6.svg',
]
const uploadingImage = ref(false)
async function handleImageUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadingImage.value = true
  try {
    const { coupleApi } = await import('@/api')
    editingMemory.value.image = await coupleApi.uploadImage(file)
  } catch {
    toast.error('图片上传失败，请重试')
  } finally {
    uploadingImage.value = false
  }
}

onMounted(() => store.fetchMemories())

async function handleFilter(type: string) {
  activeFilter.value = type
  await store.fetchMemories(type)
}

function openNew() {
  editingMemory.value = { title: '', description: '', image: '/images/memory-1.svg', date: '', type: 'photo', emotion: 'sweet' }
  showForm.value = true
}

function openEdit(m: CoupleMemory) {
  editingMemory.value = { ...m }
  showForm.value = true
}

async function handleSave() {
  if (!editingMemory.value.title?.trim()) { toast.warning('标题不能为空'); return }
  saving.value = true
  try {
    if (editingMemory.value.id) {
      await store.update(editingMemory.value.id, editingMemory.value)
    } else {
      await store.create(editingMemory.value as Omit<CoupleMemory, 'id'>)
    }
    showForm.value = false
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: string) {
  if (!confirm('确定删除这条记忆吗？')) return
  await store.remove(id)
}

function handleLogout() {
  appStore.setCoupleAuth(false)
  router.push('/')
}
</script>

<template>
  <div class="couple-space">
    <section class="couple-hero">
      <div class="couple-hero__bg"><div class="ch-blob ch-blob--1" /><div class="ch-blob ch-blob--2" /></div>
      <div class="couple-hero__inner">
        <div class="couple-hero__avatars animate-scale-in">
          <div class="couple-avatar">
            <img :src="coupleInfo.person1.avatar" :alt="coupleInfo.person1.nickname" />
            <span class="couple-avatar__name">{{ coupleInfo.person1.nickname }}</span>
          </div>
          <div class="couple-heart animate-float">💗</div>
          <div class="couple-avatar">
            <img :src="coupleInfo.person2.avatar" :alt="coupleInfo.person2.nickname" />
            <span class="couple-avatar__name">{{ coupleInfo.person2.nickname }}</span>
          </div>
        </div>
        <div class="couple-hero__info animate-fade-in-up delay-200">
          <p class="couple-hero__motto">「{{ coupleInfo.motto }}」</p>
          <div class="couple-hero__counter">
            <p class="couple-hero__counter-label">我们在一起已经</p>
            <DayCounter :start-date="coupleInfo.startDate" />
          </div>
          <p class="couple-hero__since">自 {{ coupleInfo.startDate }} 起 ✨</p>
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
                @click="handleFilter(key)"
              >{{ typeIcons[key] }} {{ label }}</button>
            </div>
            <AppButton variant="warm" size="sm" @click="openNew">+ 添加记忆</AppButton>
          </div>
        </div>
        <div v-if="store.loading" class="memories-loading">加载中...</div>
        <div v-else class="memories-grid">
          <div v-for="(mem, _i) in store.memories" :key="mem.id"
            class="memory-card glass-card animate-fade-in-up">
            <div class="memory-card__cover">
              <img :src="mem.image" :alt="mem.title" />
              <div class="memory-card__emotion" :style="{ background: emotionColors[mem.emotion] }">{{ emotionLabels[mem.emotion] }}</div>
            </div>
            <div class="memory-card__body">
              <div class="memory-card__type">{{ typeIcons[mem.type] }} {{ typeLabels[mem.type] }}</div>
              <h4 class="memory-card__title">{{ mem.title }}</h4>
              <p class="memory-card__desc">{{ mem.description }}</p>
              <div class="memory-card__footer">
                <span class="memory-card__date">📅 {{ mem.date }}</span>
                <div class="memory-card__ops">
                  <button class="op-btn" @click="openEdit(mem)">✏️</button>
                  <button class="op-btn op-btn--danger" @click="handleDelete(mem.id)">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <Transition name="modal">
      <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
        <div class="modal-card glass-card">
          <div class="modal-header">
            <h3>{{ editingMemory.id ? '编辑记忆' : '添加新记忆' }}</h3>
            <button class="modal-close" @click="showForm = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">标题 *</label>
              <input v-model="editingMemory.title" class="form-input" placeholder="这个记忆叫什么？" />
            </div>
            <div class="form-group">
              <label class="form-label">描述</label>
              <textarea v-model="editingMemory.description" class="form-textarea" rows="3" placeholder="记录这个特别时刻..."/>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">日期</label><input v-model="editingMemory.date" class="form-input" type="date" /></div>
              <div class="form-group"><label class="form-label">类型</label>
                <select v-model="editingMemory.type" class="form-select">
                  <option value="photo">相册</option><option value="milestone">里程碑</option><option value="wish">心愿</option><option value="diary">日记</option>
                </select>
              </div>
              <div class="form-group"><label class="form-label">情感</label>
                <select v-model="editingMemory.emotion" class="form-select">
                  <option v-for="(label, key) in emotionLabels" :key="key" :value="key">{{ label }}</option>
                </select>
              </div>
            </div>
            <div class="form-group"><label class="form-label">封面图</label>
              <div class="cover-upload" style="margin-bottom:10px">
                <label class="cover-upload-btn">
                  <span v-if="uploadingImage">上传中...</span>
                  <span v-else>📤 上传自定义图片</span>
                  <input type="file" accept="image/*" style="display:none" @change="handleImageUpload" :disabled="uploadingImage" />
                </label>
                <div v-if="editingMemory.image && !imageOptions.includes(editingMemory.image)" style="margin-top:8px;border-radius:8px;overflow:hidden;width:120px">
                  <img :src="editingMemory.image" style="width:100%;display:block" />
                </div>
              </div>
              <p style="font-size:12px;color:var(--color-text-muted);margin-bottom:8px">或选择预设图片：</p>
              <div class="image-options">
                <div v-for="img in imageOptions" :key="img"
                  :class="['img-option', { 'img-option--active': editingMemory.image === img }]"
                  @click="editingMemory.image = img">
                  <img :src="img" />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="tag" @click="showForm = false">取消</button>
            <AppButton variant="warm" :loading="saving" @click="handleSave">保存记忆</AppButton>
          </div>
        </div>
      </div>
    </Transition>
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
.memories-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
.memories-title { font-size: var(--text-2xl); font-weight: 700; color: var(--color-text-primary); }
.memories-header__right { display: flex; flex-direction: column; gap: 10px; align-items: flex-end; }
.memories-filter { display: flex; flex-wrap: wrap; gap: 8px; }
.mem-filter-btn { padding: 7px 16px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: var(--text-sm); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast); }
.mem-filter-btn:hover { border-color: #E8607A; color: #E8607A; }
.mem-filter-btn--active { background: rgba(232,96,122,.10); border-color: rgba(232,96,122,.3); color: #E8607A; font-weight: 600; }
.memories-loading { text-align: center; padding: 60px; color: var(--color-text-muted); }
.memories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.memory-card { overflow: hidden; transition: all var(--transition-base); }
.memory-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
.memory-card__cover { position: relative; aspect-ratio: 4/3; overflow: hidden; background: linear-gradient(135deg,#FFF0F5,#FFF8F0); }
.memory-card__cover img { width: 100%; height: 100%; object-fit: cover; }
.memory-card__emotion { position: absolute; top: 10px; right: 10px; padding: 3px 10px; border-radius: var(--radius-full); font-size: var(--text-xs); color: white; font-weight: 600; }
.memory-card__body { padding: 16px 18px; }
.memory-card__type { font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: 6px; }
.memory-card__title { font-size: var(--text-base); font-weight: 600; color: var(--color-text-primary); margin-bottom: 8px; }
.memory-card__desc { font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.6; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.memory-card__footer { display: flex; justify-content: space-between; align-items: center; }
.memory-card__date { font-size: var(--text-xs); color: var(--color-text-muted); }
.memory-card__ops { display: flex; gap: 4px; }
.op-btn { padding: 4px 8px; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: .8rem; cursor: pointer; transition: all var(--transition-fast); }
.op-btn:hover { border-color: var(--color-primary); }
.op-btn--danger:hover { border-color: var(--color-error); }
.couple-logout { text-align: center; padding: 0 0 60px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; }
.modal-card { width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 28px 16px; border-bottom: 1px solid var(--color-border); }
.modal-header h3 { font-size: var(--text-lg); font-weight: 700; color: var(--color-text-primary); }
.modal-close { font-size: 1.2rem; cursor: pointer; color: var(--color-text-muted); background: none; border: none; }
.modal-body { padding: 20px 28px; display: flex; flex-direction: column; gap: 16px; }
.modal-footer { padding: 16px 28px 24px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--color-border); }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.form-label { font-size: var(--text-sm); font-weight: 600; color: var(--color-text-secondary); }
.form-input, .form-textarea, .form-select { padding: 10px 12px; background: rgba(255,255,255,.5); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--color-text-primary); font-family: var(--font-sans); outline: none; width: 100%; }
.form-input:focus, .form-textarea:focus, .form-select:focus { border-color: #E8607A; }
.image-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.img-option { border-radius: var(--radius-md); overflow: hidden; cursor: pointer; border: 2px solid transparent; aspect-ratio: 4/3; transition: border-color var(--transition-fast); }
.img-option img { width: 100%; height: 100%; object-fit: cover; }
.img-option--active { border-color: #E8607A; }
.modal-enter-active, .modal-leave-active { transition: all .25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>

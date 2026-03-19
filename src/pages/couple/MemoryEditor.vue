<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useCoupleStore } from '@/stores/couple'
import AppButton from '@/components/common/AppButton.vue'
import type { CoupleMemory } from '@/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const store = useCoupleStore()

const isEdit = !!route.params.id
const loading = ref(false)
const saving = ref(false)
const imageFile = ref<File | null>(null)
const imagePreview = ref('')

const typeLabels = { photo: '相册', milestone: '里程碑', wish: '心愿', diary: '日记' }
const emotionLabels = { happy: '快乐', romantic: '浪漫', sweet: '甜蜜', funny: '搞笑' }
const imageOptions = [
  '/images/memory-1.svg', '/images/memory-2.svg', '/images/memory-3.svg',
  '/images/memory-4.svg', '/images/memory-5.svg', '/images/memory-6.svg',
]

const form = ref<Partial<CoupleMemory>>({
  title: '',
  description: '',
  image: '/images/memory-1.svg',
  date: '',
  type: 'photo',
  emotion: 'sweet',
})

const currentImage = ref('/images/memory-1.svg')

onMounted(async () => {
  if (isEdit) {
    loading.value = true
    try {
      await store.fetchMemories()
      const mem = store.memories.find(m => m.id === route.params.id)
      if (mem) {
        form.value = { ...mem }
        currentImage.value = mem.image
      } else {
        toast.error('记忆不存在')
        router.push('/couple/space')
      }
    } finally {
      loading.value = false
    }
  }
})

function handleImageSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  imageFile.value = file
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value)
  imagePreview.value = URL.createObjectURL(file)
  currentImage.value = imagePreview.value
  form.value.image = ''
}

function selectPreset(img: string) {
  form.value.image = img
  currentImage.value = img
  imageFile.value = null
  if (imagePreview.value) { URL.revokeObjectURL(imagePreview.value); imagePreview.value = '' }
}

async function handleSubmit() {
  if (!form.value.title?.trim()) { toast.error('标题不能为空'); return }
  saving.value = true
  try {
    let imageUrl = form.value.image || '/images/memory-1.svg'
    if (imageFile.value) {
      try {
        const { coupleApi } = await import('@/api')
        imageUrl = await coupleApi.uploadImage(imageFile.value)
      } catch { toast.error('图片上传失败，将使用默认图片') }
    }
    const data = { ...form.value, image: imageUrl }
    if (isEdit && route.params.id) {
      await store.update(route.params.id as string, data)
      toast.success('记忆已更新 💕')
    } else {
      await store.create(data as Omit<CoupleMemory, 'id'>)
      toast.success('记忆已创建 💕')
    }
    router.push('/couple/space')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="memory-editor-page">
    <div class="editor-header">
      <button class="back-btn" @click="router.push('/couple/space')">← 返回空间</button>
      <h2 class="editor-title">{{ isEdit ? '✏️ 编辑记忆' : '✨ 添加新记忆' }}</h2>
    </div>

    <div v-if="loading" class="editor-loading">加载中...</div>
    <div v-else class="editor-body">

      <div class="editor-main">
        <div class="form-group">
          <input v-model="form.title" class="title-input" placeholder="这个记忆叫什么？" />
        </div>
        <div class="form-group">
          <label class="form-label">描述</label>
          <textarea
            v-model="form.description"
            class="content-textarea"
            rows="8"
            placeholder="记录这个特别时刻..."
          />
        </div>
        <div class="form-group">
          <label class="form-label">封面图</label>
          <div class="cover-area">
            <div class="cover-preview">
              <img :src="currentImage" alt="封面预览" />
              <span v-if="imageFile" class="cover-badge">📤 保存时上传</span>
            </div>
            <div class="cover-right">
              <label class="upload-btn">📤 选择本地图片<input type="file" accept="image/*" style="display:none" @change="handleImageSelect" /></label>
              <p class="cover-hint">或选择预设封面：</p>
              <div class="image-options">
                <div
                  v-for="img in imageOptions" :key="img"
                  :class="['img-option', { 'img-option--active': !imageFile && form.image === img }]"
                  @click="selectPreset(img)"
                >
                  <img :src="img" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="editor-sidebar">
        <div class="sidebar-card">
          <h4 class="sidebar-card__title">记忆设置</h4>
          <div class="form-group">
            <label class="form-label">日期</label>
            <input v-model="form.date" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">类型</label>
            <select v-model="form.type" class="form-select">
              <option v-for="(label, key) in typeLabels" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">情感</label>
            <select v-model="form.emotion" class="form-select">
              <option v-for="(label, key) in emotionLabels" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <div class="sidebar-save">
            <AppButton variant="warm" :loading="saving" @click="handleSubmit" style="width:100%">
              {{ isEdit ? '保存修改' : '💕 保存记忆' }}
            </AppButton>
          </div>
        </div>
      </aside>

    </div>
  </div>
</template>

<style scoped>
.memory-editor-page { max-width: 1200px; margin: 0 auto; padding: 32px 24px 80px; }
.editor-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
.back-btn { color: var(--color-text-muted); font-size: var(--text-sm); cursor: pointer; background: none; border: none; transition: color var(--transition-fast); }
.back-btn:hover { color: #E8607A; }
.editor-title { font-size: var(--text-xl); font-weight: 700; color: var(--color-text-primary); flex: 1; }
.editor-loading { text-align: center; padding: 80px; color: var(--color-text-muted); }
.editor-body { display: grid; grid-template-columns: 1fr 280px; gap: 24px; align-items: start; }
.editor-main { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: var(--text-sm); font-weight: 600; color: var(--color-text-secondary); }
.title-input { width: 100%; padding: 14px 0; background: transparent; border: none; border-bottom: 2px solid var(--color-border); font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 700; color: var(--color-text-primary); outline: none; font-family: var(--font-sans); transition: border-color var(--transition-fast); }
.title-input:focus { border-color: #E8607A; }
.title-input::placeholder { color: var(--color-text-muted); font-weight: 400; }
.content-textarea { width: 100%; padding: 16px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); font-size: var(--text-sm); color: var(--color-text-primary); font-family: var(--font-sans); line-height: 1.8; resize: vertical; outline: none; transition: border-color var(--transition-fast); }
.content-textarea:focus { border-color: #E8607A; }
.content-textarea::placeholder { color: var(--color-text-muted); }
.cover-area { display: grid; grid-template-columns: 200px 1fr; gap: 20px; }
.cover-preview { position: relative; border-radius: var(--radius-lg); overflow: hidden; aspect-ratio: 4/3; background: var(--color-bg-glass); }
.cover-preview img { width: 100%; height: 100%; object-fit: cover; }
.cover-badge { position: absolute; bottom: 8px; left: 8px; background: rgba(232,96,122,.85); color: white; font-size: 11px; padding: 3px 8px; border-radius: var(--radius-full); }
.cover-right { display: flex; flex-direction: column; gap: 8px; }
.upload-btn { display: block; text-align: center; padding: 8px 14px; border-radius: var(--radius-lg); border: 1.5px dashed var(--color-border); background: var(--color-bg-glass); font-size: var(--text-xs); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast); }
.upload-btn:hover { border-color: #E8607A; color: #E8607A; }
.cover-hint { font-size: 11px; color: var(--color-text-muted); }
.image-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.img-option { border-radius: var(--radius-md); overflow: hidden; cursor: pointer; border: 2px solid transparent; aspect-ratio: 4/3; transition: border-color var(--transition-fast); }
.img-option img { width: 100%; height: 100%; object-fit: cover; }
.img-option--active { border-color: #E8607A; }
.sidebar-card { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 20px; display: flex; flex-direction: column; gap: 16px; position: sticky; top: 80px; }
.sidebar-card__title { font-size: var(--text-base); font-weight: 600; color: var(--color-text-primary); padding-bottom: 12px; border-bottom: 1px solid var(--color-border); }
.form-input, .form-select { padding: 9px 13px; background: var(--color-bg-glass); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--color-text-primary); outline: none; width: 100%; font-family: var(--font-sans); transition: border-color var(--transition-fast); }
.form-input:focus, .form-select:focus { border-color: #E8607A; }
.sidebar-save { padding-top: 12px; border-top: 1px solid var(--color-border); }
@media (max-width: 900px) { .editor-body { grid-template-columns: 1fr; } .cover-area { grid-template-columns: 1fr; } }
</style>

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

const MAX_IMAGES = 20
const imageFiles = ref<File[]>([])
const imagePreviews = ref<string[]>([])
const selectedIndex = ref(0)
// 用对象来追踪每个预览：{ isNew: boolean, url: string, file?: File }
const imageMetadata = ref<Array<{ isNew: boolean; url: string; file?: File }>>([])

const typeLabels = { photo: '相册', milestone: '里程碑', wish: '心愿', diary: '日记' }
const emotionLabels = { happy: '快乐', romantic: '浪漫', sweet: '甜蜜', funny: '搞笑' }

const form = ref<Partial<CoupleMemory>>({
  title: '',
  description: '',
  image: '',
  date: new Date().toISOString().slice(0, 10),
  type: 'photo',
  emotion: 'sweet',
})

onMounted(async () => {
  if (isEdit) {
    loading.value = true
    try {
      await store.fetchMemories()
      const mem = store.memories.find(m => m.id === route.params.id)
      if (mem) {
        form.value = { ...mem }
        if (mem.images && mem.images.length > 0) {
          imagePreviews.value = [...mem.images]
          imageMetadata.value = mem.images.map(url => ({ isNew: false, url }))
          selectedIndex.value = 0
        } else if (mem.image) {
          imagePreviews.value = [mem.image]
          imageMetadata.value = [{ isNew: false, url: mem.image }]
        }
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
  const files = Array.from((e.target as HTMLInputElement).files || [])
  if (!files.length) return
  const remaining = MAX_IMAGES - imagePreviews.value.length
  if (remaining <= 0) { toast.warning(`最多上传 ${MAX_IMAGES} 张图片`); return }
  const toAdd = files.slice(0, remaining)
  if (files.length > remaining) toast.warning(`已达上限，只添加了前 ${remaining} 张`)
  
  for (const file of toAdd) {
    const url = URL.createObjectURL(file)
    imagePreviews.value.push(url)
    imageMetadata.value.push({ isNew: true, url, file })
  }
  
  selectedIndex.value = imagePreviews.value.length - 1
  ;(e.target as HTMLInputElement).value = ''
}

function removeImage(idx: number) {
  URL.revokeObjectURL(imagePreviews.value[idx])
  imagePreviews.value.splice(idx, 1)
  imageMetadata.value.splice(idx, 1)
  if (selectedIndex.value >= imagePreviews.value.length) {
    selectedIndex.value = Math.max(0, imagePreviews.value.length - 1)
  }
}

async function handleSubmit() {
  if (!form.value.title?.trim()) { toast.error('标题不能为空'); return }
  saving.value = true
  try {
    const { coupleApi } = await import('@/api')
    const allImageUrls: string[] = []
    
    // 处理所有图片
    for (let i = 0; i < imageMetadata.value.length; i++) {
      const meta = imageMetadata.value[i]
      if (meta.isNew && meta.file) {
        // 新上传的图片，需要上传
        try {
          const url = await coupleApi.uploadImage(meta.file)
          allImageUrls.push(url)
        } catch (err) {
          toast.error(`第 ${i + 1} 张图片上传失败`)
          console.error('Upload error:', err)
          return
        }
      } else {
        // 已存在的图片URL，直接保留
        allImageUrls.push(meta.url)
      }
    }
    
    // 设置封面图
    const imageUrl = allImageUrls[selectedIndex.value] || allImageUrls[0] || ''
    
    const data = { ...form.value, image: imageUrl, images: allImageUrls }
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
    console.error('Submit error:', e)
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
          <label class="form-label">封面图 <span class="form-hint">（最多 {{ MAX_IMAGES }} 张，点击缩略图设为封面）</span></label>
          <div class="cover-area">
            <div class="cover-preview">
              <img v-if="imagePreviews.length" :src="imagePreviews[selectedIndex]" alt="封面预览" />
              <div v-else class="cover-empty">暂无图片</div>
            </div>
            <div class="cover-right">
              <label class="upload-btn">
                📷 选择图片（可多选）
                <input type="file" accept="image/*" multiple style="display:none" @change="handleImageSelect" />
              </label>
              <p class="cover-hint">已选 {{ imagePreviews.length }} / {{ MAX_IMAGES }} 张</p>
              <div v-if="imagePreviews.length" class="thumb-grid">
                <div
                  v-for="(src, idx) in imagePreviews" :key="idx"
                  :class="['thumb-item', { 'thumb-item--active': selectedIndex === idx }]"
                  @click="selectedIndex = idx"
                >
                  <img :src="src" />
                  <button class="thumb-remove" @click.stop="removeImage(idx)">✕</button>
                  <span v-if="selectedIndex === idx" class="thumb-cover-badge">封面</span>
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
.form-hint { font-weight: 400; color: var(--color-text-muted); font-size: 11px; }
.title-input { width: 100%; padding: 14px 0; background: transparent; border: none; border-bottom: 2px solid var(--color-border); font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 700; color: var(--color-text-primary); outline: none; font-family: var(--font-sans); transition: border-color var(--transition-fast); }
.title-input:focus { border-color: #E8607A; }
.title-input::placeholder { color: var(--color-text-muted); font-weight: 400; }
.content-textarea { width: 100%; padding: 16px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); font-size: var(--text-sm); color: var(--color-text-primary); font-family: var(--font-sans); line-height: 1.8; resize: vertical; outline: none; transition: border-color var(--transition-fast); }
.content-textarea:focus { border-color: #E8607A; }
.content-textarea::placeholder { color: var(--color-text-muted); }
.cover-area { display: grid; grid-template-columns: 220px 1fr; gap: 20px; }
.cover-preview { position: relative; border-radius: var(--radius-lg); overflow: hidden; aspect-ratio: 4/3; background: var(--color-bg-glass); border: 1px solid var(--color-border); }
.cover-preview img { width: 100%; height: 100%; object-fit: cover; }
.cover-empty { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--color-text-muted); font-size: var(--text-sm); }
.cover-right { display: flex; flex-direction: column; gap: 10px; }
.upload-btn { display: block; text-align: center; padding: 10px 14px; border-radius: var(--radius-lg); border: 1.5px dashed var(--color-border); background: var(--color-bg-glass); font-size: var(--text-sm); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast); }
.upload-btn:hover { border-color: #E8607A; color: #E8607A; }
.cover-hint { font-size: 11px; color: var(--color-text-muted); }
.thumb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 8px; }
.thumb-item { position: relative; border-radius: var(--radius-md); overflow: hidden; aspect-ratio: 1; cursor: pointer; border: 2px solid transparent; transition: border-color var(--transition-fast); background: var(--color-bg-glass); }
.thumb-item img { width: 100%; height: 100%; object-fit: cover; }
.thumb-item--active { border-color: #E8607A; }
.thumb-remove { position: absolute; top: 3px; right: 3px; width: 18px; height: 18px; border-radius: 50%; background: rgba(0,0,0,0.6); color: white; border: none; cursor: pointer; font-size: 10px; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity var(--transition-fast); }
.thumb-item:hover .thumb-remove { opacity: 1; }
.thumb-cover-badge { position: absolute; bottom: 3px; left: 3px; background: rgba(232,96,122,.9); color: white; font-size: 9px; padding: 2px 5px; border-radius: var(--radius-full); }
.sidebar-card { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 20px; display: flex; flex-direction: column; gap: 16px; position: sticky; top: 80px; }
.sidebar-card__title { font-size: var(--text-base); font-weight: 600; color: var(--color-text-primary); padding-bottom: 12px; border-bottom: 1px solid var(--color-border); }
.form-input, .form-select { padding: 9px 13px; background: var(--color-bg-glass); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--color-text-primary); outline: none; width: 100%; font-family: var(--font-sans); transition: border-color var(--transition-fast); }
.form-input:focus, .form-select:focus { border-color: #E8607A; }
.sidebar-save { padding-top: 12px; border-top: 1px solid var(--color-border); }
@media (max-width: 900px) { .editor-body { grid-template-columns: 1fr; } .cover-area { grid-template-columns: 1fr; } }
</style>

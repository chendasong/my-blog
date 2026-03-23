<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useCoupleStore } from '@/stores/couple'
import AppButton from '@/components/common/AppButton.vue'
import type { CoupleMemory } from '@/types'
import { captureVideoFrameAsJpegBlob } from '@/lib/videoCapture'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const store = useCoupleStore()

const isEdit = !!route.params.id
const loading = ref(false)
const saving = ref(false)

const MAX_IMAGES = 20
const MAX_VIDEOS = 8
const imagePreviews = ref<string[]>([])
const selectedIndex = ref(0)
const imageMetadata = ref<Array<{ isNew: boolean; url: string; file?: File }>>([])
const deletedImageUrls = ref<string[]>([])

const videoPreviews = ref<string[]>([])
const videoMetadata = ref<
  Array<{ isNew: boolean; url: string; file?: File; posterUrl?: string }>
>([])
const deletedVideoUrls = ref<string[]>([])
const deletedVideoPosterUrls = ref<string[]>([])

const videoViewerOpen = ref(false)
const videoViewerIndex = ref(0)
const modalVideoRef = ref<HTMLVideoElement | null>(null)
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

function openVideoViewer(idx: number) {
  if (idx < 0 || idx >= videoPreviews.value.length) return
  videoViewerIndex.value = idx
  videoViewerOpen.value = true
  void nextTick(() => {
    modalVideoRef.value?.play().catch(() => {})
  })
}

function closeVideoViewer() {
  videoViewerOpen.value = false
  modalVideoRef.value?.pause()
}

function videoViewerPrev() {
  const n = videoPreviews.value.length
  if (n <= 1) return
  videoViewerIndex.value = (videoViewerIndex.value - 1 + n) % n
  void nextTick(() => {
    modalVideoRef.value?.play().catch(() => {})
  })
}

function videoViewerNext() {
  const n = videoPreviews.value.length
  if (n <= 1) return
  videoViewerIndex.value = (videoViewerIndex.value + 1) % n
  void nextTick(() => {
    modalVideoRef.value?.play().catch(() => {})
  })
}

function onVideoViewerKeydown(e: KeyboardEvent) {
  if (!videoViewerOpen.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    closeVideoViewer()
    return
  }
  if (videoPreviews.value.length <= 1) return
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    videoViewerPrev()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    videoViewerNext()
  }
}

let videoTouchStartX = 0
function onVideoTouchStart(e: TouchEvent) {
  videoTouchStartX = e.changedTouches[0]?.screenX ?? 0
}
function onVideoTouchEnd(e: TouchEvent) {
  if (videoPreviews.value.length <= 1) return
  const x = e.changedTouches[0]?.screenX ?? videoTouchStartX
  const d = x - videoTouchStartX
  if (d < -48) videoViewerNext()
  else if (d > 48) videoViewerPrev()
}

watch(videoViewerOpen, (open) => {
  if (!open) modalVideoRef.value?.pause()
})

function onModalVideoLoaded() {
  void modalVideoRef.value?.play().catch(() => {})
}

onMounted(async () => {
  window.addEventListener('keydown', onVideoViewerKeydown)
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
        if (mem.videos && mem.videos.length > 0) {
          videoPreviews.value = [...mem.videos]
          videoMetadata.value = mem.videos.map((url, i) => ({
            isNew: false,
            url,
            posterUrl: mem.videoPosters?.[i],
          }))
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

onUnmounted(() => {
  window.removeEventListener('keydown', onVideoViewerKeydown)
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

function handleVideoSelect(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files || [])
  if (!files.length) return
  const remaining = MAX_VIDEOS - videoPreviews.value.length
  if (remaining <= 0) { toast.warning(`最多上传 ${MAX_VIDEOS} 个视频`); return }
  const toAdd = files.slice(0, remaining)
  if (files.length > remaining) toast.warning(`已达上限，只添加了前 ${remaining} 个`)
  for (const file of toAdd) {
    if (!file.type.startsWith('video/')) {
      toast.warning('请只选择视频文件')
      continue
    }
    const url = URL.createObjectURL(file)
    videoPreviews.value.push(url)
    videoMetadata.value.push({ isNew: true, url, file })
  }
  ;(e.target as HTMLInputElement).value = ''
}

function removeVideo(idx: number) {
  const meta = videoMetadata.value[idx]
  if (!meta.isNew && meta.url) deletedVideoUrls.value.push(meta.url)
  if (!meta.isNew && meta.posterUrl?.trim()) {
    deletedVideoPosterUrls.value.push(meta.posterUrl.trim())
  }
  URL.revokeObjectURL(videoPreviews.value[idx])
  videoPreviews.value.splice(idx, 1)
  videoMetadata.value.splice(idx, 1)
  if (videoViewerOpen.value) {
    if (videoPreviews.value.length === 0) closeVideoViewer()
    else if (videoViewerIndex.value >= videoPreviews.value.length)
      videoViewerIndex.value = videoPreviews.value.length - 1
  }
}

function removeImage(idx: number) {
  const meta = imageMetadata.value[idx]
  // 如果是已存在的图片（不是新上传的），记录为删除
  if (!meta.isNew && meta.url) {
    deletedImageUrls.value.push(meta.url)
  }
  
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
    for (let i = 0; i < imageMetadata.value.length; i++) {
      const meta = imageMetadata.value[i]
      if (meta.isNew && meta.file) {
        try {
          const url = await coupleApi.uploadImage(meta.file, 'love')
          allImageUrls.push(url)
        } catch (err) {
          toast.error(`第 ${i + 1} 张图片上传失败`)
          console.error('Upload error:', err)
          return
        }
      } else {
        allImageUrls.push(meta.url)
      }
    }

    const allVideoUrls: string[] = []
    const allVideoPosterUrls: string[] = []
    for (let i = 0; i < videoMetadata.value.length; i++) {
      const meta = videoMetadata.value[i]
      let posterUrl = (meta.posterUrl || '').trim()
      if (meta.isNew && meta.file) {
        try {
          const url = await coupleApi.uploadImage(meta.file, 'love-video')
          allVideoUrls.push(url)
          try {
            const jpeg = await captureVideoFrameAsJpegBlob(meta.file)
            const posterFile = new File([jpeg], 'poster.jpg', {
              type: 'image/jpeg',
            })
            posterUrl = await coupleApi.uploadImage(
              posterFile,
              'love-video-poster',
            )
          } catch (capErr) {
            console.warn('[memory] 视频封面截取失败，列表将用视频首帧兜底', capErr)
            posterUrl = ''
          }
          allVideoPosterUrls.push(posterUrl)
        } catch (err) {
          toast.error(`第 ${i + 1} 个视频上传失败`)
          console.error('Video upload error:', err)
          return
        }
      } else {
        allVideoUrls.push(meta.url)
        allVideoPosterUrls.push(posterUrl)
      }
    }

    const imageUrl =
      allImageUrls.length > 0
        ? allImageUrls[Math.min(selectedIndex.value, allImageUrls.length - 1)] || allImageUrls[0]
        : ''

    const data = {
      ...form.value,
      image: imageUrl,
      images: allImageUrls,
      videos: allVideoUrls,
      videoPosters: allVideoUrls.length ? allVideoPosterUrls : undefined,
    }
    if (isEdit && route.params.id) {
      await store.update(route.params.id as string, data)
      
      if (deletedImageUrls.value.length > 0) {
        await coupleApi.deleteFiles(deletedImageUrls.value)
        deletedImageUrls.value = []
      }
      if (deletedVideoUrls.value.length > 0) {
        await coupleApi.deleteFiles(deletedVideoUrls.value)
        deletedVideoUrls.value = []
      }
      if (deletedVideoPosterUrls.value.length > 0) {
        await coupleApi.deleteFiles(deletedVideoPosterUrls.value)
        deletedVideoPosterUrls.value = []
      }
      
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
          <label class="form-label">图片 <span class="form-hint">（最多 {{ MAX_IMAGES }} 张，点击缩略图设为封面）</span></label>
          <div class="thumb-grid">
            <div
              v-for="(src, idx) in imagePreviews"
              :key="idx"
              :class="['thumb-item', { 'thumb-item--active': selectedIndex === idx }]"
              @click="selectedIndex = idx"
            >
              <img :src="src" alt="" />
              <button type="button" class="thumb-remove" @click.stop="removeImage(idx)">✕</button>
              <span v-if="selectedIndex === idx" class="thumb-cover-badge">封面</span>
            </div>
            <label v-if="imagePreviews.length < MAX_IMAGES" class="thumb-add">
              <span class="thumb-add__icon" aria-hidden="true">📷</span>
              <span class="thumb-add__text">添加</span>
              <input type="file" accept="image/*" multiple class="thumb-add__input" @change="handleImageSelect" />
            </label>
          </div>
          <p class="cover-hint">已选 {{ imagePreviews.length }} / {{ MAX_IMAGES }} 张</p>
        </div>
        <div class="form-group">
          <label class="form-label">视频 <span class="form-hint">（最多 {{ MAX_VIDEOS }} 个；点击缩略图全屏播放，左右键或滑动切换）</span></label>
          <div class="thumb-grid thumb-grid--video">
            <div
              v-for="(src, idx) in videoPreviews"
              :key="'v' + idx + src"
              class="thumb-item thumb-item--video"
              role="button"
              tabindex="0"
              :aria-label="`全屏播放第 ${idx + 1} 个视频`"
              @click="openVideoViewer(idx)"
              @keydown.enter.prevent="openVideoViewer(idx)"
              @keydown.space.prevent="openVideoViewer(idx)"
            >
              <video
                :src="src"
                class="thumb-item__video"
                muted
                playsinline
                preload="metadata"
                disablePictureInPicture
                controlsList="nodownload noremoteplayback noplaybackrate"
                tabindex="-1"
              />
              <span class="thumb-item__video-play-hint" aria-hidden="true">▶</span>
              <button type="button" class="thumb-remove" @click.stop="removeVideo(idx)">✕</button>
            </div>
            <label v-if="videoPreviews.length < MAX_VIDEOS" class="thumb-add thumb-add--video">
              <span class="thumb-add__icon" aria-hidden="true">🎬</span>
              <span class="thumb-add__text">添加</span>
              <input type="file" accept="video/*" multiple class="thumb-add__input" @change="handleVideoSelect" />
            </label>
          </div>
          <p class="cover-hint">已选 {{ videoPreviews.length }} / {{ MAX_VIDEOS }} 个</p>
        </div>
      </div>

      <transition name="ve-fade">
        <div
          v-if="videoViewerOpen && videoPreviews.length"
          class="video-viewer"
          role="dialog"
          aria-modal="true"
          aria-label="视频全屏预览"
          @click.self="closeVideoViewer"
        >
          <div
            class="video-viewer__panel"
            @touchstart.passive="onVideoTouchStart"
            @touchend.passive="onVideoTouchEnd"
          >
            <button type="button" class="video-viewer__close" aria-label="关闭" @click="closeVideoViewer">✕</button>
            <div v-if="videoPreviews.length > 1" class="video-viewer__count">
              {{ videoViewerIndex + 1 }} / {{ videoPreviews.length }}
            </div>
            <video
              :key="videoViewerIndex"
              ref="modalVideoRef"
              class="video-viewer__video"
              :src="videoPreviews[videoViewerIndex]"
              controls
              playsinline
              preload="metadata"
              @loadeddata="onModalVideoLoaded"
            />
            <template v-if="videoPreviews.length > 1">
              <button type="button" class="video-viewer__nav video-viewer__nav--prev" aria-label="上一个" @click="videoViewerPrev">‹</button>
              <button type="button" class="video-viewer__nav video-viewer__nav--next" aria-label="下一个" @click="videoViewerNext">›</button>
            </template>
            <p v-if="videoPreviews.length > 1" class="video-viewer__hint">← → 切换 · 左右滑动 · Esc 关闭</p>
          </div>
        </div>
      </transition>

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
.cover-hint { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }
.thumb-grid { display: grid; grid-template-columns: repeat(auto-fill, 88px); gap: 10px; justify-content: start; }
.thumb-item { position: relative; border-radius: var(--radius-md); overflow: hidden; aspect-ratio: 1; width: 88px; cursor: pointer; border: 2px solid transparent; transition: border-color var(--transition-fast); background: var(--color-bg-glass); }
.thumb-add {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 88px;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  border: 1.5px dashed var(--color-border);
  background: var(--color-bg-glass);
  cursor: pointer;
  transition: border-color var(--transition-fast), color var(--transition-fast);
  flex-shrink: 0;
}
.thumb-add:hover { border-color: #E8607A; color: #E8607A; }
.thumb-add__icon { font-size: 1.35rem; line-height: 1; }
.thumb-add__text { font-size: 10px; font-weight: 600; color: var(--color-text-muted); }
.thumb-add:hover .thumb-add__text { color: #E8607A; }
.thumb-add__input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; font-size: 0; }
.thumb-item img { width: 100%; height: 100%; object-fit: cover; }
.thumb-item--active { border-color: #E8607A; }
.thumb-remove { position: absolute; top: 3px; right: 3px; z-index: 2; width: 18px; height: 18px; border-radius: 50%; background: rgba(0,0,0,0.6); color: white; border: none; cursor: pointer; font-size: 10px; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity var(--transition-fast); }
.thumb-item:hover .thumb-remove { opacity: 1; }
.thumb-cover-badge { position: absolute; bottom: 3px; left: 3px; background: rgba(232,96,122,.9); color: white; font-size: 9px; padding: 2px 5px; border-radius: var(--radius-full); }
.thumb-grid--video { margin-top: 0; }
.thumb-item--video {
  cursor: pointer;
  outline: none;
  border-color: rgba(139, 111, 240, 0.22);
  background: #0f0f12;
}
.thumb-item--video:hover { border-color: rgba(139, 111, 240, 0.5); }
.thumb-item--video:focus-visible { box-shadow: 0 0 0 2px rgba(139, 111, 240, 0.5); }
.thumb-item__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  vertical-align: middle;
  pointer-events: none;
}
.thumb-item__video-play-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  font-size: 1.6rem;
  line-height: 1;
  padding-left: 0.2em;
  color: rgba(255, 255, 255, 0.96);
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.55);
  background: rgba(0, 0, 0, 0.18);
  border-radius: inherit;
}
.thumb-item--video:hover .thumb-item__video-play-hint,
.thumb-item--video:focus-visible .thumb-item__video-play-hint {
  opacity: 1;
}
.video-viewer {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.video-viewer__panel {
  position: relative;
  width: 100%;
  max-width: min(960px, 100%);
  max-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.video-viewer__video {
  width: 100%;
  max-height: min(78vh, calc(100vh - 120px));
  border-radius: var(--radius-lg);
  background: #000;
  vertical-align: middle;
}
.video-viewer__close {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 3;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}
.video-viewer__close:hover { background: rgba(255, 255, 255, 0.28); }
.video-viewer__count {
  position: absolute;
  top: -8px;
  left: -8px;
  z-index: 3;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.55);
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.video-viewer__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}
.video-viewer__nav:hover { background: rgba(255, 255, 255, 0.26); }
.video-viewer__nav--prev { left: 8px; }
.video-viewer__nav--next { right: 8px; }
.video-viewer__hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  text-align: center;
}
.ve-fade-enter-active,
.ve-fade-leave-active { transition: opacity 0.2s ease; }
.ve-fade-enter-from,
.ve-fade-leave-to { opacity: 0; }
@media (max-width: 520px) {
  .video-viewer__nav { width: 38px; height: 38px; font-size: 1.5rem; }
  .video-viewer__nav--prev { left: 4px; }
  .video-viewer__nav--next { right: 4px; }
}
.thumb-add--video:hover { border-color: #8b6ff0; color: #8b6ff0; }
.thumb-add--video:hover .thumb-add__text { color: #8b6ff0; }
.sidebar-card { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 20px; display: flex; flex-direction: column; gap: 16px; position: sticky; top: 80px; }
.sidebar-card__title { font-size: var(--text-base); font-weight: 600; color: var(--color-text-primary); padding-bottom: 12px; border-bottom: 1px solid var(--color-border); }
.form-input, .form-select { padding: 9px 13px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--color-text-primary); outline: none; width: 100%; font-family: var(--font-sans); transition: border-color var(--transition-fast); }
.form-input { background: var(--color-bg-glass); }
.form-select { background-color: var(--color-bg-glass); }
.form-input:focus, .form-select:focus { border-color: #E8607A; }
.sidebar-save { padding-top: 12px; border-top: 1px solid var(--color-border); }
@media (max-width: 900px) { .editor-body { grid-template-columns: 1fr; } }
</style>

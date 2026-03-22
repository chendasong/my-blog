<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useRoute, useRouter } from 'vue-router'
import { articleApi, uploadImage } from '@/api'
import { generateImages } from '@/api/siliconflow'
import { categories, AI_IMAGE_STYLES, DEFAULT_AI_IMAGE_STYLE_ID, getAiImageStyleById, buildCoverImagePrompt } from '@/data'
import AppButton from '@/components/common/AppButton.vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const isEdit = !!route.params.id

const loading = ref(false)
const saving = ref(false)
const generatingCovers = ref(false)
const coverImageStyleId = ref(DEFAULT_AI_IMAGE_STYLE_ID)

// 封面状态独立管理，互不干扰
// uploadedCover: 本地预览 URL（未上传）
const uploadedFile = ref<File | null>(null)        // 待上传的文件
const uploadedPreview = ref('')                  // 本地预览 URL
const generatedCovers = ref<string[]>([])          // AI 生成的图 (远程 URL)
const selectedUpload = ref('')                   // 当前选中的自定义图
const selectedAI = ref('')                       // 当前选中的 AI 图
// activeSource: 'upload' | 'ai' | '' - 最后操作的来源
const activeSource = ref<'upload' | 'ai' | ''>('')

const form = ref({
  title: '',
  summary: '',
  content: '',
  category: '技术',
  tags: '',
  cover: '',
  author: '晨光',
  featured: false,
})

onMounted(async () => {
  if (isEdit) {
    loading.value = true
    try {
      const article = await articleApi.getById(route.params.id as string)
      form.value = {
        title: article.title,
        summary: article.summary,
        content: article.content,
        category: article.category,
        tags: article.tags.join(', '),
        cover: article.cover,
        author: article.author,
        featured: article.featured,
      }
    } finally {
      loading.value = false
    }
  }
})

function handleCoverUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadedFile.value = file
  // 本地预览，不上传服务器
  if (uploadedPreview.value) URL.revokeObjectURL(uploadedPreview.value)
  uploadedPreview.value = URL.createObjectURL(file)
  selectedUpload.value = uploadedPreview.value
  activeSource.value = 'upload'
  toast.success('图片已选择，发布后自动上传')
}

async function handleGenerateCovers() {
  if (!form.value.title.trim()) {
    toast.warning('请先输入文章标题')
    return
  }
  generatingCovers.value = true
  generatedCovers.value = []
  try {
    const style = getAiImageStyleById(coverImageStyleId.value) || AI_IMAGE_STYLES[0]
    const prompt = buildCoverImagePrompt(form.value.title.trim(), style)
    generatedCovers.value = await generateImages(prompt, 3)
    if (generatedCovers.value.length > 0) {
      selectedAI.value = generatedCovers.value[0]
      activeSource.value = 'ai'
    }
    toast.success('封面生成成功，已自动选中')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'AI生成失败')
  } finally {
    generatingCovers.value = false
  }
}

// 得到最终封面：优先取最后操作来源的图
function getActiveCover(): string {
  if (activeSource.value === 'upload') return selectedUpload.value
  if (activeSource.value === 'ai') return selectedAI.value
  return form.value.cover
}

async function handleSubmit() {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    toast.error('标题和内容不能为空')
    return
  }
  saving.value = true
  try {
    let coverUrl = getActiveCover()
    // 如果有本地上传的文件，且封面选的是自定义图，现在才上传
    if (uploadedFile.value && activeSource.value === 'upload') {
      try {
        coverUrl = await uploadImage(uploadedFile.value)
      } catch {
        toast.error('封面上传失败，将使用旧封面')
        coverUrl = form.value.cover
      }
    }
    const now = dayjs().format('YYYY-MM-DD')
    const data = {
      ...form.value,
      cover: coverUrl,
      tags: form.value.tags.split(',').map(t => t.trim()).filter(Boolean),
      publishedAt: now,
      updatedAt: now,
      views: 0,
      likes: 0,
      comments: 0,
    }
    if (isEdit) {
      await articleApi.update(route.params.id as string, { ...data, updatedAt: now })
    } else {
      await articleApi.create(data)
    }
    router.push('/blog')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="article-editor">
    <div class="editor-header">
      <button class="back-btn" @click="router.push('/blog')">← 返回列表</button>
      <h2 class="editor-title">{{ isEdit ? '编辑文章' : '写新文章' }}</h2>
    </div>
    <div v-if="loading" class="editor-loading">加载中...</div>
    <div v-else class="editor-body">
      <div class="editor-main">
        <div class="form-group">
          <input v-model="form.title" class="title-input" placeholder="文章标题..." />
        </div>
        <div class="form-group">
          <label class="form-label">摘要 <span class="form-hint">（不填则自动截取正文）</span></label>
          <textarea v-model="form.summary" class="form-textarea" rows="2" placeholder="输入文章摘要..." />
        </div>
        <div class="form-group">
          <label class="form-label">正文内容 * <span class="form-hint">（支持 Markdown）</span></label>
          <textarea v-model="form.content" class="content-textarea" rows="24"
            placeholder="开始写文章...&#10;&#10;支持 Markdown 格式：&#10;## 标题&#10;- 列表项&#10;- [ ] 待办事项&#10;**加粗** *斜体* `代码`&#10;&#10;&gt; 引用文本" />
        </div>
      </div>
      <aside class="editor-sidebar">
        <div class="sidebar-card">
          <h4 class="sidebar-card__title">文章设置</h4>
          <div class="form-group">
            <label class="form-label">分类</label>
            <select v-model="form.category" class="form-select">
              <option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">标签 <span class="form-hint">（逗号分隔）</span></label>
            <input v-model="form.tags" class="form-input" placeholder="Vue3, TypeScript, 前端" />
          </div>
          <div class="form-group">
            <label class="form-label">封面图</label>
            <div class="select-with-label cover-style-row">
              <span class="select-with-label__text">生图风格</span>
              <select v-model="coverImageStyleId" class="form-select form-select--inline" :disabled="generatingCovers">
                <option v-for="s in AI_IMAGE_STYLES" :key="s.id" :value="s.id">{{ s.label }}</option>
              </select>
            </div>
            <div class="cover-actions">
              <label class="cover-btn">
                <span v-if="saving">上传中...</span>
                <span v-else>📤 自定义上传</span>
                <input type="file" accept="image/*" style="display:none" @change="handleCoverUpload" />
              </label>
              <button class="cover-btn cover-btn--ai" :disabled="generatingCovers || !form.title"
                @click="handleGenerateCovers">
                <span v-if="generatingCovers">✨ 生成中...</span>
                <span v-else>✨ AI 生成封面</span>
              </button>
            </div>
            <div v-if="generatingCovers" class="cover-generating">
              <div class="cover-gen-dots"><span /><span /><span /></div>
              <p>AI 正在生成封面图...</p>
            </div>
            <div v-if="uploadedPreview" class="cover-section">
              <p class="cover-section__label">📤 自定义上传</p>
              <div :class="['cover-option', { 'cover-option--active': activeSource === 'upload' }]"
                @click="activeSource = 'upload'; selectedUpload = uploadedPreview">
                <img :src="uploadedPreview" alt="自定义封面" />
                <span class="cover-option__label">{{ activeSource === 'upload' ? '✓ 已选择' : '点击选择' }}</span>
              </div>
            </div>
            <div v-if="generatedCovers.length" class="cover-section">
              <p class="cover-section__label">✨ AI 生成</p>
              <div class="cover-grid">
                <div v-for="(url, i) in generatedCovers" :key="i"
                  :class="['cover-option', { 'cover-option--active': activeSource === 'ai' && selectedAI === url }]"
                  @click="selectedAI = url; activeSource = 'ai'">
                  <img :src="url" :alt="'AI封面' + (i + 1)" />
                  <span class="cover-option__label">{{ activeSource === 'ai' && selectedAI === url ? '✓ 已选择' : '方案 ' +
                    (i+1) }}</span>
                </div>
              </div>
            </div>
            <div v-if="form.cover && !uploadedPreview" class="cover-current">
              <p class="cover-section__label">当前封面</p>
              <img :src="form.cover" alt="封面预览" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label-check">
              <input v-model="form.featured" type="checkbox" />
              <span>设为精选文章</span>
            </label>
          </div>
          <div class="sidebar-save">
            <AppButton :loading="saving" @click="handleSubmit" style="width:100%">{{ isEdit ? '保存修改' : '📢 发布文章' }}
            </AppButton>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.article-editor {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.back-btn {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  cursor: pointer;
  background: none;
  border: none;
  transition: color var(--transition-fast);
}

.back-btn:hover {
  color: var(--color-primary);
}

.editor-title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  flex: 1;
}

.editor-loading {
  text-align: center;
  padding: 80px;
  color: var(--color-text-muted);
}

.editor-body {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  align-items: start;
}

.editor-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text-secondary);
}

.form-hint {
  font-weight: 400;
  color: var(--color-text-muted);
}

.title-input {
  width: 100%;
  padding: 14px 0;
  background: transparent;
  border: none;
  border-bottom: 2px solid var(--color-border);
  font-size: clamp(1.4rem, 3vw, 2rem);
  font-weight: 700;
  color: var(--color-text-primary);
  outline: none;
  font-family: var(--font-sans);
  transition: border-color var(--transition-fast);
}

.title-input:focus {
  border-color: var(--color-primary);
}

.title-input::placeholder {
  color: var(--color-text-muted);
  font-weight: 400;
}

.form-textarea,
.form-input,
.form-select {
  padding: 11px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  outline: none;
  transition: border-color var(--transition-fast);
  width: 100%;
}

.form-textarea,
.form-input {
  background: var(--color-bg-card);
}

.form-select {
  background-color: var(--color-bg-card);
}

.form-select--inline {
  width: auto;
  min-width: 11rem;
  max-width: 260px;
}

.form-textarea:focus,
.form-input:focus,
.form-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(91, 138, 240, 0.10);
}

.form-textarea {
  resize: vertical;
  line-height: 1.6;
}

.content-textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(91, 138, 240, 0.10);
}

.content-textarea {
  width: 100%;
  padding: 16px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  line-height: 1.8;
  resize: vertical;
  outline: none;
  transition: border-color var(--transition-fast);
}

.form-label-check {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.sidebar-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 80px;
}

.sidebar-card__title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.sidebar-save {
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.cover-actions {
  display: flex;
  gap: 8px;
}

.cover-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1.5px dashed var(--color-border);
  background: var(--color-bg-glass);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.cover-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.cover-btn--ai {
  border-style: solid;
  background: rgba(91, 138, 240, 0.06);
  color: var(--color-primary);
  border-color: rgba(91, 138, 240, 0.3);
}

.cover-btn--ai:hover:not(:disabled) {
  background: rgba(91, 138, 240, 0.12);
}

.cover-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cover-generating {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: var(--text-xs);
}

.cover-gen-dots {
  display: flex;
  gap: 5px;
}

.cover-gen-dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: bounce 1.2s ease-in-out infinite;
}

.cover-gen-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.cover-gen-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {

  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5
  }

  40% {
    transform: scale(1.2);
    opacity: 1
  }
}

.cover-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-top: 8px;
}

.cover-option {
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color var(--transition-fast);
  position: relative;
}

.cover-option img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  display: block;
}

.cover-option__label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 11px;
  padding: 3px;
}

.cover-option--active {
  border-color: var(--color-primary);
}

.cover-current {
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-top: 8px;
}

.cover-current img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  display: block;
}

@media (max-width: 900px) {
  .editor-body {
    grid-template-columns: 1fr;
  }
}

.cover-section__label {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
  font-weight: 600;
}

.cover-section {
  margin-top: 10px;
}

.cover-style-row {
  margin-bottom: 4px;
}
</style>

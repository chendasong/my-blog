<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { articleApi, uploadImage } from '@/api'
import { categories } from '@/data'
import AppButton from '@/components/common/AppButton.vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const isEdit = !!route.params.id

const loading = ref(false)
const saving = ref(false)

const form = ref({
  title: '',
  summary: '',
  content: '',
  category: '技术',
  tags: '',
  cover: '/images/article-1.svg',
  author: '晨光',
  featured: false,
})

const coverOptions = [
  '/images/article-1.svg',
  '/images/article-2.svg',
  '/images/article-3.svg',
  '/images/article-4.svg',
  '/images/article-5.svg',
  '/images/article-6.svg',
]

const uploadingCover = ref(false)
async function handleCoverUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadingCover.value = true
  try {
    form.value.cover = await uploadImage(file)
  } catch {
    alert('图片上传失败，请重试')
  } finally {
    uploadingCover.value = false
  }
}

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

async function handleSubmit() {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    alert('标题和内容不能为空')
    return
  }
  saving.value = true
  try {
    const now = dayjs().format('YYYY-MM-DD')
    const data = {
      ...form.value,
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
      <AppButton :loading="saving" @click="handleSubmit">{{ isEdit ? '保存修改' : '发布文章' }}</AppButton>
    </div>

    <div v-if="loading" class="editor-loading">加载中...</div>
    <div v-else class="editor-body">
      <div class="editor-main">
        <div class="form-group">
          <label class="form-label">文章标题 *</label>
          <input v-model="form.title" class="form-input" placeholder="输入文章标题..." />
        </div>
        <div class="form-group">
          <label class="form-label">摘要</label>
          <textarea v-model="form.summary" class="form-textarea" rows="3" placeholder="输入文章摘要，不填则自动截取正文..."/>
        </div>
        <div class="form-group">
          <label class="form-label">正文内容 * <span class="form-hint">（支持 Markdown）</span></label>
          <textarea v-model="form.content" class="form-textarea form-textarea--content" rows="20" placeholder="# 文章标题&#10;&#10;开始写作..."/>
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
            <div class="cover-upload">
              <label class="cover-upload-btn">
                <span v-if="uploadingCover">上传中...</span>
                <span v-else>📤 上传自定义封面</span>
                <input type="file" accept="image/*" style="display:none" @change="handleCoverUpload" :disabled="uploadingCover" />
              </label>
              <div v-if="form.cover && !coverOptions.includes(form.cover)" class="cover-preview">
                <img :src="form.cover" alt="封面预览" />
              </div>
            </div>
            <p class="form-hint" style="margin-top:8px">或选择预设封面：</p>
            <div class="cover-options">
              <div
                v-for="cover in coverOptions"
                :key="cover"
                :class="['cover-option', { 'cover-option--active': form.cover === cover }]"
                @click="form.cover = cover"
              >
                <img :src="cover" :alt="cover" />
              </div>
            </div>
          </div>
          <div class="form-group form-group--checkbox">
            <label class="form-label-check">
              <input v-model="form.featured" type="checkbox" />
              <span>设为精选文章</span>
            </label>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.article-editor { max-width: 1200px; margin: 0 auto; padding: 32px 24px 80px; }
.editor-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; flex-wrap: wrap; }
.back-btn { color: var(--color-text-muted); font-size: var(--text-sm); cursor: pointer; transition: color var(--transition-fast); }
.back-btn:hover { color: var(--color-primary); }
.editor-title { font-size: var(--text-xl); font-weight: 700; color: var(--color-text-primary); flex: 1; }
.editor-loading { text-align: center; padding: 80px; color: var(--color-text-muted); }
.editor-body { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start; }
.editor-main { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group--checkbox { flex-direction: row; align-items: center; }
.form-label { font-size: var(--text-sm); font-weight: 600; color: var(--color-text-secondary); }
.form-hint { font-weight: 400; color: var(--color-text-muted); }
.form-input, .form-textarea, .form-select { padding: 11px 14px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); font-size: var(--text-sm); color: var(--color-text-primary); font-family: var(--font-sans); outline: none; transition: border-color var(--transition-fast); width: 100%; }
.form-input:focus, .form-textarea:focus, .form-select:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(91,138,240,0.10); }
.form-textarea { resize: vertical; line-height: 1.6; }
.form-textarea--content { font-family: var(--font-mono); font-size: var(--text-sm); }
.form-label-check { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: var(--text-sm); color: var(--color-text-secondary); }
.editor-sidebar {}
.sidebar-card { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 20px; display: flex; flex-direction: column; gap: 16px; position: sticky; top: 80px; }
.sidebar-card__title { font-size: var(--text-base); font-weight: 600; color: var(--color-text-primary); margin-bottom: 4px; }
.cover-upload { display: flex; flex-direction: column; gap: 8px; }
.cover-upload-btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 18px; border-radius: var(--radius-full); border: 1.5px dashed var(--color-border); background: var(--color-bg-glass); font-size: var(--text-sm); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast); }
.cover-upload-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.cover-preview { width: 120px; border-radius: var(--radius-md); overflow: hidden; }
.cover-preview img { width: 100%; display: block; }
.cover-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.cover-option { border-radius: var(--radius-md); overflow: hidden; cursor: pointer; border: 2px solid transparent; transition: border-color var(--transition-fast); aspect-ratio: 16/9; }
.cover-option img { width: 100%; height: 100%; object-fit: cover; }
.cover-option--active { border-color: var(--color-primary); }
@media (max-width: 900px) { .editor-body { grid-template-columns: 1fr; } }
</style>

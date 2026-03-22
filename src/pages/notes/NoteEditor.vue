<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useNoteStore } from '@/stores/note'
import { noteApi } from '@/api/notes'
import AppButton from '@/components/common/AppButton.vue'
import type { NoteCategory } from '@/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const store = useNoteStore()

const isEdit = !!route.params.id
const loading = ref(false)
const saving = ref(false)

const colorOptions = ['#6C8EBF', '#82B366', '#D6B656', '#9673A6', '#B85450', '#4CAF82']
const categoryLabels: Record<string, string> = {
  work: '工作', life: '生活', study: '学习', idea: '想法', todo: '待办',
}

const form = ref({
  title: '',
  content: '',
  category: 'idea' as NoteCategory,
  tags: '',
  color: '#6C8EBF',
  pinned: false,
})

onMounted(async () => {
  if (isEdit) {
    loading.value = true
    try {
      const note = await noteApi.getById(route.params.id as string)
      form.value = {
        title: note.title,
        content: note.content,
        category: note.category,
        tags: note.tags.join(', '),
        color: note.color,
        pinned: note.pinned,
      }
    } catch {
      toast.error('笔记不存在或加载失败')
      router.push('/notes')
    } finally {
      loading.value = false
    }
  }
})

async function handleSubmit() {
  if (!form.value.title.trim()) {
    toast.error('标题不能为空')
    return
  }
  saving.value = true
  try {
    const data = {
      ...form.value,
      tags: form.value.tags.split(',').map(t => t.trim()).filter(Boolean),
    }
    if (isEdit) {
      await store.update(route.params.id as string, data)
      toast.success('笔记已更新')
    } else {
      await store.create(data as any)
      toast.success('笔记已创建')
    }
    router.push('/notes')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="note-editor-page">
    <div class="editor-header">
      <button class="back-btn" @click="router.push('/notes')">← 返回笔记</button>
      <h2 class="editor-title">{{ isEdit ? '编辑笔记' : '新建笔记' }}</h2>
      </div>

    <div v-if="loading" class="editor-loading">加载中...</div>
    <div v-else class="editor-body">
      <div class="editor-main">
        <div class="form-group">
          <input
            v-model="form.title"
            class="title-input"
            placeholder="笔记标题..."
          />
        </div>
        <div class="form-group">
          <label class="form-label">正文内容 <span class="form-hint">（支持 Markdown）</span></label>
          <textarea
            v-model="form.content"
            class="content-textarea"
            rows="24"
            placeholder="开始写笔记...&#10;&#10;支持 Markdown 格式：&#10;## 标题&#10;- 列表项&#10;- [ ] 待办事项&#10;**加粗** `代码`"
          />
        </div>
      </div>

      <aside class="editor-sidebar">
        <div class="sidebar-card">
          <h4 class="sidebar-card__title">笔记设置</h4>

          <div class="form-group">
            <label class="form-label">分类</label>
            <select v-model="form.category" class="form-select">
              <option v-for="(label, key) in categoryLabels" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">标签 <span class="form-hint">（逗号分隔）</span></label>
            <input v-model="form.tags" class="form-input" placeholder="工作, 计划, 2024" />
          </div>

          <div class="form-group">
            <label class="form-label">卡片颜色</label>
            <div class="color-picker">
              <button
                v-for="c in colorOptions" :key="c"
                class="color-dot"
                :style="{ background: c, outline: form.color === c ? `3px solid ${c}` : 'none', outlineOffset: '3px' }"
                @click="form.color = c"
              />
            </div>
            <div class="color-preview" :style="{ borderLeftColor: form.color }">
              <span>{{ form.title || '笔记标题预览' }}</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label-check">
              <input v-model="form.pinned" type="checkbox" />
              <span>📌 置顶笔记</span>
            </label>
          </div>
          <div class="sidebar-save">
            <AppButton :loading="saving" @click="handleSubmit" style="width:100%">{{ isEdit ? '保存修改' : '📝 创建笔记' }}</AppButton>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.note-editor-page { max-width: 1200px; margin: 0 auto; padding: 32px 24px 80px; }
.editor-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; flex-wrap: wrap; }
.back-btn { color: var(--color-text-muted); font-size: var(--text-sm); cursor: pointer; background: none; border: none; transition: color var(--transition-fast); }
.back-btn:hover { color: var(--color-primary); }
.editor-title { font-size: var(--text-xl); font-weight: 700; color: var(--color-text-primary); flex: 1; }
.editor-loading { text-align: center; padding: 80px; color: var(--color-text-muted); }
.editor-body { display: grid; grid-template-columns: 1fr 280px; gap: 24px; align-items: start; }
.editor-main { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: var(--text-sm); font-weight: 600; color: var(--color-text-secondary); }
.form-hint { font-weight: 400; color: var(--color-text-muted); }
.title-input { width: 100%; padding: 14px 0; background: transparent; border: none; border-bottom: 2px solid var(--color-border); font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 700; color: var(--color-text-primary); outline: none; font-family: var(--font-sans); transition: border-color var(--transition-fast); }
.title-input:focus { border-color: var(--color-primary); }
.title-input::placeholder { color: var(--color-text-muted); font-weight: 400; }
.content-textarea { width: 100%; padding: 16px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); font-size: var(--text-sm); color: var(--color-text-primary); font-family: var(--font-mono); line-height: 1.8; resize: vertical; outline: none; transition: border-color var(--transition-fast); }
.content-textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(91,138,240,0.10); }
.content-textarea::placeholder { color: var(--color-text-muted); }
.sidebar-card { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 20px; display: flex; flex-direction: column; gap: 16px; position: sticky; top: 80px; }
.sidebar-card__title { font-size: var(--text-base); font-weight: 600; color: var(--color-text-primary); margin-bottom: 4px; }
.form-input, .form-select { padding: 9px 13px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--color-text-primary); outline: none; width: 100%; font-family: var(--font-sans); transition: border-color var(--transition-fast); }
.form-input { background: var(--color-bg-glass); }
.form-select { background-color: var(--color-bg-glass); }
.form-input:focus, .form-select:focus { border-color: var(--color-primary); }
.color-picker { display: flex; gap: 10px; flex-wrap: wrap; }
.color-dot { width: 24px; height: 24px; border-radius: 50%; border: none; cursor: pointer; transition: transform var(--transition-fast); }
.color-dot:hover { transform: scale(1.2); }
.color-preview { border-left: 4px solid #6C8EBF; padding: 10px 14px; background: var(--color-bg-glass); border-radius: var(--radius-md); margin-top: 8px; font-size: var(--text-sm); font-weight: 600; color: var(--color-text-primary); transition: border-color var(--transition-fast); }
.form-label-check { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: var(--text-sm); color: var(--color-text-secondary); }
@media (max-width: 900px) { .editor-body { grid-template-columns: 1fr; } }

.sidebar-save { margin-top: 4px; padding-top: 12px; border-top: 1px solid var(--color-border); }
</style>

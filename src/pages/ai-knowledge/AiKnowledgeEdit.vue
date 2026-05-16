<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAiKnowledgeStore } from '@/stores/aiKnowledge'
import { useToast } from '@/composables/useToast'
import AppButton from '@/components/common/AppButton.vue'
import DocumentBodyEditor from '@/components/editor/DocumentBodyEditor.vue'
import { isRichTextEmpty, ensureArticleBodyHtml } from '@/lib/articleContent'
import { noteContentToEditorHtml } from '@/lib/noteHtml'

const route = useRoute()
const router = useRouter()
const store = useAiKnowledgeStore()
const toast = useToast()

const isNew = computed(() => route.name === 'ai-knowledge-new')
const articleId = computed(() => (route.params.articleId as string) || '')

const title = ref('')
const content = ref('')
const folderId = ref('')
const saving = ref(false)

function pickDefaultFolder() {
  const q = route.query.folderId as string | undefined
  if (q && store.folderById(q)) return q
  return store.folders[0]?.id ?? ''
}

function goBack() {
  if (!isNew.value && articleId.value) {
    router.push({ name: 'ai-knowledge-article', params: { articleId: articleId.value } })
    return
  }
  const first = store.firstArticleId()
  if (first) router.push({ name: 'ai-knowledge-article', params: { articleId: first } })
  else router.push({ name: 'ai-knowledge-index' })
}

watch(
  () => [isNew.value, articleId.value, route.query.folderId, store.folders.length] as const,
  async () => {
    await store.ensureLibraryLoaded()
    if (isNew.value) {
      folderId.value = pickDefaultFolder()
      title.value = ''
      content.value = ''
      return
    }
    const id = articleId.value
    if (!id) return
    try {
      await store.ensureArticleContent(id)
    } catch {
      return
    }
    const a = store.getArticle(id)
    if (a) {
      title.value = a.title
      content.value = noteContentToEditorHtml(a.content)
      folderId.value = a.folderId
    }
  },
  { immediate: true },
)

onMounted(() => {
  void store.ensureLibraryLoaded()
})

async function handleSubmit() {
  if (!title.value.trim()) {
    toast.error('标题不能为空')
    return
  }
  if (isRichTextEmpty(content.value)) {
    toast.error('正文不能为空')
    return
  }
  if (!folderId.value) {
    toast.error('请先创建至少一个目录')
    return
  }
  const bodyHtml = ensureArticleBodyHtml(content.value)
  saving.value = true
  try {
    if (isNew.value) {
      const id = await store.addArticle(folderId.value, title.value.trim(), bodyHtml)
      if (id) {
        toast.success('文章已创建')
        await router.replace({ name: 'ai-knowledge-article', params: { articleId: id } })
      }
    } else {
      await store.updateArticle({
        id: articleId.value,
        title: title.value.trim(),
        content: bodyHtml,
        folderId: folderId.value,
      })
      toast.success('文章已更新')
      await router.push({ name: 'ai-knowledge-article', params: { articleId: articleId.value } })
    }
  } catch (e) {
    toast.error(e instanceof Error ? e.message : String(e))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="note-editor-page">
    <div class="editor-header">
      <button type="button" class="back-btn" @click="goBack">← 返回知识库</button>
      <h2 class="editor-title">{{ isNew ? '新建文章' : '编辑文章' }}</h2>
    </div>

    <div class="editor-body">
      <div class="editor-main">
        <div class="form-group">
          <input v-model="title" class="title-input" type="text" placeholder="文章标题..." />
        </div>
        <div class="form-group">
          <label class="form-label">正文内容 <span class="form-hint">（与笔记相同文档编辑器）</span></label>
          <DocumentBodyEditor
            v-model="content"
            enable-task-list
            placeholder="用工具栏设置标题、列表、待办勾选等，无需记格式…"
          />
        </div>
      </div>

      <aside class="editor-sidebar">
        <div class="sidebar-card">
          <h4 class="sidebar-card__title">知识库设置</h4>

          <div class="form-group">
            <label class="form-label">所属目录</label>
            <select v-model="folderId" class="form-select" :disabled="!store.folders.length">
              <option v-for="f in store.folders" :key="f.id" :value="f.id">
                {{ f.icon || '📁' }} {{ f.title }}
              </option>
            </select>
            <p v-if="!store.folders.length" class="form-empty-hint">请先在知识库左侧新建目录</p>
          </div>

          <div class="sidebar-save">
            <AppButton :loading="saving" style="width: 100%" @click="handleSubmit">
              {{ isNew ? '📝 创建文章' : '保存修改' }}
            </AppButton>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.note-editor-page {
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
  margin: 0;
}
.editor-body {
  display: grid;
  grid-template-columns: 1fr 280px;
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
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}
.form-hint {
  font-weight: 400;
  color: var(--color-text-muted);
}
.form-empty-hint {
  margin: 4px 0 0;
  font-size: var(--text-xs);
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
.form-select {
  padding: 9px 13px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  outline: none;
  width: 100%;
  font-family: var(--font-sans);
  transition: border-color var(--transition-fast);
  background-color: var(--color-bg-glass);
}
.form-select:focus {
  border-color: var(--color-primary);
}
.form-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.sidebar-save {
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}
@media (max-width: 900px) {
  .editor-body {
    grid-template-columns: 1fr;
  }
}
</style>

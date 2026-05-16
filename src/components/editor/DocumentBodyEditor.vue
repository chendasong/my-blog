<script setup lang="ts">
import type { Extensions } from '@tiptap/core'
import { ref, onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { uploadImage } from '@/api'
import { useToast } from '@/composables/useToast'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    /** 为 true 时启用可勾选任务列表（笔记等）；博客保持默认 false */
    enableTaskList?: boolean
    /** 图片上传路径前缀 */
    imageUploadPrefix?: string
  }>(),
  { 
    enableTaskList: false,
    imageUploadPrefix: 'editor',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const toast = useToast()
const uploadingImage = ref(false)
const imageInputRef = ref<HTMLInputElement | null>(null)

function buildExtensions(): Extensions {
  const exts: Extensions = [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      bulletList: { keepMarks: true, keepAttributes: false },
      orderedList: { keepMarks: true, keepAttributes: false },
      paragraph: { HTMLAttributes: { class: 'doc-p' } },
    }),
  ]
  if (props.enableTaskList) {
    exts.push(
      TaskList.configure({
        HTMLAttributes: { class: 'doc-task-list' },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: { class: 'doc-task-item' },
      }),
    )
  }
  exts.push(
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
    }),
    Image.configure({
      allowBase64: false,
      HTMLAttributes: {
        class: 'editor-image',
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder ?? '输入正文，支持标题、列表、引用、加粗等…',
    }),
  )
  return exts
}

const editor = useEditor({
  content: props.modelValue || '',
  extensions: buildExtensions(),
  editorProps: {
    attributes: {
      class: 'document-body-editor__pm',
    },
  },
  onUpdate: ({ editor: ed }) => {
    emit('update:modelValue', ed.getHTML())
  },
})

watch(
  () => props.modelValue,
  (html) => {
    const ed = editor.value
    if (!ed || ed.isDestroyed) return
    const cur = ed.getHTML()
    if (html === cur) return
    ed.commands.setContent(html || '')
  },
)

function setLink() {
  const ed = editor.value
  if (!ed) return
  const prev = ed.getAttributes('link').href as string | undefined
  const url = window.prompt('链接地址（留空则移除链接）', prev || 'https://')
  if (url === null) return
  if (url.trim() === '') {
    ed.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  ed.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
}

function triggerImageUpload() {
  imageInputRef.value?.click()
}

async function handleImageUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    toast.error('请选择图片文件')
    return
  }
  
  // 验证文件大小 (最大 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('图片大小不能超过 5MB')
    return
  }
  
  uploadingImage.value = true
  try {
    const imageUrl = await uploadImage(file, props.imageUploadPrefix)
    insertImage(imageUrl)
    toast.success('图片插入成功')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '图片上传失败')
  } finally {
    uploadingImage.value = false
    // 清空 input 以便可以再次选择同一文件
    if (imageInputRef.value) {
      imageInputRef.value.value = ''
    }
  }
}

function insertImage(url: string) {
  const ed = editor.value
  if (!ed) return
  ed.chain().focus().setImage({ src: url }).run()
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="document-body-editor" :class="{ 'document-body-editor--tasks': enableTaskList }">
    <!-- 隐藏的图片上传 input -->
    <input
      ref="imageInputRef"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleImageUpload"
    />
    
    <div v-if="editor" class="document-body-editor__toolbar" role="toolbar" aria-label="正文格式">
      <div class="document-body-editor__toolbar-group">
        <button
          type="button"
          class="document-body-editor__btn"
          :class="{ 'document-body-editor__btn--on': editor.isActive('heading', { level: 1 }) }"
          title="标题 1"
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        >
          H1
        </button>
        <button
          type="button"
          class="document-body-editor__btn"
          :class="{ 'document-body-editor__btn--on': editor.isActive('heading', { level: 2 }) }"
          title="标题 2"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        >
          H2
        </button>
        <button
          type="button"
          class="document-body-editor__btn"
          :class="{ 'document-body-editor__btn--on': editor.isActive('heading', { level: 3 }) }"
          title="标题 3"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        >
          H3
        </button>
        <button
          type="button"
          class="document-body-editor__btn"
          :class="{ 'document-body-editor__btn--on': editor.isActive('paragraph') }"
          title="正文"
          @click="editor.chain().focus().setParagraph().run()"
        >
          正文
        </button>
      </div>
      <span class="document-body-editor__sep" aria-hidden="true" />
      <div class="document-body-editor__toolbar-group">
        <button
          type="button"
          class="document-body-editor__btn"
          :class="{ 'document-body-editor__btn--on': editor.isActive('bold') }"
          title="加粗"
          @click="editor.chain().focus().toggleBold().run()"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          class="document-body-editor__btn"
          :class="{ 'document-body-editor__btn--on': editor.isActive('italic') }"
          title="斜体"
          @click="editor.chain().focus().toggleItalic().run()"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          class="document-body-editor__btn"
          :class="{ 'document-body-editor__btn--on': editor.isActive('underline') }"
          title="下划线"
          @click="editor.chain().focus().toggleUnderline().run()"
        >
          <span class="document-body-editor__u">U</span>
        </button>
        <button
          type="button"
          class="document-body-editor__btn"
          :class="{ 'document-body-editor__btn--on': editor.isActive('strike') }"
          title="删除线"
          @click="editor.chain().focus().toggleStrike().run()"
        >
          S
        </button>
        <button
          type="button"
          class="document-body-editor__btn"
          :class="{ 'document-body-editor__btn--on': editor.isActive('code') }"
          title="行内代码"
          @click="editor.chain().focus().toggleCode().run()"
        >
          &lt;/&gt;
        </button>
      </div>
      <span class="document-body-editor__sep" aria-hidden="true" />
      <div class="document-body-editor__toolbar-group">
        <button
          type="button"
          class="document-body-editor__btn"
          :class="{ 'document-body-editor__btn--on': editor.isActive('bulletList') }"
          title="无序列表"
          @click="editor.chain().focus().toggleBulletList().run()"
        >
          • 列表
        </button>
        <button
          type="button"
          class="document-body-editor__btn"
          :class="{ 'document-body-editor__btn--on': editor.isActive('orderedList') }"
          title="有序列表"
          @click="editor.chain().focus().toggleOrderedList().run()"
        >
          1. 列表
        </button>
        <button
          v-if="enableTaskList"
          type="button"
          class="document-body-editor__btn"
          :class="{ 'document-body-editor__btn--on': editor.isActive('taskList') }"
          title="待办勾选列表"
          @click="editor.chain().focus().toggleTaskList().run()"
        >
          待办
        </button>
        <button
          type="button"
          class="document-body-editor__btn"
          :class="{ 'document-body-editor__btn--on': editor.isActive('blockquote') }"
          title="引用"
          @click="editor.chain().focus().toggleBlockquote().run()"
        >
          引用
        </button>
        <button
          type="button"
          class="document-body-editor__btn"
          :class="{ 'document-body-editor__btn--on': editor.isActive('codeBlock') }"
          title="代码块"
          @click="editor.chain().focus().toggleCodeBlock().run()"
        >
          代码块
        </button>
      </div>
      <span class="document-body-editor__sep" aria-hidden="true" />
      <div class="document-body-editor__toolbar-group">
        <button 
          type="button" 
          class="document-body-editor__btn" 
          :class="{ 'document-body-editor__btn--on': editor.isActive('image') }"
          :disabled="uploadingImage"
          title="插入图片"
          @click="triggerImageUpload"
        >
          <span v-if="uploadingImage">⏳</span>
          <span v-else>🖼️</span>
          图片
        </button>
        <button type="button" class="document-body-editor__btn" title="分隔线" @click="editor.chain().focus().setHorizontalRule().run()">
          ─
        </button>
        <button
          type="button"
          class="document-body-editor__btn"
          :class="{ 'document-body-editor__btn--on': editor.isActive('link') }"
          title="链接"
          @click="setLink"
        >
          链接
        </button>
        <button type="button" class="document-body-editor__btn" title="撤销" @click="editor.chain().focus().undo().run()">
          撤销
        </button>
        <button type="button" class="document-body-editor__btn" title="重做" @click="editor.chain().focus().redo().run()">
          重做
        </button>
      </div>
    </div>
    <div class="document-body-editor__sheet">
      <EditorContent :editor="editor" class="document-body-editor__content" />
    </div>
  </div>
</template>

<style scoped>
.document-body-editor {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
  overflow: hidden;
  box-shadow: 0 1px 2px color-mix(in srgb, var(--color-text-primary) 6%, transparent);
}

.document-body-editor__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 4px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--color-bg-glass) 85%, var(--color-bg-card));
  border-bottom: 1px solid var(--color-border);
}

.document-body-editor__toolbar-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.document-body-editor__sep {
  width: 1px;
  height: 22px;
  background: var(--color-border);
  margin: 0 4px;
  flex-shrink: 0;
}

.document-body-editor__btn {
  padding: 6px 10px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  background: transparent;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
  font-family: var(--font-sans);
}

.document-body-editor__btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  color: var(--color-text-primary);
}

.document-body-editor__btn--on {
  background: color-mix(in srgb, var(--color-primary) 14%, transparent);
  color: var(--color-primary);
  border-color: color-mix(in srgb, var(--color-primary) 35%, transparent);
}

.document-body-editor__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.document-body-editor__u {
  text-decoration: underline;
}

.document-body-editor__sheet {
  min-height: 420px;
  max-height: min(70vh, 720px);
  overflow-y: auto;
  background: var(--color-bg-card);
}

.document-body-editor__content {
  padding: 28px 32px 48px;
}
</style>

<style>
/* 无 scoped：ProseMirror 由 TipTap 挂载，与全局 .prose 共用 --doc-* 令牌 */
.document-body-editor .document-body-editor__pm {
  outline: none;
  min-height: 360px;
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--doc-body-line-height);
  color: var(--color-text-primary);
}

.document-body-editor .document-body-editor__pm p.is-empty::before {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
  color: var(--color-text-muted);
}

.document-body-editor .document-body-editor__pm h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: var(--doc-heading-margin-top-1) 0 var(--doc-heading-margin-bottom);
  line-height: 1.3;
}

.document-body-editor .document-body-editor__pm h2 {
  font-size: 1.35rem;
  font-weight: 700;
  margin: var(--doc-heading-margin-top-2) 0 var(--doc-heading-margin-bottom);
  line-height: 1.35;
}

.document-body-editor .document-body-editor__pm h3 {
  font-size: 1.15rem;
  font-weight: 600;
  margin: var(--doc-heading-margin-top-3) 0 var(--doc-heading-margin-bottom);
}

.document-body-editor .document-body-editor__pm h1:first-child,
.document-body-editor .document-body-editor__pm h2:first-child,
.document-body-editor .document-body-editor__pm h3:first-child {
  margin-top: 0;
}

.document-body-editor .document-body-editor__pm p {
  margin-top: 0;
  margin-bottom: var(--doc-paragraph-spacing);
}

.document-body-editor .document-body-editor__pm li > p {
  margin: var(--doc-list-item-p-margin-y) 0;
}

.document-body-editor .document-body-editor__pm li > p:first-child {
  margin-top: 0;
}

.document-body-editor .document-body-editor__pm li > p:last-child {
  margin-bottom: 0;
}

.document-body-editor .document-body-editor__pm ul,
.document-body-editor .document-body-editor__pm ol {
  margin: var(--doc-block-margin-y) 0;
  padding-left: 1.75em;
}

.document-body-editor .document-body-editor__pm ul.doc-task-list {
  list-style: none;
  padding-left: 0.25em;
}

.document-body-editor .document-body-editor__pm ul.doc-task-list li.doc-task-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5em;
}

.document-body-editor .document-body-editor__pm ul.doc-task-list li.doc-task-item > label {
  flex-shrink: 0;
  margin-top: 0.35em;
}

.document-body-editor .document-body-editor__pm ul.doc-task-list li.doc-task-item > div {
  flex: 1;
}

.document-body-editor .document-body-editor__pm blockquote {
  margin: var(--doc-block-margin-y) 0;
  padding: 0.75em 1em;
  border-left: 4px solid var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 6%, transparent);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.document-body-editor .document-body-editor__pm pre {
  margin: var(--doc-block-margin-y) 0;
  padding: 1em;
  background: color-mix(in srgb, var(--color-text-primary) 8%, transparent);
  border-radius: var(--radius-md);
  overflow-x: auto;
}

.document-body-editor .document-body-editor__pm pre code {
  background: transparent;
  padding: 0;
  font-family: var(--font-mono);
  font-size: 0.95em;
}

.document-body-editor .document-body-editor__pm code {
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  padding: 0.15em 0.35em;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.9em;
}

.document-body-editor .document-body-editor__pm a {
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.document-body-editor .document-body-editor__pm hr {
  margin: var(--doc-block-margin-y) 0;
  border: none;
  border-top: 1px solid var(--color-border-strong);
}

.document-body-editor .document-body-editor__pm strong {
  font-weight: 700;
}

.document-body-editor .document-body-editor__pm em {
  font-style: italic;
}

.document-body-editor .document-body-editor__pm s,
.document-body-editor .document-body-editor__pm del {
  text-decoration: line-through;
}

.document-body-editor .document-body-editor__pm u {
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* 图片样式 */
.document-body-editor .document-body-editor__pm .editor-image {
  max-width: 100%;
  height: auto;
  display: block;
  margin: var(--doc-block-margin-y) 0;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.document-body-editor .document-body-editor__pm .editor-image.ProseMirror-selectednode {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>

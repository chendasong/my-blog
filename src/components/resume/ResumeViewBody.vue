<script setup lang="ts">
import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { onClickOutside } from "@vueuse/core"
import { useAuthStore } from "@/stores/auth"
import { resumeApi } from "@/api"
import type { ResumeDocument } from "@/types/resume"
import AppButton from "@/components/common/AppButton.vue"
import ResumeContent from "@/components/resume/ResumeContent.vue"
import { getActiveTemplate, getTemplateById } from "@/lib/resumeDocument"

const router = useRouter()
const authStore = useAuthStore()

/** 首屏：Suspense 会等到该 Promise 完成再替换 #fallback */
const resumeDocument = ref(await resumeApi.getResume())

/** 预览首屏：与接口/组装顺序一致，固定用第一条（`resumeRowsToDocument` 里即 defaultTemplateId = created_at 最早一行） */
function initialPreviewTemplateId(doc: ResumeDocument): string {
  const tpls = doc.templates
  if (!tpls.length) return ""
  if (doc.defaultTemplateId && tpls.some((t) => t.id === doc.defaultTemplateId)) {
    return doc.defaultTemplateId
  }
  return tpls[0]!.id
}

/** 浏览页预览哪条模板（仅前端筛选，与打印 PDF 标题同源） */
const previewTemplateId = ref(initialPreviewTemplateId(resumeDocument.value))

const previewTemplate = computed(() => {
  const doc = resumeDocument.value
  const byId = getTemplateById(doc, previewTemplateId.value)
  if (byId) return byId
  return getActiveTemplate(doc)
})

const showTemplatePicker = computed(() => resumeDocument.value.templates.length > 1)

const templatePickerRoot = ref<HTMLElement | null>(null)
const templatePickerOpen = ref(false)

onClickOutside(templatePickerRoot, () => {
  templatePickerOpen.value = false
})

function pickPreviewTemplate(id: string) {
  previewTemplateId.value = id
  templatePickerOpen.value = false
}

const visibleSections = computed(() => {
  return previewTemplate.value.sections
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order)
})

/** 去掉 Windows/浏览器文件名非法字符与多余空白 */
function sanitizeFileSegment(raw: string): string {
  return raw.replace(/[/\\:*?"<>|]/g, " ").replace(/\s+/g, " ").trim()
}

/** 打印/另存为 PDF 时，系统默认文件名常取自 document.title；姓名、岗位来自基本信息区块 */
const printPdfDefaultFileBase = computed(() => {
  const sec = previewTemplate.value.sections.find((s) => s.type === "basic")
  const rawName =
    typeof sec?.content?.name === "string" ? sec.content.name.trim() : ""
  const rawTitle =
    typeof sec?.content?.title === "string" ? sec.content.title.trim() : ""
  const name = sanitizeFileSegment(rawName)
  const title = sanitizeFileSegment(rawTitle)
  if (name && title) return `${name}-${title}`
  if (name) return `${name}的简历`
  if (title) return title
  return "我的简历"
})

const handleEdit = () => {
  router.push("/resume/edit")
}

const handlePrintResume = () => {
  const prevTitle = document.title
  document.title = printPdfDefaultFileBase.value
  const restoreTitle = () => {
    document.title = prevTitle
    window.removeEventListener("afterprint", restoreTitle)
  }
  window.addEventListener("afterprint", restoreTitle)
  window.print()
}
</script>

<template>
  <div class="resume-container">
    <div class="resume-header resume-no-print">
      <AppButton v-if="authStore.isLoggedIn" variant="primary" size="sm" @click="handleEdit"
        >✏️ 编辑</AppButton
      >
      <div
        v-if="authStore.isLoggedIn && showTemplatePicker"
        ref="templatePickerRoot"
        class="resume-template-dd"
      >
        <AppButton
          variant="primary"
          size="sm"
          class="resume-template-dd__trigger"
          type="button"
          :aria-expanded="templatePickerOpen"
          aria-haspopup="listbox"
          :aria-label="`预览模板：${previewTemplate.name}`"
          @click="templatePickerOpen = !templatePickerOpen"
        >
          <span class="resume-template-dd__trigger-label">{{ previewTemplate.name }}</span>
          <span class="resume-template-dd__chevron" aria-hidden="true">▾</span>
        </AppButton>
        <ul
          v-show="templatePickerOpen"
          class="resume-template-dd__menu"
          role="listbox"
          aria-label="简历模板列表"
        >
          <li v-for="t in resumeDocument.templates" :key="t.id" role="none">
            <button
              type="button"
              role="option"
              class="resume-template-dd__option"
              :class="{ 'resume-template-dd__option--active': t.id === previewTemplateId }"
              :aria-selected="t.id === previewTemplateId"
              @click="pickPreviewTemplate(t.id)"
            >
              {{ t.name }}
            </button>
          </li>
        </ul>
      </div>
      <AppButton variant="primary" size="sm" @click="handlePrintResume"
        >🖨️ 打印 / 下载 PDF</AppButton
      >
    </div>
    <ResumeContent :key="previewTemplateId" :sections="visibleSections" />
  </div>
</template>

<style scoped>
.resume-container {
  width: 700px;
  margin: 0 auto;
}

.resume-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
  flex-wrap: wrap;
}

/* 与编辑按钮同款 primary：用 AppButton + 自定义菜单（原生 select 在 Win/Chrome 上无法稳定显示渐变） */
.resume-template-dd {
  position: relative;
}

.resume-template-dd__trigger :deep(.btn__label) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 160px;
}

.resume-template-dd__trigger-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resume-template-dd__chevron {
  flex-shrink: 0;
  font-size: 0.7em;
  opacity: 0.95;
}

.resume-template-dd__menu {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  z-index: 50;
  margin: 0;
  padding: 6px;
  min-width: 100%;
  list-style: none;
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
}

.resume-template-dd__option {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: var(--radius-md);
  text-align: left;
  font: inherit;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
}

.resume-template-dd__option:hover {
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
}

.resume-template-dd__option--active {
  color: var(--color-primary);
  font-weight: 600;
}
</style>

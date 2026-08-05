<script setup lang="ts">
/**
 * 简历公开浏览页主体。
 * 面向访客展示最终排版，支持打印/另存 PDF；登录用户可跳转编辑、切换多套模板预览。
 * 同一用户可维护多份「投递版本」（如不同公司/岗位），浏览页只选预览哪一套，不改 activeTemplateId。
 */
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

/** 首屏拉取完整简历文档（含 templates、defaultTemplateId）；父级 Suspense 会等此 Promise 再渲染正文 */
const resumeDocument = ref(await resumeApi.getResume())

/**
 * 浏览页默认预览哪套模板。
 * 优先 defaultTemplateId（数据库 created_at 最早的那行，代表「主简历」），否则取 templates[0]。
 * 与编辑页的 activeTemplateId 独立：浏览切换预览不影响编辑默认打开哪套。
 */
function initialPreviewTemplateId(doc: ResumeDocument): string {
  const tpls = doc.templates
  if (!tpls.length) return ""
  if (doc.defaultTemplateId && tpls.some((t) => t.id === doc.defaultTemplateId)) {
    return doc.defaultTemplateId
  }
  return tpls[0]!.id
}

/** 当前预览的模板 id，纯前端状态，不写回服务端 */
const previewTemplateId = ref(initialPreviewTemplateId(resumeDocument.value))

/** 解析 previewTemplateId 对应模板；id 失效时回退到 activeTemplate，避免删模板后白屏 */
const previewTemplate = computed(() => {
  const doc = resumeDocument.value
  const byId = getTemplateById(doc, previewTemplateId.value)
  if (byId) return byId
  return getActiveTemplate(doc)
})

/** 仅当存在多套模板时才展示下拉，避免单模板用户看到无意义控件 */
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

/** 只渲染 visible 区块并按 order 排序，与编辑页「隐藏模块」规则一致 */
const visibleSections = computed(() => {
  return previewTemplate.value.sections
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order)
})

/** 清洗姓名/岗位片段，供浏览器「另存为 PDF」默认文件名使用，避免非法字符导致保存失败 */
function sanitizeFileSegment(raw: string): string {
  return raw.replace(/[/\\:*?"<>|]/g, " ").replace(/\s+/g, " ").trim()
}

/**
 * 打印/下载 PDF 时的建议文件名（不含扩展名）。
 * 浏览器另存 PDF 常读 document.title；从 basic 区块取姓名与岗位，组合成「张三-前端工程师」类名称。
 */
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

/** 仅登录用户可见编辑入口，跳转编辑页继续改 activeTemplate 对应内容 */
const handleEdit = () => {
  router.push("/resume/edit")
}

/** 临时改 document.title 以影响 PDF 默认文件名，打印结束后在 afterprint 恢复站点原标题 */
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

<script setup lang="ts">
import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { resumeApi } from "@/api"
import type { ResumeSection, ResumeTemplate } from "@/types/resume"
import AppButton from "@/components/common/AppButton.vue"
import SectionModuleList from "@/components/resume/SectionModuleList.vue"
import SectionEditor from "@/components/resume/SectionEditor.vue"
import ResumeContent from "@/components/resume/ResumeContent.vue"
import ResumeTemplateTabs from "@/components/resume/ResumeTemplateTabs.vue"
import { useToast } from "@/composables/useToast"
import { useAuthStore } from "@/stores/auth"
import {
  cloneTemplatePayload,
  getActiveTemplate,
  getTemplateById,
} from "@/lib/resumeDocument"

const toast = useToast()
const router = useRouter()
const authStore = useAuthStore()
const saving = ref(false)
const templateSwitching = ref(false)
const saveAsOpen = ref(false)
const saveAsName = ref("")
const saveAsSubmitting = ref(false)
const selectedSectionId = ref<string | null>(null)

/** 首屏：Suspense 会等到该 Promise 完成再替换 #fallback */
const resumeDocument = ref(await resumeApi.getResume())
const activeTemplate = computed(() => getActiveTemplate(resumeDocument.value))

if (activeTemplate.value.sections.length) {
  selectedSectionId.value = activeTemplate.value.sections[0]!.id
}

const selectedSection = computed(() => {
  return activeTemplate.value.sections.find((s) => s.id === selectedSectionId.value)
})

const sortedSections = computed(() => {
  return activeTemplate.value.sections.slice().sort((a, b) => a.order - b.order)
})

function pickFirstSectionForActive() {
  const secs = activeTemplate.value.sections
  selectedSectionId.value = secs.length ? secs[0]!.id : null
}

const handleSectionSelect = (sectionId: string) => {
  selectedSectionId.value = sectionId
}

const handleToggleSection = (sectionId: string, visible: boolean) => {
  const section = activeTemplate.value.sections.find((s) => s.id === sectionId)
  if (section) {
    section.visible = visible
  }
}

const handleReorderSections = (newOrder: ResumeSection[]) => {
  const sections = activeTemplate.value.sections
  newOrder.forEach((section, index) => {
    const original = sections.find((s) => s.id === section.id)
    if (original) {
      original.order = index
    }
  })
}

const handleSectionUpdate = (updatedSection: ResumeSection) => {
  const sections = activeTemplate.value.sections
  const index = sections.findIndex((s) => s.id === updatedSection.id)
  if (index !== -1) {
    sections[index] = updatedSection
  }
}

const handleSave = async () => {
  try {
    saving.value = true
    resumeDocument.value.updatedAt = new Date().toISOString()
    resumeDocument.value = await resumeApi.updateResume(resumeDocument.value)
    toast.success("简历已保存")
  } catch (error) {
    console.error("Failed to save resume:", error)
    toast.error("保存失败，请重试")
  } finally {
    saving.value = false
  }
}

const handleBack = () => {
  router.push("/resume")
}

function handleTemplateSelect(id: string) {
  void handleTemplateSelectAsync(id)
}

async function handleTemplateSelectAsync(id: string) {
  if (id === resumeDocument.value.activeTemplateId) return
  if (authStore.isLoggedIn) {
    templateSwitching.value = true
    try {
      const fresh = await resumeApi.loadResumeDocumentFromDatabase()
      if (!fresh) {
        toast.error("无法从服务器加载简历")
        return
      }
      if (!getTemplateById(fresh, id)) {
        toast.error("未找到该模板")
        return
      }
      resumeDocument.value = { ...fresh, activeTemplateId: id }
      pickFirstSectionForActive()
    } catch (error) {
      console.error(error)
      toast.error("加载模板失败")
    } finally {
      templateSwitching.value = false
    }
  } else {
    resumeDocument.value.activeTemplateId = id
    pickFirstSectionForActive()
  }
}

function nextTemplateName(): string {
  const base = "新模板"
  const names = new Set(resumeDocument.value.templates.map((t) => t.name))
  if (!names.has(base)) return base
  let n = 2
  while (names.has(`${base} ${n}`)) n++
  return `${base} ${n}`
}

async function handleAddTemplate() {
  if (authStore.isLoggedIn) {
    const active = getActiveTemplate(resumeDocument.value)
    const { sections, theme } = cloneTemplatePayload(active)
    const created = await resumeApi.createTemplateRow({
      name: nextTemplateName(),
      sections,
      theme,
    })
    if (!created) {
      toast.error("新建模板失败")
      return
    }
    resumeDocument.value = await resumeApi.getResume()
    pickFirstSectionForActive()
    return
  }
  const active = getActiveTemplate(resumeDocument.value)
  const { sections, theme } = cloneTemplatePayload(active)
  const newId = crypto.randomUUID()
  const t: ResumeTemplate = {
    id: newId,
    name: nextTemplateName(),
    sections,
    theme,
  }
  resumeDocument.value.templates.push(t)
  resumeDocument.value.activeTemplateId = newId
  pickFirstSectionForActive()
}

async function handleDeleteTemplate(id: string) {
  if (id === resumeDocument.value.defaultTemplateId) {
    toast.error("默认模板不可删除")
    return
  }
  if (authStore.isLoggedIn) {
    const ok = await resumeApi.deleteTemplateRow(id)
    if (!ok) {
      toast.error("删除失败（默认模板不可删）")
      return
    }
    resumeDocument.value = await resumeApi.getResume()
    pickFirstSectionForActive()
    return
  }
  if (resumeDocument.value.templates.length <= 1) return
  const idx = resumeDocument.value.templates.findIndex((t) => t.id === id)
  if (idx === -1) return
  const wasActive = resumeDocument.value.activeTemplateId === id
  resumeDocument.value.templates.splice(idx, 1)
  if (wasActive) {
    const next = resumeDocument.value.templates[Math.max(0, idx - 1)]!
    resumeDocument.value.activeTemplateId = next.id
    pickFirstSectionForActive()
  }
}

async function handleRenameTemplate(id: string, name: string) {
  const t = resumeDocument.value.templates.find((x) => x.id === id)
  if (t) t.name = name
  if (authStore.isLoggedIn) {
    await resumeApi.updateTemplateName(id, name)
  }
}

function openSaveAs() {
  saveAsName.value = ""
  saveAsOpen.value = true
}

function closeSaveAs() {
  saveAsOpen.value = false
  saveAsName.value = ""
}

async function confirmSaveAs() {
  const name = saveAsName.value.trim()
  if (!name) {
    toast.error("请输入模板名称")
    return
  }
  try {
    saveAsSubmitting.value = true
    const active = getActiveTemplate(resumeDocument.value)
    const { sections, theme } = cloneTemplatePayload(active)
    if (authStore.isLoggedIn) {
      const created = await resumeApi.createTemplateRow({ name, sections, theme })
      if (!created) {
        toast.error("另存为失败")
        return
      }
      resumeDocument.value = await resumeApi.getResume()
      pickFirstSectionForActive()
      toast.success("已另存为新模板")
      closeSaveAs()
      return
    }
    const newId = crypto.randomUUID()
    resumeDocument.value.templates.push({
      id: newId,
      name,
      sections,
      theme,
    })
    resumeDocument.value.activeTemplateId = newId
    pickFirstSectionForActive()
    toast.success("已另存为新模板（未登录仅本地）")
    closeSaveAs()
  } catch (error) {
    console.error("Save as failed:", error)
    toast.error("另存为失败，请重试")
  } finally {
    saveAsSubmitting.value = false
  }
}
</script>

<template>
  <div class="editor-layout">
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <div class="toolbar-brand">
          <AppButton variant="ghost" @click="handleBack">← 返回</AppButton>
          <h1 class="editor-title">编辑简历</h1>
        </div>
        <ResumeTemplateTabs
          :templates="resumeDocument.templates"
          :active-template-id="resumeDocument.activeTemplateId"
          :default-template-id="resumeDocument.defaultTemplateId"
          :switching="templateSwitching"
          @select="handleTemplateSelect"
          @add="() => void handleAddTemplate()"
          @delete="(id) => void handleDeleteTemplate(id)"
          @rename="(id, name) => void handleRenameTemplate(id, name)"
        />
      </div>
      <div class="toolbar-right">
        <AppButton variant="secondary" :disabled="saving || saveAsSubmitting" @click="openSaveAs">
          另存为
        </AppButton>
        <AppButton variant="primary" :loading="saving" @click="handleSave">💾 保存</AppButton>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="saveAsOpen"
        class="save-as-overlay"
        role="presentation"
        @click.self="closeSaveAs"
      >
        <div class="save-as-dialog" role="dialog" aria-modal="true" aria-labelledby="save-as-title">
          <h2 id="save-as-title" class="save-as-dialog__title">另存为模板</h2>
          <label class="save-as-dialog__label" for="save-as-input">模板名称</label>
          <input
            id="save-as-input"
            v-model="saveAsName"
            type="text"
            class="save-as-dialog__input"
            maxlength="64"
            placeholder="例如：某公司名称"
            @keydown.enter.prevent="confirmSaveAs"
          />
          <div class="save-as-dialog__actions">
            <AppButton variant="ghost" :disabled="saveAsSubmitting" @click="closeSaveAs">
              取消
            </AppButton>
            <AppButton variant="primary" :loading="saveAsSubmitting" @click="confirmSaveAs">
              确定
            </AppButton>
          </div>
        </div>
      </div>
    </Teleport>

    <div class="editor-container">
      <div class="editor-sidebar">
        <SectionModuleList
          :sections="sortedSections"
          :selected-id="selectedSectionId"
          @select="handleSectionSelect"
          @toggle="handleToggleSection"
          @reorder="handleReorderSections"
        />
      </div>

      <div class="editor-main">
        <SectionEditor
          v-if="selectedSection"
          :section="selectedSection"
          @update="handleSectionUpdate"
        />
        <div v-else class="no-selection">选择左侧模块开始编辑</div>
      </div>
      <ResumeContent :key="resumeDocument.activeTemplateId" :sections="sortedSections" />
    </div>
  </div>
</template>

<style scoped>
.editor-layout {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}
.toolbar-brand {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}
.editor-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.save-as-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: color-mix(in srgb, var(--color-text-primary) 45%, transparent);
}

.save-as-dialog {
  width: 100%;
  max-width: 400px;
  padding: 24px;
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border);
}

.save-as-dialog__title {
  margin: 0 0 16px;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.save-as-dialog__label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.save-as-dialog__input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  margin-bottom: 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  font: inherit;
  background: var(--color-bg);
  color: var(--color-text-primary);
}

.save-as-dialog__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.save-as-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.avatar-upload-area {
  position: relative;
}
.avatar-display {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.2s ease;
}
.avatar-display:hover {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 10%, transparent);
}
.avatar-file-input {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
.avatar-placeholder {
  font-size: 1.5rem;
}
.editor-container {
  display: flex;
  gap: 16px;
  padding: 16px;
  flex: 1;
  overflow: hidden;
}
.editor-sidebar {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 16px;
  overflow-y: auto;
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  height: max-content;
  min-width: 290px;
}
.editor-main {
  flex: 1;
  min-width: 500px;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  overflow-y: auto;
  box-shadow: var(--shadow-sm);
  height:max-content;
}
.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-muted);
  text-align: center;
}
.editor-preview {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  overflow-y: auto;
  box-shadow: var(--shadow-sm);
}
@media (max-width: 1400px) {
  .editor-container {
    grid-template-columns: 240px 1fr;
  }
  .editor-preview {
    display: none;
  }
}
@media (max-width: 900px) {
  .editor-container {
    grid-template-columns: 1fr;
  }
  .editor-sidebar {
    display: none;
  }
}
</style>

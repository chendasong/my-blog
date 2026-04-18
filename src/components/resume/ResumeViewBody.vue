<script setup lang="ts">
import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import { resumeApi } from "@/api"
import AppButton from "@/components/common/AppButton.vue"
import ResumeContent from "@/components/resume/ResumeContent.vue"

const router = useRouter()
const authStore = useAuthStore()

/** 首屏：Suspense 会等到该 Promise 完成再替换 #fallback */
const resume = ref(await resumeApi.getResume())

const visibleSections = computed(() => {
  return resume.value.sections
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order)
})

/** 去掉 Windows/浏览器文件名非法字符与多余空白 */
function sanitizeFileSegment(raw: string): string {
  return raw.replace(/[/\\:*?"<>|]/g, " ").replace(/\s+/g, " ").trim()
}

/** 打印/另存为 PDF 时，系统默认文件名常取自 document.title；姓名、岗位来自基本信息区块 */
const printPdfDefaultFileBase = computed(() => {
  const sec = resume.value.sections.find((s) => s.type === "basic")
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
      <AppButton variant="primary" size="sm" @click="handlePrintResume"
        >🖨️ 打印 / 下载 PDF</AppButton
      >
    </div>
    <ResumeContent :sections="visibleSections" />
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
}
</style>

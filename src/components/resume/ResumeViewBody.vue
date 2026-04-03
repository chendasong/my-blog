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

/** 打印/另存为 PDF 时，系统默认文件名常取自 document.title */
const printPdfDefaultFileBase = computed(() => {
  const sec = resume.value.sections.find((s) => s.type === "basic")
  const raw = typeof sec?.content?.name === "string" ? sec.content.name.trim() : ""
  const safe = raw.replace(/[/\\:*?"<>|]/g, " ").replace(/\s+/g, " ").trim()
  return safe ? `${safe}的简历` : "陈大嵩的简历"
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

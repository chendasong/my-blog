<script setup lang="ts">
import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import { resumeApi } from "@/api"
import { useToast } from "@/composables/useToast"
import AppButton from "@/components/common/AppButton.vue"
import ResumeContent from "@/components/resume/ResumeContent.vue"

const toast = useToast()
const router = useRouter()
const authStore = useAuthStore()
const downloading = ref(false)

/** 首屏：Suspense 会等到该 Promise 完成再替换 #fallback */
const resume = ref(await resumeApi.getResume())

const visibleSections = computed(() => {
  return resume.value.sections
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order)
})

const handleEdit = () => {
  router.push("/resume/edit")
}

const handleDownloadPDF = async () => {
  try {
    downloading.value = true
    const contentElement = document.querySelector(".resume-content") as HTMLElement
    if (contentElement) {
      const html2pdf = (await import("html2pdf.js")).default
      const opt: any = {
        margin: 10,
        filename: `陈大嵩的简历.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      }
      html2pdf().set(opt).from(contentElement).save()
    }
  } catch (error) {
    console.error("Failed to download PDF:", error)
  } finally {
    downloading.value = false
    toast.success("下载成功")
  }
}
</script>

<template>
  <div class="resume-container">
    <div class="resume-header">
      <AppButton v-if="authStore.isLoggedIn" variant="primary" size="sm" @click="handleEdit"
        >✏️ 编辑</AppButton
      >
      <AppButton variant="secondary" size="sm" :loading="downloading" @click="handleDownloadPDF"
        >📥 下载PDF</AppButton
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

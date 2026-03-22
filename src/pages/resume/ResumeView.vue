<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import { resumeApi } from "@/api"
import { useToast } from "@/composables/useToast"
import type { Resume } from "@/types/resume"
import AppButton from "@/components/common/AppButton.vue"
import ResumeContent from "@/components/resume/ResumeContent.vue"

const toast = useToast()
const router = useRouter()
const authStore = useAuthStore()
const resume = ref<Resume | null>(null)
const loading = ref(true)
const downloading = ref(false)

const visibleSections = computed(() => {
  return resume.value?.sections.filter((s) => s.visible).sort((a, b) => a.order - b.order) || []
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

onMounted(async () => {
  try {
    resume.value = await resumeApi.getResume()
  } catch (error) {
    console.error("Failed to load resume:", error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="resume-view">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="resume" class="resume-container">
      <div class="resume-header">
        <AppButton v-if="authStore.isLoggedIn" @click="handleEdit" variant="primary" size="sm">✏️ 编辑</AppButton>
        <AppButton @click="handleDownloadPDF" :loading="downloading" variant="secondary" size="sm">📥 下载PDF</AppButton>
      </div>
      <ResumeContent :sections="visibleSections" />
    </div>
  </div>
</template>

<style scoped>
.resume-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 40px 24px
}

.loading {
  text-align: center;
  padding: 60px 24px;
  color: var(--color-text-muted)
}

.resume-container {
  width: 700px;
  margin: 0 auto
}

.resume-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px
}
</style>

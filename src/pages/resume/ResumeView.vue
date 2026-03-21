<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { resumeApi } from "@/api";
import { useToast } from "@/composables/useToast";
import type { Resume } from "@/types/resume";
import AppButton from "@/components/common/AppButton.vue";

const toast = useToast();
const router = useRouter();
const authStore = useAuthStore();
const resume = ref<Resume | null>(null);
const loading = ref(true);
const downloading = ref(false);

const visibleSections = computed(() => {
  return (
    resume.value?.sections
      .filter((s) => s.visible)
      .sort((a, b) => a.order - b.order) || []
  );
});

const handleEdit = () => {
  router.push("/resume/edit");
};

const handleDownloadPDF = async () => {
  try {
    downloading.value = true;
    const contentElement = document.querySelector(
      ".resume-content",
    ) as HTMLElement;
    if (contentElement) {
      const html2pdf = (await import("html2pdf.js")).default;
      const opt: any = {
        margin: 10,
        filename: `陈大嵩的简历.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      };
      html2pdf().set(opt).from(contentElement).save();
    }
  } catch (error) {
    console.error("Failed to download PDF:", error);
  } finally {
    downloading.value = false;
    toast.success("下载成功")
  }
};

const formatDate = (date: string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
  });
};

onMounted(async () => {
  try {
    resume.value = await resumeApi.getResume();
  } catch (error) {
    console.error("Failed to load resume:", error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="resume-view">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="resume" class="resume-container">
      <div class="resume-header">
        <AppButton
          v-if="authStore.isLoggedIn"
          @click="handleEdit"
          variant="primary"
          size="sm"
          >✏️ 编辑</AppButton
        >
        <AppButton
          @click="handleDownloadPDF"
          :loading="downloading"
          variant="secondary"
          size="sm"
          >📥 下载PDF</AppButton
        >
      </div>

      <div class="resume-content">
        <div v-for="section in visibleSections" :key="section.id">
          <div v-if="section.type === 'basic'" class="basic-section">
            <div class="basic-header">
              <div class="basic-info">
                <h2 class="name">{{ section.content.name }}</h2>
                <p class="title">{{ section.content.title }}</p>
                <div class="contact-info">
                  <span v-if="section.content.email"
                    >📧 {{ section.content.email }}</span
                  >
                  <span v-if="section.content.phone"
                    >📱 {{ section.content.phone }}</span
                  >
                  <span v-if="section.content.location"
                    >📍 {{ section.content.location }}</span
                  >
                </div>
              </div>
              <div v-if="section.content.avatar" class="basic-avatar">
                <img
                  :src="section.content.avatar"
                  :alt="section.content.name"
                />
              </div>
            </div>
            <p v-if="section.content.bio" class="bio">
              {{ section.content.bio }}
            </p>
          </div>

          <div v-else-if="section.type === 'education'" class="section">
            <h3 class="section-title">🎓 {{ section.title }}</h3>
            <div
              v-for="item in section.content.items"
              :key="item.id"
              class="section-item"
            >
              <div class="item-header">
                <h4 class="item-title">{{ item.school }}</h4>
                <span class="item-date"
                  >{{ formatDate(item.startDate) }} -
                  {{ formatDate(item.endDate) }}</span
                >
              </div>
              <p class="item-subtitle">{{ item.degree }} · {{ item.field }}</p>
              <p v-if="item.description" class="item-desc">
                {{ item.description }}
              </p>
            </div>
          </div>

          <div v-else-if="section.type === 'experience'" class="section">
            <h3 class="section-title">💼 {{ section.title }}</h3>
            <div
              v-for="item in section.content.items"
              :key="item.id"
              class="section-item"
            >
              <div class="item-header">
                <h4 class="item-title">{{ item.position }}</h4>
                <span class="item-date"
                  >{{ formatDate(item.startDate) }} -
                  {{ formatDate(item.endDate) }}</span
                >
              </div>
              <p class="item-subtitle">{{ item.company }}</p>
              <p v-if="item.description" class="item-desc">
                {{ item.description }}
              </p>
            </div>
          </div>

          <div v-else-if="section.type === 'skills'" class="section">
            <h3 class="section-title">🛠️ {{ section.title }}</h3>
            <div
              v-for="item in section.content.items"
              :key="item.id"
              class="skill-group"
            >
              <h4 class="skill-category">{{ item.category }}</h4>
              <div class="skill-tags">
                <span
                  v-for="(skill, i) in item.skills"
                  :key="i"
                  class="skill-tag"
                  >{{ skill }}</span
                >
              </div>
            </div>
          </div>

          <div v-else-if="section.type === 'projects'" class="section">
            <h3 class="section-title">🚀 {{ section.title }}</h3>
            <div
              v-for="item in section.content.items"
              :key="item.id"
              class="section-item"
            >
              <div class="item-header">
                <h4 class="item-title">{{ item.name }}</h4>
                <span v-if="item.link" class="item-link"
                  ><a :href="item.link" target="_blank">查看</a></span
                >
              </div>
              <p v-if="item.description" class="item-desc">
                {{ item.description }}
              </p>
              <div v-if="item.technologies?.length" class="tech-tags">
                <span
                  v-for="(tech, i) in item.technologies"
                  :key="i"
                  class="tech-tag"
                  >{{ tech }}</span
                >
              </div>
            </div>
          </div>

          <div v-else-if="section.type === 'awards'" class="section">
            <h3 class="section-title">🏆 {{ section.title }}</h3>
            <div
              v-for="item in section.content.items"
              :key="item.id"
              class="section-item"
            >
              <div class="item-header">
                <h4 class="item-title">{{ item.title }}</h4>
                <span class="item-date">{{ formatDate(item.date) }}</span>
              </div>
              <p class="item-subtitle">{{ item.issuer }}</p>
              <p v-if="item.description" class="item-desc">
                {{ item.description }}
              </p>
            </div>
          </div>

          <div v-else-if="section.type === 'certifications'" class="section">
            <h3 class="section-title">📜 {{ section.title }}</h3>
            <div
              v-for="item in section.content.items"
              :key="item.id"
              class="section-item"
            >
              <div class="item-header">
                <h4 class="item-title">{{ item.name }}</h4>
                <span class="item-date">{{ formatDate(item.date) }}</span>
              </div>
              <p class="item-subtitle">{{ item.issuer }}</p>
              <div v-if="item.credentialUrl" class="cert-link">
                <a :href="item.credentialUrl" target="_blank">查看凭证</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resume-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 40px 24px;
}
.loading {
  text-align: center;
  padding: 60px 24px;
  color: var(--color-text-muted);
}
.resume-container {
  max-width: 900px;
  margin: 0 auto;
}
.resume-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
}
.resume-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}
.header-actions {
  display: flex;
  gap: 12px;
}
.resume-content {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.basic-section {
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 2px solid #f0f0f0;
}
.basic-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}
.basic-info {
  flex: 1;
}
.name {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}
.title {
  font-size: 1.25rem;
  color: var(--color-primary);
  margin: 0 0 12px 0;
  font-weight: 500;
}
.contact-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.95rem;
  color: var(--color-text-secondary);
}
.basic-avatar {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}
.basic-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.bio {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin: 16px 0 0 0;
}
.section {
  margin-bottom: 28px;
}
.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--color-primary);
}
.section-item {
  margin-bottom: 16px;
}
.item-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 4px;
}
.item-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}
.item-date {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}
.item-subtitle {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin: 0 0 6px 0;
  font-weight: 500;
}
.item-desc {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
  margin: 0;
}
.item-link {
  font-size: 0.85rem;
}
.item-link a {
  color: var(--color-primary);
  text-decoration: none;
}
.item-link a:hover {
  text-decoration: underline;
}
.skill-group {
  margin-bottom: 12px;
}
.skill-category {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}
.skill-tags,
.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.skill-tag,
.tech-tag {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(91, 138, 240, 0.1);
  border: 1px solid rgba(91, 138, 240, 0.2);
  border-radius: 16px;
  font-size: 0.8rem;
  color: var(--color-primary);
  font-weight: 500;
}
.language-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}
.language-item {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.lang-name {
  font-weight: 500;
  color: var(--color-text-primary);
}
.lang-level {
  font-size: 0.85rem;
  color: var(--color-primary);
  background: rgba(91, 138, 240, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
}
.cert-link {
  margin-top: 8px;
}
.cert-link a {
  font-size: 0.85rem;
  color: var(--color-primary);
  text-decoration: none;
}
.cert-link a:hover {
  text-decoration: underline;
}
@media print {
  .resume-header {
    box-shadow: none;
    border: 1px solid #e0e0e0;
  }
  .resume-content {
    box-shadow: none;
    border: 1px solid #e0e0e0;
  }
}
@media (max-width: 768px) {
  .resume-view {
    padding: 20px 12px;
  }
  .resume-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-actions {
    width: 100%;
    margin-top: 16px;
  }
  .resume-content {
    padding: 24px;
  }
  .basic-header {
    flex-direction: column;
  }
  .basic-avatar {
    width: 100px;
    height: 100px;
  }
  .name {
    font-size: 1.5rem;
  }
  .title {
    font-size: 1rem;
  }
}
</style>

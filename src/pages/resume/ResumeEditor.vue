<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { resumeApi } from "@/api";
import type { Resume, ResumeSection } from "@/types/resume";
import AppButton from "@/components/common/AppButton.vue";
import SectionModuleList from "@/components/resume/SectionModuleList.vue";
import SectionEditor from "@/components/resume/SectionEditor.vue";
import ResumeContent from "@/components/resume/ResumeContent.vue";
import { useToast } from '@/composables/useToast'

const toast = useToast()
const router = useRouter();
const resume = ref<Resume | null>(null);
const loading = ref(true);
const saving = ref(false);
const selectedSectionId = ref<string | null>(null);

const selectedSection = computed(() => {
  return resume.value?.sections.find((s) => s.id === selectedSectionId.value);
});

const sortedSections = computed(() => {
  return resume.value?.sections.slice().sort((a, b) => a.order - b.order) || [];
});

const basicSection = computed(() => {
  return resume.value?.sections.find((s) => s.type === "basic");
});

const handleSectionSelect = (sectionId: string) => {
  selectedSectionId.value = sectionId;
};

const handleAvatarUpload = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (basicSection.value) {
        basicSection.value.content.avatar = event.target?.result as string;
      }
    };
    reader.readAsDataURL(file);
  }
};

const handleToggleSection = (sectionId: string, visible: boolean) => {
  if (!resume.value) return;
  const section = resume.value.sections.find((s) => s.id === sectionId);
  if (section) {
    section.visible = visible;
  }
};

const handleReorderSections = (newOrder: ResumeSection[]) => {
  if (!resume.value) return;
  newOrder.forEach((section, index) => {
    const original = resume.value!.sections.find((s) => s.id === section.id);
    if (original) {
      original.order = index;
    }
  });
};

const handleSectionUpdate = (updatedSection: ResumeSection) => {
  if (!resume.value) return;
  const index = resume.value.sections.findIndex(
    (s) => s.id === updatedSection.id,
  );
  if (index !== -1) {
    resume.value.sections[index] = updatedSection;
  }
};

const handleSave = async () => {
  if (!resume.value) return;
  try {
    saving.value = true;
    // 强制更新所有 section，确保获取最新数据
    resume.value= JSON.parse(JSON.stringify(resume.value));
    console.log("resume.value",resume.value);
    
    resume.value!.updatedAt = new Date().toISOString();
    await resumeApi.updateResume(resume.value!);
    toast.success("简历已保存");
  } catch (error) {
    console.error("Failed to save resume:", error);
    toast.error("保存失败，请重试");
  } finally {
    saving.value = false;
  }
};

const handleBack = () => {
  router.push("/resume");
};

onMounted(async () => {
  try {
    resume.value = await resumeApi.getResume();
    if (resume.value?.sections.length) {
      selectedSectionId.value = resume.value.sections[0].id;
    }
  } catch (error) {
    console.error("Failed to load resume:", error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="resume-editor">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="resume" class="editor-layout">
      <div class="editor-toolbar">
        <div class="toolbar-left">
          <AppButton variant="ghost" @click="handleBack">← 返回</AppButton>
          <h1 class="editor-title">编辑简历</h1>
        </div>
        <div class="toolbar-right">
          <AppButton @click="handleSave" :loading="saving" variant="primary"
            >💾 保存</AppButton
          >
        </div>
      </div>

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
        <ResumeContent :sections="sortedSections" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.resume-editor {
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
}
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: var(--color-text-muted);
}
.editor-layout {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.editor-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
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
  box-shadow: 0 0 0 2px rgba(91, 138, 240, 0.1);
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
}
.editor-main {
  flex: 1;
  min-width: 0;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  overflow-y: auto;
  box-shadow: var(--shadow-sm);
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

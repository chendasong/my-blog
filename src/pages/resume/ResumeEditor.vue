<script setup lang="ts">
import ResumeEditorBody from "@/components/resume/ResumeEditorBody.vue"
</script>

<template>
  <div class="resume-editor">
    <Suspense>
      <template #default>
        <ResumeEditorBody />
      </template>
      <template #fallback>
        <div
          class="editor-suspense-fallback"
          aria-busy="true"
          aria-label="加载简历编辑器"
        >
          <div class="editor-skeleton-toolbar">
            <div class="editor-skeleton-toolbar__left">
              <span class="editor-skeleton-pill" />
              <span class="editor-skeleton-title" />
            </div>
            <span class="editor-skeleton-pill editor-skeleton-pill--primary" />
          </div>
          <div class="editor-skeleton-main">
            <div class="editor-skeleton-sidebar">
              <div v-for="n in 6" :key="n" class="editor-skeleton-row" />
            </div>
            <div class="editor-skeleton-content">
              <div class="editor-skeleton__shine" />
              <div class="editor-skeleton-line editor-skeleton-line--wide" />
              <div class="editor-skeleton-line" />
              <div class="editor-skeleton-line" />
              <div class="editor-skeleton-line editor-skeleton-line--short" />
              <div class="editor-skeleton-panel" />
            </div>
            <div class="editor-skeleton-preview">
              <div class="editor-skeleton-line editor-skeleton-line--wide" />
              <div class="editor-skeleton-line" />
              <div class="editor-skeleton-line editor-skeleton-line--short" />
            </div>
          </div>
          <p class="editor-suspense-fallback__hint">正在加载简历数据…</p>
        </div>
      </template>
    </Suspense>
  </div>
</template>

<style scoped>
.resume-editor {
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
}

.editor-suspense-fallback {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.editor-suspense-fallback__hint {
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  padding: 16px;
}

.editor-skeleton-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.editor-skeleton-toolbar__left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.editor-skeleton-pill {
  width: 72px;
  height: 34px;
  border-radius: var(--radius-full);
  background: var(--color-border);
  opacity: 0.55;
}

.editor-skeleton-pill--primary {
  width: 88px;
  background: rgba(91, 138, 240, 0.25);
}

.editor-skeleton-title {
  width: 120px;
  height: 22px;
  border-radius: var(--radius-sm);
  background: var(--color-border);
  opacity: 0.5;
}

.editor-skeleton-main {
  display: flex;
  gap: 16px;
  padding: 16px;
  flex: 1;
  align-items: stretch;
}

.editor-skeleton-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.editor-skeleton-row {
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--color-border);
  opacity: 0.45;
}

.editor-skeleton-content {
  position: relative;
  flex: 1;
  min-width: 0;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.editor-skeleton-preview {
  width: 280px;
  flex-shrink: 0;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.editor-skeleton__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(91, 138, 240, 0.06) 50%,
    transparent 60%
  );
  background-size: 200% 100%;
  animation: editor-skeleton-shine 1.4s ease-in-out infinite;
  pointer-events: none;
}

.editor-skeleton-line {
  height: 12px;
  border-radius: var(--radius-sm);
  background: var(--color-border);
  opacity: 0.5;
  width: 70%;
}

.editor-skeleton-line--wide {
  width: 88%;
  height: 16px;
}

.editor-skeleton-line--short {
  width: 40%;
}

.editor-skeleton-panel {
  margin-top: 8px;
  flex: 1;
  min-height: 160px;
  border-radius: var(--radius-md);
  background: var(--color-border);
  opacity: 0.35;
}

@keyframes editor-skeleton-shine {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

@media (max-width: 1400px) {
  .editor-skeleton-preview {
    display: none;
  }
}

@media (max-width: 900px) {
  .editor-skeleton-sidebar {
    display: none;
  }
}
</style>

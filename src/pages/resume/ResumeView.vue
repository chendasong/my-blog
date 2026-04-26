<script setup lang="ts">
import ResumeViewBody from "@/components/resume/ResumeViewBody.vue"
import "@/assets/styles/resume-print.css"
</script>

<template>
  <div class="resume-view">
    <Suspense>
      <template #default>
        <ResumeViewBody />
      </template>
      <template #fallback>
        <div
          class="resume-suspense-fallback"
          aria-busy="true"
          aria-label="加载简历"
        >
          <p class="resume-suspense-fallback__title">正在加载简历…</p>
          <div class="resume-skeleton">
            <div class="resume-skeleton__shine" />
            <div class="resume-skeleton__toolbar">
              <span class="resume-skeleton__pill" />
              <span class="resume-skeleton__pill resume-skeleton__pill--short" />
            </div>
            <div class="resume-skeleton__line resume-skeleton__line--hero" />
            <div class="resume-skeleton__line" />
            <div class="resume-skeleton__line" />
            <div class="resume-skeleton__line resume-skeleton__line--short" />
            <div class="resume-skeleton__block" />
            <div class="resume-skeleton__line" />
            <div class="resume-skeleton__line resume-skeleton__line--medium" />
          </div>
        </div>
      </template>
    </Suspense>
  </div>
</template>

<style scoped>
.resume-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 40px 24px;
}

.resume-suspense-fallback {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 0 48px;
}

.resume-suspense-fallback__title {
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-bottom: 24px;
}

.resume-skeleton {
  position: relative;
  overflow: hidden;
  min-height: 520px;
  border-radius: var(--radius-xl);
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.85);
  padding: 24px 28px;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.resume-skeleton__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 40%,
    color-mix(in srgb, var(--color-primary) 7%, transparent) 50%,
    transparent 60%
  );
  background-size: 200% 100%;
  animation: resume-skeleton-shine 1.4s ease-in-out infinite;
  pointer-events: none;
}

.resume-skeleton__toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 8px;
}

.resume-skeleton__pill {
  width: 88px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--color-border);
  opacity: 0.55;
}

.resume-skeleton__pill--short {
  width: 100px;
}

.resume-skeleton__line {
  height: 12px;
  border-radius: var(--radius-sm);
  background: var(--color-border);
  opacity: 0.5;
  width: 78%;
}

.resume-skeleton__line--hero {
  width: 42%;
  height: 22px;
  margin-top: 4px;
}

.resume-skeleton__line--medium {
  width: 62%;
}

.resume-skeleton__line--short {
  width: 36%;
}

.resume-skeleton__block {
  margin-top: 12px;
  height: 120px;
  border-radius: var(--radius-lg);
  background: var(--color-border);
  opacity: 0.35;
  width: 100%;
}

@keyframes resume-skeleton-shine {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
</style>

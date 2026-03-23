<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
  align?: 'left' | 'center'
}
withDefaults(defineProps<Props>(), { align: 'left' })
</script>

<template>
  <div :class="['section-title', `section-title--${align}`]">
    <h2 class="section-title__main">{{ title }}</h2>
    <p v-if="subtitle" class="section-title__sub">{{ subtitle }}</p>
  </div>
</template>

<style scoped>
/* 底部间距由父级（如 section__header）控制，避免与 margin-bottom 叠加大块空白 */
.section-title { margin-bottom: 0; }
.section-title--center { text-align: center; }
.section-title__main {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  line-height: 1.2;
}
.section-title__sub {
  margin-top: 6px;
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.6;
}
</style>

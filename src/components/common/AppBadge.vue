<script setup lang="ts">
interface Props {
  tag?: string
  color?: string
  size?: 'sm' | 'md'
}
const props = withDefaults(defineProps<Props>(), {
  tag: '',
  size: 'sm',
})
</script>

<template>
  <span :class="['badge', `badge--${props.size}`]" :style="props.color ? { background: props.color + '18', color: props.color } : {}">
    <slot>{{ props.tag }}</slot>
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-weight: 500;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  white-space: nowrap;
}
.badge--sm { font-size: var(--text-xs); }
.badge--md { font-size: var(--text-sm); padding: 5px 14px; }
</style>

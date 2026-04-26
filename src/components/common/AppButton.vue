<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'warm'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  icon?: string
}
const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
})
</script>

<template>
  <button
    :class="['btn', `btn--${props.variant}`, `btn--${props.size}`, { 'btn--loading': props.loading }]"
    :disabled="props.disabled || props.loading"
    v-bind="$attrs"
  >
    <span v-if="props.loading" class="btn__spinner" />
    <span v-if="props.icon && !props.loading" class="btn__icon">{{ props.icon }}</span>
    <span class="btn__label"><slot /></span>
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-sans);
  font-weight: 500;
  border-radius: var(--radius-full);
  border: none;
  cursor: pointer;
  transition: all var(--transition-base);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
}
.btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0);
  transition: background var(--transition-fast);
}
.btn:hover::before { background: rgba(255,255,255,0.12); }
.btn:active { transform: scale(0.97); }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }

/* Variants */
.btn--primary {
  background: var(--gradient-primary);
  color: white;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--color-primary) 35%, transparent);
}
.btn--secondary {
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  border: 1px solid var(--color-border-strong);
}
.btn--secondary:hover { background: color-mix(in srgb, var(--color-primary) 16%, transparent); }
.btn--ghost {
  background: transparent;
  color: var(--color-text-secondary);
}
.btn--ghost:hover { background: color-mix(in srgb, var(--color-primary) 6%, transparent); color: var(--color-primary); }
.btn--warm {
  background: var(--gradient-warm);
  color: white;
  box-shadow: 0 4px 16px rgba(240,160,91,0.35);
}

/* Sizes */
.btn--sm { padding: 7px 16px; font-size: var(--text-sm); }
.btn--md { padding: 10px 22px; font-size: var(--text-sm); }
.btn--lg { padding: 14px 30px; font-size: var(--text-base); }

/* Spinner */
.btn__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>

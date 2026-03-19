<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()

const icons: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast', `toast--${toast.type}`]"
        >
          <span class="toast__icon">{{ icons[toast.type] }}</span>
          <span class="toast__msg">{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  pointer-events: none;
  width: max-content;
  max-width: calc(100vw - 48px);
}
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  pointer-events: auto;
  white-space: nowrap;
  border: 1px solid transparent;
}
.toast--success {
  background: rgba(34, 197, 110, 0.15);
  border-color: rgba(34, 197, 110, 0.3);
  color: #22C56E;
}
.toast--error {
  background: rgba(232, 96, 122, 0.15);
  border-color: rgba(232, 96, 122, 0.3);
  color: #E8607A;
}
.toast--warning {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.3);
  color: #F59E0B;
}
.toast--info {
  background: rgba(91, 138, 240, 0.15);
  border-color: rgba(91, 138, 240, 0.3);
  color: var(--color-primary);
}
.toast__icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.toast--success .toast__icon { background: rgba(34,197,110,0.2); }
.toast--error .toast__icon { background: rgba(232,96,122,0.2); }
.toast--warning .toast__icon { background: rgba(245,158,11,0.2); }
.toast--info .toast__icon { background: rgba(91,138,240,0.2); }
.toast__msg { color: var(--color-text-primary); }

/* Transition */
.toast-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from { opacity: 0; transform: translateY(-20px) scale(0.9); }
.toast-leave-to { opacity: 0; transform: translateY(-10px) scale(0.95); }
.toast-move { transition: transform 0.3s ease; }
</style>

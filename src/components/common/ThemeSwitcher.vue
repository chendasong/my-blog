<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside, useMediaQuery } from '@vueuse/core'
import { useAppStore } from '@/stores/app'
import type { AppTheme } from '@/lib/theme'

const app = useAppStore()

const options: { id: AppTheme; label: string; hint: string }[] = [
  { id: 'blue', label: '蓝色', hint: '默认' },
  { id: 'pink', label: '粉色', hint: '暖粉' },
  { id: 'dark', label: '深色', hint: '夜间' },
]

const currentLabel = () => options.find((o) => o.id === app.theme)?.label ?? '蓝色'

const isOpen = ref(false)
const root = ref<HTMLElement | null>(null)
const isHoverOrWide = useMediaQuery('(min-width: 768px) and (hover: hover)')

onClickOutside(root, () => {
  if (!isHoverOrWide.value) isOpen.value = false
})

function pickTheme(id: AppTheme) {
  app.setTheme(id)
  isOpen.value = false
}

function onTriggerClick() {
  if (!isHoverOrWide.value) isOpen.value = !isOpen.value
}
</script>

<template>
  <div ref="root" :class="['theme-dd', { 'theme-dd--open': isOpen, 'theme-dd--hoverable': isHoverOrWide }]">
    <button type="button" class="theme-dd__trigger" :aria-expanded="!isHoverOrWide ? isOpen : undefined"
      :aria-haspopup="true" :aria-label="`主题，当前为${currentLabel()}`" @click="onTriggerClick">
      <span class="theme-dd__prefix" aria-hidden="true">🎨主题</span>
      <span class="theme-dd__value">{{ currentLabel() }}</span>
      <span class="theme-dd__icon" aria-hidden="true">
        <svg class="theme-dd__chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.2" stroke-linecap="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </button>
    <div class="theme-dd__panel" role="menu" aria-label="选择主题" @click.stop>
      <button v-for="o in options" :key="o.id" type="button" class="theme-dd__item"
        :class="{ 'theme-dd__item--active': app.theme === o.id }" role="menuitemradio"
        :aria-checked="app.theme === o.id" :title="o.hint" @click="pickTheme(o.id)">
        <span class="theme-dd__item-label">{{ o.label }}</span>
        <!-- <span class="theme-dd__item-hint">{{ o.hint }}</span> -->
        <span v-if="app.theme === o.id" class="theme-dd__check" aria-hidden="true">✓</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.theme-dd {
  position: relative;
  flex-shrink: 0;
  z-index: 120;
}

/* 桌面：悬停/焦点展开，与顶栏 user 下拉面板的交互习惯一致 */
@media (min-width: 768px) and (hover: hover) {

  .theme-dd--hoverable:hover .theme-dd__panel,
  .theme-dd--hoverable:focus-within .theme-dd__panel {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    pointer-events: auto;
  }

  .theme-dd--hoverable:hover .theme-dd__chev,
  .theme-dd--hoverable:focus-within .theme-dd__chev {
    transform: rotate(180deg);
  }
}

/* 小屏/触控：点击由 .theme-dd--open 控制 */
@media not all and (min-width: 768px) and (hover: hover) {
  .theme-dd--open .theme-dd__panel {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    pointer-events: auto;
  }

  .theme-dd--open .theme-dd__chev {
    transform: rotate(180deg);
  }
}

.theme-dd__trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px 7px 12px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  background: transparent;
  border: 1px solid var(--color-border);
  box-shadow: none;
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
  cursor: pointer;
  line-height: 1.2;
  white-space: nowrap;
  max-width: 100%;
}

.theme-dd__trigger:hover {
  background: color-mix(in srgb, var(--color-primary) 6%, transparent);
  border-color: var(--color-border-strong);
}

.theme-dd:focus-within .theme-dd__trigger,
.theme-dd--open .theme-dd__trigger {
  border-color: var(--color-border-strong);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 12%, transparent);
}

.theme-dd__prefix {
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-text-muted);
}

.theme-dd__value {
  font-weight: 600;
  color: var(--color-text-primary);
}

.theme-dd__icon {
  display: flex;
  align-items: center;
  margin-left: 2px;
  color: var(--color-text-muted);
}

.theme-dd__chev {
  transition: transform 0.2s ease;
}

.theme-dd__panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 168px;
  padding: 6px;
  background: var(--color-bg-card);
  backdrop-filter: var(--blur-lg);
  -webkit-backdrop-filter: var(--blur-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-6px);
  pointer-events: none;
  transition:
    opacity 0.18s ease,
    visibility 0.18s ease,
    transform 0.2s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.theme-dd__item {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas: 'label check' 'hint check';
  align-items: center;
  column-gap: 10px;
  row-gap: 0;
  width: 100%;
  padding: 8px 10px 8px 12px;
  text-align: left;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  background: none;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.theme-dd__item:hover {
  background: color-mix(in srgb, var(--color-primary) 7%, transparent);
  color: var(--color-text-primary);
}

.theme-dd__item--active {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.theme-dd__item-label {
  grid-area: label;
  font-weight: 600;
}

.theme-dd__item-hint {
  grid-area: hint;
  font-size: var(--text-xs);
  font-weight: 400;
  color: var(--color-text-muted);
  margin-top: 1px;
}

.theme-dd__item--active .theme-dd__item-hint {
  color: color-mix(in srgb, var(--color-primary) 65%, var(--color-text-muted));
}

.theme-dd__check {
  grid-area: check;
  align-self: center;
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-primary);
}

/* 移动端抽屉里：全宽、下拉不裁切 */
@media (max-width: 767px) {
  .theme-dd {
    width: 100%;
  }

  .theme-dd__trigger {
    width: 100%;
    justify-content: space-between;
  }

  .theme-dd__panel {
    right: 0;
    left: 0;
    min-width: unset;
  }
}
</style>

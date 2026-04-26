<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const visible = ref(false)

function onScroll() {
  visible.value = window.scrollY > 300
}

function goTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <Transition name="scroll-top-fade">
    <button
      v-show="visible"
      type="button"
      class="scroll-to-top"
      title="返回顶部"
      aria-label="返回顶部"
      @click="goTop"
    >
      <span class="scroll-to-top__icon" aria-hidden="true">↑</span>
    </button>
  </Transition>
</template>

<style scoped>
.scroll-to-top {
  position: fixed;
  bottom: 28px;
  right: 24px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-primary) 92%, transparent) 0%,
    rgba(139, 111, 240, 0.92) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 8px 28px color-mix(in srgb, var(--color-primary) 28%, transparent);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  transition:
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.25s ease;
}

.scroll-to-top:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px color-mix(in srgb, var(--color-primary) 38%, transparent);
}

.scroll-to-top:active {
  transform: translateY(-1px);
}

.scroll-to-top__icon {
  font-size: 1.45rem;
  color: white;
  font-weight: 700;
  line-height: 1;
}

.scroll-top-fade-enter-active,
.scroll-top-fade-leave-active {
  transition: opacity 0.28s ease;
}

.scroll-top-fade-enter-from,
.scroll-top-fade-leave-to {
  opacity: 0;
}
</style>

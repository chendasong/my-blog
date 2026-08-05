<script setup lang="ts">
import AppNavbar from '@/components/common/AppNavbar.vue'
import AppFooter from '@/components/common/AppFooter.vue'
</script>

<template>
  <div class="layout">
    <AppNavbar />
    <main class="layout__main">
      <RouterView />
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.layout__main {
  flex: 1;
  padding-top: 64px;
}

/* AI 知识库（宽屏三栏）：锁视口高度，左右栏独立滚动，避免目录被正文滚走 */
@media (min-width: 1101px) {
  .layout:has(.ak-page) {
    height: 100vh;
    max-height: 100vh;
    overflow: hidden;
  }
  .layout:has(.ak-page) .layout__main {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .layout:has(.ak-page) :deep(.footer) {
    display: none;
  }
}
</style>

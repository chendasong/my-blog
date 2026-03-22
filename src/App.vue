<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import AppToast from '@/components/common/AppToast.vue'
import MusicPlayerPro from '@/components/common/MusicPlayerPro.vue'
import AIAssistantFloat from '@/components/common/AIAssistantFloat.vue'
import ScrollToTop from '@/components/common/ScrollToTop.vue'

const appStore = useAppStore()
const authStore = useAuthStore()

onMounted(() => {
  appStore.initCoupleAuth()
  authStore.fetchSiteSettings()
})
</script>

<template>
  <RouterView />
  <AppToast />
  <ScrollToTop />
  <MusicPlayerPro :music-urls="authStore.siteSettings?.music_urls" :music-names="authStore.siteSettings?.music_names" />
  <AIAssistantFloat />
</template>

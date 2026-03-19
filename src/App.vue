<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAppStore } from '@/stores/app'
import AppToast from '@/components/common/AppToast.vue'

const appStore = useAppStore()
onMounted(() => {
  appStore.initCoupleAuth()
})
</script>

<template>
  <RouterView />
  <AppToast />
</template>

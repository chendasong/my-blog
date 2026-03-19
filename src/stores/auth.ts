import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { AdminUser, SiteSettings } from '@/api/auth'

const STORAGE_KEY = 'admin_user'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AdminUser | null>(null)
  const siteSettings = ref<SiteSettings | null>(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!user.value)

  // 从 localStorage 恢复登录状态
  function restore() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) user.value = JSON.parse(stored)
    } catch {
      user.value = null
    }
  }

  async function login(username: string, password: string) {
    loading.value = true
    try {
      const result = await authApi.login(username, password)
      user.value = result
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
      return result
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  async function updateProfile(data: Partial<AdminUser> & { avatar_file?: File }) {
    if (!user.value) return
    const updated = await authApi.updateProfile(user.value.id, data)
    user.value = updated
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  }

  async function fetchSiteSettings() {
    siteSettings.value = await authApi.getSiteSettings()
  }

  async function updateSiteSettings(data: Parameters<typeof authApi.updateSiteSettings>[0]) {
    siteSettings.value = await authApi.updateSiteSettings(data)
    return siteSettings.value
  }

  return { user, siteSettings, loading, isLoggedIn, restore, login, logout, updateProfile, fetchSiteSettings, updateSiteSettings }
})

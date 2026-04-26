import { defineStore } from 'pinia'
import { ref } from 'vue'
import { applyThemeToDocument, getStoredTheme, persistTheme, type AppTheme, VALID_APP_THEMES } from '@/lib/theme'

export const useAppStore = defineStore('app', () => {
  const isMenuOpen = ref(false)
  const isCoupleAuthed = ref(false)
  const theme = ref<AppTheme>(getStoredTheme())

  function setTheme(t: AppTheme) {
    if (!VALID_APP_THEMES.includes(t)) return
    theme.value = t
    persistTheme(t)
    applyThemeToDocument(t)
  }

  function initTheme() {
    const t = getStoredTheme()
    theme.value = t
    applyThemeToDocument(t)
  }

  function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value
  }

  function closeMenu() {
    isMenuOpen.value = false
  }

  function setCoupleAuth(value: boolean) {
    isCoupleAuthed.value = value
    if (value) {
      sessionStorage.setItem('couple_auth', '1')
    } else {
      sessionStorage.removeItem('couple_auth')
    }
  }

  function initCoupleAuth() {
    const authed = sessionStorage.getItem('couple_auth')
    isCoupleAuthed.value = !!authed
  }

  return { isMenuOpen, isCoupleAuthed, theme, setTheme, initTheme, toggleMenu, closeMenu, setCoupleAuth, initCoupleAuth }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const isMenuOpen = ref(false)
  const isCoupleAuthed = ref(false)

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

  return { isMenuOpen, isCoupleAuthed, toggleMenu, closeMenu, setCoupleAuth, initCoupleAuth }
})

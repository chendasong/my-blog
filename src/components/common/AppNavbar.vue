<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { userProfile } from '@/data'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const scrolled = ref(false)
const navItems = [
  { label: '首页', path: '/', icon: '🏠' },
  { label: '博客', path: '/blog', icon: '📝' },
  { label: '笔记', path: '/notes', icon: '📔' },
  { label: 'AI 工坊', path: '/ai', icon: '✨' },
  { label: '情侣空间', path: '/couple', icon: '💑' },
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

if (typeof window !== 'undefined') {
  window.addEventListener('scroll', () => {
    scrolled.value = window.scrollY > 20
  })
}

function navigate(path: string) {
  router.push(path)
  appStore.closeMenu()
}
</script>

<template>
  <header :class="['navbar', { 'navbar--scrolled': scrolled }]">
    <div class="navbar__inner">
      <!-- Logo -->
      <button class="navbar__logo" @click="navigate('/')">
        <span class="navbar__logo-icon">✦</span>
        <span class="navbar__logo-text">Luminary</span>
      </button>

      <!-- Desktop Nav -->
      <nav class="navbar__nav">
        <button
          v-for="item in navItems"
          :key="item.path"
          :class="['nav-item', { 'nav-item--active': isActive(item.path) }]"
          @click="navigate(item.path)"
        >
          <span class="nav-item__icon">{{ item.icon }}</span>
          <span class="nav-item__label">{{ item.label }}</span>
        </button>
      </nav>

      <!-- Avatar -->
      <div class="navbar__avatar">
        <img :src="userProfile.avatar" :alt="userProfile.nickname" class="avatar-img" />
        <div class="avatar-dot" />
      </div>

      <!-- Mobile Menu Button -->
      <button class="navbar__hamburger" @click="appStore.toggleMenu()">
        <span :class="['hamburger-line', { open: appStore.isMenuOpen }]" />
        <span :class="['hamburger-line', { open: appStore.isMenuOpen }]" />
        <span :class="['hamburger-line', { open: appStore.isMenuOpen }]" />
      </button>
    </div>

    <!-- Mobile Drawer -->
    <Transition name="drawer">
      <div v-if="appStore.isMenuOpen" class="mobile-drawer">
        <button
          v-for="item in navItems"
          :key="item.path"
          :class="['mobile-nav-item', { 'mobile-nav-item--active': isActive(item.path) }]"
          @click="navigate(item.path)"
        >
          <span>{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </button>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0 24px;
  transition: all var(--transition-base);
}

.navbar--scrolled {
  background: var(--color-bg-card);
  backdrop-filter: var(--blur-lg);
  -webkit-backdrop-filter: var(--blur-lg);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.navbar__inner {
  max-width: 1200px;
  margin: 0 auto;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.navbar__logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 1.2rem;
  letter-spacing: -0.02em;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}
.navbar__logo:hover { opacity: 0.75; }

.navbar__logo-icon {
  font-size: 1.4rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.navbar__nav {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
  cursor: pointer;
}
.nav-item:hover {
  background: rgba(91, 138, 240, 0.08);
  color: var(--color-primary);
}
.nav-item--active {
  background: rgba(91, 138, 240, 0.12);
  color: var(--color-primary);
  font-weight: 600;
}

.nav-item__icon { font-size: 1rem; }

.navbar__avatar {
  position: relative;
  margin-left: 8px;
  cursor: pointer;
}
.avatar-img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--color-border-strong);
  object-fit: cover;
}
.avatar-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 9px;
  height: 9px;
  background: var(--color-success);
  border-radius: 50%;
  border: 2px solid white;
}

.navbar__hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  padding: 8px;
  cursor: pointer;
}
.hamburger-line {
  display: block;
  width: 22px;
  height: 2px;
  background: var(--color-text-secondary);
  border-radius: 2px;
  transition: all var(--transition-base);
}

.mobile-drawer {
  display: none;
  flex-direction: column;
  padding: 12px 16px 16px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-card);
  backdrop-filter: var(--blur-lg);
  -webkit-backdrop-filter: var(--blur-lg);
}
.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.mobile-nav-item:hover,
.mobile-nav-item--active {
  background: rgba(91, 138, 240, 0.08);
  color: var(--color-primary);
}

.drawer-enter-active, .drawer-leave-active {
  transition: all 0.3s ease;
}
.drawer-enter-from, .drawer-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 768px) {
  .navbar__nav { display: none; }
  .navbar__hamburger { display: flex; }
  .mobile-drawer { display: flex; }
  .navbar__avatar { margin-left: auto; }
}
</style>

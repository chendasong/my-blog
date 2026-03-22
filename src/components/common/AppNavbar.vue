<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

const scrolled = ref(false)
const navItems = [
  { label: '首页', path: '/', icon: '🏠' },
  { label: '文章', path: '/blog', icon: '📝' },
  { label: '笔记', path: '/notes', icon: '📔' },
  { label: 'AI 工坊', path: '/ai', icon: '✨' },
  { label: '写作 Agent', path: '/ai/agent', icon: '🤖' },
  { label: '我的简历', path: '/resume', icon: '📄' },
  { label: '情侣空间', path: '/couple', icon: '💑' },
]

const showAdminMenu = ref(false)

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  if (path === '/ai') return route.path === '/ai' || route.path === '/ai/'
  return route.path.startsWith(path)
}

if (typeof window !== 'undefined') {
  window.addEventListener('scroll', () => { scrolled.value = window.scrollY > 20 })
  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('.navbar__user')) showAdminMenu.value = false
  })
}

function navigate(path: string) {
  router.push(path)
  appStore.closeMenu()
  showAdminMenu.value = false
}

function handleLogout() {
  authStore.logout()
  showAdminMenu.value = false
  router.push('/')
}
</script>

<template>
  <header :class="['navbar', { 'navbar--scrolled': scrolled }]">
    <div class="navbar__inner">
      <button class="navbar__logo" @click="navigate('/')">
        <span class="navbar__logo-icon">✦</span>
        <span class="navbar__logo-text">Luminary</span>
      </button>

      <nav class="navbar__nav">
        <button
          v-for="item in navItems" :key="item.path"
          :class="['nav-item', { 'nav-item--active': isActive(item.path) }]"
          @click="navigate(item.path)"
        >
          <span class="nav-item__icon">{{ item.icon }}</span>
          <span class="nav-item__label">{{ item.label }}</span>
        </button>
      </nav>

      <!-- 用户区域 -->
      <div class="navbar__user" @click.stop="showAdminMenu = !showAdminMenu">
        <div class="navbar__avatar">
          <img
            :src="authStore.isLoggedIn ? (authStore.user?.avatar || '/images/avatar.svg') : '/images/avatar.svg'"
            :alt="authStore.isLoggedIn ? authStore.user?.nickname : '游客'"
            class="avatar-img"
          />
          <div :class="['avatar-dot', { 'avatar-dot--on': authStore.isLoggedIn }]" />
        </div>
        <span v-if="authStore.isLoggedIn" class="navbar__username">{{ authStore.user?.nickname }}</span>

        <Transition name="dropdown">
          <div v-if="showAdminMenu" class="admin-dropdown">
            <template v-if="authStore.isLoggedIn">
              <button class="dropdown-item" @click="navigate('/admin/profile')">⚙️ 配置中心</button>
              <!-- <button class="dropdown-item" @click="navigate('/blog/new')">✏️ 写文章</button> -->
              <div class="dropdown-divider" />
              <button class="dropdown-item dropdown-item--danger" @click="handleLogout">🔒 退出登录</button>
            </template>
            <template v-else>
              <button class="dropdown-item" @click="navigate('/login')">🔑 管理员登录</button>
            </template>
          </div>
        </Transition>
      </div>

      <button class="navbar__hamburger" @click="appStore.toggleMenu()">
        <span :class="['hamburger-line', { open: appStore.isMenuOpen }]" />
        <span :class="['hamburger-line', { open: appStore.isMenuOpen }]" />
        <span :class="['hamburger-line', { open: appStore.isMenuOpen }]" />
      </button>
    </div>

    <Transition name="drawer">
      <div v-if="appStore.isMenuOpen" class="mobile-drawer">
        <button
          v-for="item in navItems" :key="item.path"
          :class="['mobile-nav-item', { 'mobile-nav-item--active': isActive(item.path) }]"
          @click="navigate(item.path)"
        >
          <span>{{ item.icon }}</span><span>{{ item.label }}</span>
        </button>
        <div class="mobile-drawer__divider" />
        <button v-if="authStore.isLoggedIn" class="mobile-nav-item" @click="navigate('/admin/profile')">⚙️ 管理设置</button>
        <button v-if="authStore.isLoggedIn" class="mobile-nav-item mobile-nav-item--danger" @click="handleLogout">🔒 退出登录</button>
        <button v-else class="mobile-nav-item" @click="navigate('/login')">🔑 管理员登录</button>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.navbar { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 0 24px; transition: all var(--transition-base); }
.navbar--scrolled { background: var(--color-bg-card); backdrop-filter: var(--blur-lg); -webkit-backdrop-filter: var(--blur-lg); border-bottom: 1px solid var(--color-border); box-shadow: var(--shadow-sm); }
.navbar__inner { max-width: 1200px; margin: 0 auto; height: 64px; display: flex; align-items: center; gap: 16px; }
.navbar__logo { display: flex; align-items: center; gap: 8px; color: var(--color-text-primary); font-family: var(--font-sans); font-weight: 700; font-size: 1.2rem; letter-spacing: -0.02em; cursor: pointer; transition: opacity var(--transition-fast); }
.navbar__logo:hover { opacity: 0.75; }
.navbar__logo-icon { font-size: 1.4rem; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.navbar__nav { display: flex; align-items: center; gap: 4px; margin-left: auto; }
.nav-item { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: var(--radius-full); font-size: var(--text-sm); font-weight: 500; color: var(--color-text-secondary); transition: all var(--transition-fast); cursor: pointer; }
.nav-item:hover { background: rgba(91,138,240,0.08); color: var(--color-primary); }
.nav-item--active { background: rgba(91,138,240,0.12); color: var(--color-primary); font-weight: 600; }
.nav-item__icon { font-size: 1rem; }
.navbar__user { position: relative; display: flex; align-items: center; gap: 8px; cursor: pointer; margin-left: 8px; padding: 4px 8px; border-radius: var(--radius-full); transition: background var(--transition-fast); }
.navbar__user:hover { background: rgba(91,138,240,0.06); }
.navbar__avatar { position: relative; flex-shrink: 0; }
.avatar-img { width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--color-border-strong); object-fit: cover; }
.avatar-dot { position: absolute; bottom: 1px; right: 1px; width: 9px; height: 9px; background: var(--color-text-muted); border-radius: 50%; border: 2px solid white; transition: background var(--transition-fast); }
.avatar-dot--on { background: var(--color-success, #4CAF82); }
.navbar__username { font-size: var(--text-sm); font-weight: 600; color: var(--color-text-primary); max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.admin-dropdown { position: absolute; top: calc(100% + 8px); right: 0; min-width: 160px; background: var(--color-bg-card); backdrop-filter: var(--blur-lg); border: 1px solid var(--color-border); border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); padding: 6px; z-index: 200; }
.dropdown-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 12px; border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--color-text-secondary); cursor: pointer; background: none; border: none; transition: all var(--transition-fast); text-align: left; }
.dropdown-item:hover { background: rgba(91,138,240,0.08); color: var(--color-primary); }
.dropdown-item--danger:hover { background: rgba(232,96,122,0.08); color: #E8607A; }
.dropdown-divider { height: 1px; background: var(--color-border); margin: 4px 0; }
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px) scale(0.97); }
.navbar__hamburger { display: none; flex-direction: column; gap: 5px; padding: 8px; cursor: pointer; }
.hamburger-line { display: block; width: 22px; height: 2px; background: var(--color-text-secondary); border-radius: 2px; transition: all var(--transition-base); }
.mobile-drawer { display: none; flex-direction: column; padding: 12px 16px 16px; border-top: 1px solid var(--color-border); background: var(--color-bg-card); backdrop-filter: var(--blur-lg); }
.mobile-drawer__divider { height: 1px; background: var(--color-border); margin: 8px 0; }
.mobile-nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: var(--radius-md); font-size: var(--text-base); color: var(--color-text-secondary); cursor: pointer; background: none; border: none; transition: all var(--transition-fast); text-align: left; }
.mobile-nav-item:hover, .mobile-nav-item--active { background: rgba(91,138,240,0.08); color: var(--color-primary); }
.mobile-nav-item--danger:hover { background: rgba(232,96,122,0.08); color: #E8607A; }
.drawer-enter-active, .drawer-leave-active { transition: all 0.3s ease; }
.drawer-enter-from, .drawer-leave-to { opacity: 0; transform: translateY(-8px); }
@media (max-width: 768px) { .navbar__nav { display: none; } .navbar__hamburger { display: flex; } .mobile-drawer { display: flex; } .navbar__avatar { margin-left: auto; } .navbar__username { display: none; } }
</style>

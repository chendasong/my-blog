<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'

const authStore = useAuthStore()
onMounted(async () => {
  if (!authStore.siteSettings) await authStore.fetchSiteSettings()
})
</script>

<template>
  <footer class="footer">
    <div class="footer__inner">
      <div class="footer__brand">
        <span class="footer__logo">✦ {{ authStore.siteSettings?.site_name || 'Luminary' }}</span>
        <p class="footer__bio">{{ authStore.siteSettings?.site_subtitle || '热爱生活，热爱代码。' }}</p>
      </div>
      <div class="footer__links">
        <div class="footer__col">
          <h4 class="footer__col-title">导航</h4>
          <div class="footer__nav-row">
            <RouterLink class="footer__link" to="/">首页</RouterLink>
            <RouterLink class="footer__link" to="/blog">文章</RouterLink>
            <RouterLink class="footer__link" to="/notes">笔记</RouterLink>
            <!-- <RouterLink class="footer__link" to="/blog/new">写文章</RouterLink>
            <RouterLink class="footer__link" to="/notes/new">写笔记</RouterLink> -->
          </div>
          <!-- <div class="footer__nav-row">
          </div> -->
          <div class="footer__nav-row">
            <RouterLink class="footer__link" to="/ai">AI 工坊</RouterLink>
            <RouterLink class="footer__link" to="/ai/agent">写作 Agent</RouterLink>
            <RouterLink class="footer__link" to="/resume">我的简历</RouterLink>
            <RouterLink class="footer__link" to="/couple">情侣空间</RouterLink>
          </div>
        </div>
        <!-- <div class="footer__col">
          <h4 class="footer__col-title">项目</h4>
          <div class="footer__nav-row">
            <a href="https://github.com/chendasong/my-blog" target="_blank">GitHub</a>
          </div>
        </div> -->
      </div>
    </div>
    <div class="footer__bottom">
      <span>© 2026 chends · 用心记录每一天</span>
      <span>Made by chends ❤️</span>
    </div>
  </footer>
</template>

<style scoped>
.footer { margin-top: auto; border-top: 1px solid var(--color-border); background: var(--color-bg-card); backdrop-filter: var(--blur-md); -webkit-backdrop-filter: var(--blur-md); }
.footer__inner { max-width: 1200px; margin: 0 auto; padding: 40px 24px 28px; display: flex; gap: 48px; flex-wrap: wrap; }
.footer__brand { flex: 1; min-width: 200px; }
.footer__logo { font-size: 1.2rem; font-weight: 700; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.footer__bio { margin-top: 10px; color: var(--color-text-muted); font-size: var(--text-sm); line-height: 1.7; max-width: 280px; }
.footer__links { display: flex; gap: 48px; }
.footer__col { display: flex; flex-direction: column; gap: 10px; }
.footer__col-title { font-size: var(--text-sm); font-weight: 600; color: var(--color-text-primary); margin-bottom: 2px; }
.footer__nav-row { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; }
.footer__link { font-size: var(--text-sm); color: var(--color-text-muted); transition: color var(--transition-fast); white-space: nowrap; text-decoration: none; }
.footer__link:hover { color: var(--color-primary); }
.footer__nav-row span { font-size: var(--text-sm); color: var(--color-text-muted); }
.footer__bottom { max-width: 1200px; margin: 0 auto; padding: 16px 24px; border-top: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; font-size: var(--text-xs); color: var(--color-text-muted); }
@media (max-width: 640px) { .footer__links { flex-direction: column; gap: 20px; } .footer__bottom { flex-direction: column; gap: 6px; text-align: center; } }
</style>

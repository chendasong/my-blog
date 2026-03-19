<script setup lang="ts">
import { userProfile } from '@/data'
</script>

<template>
  <footer class="footer">
    <div class="footer__inner">
      <div class="footer__brand">
        <span class="footer__logo">✦ Luminary</span>
        <p class="footer__bio">{{ userProfile.bio }}</p>
      </div>
      <div class="footer__links">
        <div class="footer__col">
          <h4 class="footer__col-title">导航</h4>
          <a href="/blog">博客</a>
          <a href="/notes">笔记</a>
          <a href="/ai">AI 工坊</a>
          <a href="/couple">情侣空间</a>
        </div>
        <div class="footer__col">
          <h4 class="footer__col-title">联系</h4>
          <a :href="userProfile.social.github" target="_blank">GitHub</a>
          <a :href="userProfile.social.twitter" target="_blank">Twitter</a>
          <a :href="userProfile.social.weibo" target="_blank">微博</a>
        </div>
      </div>
    </div>
    <div class="footer__bottom">
      <span>© 2024 {{ userProfile.name }} · 用心记录每一天</span>
      <span>Made with ☕ &amp; ❤️</span>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: auto;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-card);
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
}
.footer__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px 32px;
  display: flex;
  gap: 48px;
  flex-wrap: wrap;
}
.footer__brand {
  flex: 1;
  min-width: 200px;
}
.footer__logo {
  font-size: 1.2rem;
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.footer__bio {
  margin-top: 12px;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  line-height: 1.7;
  max-width: 280px;
}
.footer__links {
  display: flex;
  gap: 48px;
}
.footer__col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.footer__col-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}
.footer__col a {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  transition: color var(--transition-fast);
}
.footer__col a:hover {
  color: var(--color-primary);
}
.footer__bottom {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
@media (max-width: 640px) {
  .footer__links { flex-direction: column; gap: 24px; }
  .footer__bottom { flex-direction: column; gap: 6px; text-align: center; }
}
</style>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const username = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)

async function handleLogin() {
  if (!username.value.trim() || !password.value.trim()) {
    toast.warning('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    await authStore.login(username.value.trim(), password.value)
    const redirect = (router.currentRoute.value.query.redirect as string) || '/'
    router.push(redirect)
    toast.success('登录成功，欢迎回来！')
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : '登录失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="login-blob login-blob--1" />
      <div class="login-blob login-blob--2" />
    </div>
    <div class="login-card glass-card animate-fade-in-up">
      <div class="login-header">
        <div class="login-logo">✨</div>
        <h1 class="login-title">管理员登录</h1>
        <p class="login-subtitle">登录后可管理博客内容</p>
      </div>
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">账号</label>
          <div class="input-wrap">
            <span class="input-icon">👤</span>
            <input
              v-model="username"
              class="form-input"
              placeholder="输入管理员账号"
              autocomplete="username"
              autofocus
            />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <div class="input-wrap">
            <span class="input-icon">🔑</span>
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="输入密码"
              autocomplete="current-password"
            />
            <button type="button" class="eye-btn" @click="showPassword = !showPassword">
              {{ showPassword ? '🙈' : '👁' }}
            </button>
          </div>
        </div>
        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading" class="btn-spinner" />
          <span v-else>登录</span>
        </button>
      </form>
      <button class="back-link" @click="router.push('/')">← 返回首页</button>
    </div>
  </div>
</template>

<style scoped>
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; background: var(--color-bg); }
.login-bg { position: absolute; inset: 0; pointer-events: none; }
.login-blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.5; }
.login-blob--1 { width: 500px; height: 500px; background: rgba(91,138,240,0.15); top: -100px; left: -100px; animation: float 8s ease-in-out infinite; }
.login-blob--2 { width: 400px; height: 400px; background: rgba(139,111,240,0.12); bottom: -80px; right: -80px; animation: float 10s ease-in-out infinite reverse; }
.login-card { width: 100%; max-width: 420px; padding: 48px 40px; position: relative; z-index: 1; }
.login-header { text-align: center; margin-bottom: 36px; }
.login-logo { font-size: 3rem; margin-bottom: 12px; }
.login-title { font-size: var(--text-2xl); font-weight: 700; color: var(--color-text-primary); margin-bottom: 6px; }
.login-subtitle { font-size: var(--text-sm); color: var(--color-text-muted); }
.login-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: var(--text-sm); font-weight: 600; color: var(--color-text-secondary); }
.input-wrap { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 14px; font-size: 1rem; pointer-events: none; }
.form-input { width: 100%; padding: 12px 16px 12px 42px; background: var(--color-bg-glass); border: 1.5px solid var(--color-border); border-radius: var(--radius-lg); font-size: var(--text-base); color: var(--color-text-primary); font-family: var(--font-sans); outline: none; transition: all var(--transition-fast); }
.form-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(91,138,240,0.12); }
.eye-btn { position: absolute; right: 12px; background: none; border: none; cursor: pointer; font-size: 1rem; color: var(--color-text-muted); padding: 4px; }
.login-error { background: rgba(232,96,122,0.08); border: 1px solid rgba(232,96,122,0.2); border-radius: var(--radius-lg); padding: 10px 14px; font-size: var(--text-sm); color: #E8607A; }
.error-fade-enter-active, .error-fade-leave-active { transition: all 0.2s ease; }
.error-fade-enter-from, .error-fade-leave-to { opacity: 0; transform: translateY(-4px); }
.login-btn { width: 100%; padding: 14px; background: var(--gradient-primary); color: white; border: none; border-radius: var(--radius-full); font-size: var(--text-base); font-weight: 600; cursor: pointer; transition: all var(--transition-base); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(91,138,240,0.35); margin-top: 4px; }
.login-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(91,138,240,0.4); }
.login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.back-link { display: block; text-align: center; margin-top: 20px; font-size: var(--text-sm); color: var(--color-text-muted); cursor: pointer; background: none; border: none; transition: color var(--transition-fast); }
.back-link:hover { color: var(--color-primary); }
</style>

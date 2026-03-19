<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const appStore = useAppStore()

const password = ref('')
const error = ref('')
const loading = ref(false)
const showPwd = ref(false)

// 密码：两人名字缩写+纪念日 演示用固定密码
const COUPLE_PASSWORD = 'cy0714'

async function handleSubmit() {
  if (!password.value) { error.value = '请输入密码'; return }
  loading.value = true
  error.value = ''
  await new Promise(r => setTimeout(r, 800))
  if (password.value === COUPLE_PASSWORD) {
    appStore.setCoupleAuth(true)
    router.push('/couple/space')
  } else {
    error.value = '密码不正确，请再试一次 💔'
    password.value = ''
  }
  loading.value = false
}
</script>

<template>
  <div class="couple-entry">
    <div class="couple-entry__bg">
      <div class="blob blob--1" />
      <div class="blob blob--2" />
      <div class="hearts">
        <span v-for="i in 8" :key="i" class="heart" :style="{ '--i': i }">💗</span>
      </div>
    </div>
    <div class="couple-entry__card glass-card animate-scale-in">
      <div class="couple-entry__icon">🔐</div>
      <h1 class="couple-entry__title">情侣专属空间</h1>
      <p class="couple-entry__desc">这里是我们两个人的小天地，<br />请输入专属密码进入 🌸</p>
      <form class="couple-entry__form" @submit.prevent="handleSubmit">
        <div class="pwd-field">
          <input
            v-model="password"
            :type="showPwd ? 'text' : 'password'"
            class="pwd-input"
            placeholder="输入专属密码..."
            @keydown.enter="handleSubmit"
          />
          <button type="button" class="pwd-toggle" @click="showPwd = !showPwd">
            {{ showPwd ? '🙈' : '👁️' }}
          </button>
        </div>
        <Transition name="fade">
          <p v-if="error" class="couple-entry__error">{{ error }}</p>
        </Transition>
        <AppButton
          variant="warm"
          size="lg"
          :loading="loading"
          style="width: 100%"
          @click="handleSubmit"
        >
          进入我们的空间 →
        </AppButton>
      </form>
      <p class="couple-entry__hint">提示：密码是我们名字的首字母 + 纪念日 🗝️</p>
    </div>
  </div>
</template>

<style scoped>
.couple-entry {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 40px 24px;
}
.couple-entry__bg { position: absolute; inset: 0; pointer-events: none; }
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.4;
}
.blob--1 { width: 500px; height: 500px; background: rgba(240,96,122,0.18); top: -100px; right: -100px; animation: float 8s ease-in-out infinite; }
.blob--2 { width: 400px; height: 400px; background: rgba(240,160,91,0.14); bottom: -80px; left: -80px; animation: float 10s ease-in-out infinite reverse; }
.hearts { position: absolute; inset: 0; }
.heart {
  position: absolute;
  font-size: 1.5rem;
  opacity: 0.15;
  animation: float calc(6s + var(--i) * 1.2s) ease-in-out infinite calc(var(--i) * 0.4s);
}
.heart:nth-child(1) { top: 10%; left: 5%; }
.heart:nth-child(2) { top: 20%; right: 8%; }
.heart:nth-child(3) { top: 60%; left: 3%; }
.heart:nth-child(4) { bottom: 15%; right: 5%; }
.heart:nth-child(5) { top: 40%; left: 10%; }
.heart:nth-child(6) { top: 75%; right: 12%; }
.heart:nth-child(7) { top: 5%; left: 45%; }
.heart:nth-child(8) { bottom: 10%; left: 40%; }
.couple-entry__card {
  width: 100%;
  max-width: 420px;
  padding: 48px 40px;
  text-align: center;
  position: relative;
  z-index: 1;
}
.couple-entry__icon { font-size: 3rem; margin-bottom: 16px; }
.couple-entry__title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 12px;
}
.couple-entry__desc {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  font-family: var(--font-serif);
  line-height: 1.7;
  margin-bottom: 32px;
}
.couple-entry__form { display: flex; flex-direction: column; gap: 16px; }
.pwd-field {
  position: relative;
  display: flex;
  align-items: center;
}
.pwd-input {
  width: 100%;
  padding: 14px 48px 14px 18px;
  background: rgba(255,255,255,0.6);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  outline: none;
  text-align: center;
  letter-spacing: 0.1em;
  transition: all var(--transition-fast);
}
.pwd-input:focus { border-color: var(--color-accent); box-shadow: 0 0 0 3px rgba(232,96,122,0.12); }
.pwd-input::placeholder { letter-spacing: 0; color: var(--color-text-muted); }
.pwd-toggle {
  position: absolute;
  right: 14px;
  font-size: 1.1rem;
  cursor: pointer;
  background: none;
  border: none;
}
.couple-entry__error {
  font-size: var(--text-sm);
  color: var(--color-error);
  background: rgba(232,96,122,0.08);
  padding: 8px 16px;
  border-radius: var(--radius-md);
}
.couple-entry__hint {
  margin-top: 20px;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
.fade-enter-active, .fade-leave-active { transition: all 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>

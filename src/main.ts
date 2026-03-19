import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import '@/assets/styles/global.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// 恢复登录状态
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
authStore.restore()

app.mount('#app')

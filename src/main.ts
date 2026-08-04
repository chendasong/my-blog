import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import '@/assets/styles/global.css'
import { useAppStore } from './stores/app'
import { useAuthStore } from '@/stores/auth'
import { useModelConfigStore } from '@/stores/modelConfig'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
useAppStore().initTheme()

const authStore = useAuthStore()
authStore.restore()

app.mount('#app')

// 不阻塞首屏：登录态恢复后再拉模型配置
void useModelConfigStore().load()

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const saving = ref(false)
const savingSettings = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

// 个人资料表单
const profile = ref({
  nickname: '',
  email: '',
  bio: '',
  avatar: '',
})
const avatarFile = ref<File | null>(null)
const avatarPreview = ref('')

// 网站配置表单
const settings = ref({
  site_name: '',
  site_subtitle: '',
  site_description: '',
  owner_location: '',
  icp_number: '',
  owner_avatar: '',
})
const ownerAvatarFile = ref<File | null>(null)
const ownerAvatarPreview = ref('')

onMounted(async () => {
  if (!authStore.isLoggedIn) { router.push('/login'); return }
  const u = authStore.user!
  profile.value = { nickname: u.nickname, email: u.email, bio: u.bio, avatar: u.avatar }
  await authStore.fetchSiteSettings()
  const s = authStore.siteSettings!
  settings.value = {
    site_name: s.site_name,
    site_subtitle: s.site_subtitle,
    site_description: s.site_description,
    owner_location: s.owner_location,
    icp_number: s.icp_number,
    owner_avatar: s.owner_avatar,
  }
})

function handleAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

function handleOwnerAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  ownerAvatarFile.value = file
  ownerAvatarPreview.value = URL.createObjectURL(file)
}

async function saveProfile() {
  saving.value = true
  successMsg.value = ''
  errorMsg.value = ''
  try {
    await authStore.updateProfile({
      ...profile.value,
      ...(avatarFile.value ? { avatar_file: avatarFile.value } : {}),
    })
    avatarFile.value = null
    avatarPreview.value = ''
    successMsg.value = '个人资料已保存'
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    saving.value = false
  }
}

async function saveSettings() {
  savingSettings.value = true
  successMsg.value = ''
  errorMsg.value = ''
  try {
    await authStore.updateSiteSettings({
      ...settings.value,
      ...(ownerAvatarFile.value ? { avatar_file: ownerAvatarFile.value } : {}),
    })
    ownerAvatarFile.value = null
    ownerAvatarPreview.value = ''
    successMsg.value = '网站配置已保存'
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    savingSettings.value = false
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-header">
      <button class="back-btn" @click="router.push('/')">← 返回首页</button>
      <h1 class="admin-title">⚙️ 管理设置</h1>
      <AppButton variant="ghost" @click="handleLogout">🔒 退出登录</AppButton>
    </div>

    <Transition name="msg-fade">
      <div v-if="successMsg" class="alert alert--success">✅ {{ successMsg }}</div>
      <div v-else-if="errorMsg" class="alert alert--error">⚠️ {{ errorMsg }}</div>
    </Transition>

    <div class="admin-body">
      <!-- 个人资料 -->
      <section class="admin-section glass-card">
        <h2 class="section-title">👤 个人资料</h2>
        <div class="avatar-row">
          <div class="avatar-preview">
            <img :src="avatarPreview || profile.avatar || '/images/avatar.svg'" alt="头像" />
            <label class="avatar-upload-btn">
              📷 更换头像
              <input type="file" accept="image/*" style="display:none" @change="handleAvatarChange" />
            </label>
          </div>
          <div class="avatar-info">
            <p class="avatar-tip">支持 JPG、PNG、WebP 格式，建议正方形图片</p>
            <p class="avatar-name">账号：<strong>{{ authStore.user?.username }}</strong></p>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">昵称</label>
            <input v-model="profile.nickname" class="form-input" placeholder="你的昵称" />
          </div>
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input v-model="profile.email" class="form-input" type="email" placeholder="your@email.com" />
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">个人简介</label>
            <textarea v-model="profile.bio" class="form-textarea" rows="3" placeholder="介绍一下自己..." />
          </div>
        </div>
        <div class="section-footer">
          <AppButton :loading="saving" @click="saveProfile">保存个人资料</AppButton>
        </div>
      </section>

      <!-- 网站配置 -->
      <section class="admin-section glass-card">
        <h2 class="section-title">🌐 网站配置</h2>
        <div class="avatar-row">
          <div class="avatar-preview">
            <img :src="ownerAvatarPreview || settings.owner_avatar || '/images/avatar.svg'" alt="站主头像" />
            <label class="avatar-upload-btn">
              📷 更换头像
              <input type="file" accept="image/*" style="display:none" @change="handleOwnerAvatarChange" />
            </label>
          </div>
          <p class="avatar-tip" style="margin-left:16px">首页展示的站主头像</p>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">网站名称</label>
            <input v-model="settings.site_name" class="form-input" placeholder="Luminary" />
          </div>
          <div class="form-group">
            <label class="form-label">网站副标题</label>
            <input v-model="settings.site_subtitle" class="form-input" placeholder="记录生活与技术" />
          </div>
          <div class="form-group">
            <label class="form-label">所在城市</label>
            <input v-model="settings.owner_location" class="form-input" placeholder="深圳" />
          </div>
          <div class="form-group">
            <label class="form-label">ICP 备案号</label>
            <input v-model="settings.icp_number" class="form-input" placeholder="粤ICP备XXXXXXXX号" />
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">网站描述</label>
            <textarea v-model="settings.site_description" class="form-textarea" rows="2" placeholder="网站简介，用于 SEO meta description" />
          </div>
        </div>
        <div class="section-footer">
          <AppButton :loading="savingSettings" @click="saveSettings">保存网站配置</AppButton>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.admin-page { max-width: 900px; margin: 0 auto; padding: 32px 24px 80px; }
.admin-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
.back-btn { color: var(--color-text-muted); font-size: var(--text-sm); cursor: pointer; background: none; border: none; transition: color var(--transition-fast); }
.back-btn:hover { color: var(--color-primary); }
.admin-title { font-size: var(--text-xl); font-weight: 700; color: var(--color-text-primary); flex: 1; }
.alert { padding: 12px 16px; border-radius: var(--radius-lg); font-size: var(--text-sm); margin-bottom: 20px; }
.alert--success { background: rgba(76,175,82,0.08); border: 1px solid rgba(76,175,82,0.2); color: #4CAF52; }
.alert--error { background: rgba(232,96,122,0.08); border: 1px solid rgba(232,96,122,0.2); color: #E8607A; }
.msg-fade-enter-active, .msg-fade-leave-active { transition: all 0.2s ease; }
.msg-fade-enter-from, .msg-fade-leave-to { opacity: 0; transform: translateY(-4px); }
.admin-body { display: flex; flex-direction: column; gap: 24px; }
.admin-section { padding: 32px; }
.section-title { font-size: var(--text-lg); font-weight: 700; color: var(--color-text-primary); margin-bottom: 24px; padding-bottom: 14px; border-bottom: 1px solid var(--color-border); }
.avatar-row { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }
.avatar-preview { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.avatar-preview img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid var(--color-border-strong); }
.avatar-upload-btn { display: inline-block; padding: 6px 14px; border-radius: var(--radius-full); border: 1.5px dashed var(--color-border); background: var(--color-bg-glass); font-size: var(--text-xs); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast); white-space: nowrap; }
.avatar-upload-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.avatar-info { display: flex; flex-direction: column; gap: 6px; }
.avatar-tip { font-size: var(--text-xs); color: var(--color-text-muted); }
.avatar-name { font-size: var(--text-sm); color: var(--color-text-secondary); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group--full { grid-column: 1 / -1; }
.form-label { font-size: var(--text-sm); font-weight: 600; color: var(--color-text-secondary); }
.form-input, .form-textarea { padding: 10px 14px; background: var(--color-bg-glass); border: 1px solid var(--color-border); border-radius: var(--radius-lg); font-size: var(--text-sm); color: var(--color-text-primary); font-family: var(--font-sans); outline: none; width: 100%; transition: border-color var(--transition-fast); }
.form-input:focus, .form-textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(91,138,240,0.10); }
.form-textarea { resize: vertical; line-height: 1.6; }
.section-footer { display: flex; justify-content: flex-end; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-border); }
@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } .form-group--full { grid-column: 1; } }
</style>

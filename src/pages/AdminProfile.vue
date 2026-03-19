<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/common/AppButton.vue'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const saving = ref(false)
const savingSettings = ref(false)
const savingCouple = ref(false)

const profile = ref({ nickname: '', email: '', bio: '', avatar: '' })
const avatarFile = ref<File | null>(null)
const avatarPreview = ref('')

const settings = ref({
  site_name: '', site_subtitle: '', site_description: '',
  owner_location: '', icp_number: '', owner_avatar: '',
})
const ownerAvatarFile = ref<File | null>(null)
const ownerAvatarPreview = ref('')

const showPassword = ref(false)
const coupleSettings = ref({
  couple_password: '',
  couple_since: '',
  person1_name: '',
  person1_avatar: '',
  person2_name: '',
  person2_avatar: '',
})
const person1AvatarFile = ref<File | null>(null)
const person1AvatarPreview = ref('')
const person2AvatarFile = ref<File | null>(null)
const person2AvatarPreview = ref('')

function handlePerson1Avatar(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  person1AvatarFile.value = file
  person1AvatarPreview.value = URL.createObjectURL(file)
}
function handlePerson2Avatar(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  person2AvatarFile.value = file
  person2AvatarPreview.value = URL.createObjectURL(file)
}

onMounted(async () => {
  if (!authStore.isLoggedIn) { router.push('/login'); return }
  const u = authStore.user!
  profile.value = { nickname: u.nickname, email: u.email, bio: u.bio, avatar: u.avatar }
  await authStore.fetchSiteSettings()
  const s = authStore.siteSettings!
  settings.value = {
    site_name: s.site_name, site_subtitle: s.site_subtitle,
    site_description: s.site_description, owner_location: s.owner_location,
    icp_number: s.icp_number, owner_avatar: s.owner_avatar,
  }
  coupleSettings.value = {
    couple_password: s.couple_password || '',
    couple_since: s.couple_since || '',
    person1_name: s.person1_name || '晨晨',
    person1_avatar: s.person1_avatar || '/images/couple-avatar-1.svg',
    person2_name: s.person2_name || '月月',
    person2_avatar: s.person2_avatar || '/images/couple-avatar-2.svg',
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
  try {
    await authStore.updateProfile({ ...profile.value, ...(avatarFile.value ? { avatar_file: avatarFile.value } : {}) })
    avatarFile.value = null; avatarPreview.value = ''
    toast.success('个人资料已保存')
  } catch (e) { toast.error(e instanceof Error ? e.message : '保存失败') }
  finally { saving.value = false }
}

async function saveSettings() {
  savingSettings.value = true
  try {
    await authStore.updateSiteSettings({
      site_name: settings.value.site_name, site_subtitle: settings.value.site_subtitle,
      site_description: settings.value.site_description, owner_location: settings.value.owner_location,
      icp_number: settings.value.icp_number, owner_avatar: settings.value.owner_avatar,
      ...(ownerAvatarFile.value ? { avatar_file: ownerAvatarFile.value } : {}),
    })
    ownerAvatarFile.value = null; ownerAvatarPreview.value = ''
    toast.success('网站配置已保存')
  } catch (e) { toast.error(e instanceof Error ? e.message : '保存失败') }
  finally { savingSettings.value = false }
}

async function saveCouple() {
  savingCouple.value = true
  try {
    let p1avatar = coupleSettings.value.person1_avatar
    let p2avatar = coupleSettings.value.person2_avatar
    if (person1AvatarFile.value) {
      try {
        const { uploadImage } = await import('@/api')
        p1avatar = await uploadImage(person1AvatarFile.value)
        person1AvatarFile.value = null; person1AvatarPreview.value = p1avatar
      } catch { toast.error('男主头像上传失败') }
    }
    if (person2AvatarFile.value) {
      try {
        const { uploadImage } = await import('@/api')
        p2avatar = await uploadImage(person2AvatarFile.value)
        person2AvatarFile.value = null; person2AvatarPreview.value = p2avatar
      } catch { toast.error('女主头像上传失败') }
    }
    await authStore.updateSiteSettings({
      couple_password: coupleSettings.value.couple_password,
      couple_since: coupleSettings.value.couple_since,
      person1_name: coupleSettings.value.person1_name,
      person1_avatar: p1avatar,
      person2_name: coupleSettings.value.person2_name,
      person2_avatar: p2avatar,
    })
    toast.success('情侣空间配置已保存 💕')
  } catch (e) { toast.error(e instanceof Error ? e.message : '保存失败') }
  finally { savingCouple.value = false }
}

function handleLogout() { authStore.logout(); router.push('/') }
</script>

<template>
  <div class="admin-page">
    <div class="admin-header">
      <button class="back-btn" @click="router.push('/')">← 返回首页</button>
      <h1 class="admin-title">⚙️ 管理设置</h1>
      <AppButton variant="ghost" @click="handleLogout">🔒 退出登录</AppButton>
    </div>
    <div class="admin-layout">

      <!-- 个人配置：个人资料 + 网站配置 -->
      <section class="admin-section glass-card">
        <h2 class="section-title">🧑 个人配置</h2>

        <div class="sub-section">
          <h3 class="sub-title">个人资料</h3>
          <div class="avatar-center">
            <img :src="avatarPreview || profile.avatar || '/images/avatar.svg'" alt="头像" class="avatar-img" />
            <label class="avatar-upload-btn">📷 更换头像<input type="file" accept="image/*" style="display:none" @change="handleAvatarChange" /></label>
            <span class="avatar-tip">账号：<strong>{{ authStore.user?.username }}</strong></span>
          </div>
          <div class="form-stack">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">昵称</label>
                <input v-model="profile.nickname" class="form-input" placeholder="你的昵称" />
              </div>
              <div class="form-group">
                <label class="form-label">邮箱</label>
                <input v-model="profile.email" class="form-input" type="email" placeholder="your@email.com" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">个人简介</label>
              <textarea v-model="profile.bio" class="form-textarea" rows="3" placeholder="介绍一下自己..." />
            </div>
          </div>
          <div class="sub-footer">
            <AppButton :loading="saving" @click="saveProfile">保存个人资料</AppButton>
          </div>
        </div>

        <div class="sub-divider" />

        <div class="sub-section">
          <h3 class="sub-title">网站配置</h3>
          <div class="avatar-center">
            <img :src="ownerAvatarPreview || settings.owner_avatar || '/images/avatar.svg'" alt="站主头像" class="avatar-img" />
            <label class="avatar-upload-btn">📷 更换头像<input type="file" accept="image/*" style="display:none" @change="handleOwnerAvatarChange" /></label>
            <span class="avatar-tip">首页展示的站主头像</span>
          </div>
          <div class="form-stack">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">网站名称</label>
                <input v-model="settings.site_name" class="form-input" placeholder="Luminary" />
              </div>
              <div class="form-group">
                <label class="form-label">所在城市</label>
                <input v-model="settings.owner_location" class="form-input" placeholder="深圳" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">网站副标题</label>
              <input v-model="settings.site_subtitle" class="form-input" placeholder="记录生活与技术" />
            </div>
            <div class="form-group">
              <label class="form-label">网站描述</label>
              <textarea v-model="settings.site_description" class="form-textarea" rows="3" placeholder="热爱生活，热爱代码..." />
            </div>
            <div class="form-group">
              <label class="form-label">ICP 备案号</label>
              <input v-model="settings.icp_number" class="form-input" placeholder="粤ICP备XXXXXXXX号" />
            </div>
          </div>
          <div class="sub-footer">
            <AppButton :loading="savingSettings" @click="saveSettings">保存网站配置</AppButton>
          </div>
        </div>
      </section>

      <!-- 情侣空间配置 -->
      <section class="admin-section glass-card couple-section">
        <h2 class="section-title">💕 情侣空间</h2>
        <div class="form-stack">
          <div class="form-group">
            <label class="form-label">访问密码</label>
            <div class="password-wrap">
              <input v-model="coupleSettings.couple_password" :type="showPassword ? 'text' : 'password'" class="form-input" placeholder="输入密码" />
              <button type="button" class="eye-btn" @click="showPassword = !showPassword">{{ showPassword ? '🙈' : '👁️' }}</button>
            </div>
            <span class="form-hint-text">进入情侣空间的验证密码</span>
          </div>
          <div class="form-group">
            <label class="form-label">在一起的日期</label>
            <input v-model="coupleSettings.couple_since" class="form-input" type="date" />
            <span class="form-hint-text">用于显示天数计数</span>
          </div>
          <div class="sub-divider" />
          <p class="sub-title">👦 男主配置</p>
          <div class="person-row">
            <div class="person-avatar-wrap">
              <img :src="person1AvatarPreview || coupleSettings.person1_avatar || '/images/couple-avatar-1.svg'" class="person-avatar" />
              <label class="avatar-upload-btn">📷 换头像<input type="file" accept="image/*" style="display:none" @change="handlePerson1Avatar" /></label>
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">昵称</label>
              <input v-model="coupleSettings.person1_name" class="form-input" placeholder="晨晨" />
            </div>
          </div>
          <div class="sub-divider" />
          <p class="sub-title">👧 女主配置</p>
          <div class="person-row">
            <div class="person-avatar-wrap">
              <img :src="person2AvatarPreview || coupleSettings.person2_avatar || '/images/couple-avatar-2.svg'" class="person-avatar" />
              <label class="avatar-upload-btn">📷 换头像<input type="file" accept="image/*" style="display:none" @change="handlePerson2Avatar" /></label>
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">昵称</label>
              <input v-model="coupleSettings.person2_name" class="form-input" placeholder="月月" />
            </div>
          </div>
        </div>
        <div class="section-footer">
          <AppButton variant="warm" :loading="savingCouple" @click="saveCouple">保存情侣配置 💕</AppButton>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.admin-page { max-width: 1200px; margin: 0 auto; padding: 32px 24px 60px; }
.admin-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
.back-btn { color: var(--color-text-muted); font-size: var(--text-sm); cursor: pointer; background: none; border: none; transition: color var(--transition-fast); }
.back-btn:hover { color: var(--color-primary); }
.admin-title { font-size: var(--text-xl); font-weight: 700; color: var(--color-text-primary); flex: 1; }
.admin-layout { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
.admin-section { padding: 28px; }
.section-title { font-size: var(--text-lg); font-weight: 700; color: var(--color-text-primary); margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--color-border); }

/* 子模块 */
.sub-section { }
.sub-title { font-size: var(--text-sm); font-weight: 700; color: var(--color-text-secondary); margin-bottom: 14px; }
.sub-divider { height: 1px; background: var(--color-border); margin: 20px 0; }
.sub-footer { display: flex; justify-content: flex-end; margin-top: 14px; }

.avatar-center { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 16px; }
.avatar-img { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 3px solid var(--color-border-strong); }
.avatar-upload-btn { display: inline-block; padding: 5px 12px; border-radius: var(--radius-full); border: 1.5px dashed var(--color-border); background: var(--color-bg-glass); font-size: var(--text-xs); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast); }
.avatar-upload-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.avatar-tip { font-size: var(--text-xs); color: var(--color-text-muted); }

.form-stack { display: flex; flex-direction: column; gap: 12px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-label { font-size: var(--text-xs); font-weight: 600; color: var(--color-text-secondary); }
.form-hint-text { font-size: var(--text-xs); color: var(--color-text-muted); }
.form-input, .form-textarea { padding: 9px 13px; background: var(--color-bg-glass); border: 1px solid var(--color-border); border-radius: var(--radius-lg); font-size: var(--text-sm); color: var(--color-text-primary); font-family: var(--font-sans); outline: none; width: 100%; transition: border-color var(--transition-fast); }
.form-input:focus, .form-textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(91,138,240,0.10); }
.form-textarea { resize: vertical; line-height: 1.6; }
.section-footer { display: flex; justify-content: flex-end; margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--color-border); }

/* 情侣空间 */
.couple-section { background: linear-gradient(135deg, rgba(232,96,122,0.04) 0%, rgba(240,160,91,0.04) 100%); border: 1px solid rgba(232,96,122,0.15); }
.couple-icon { font-size: 2.5rem; text-align: center; margin-bottom: 8px; }
.couple-desc { font-size: var(--text-sm); color: var(--color-text-muted); text-align: center; margin-bottom: 20px; }
.couple-preview { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(232,96,122,0.08); border-radius: var(--radius-lg); border: 1px solid rgba(232,96,122,0.15); }
.couple-preview__label { font-size: var(--text-xs); color: var(--color-text-muted); }
.couple-preview__date { font-size: var(--text-sm); font-weight: 600; color: #E8607A; }

.password-wrap { position: relative; display: flex; align-items: center; }
.password-wrap .form-input { padding-right: 40px; }
.eye-btn { position: absolute; right: 10px; background: none; border: none; cursor: pointer; font-size: 1rem; color: var(--color-text-muted); padding: 0; line-height: 1; }
.eye-btn:hover { color: var(--color-text-primary); }
.person-row { display: flex; align-items: center; gap: 14px; }
.person-avatar-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
.person-avatar { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(232,96,122,.3); }
@media (max-width: 900px) { .admin-layout { grid-template-columns: 1fr; } .form-row { grid-template-columns: 1fr; } }
</style>

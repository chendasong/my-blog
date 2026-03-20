<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AppButton from "@/components/common/AppButton.vue";
import { useToast } from "@/composables/useToast";

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const saving = ref(false);
const savingSettings = ref(false);
const savingCouple = ref(false);

const profile = ref({ nickname: "", email: "", bio: "", avatar: "" });
const avatarFile = ref<File | null>(null);
const avatarPreview = ref("");

const settings = ref({
  site_name: "",
  site_subtitle: "",
  site_description: "",
  owner_location: "",
  icp_number: "",
  owner_avatar: "",
  hero_background_image: "",
  hero_background_opacity: 0.7,
  music_urls: "",
  music_names: "",
  owner_nickname: "",
});
const ownerAvatarFile = ref<File | null>(null);
const ownerAvatarPreview = ref("");
const backgroundImageFile = ref<File | null>(null);
const backgroundImagePreview = ref("");
const musicFiles = ref<File[]>([]);
const musicFileNames = ref<string[]>([]);
const deletedMusicUrls = ref<string[]>([]);

const showPassword = ref(false);
const coupleSettings = ref({
  couple_password: "",
  couple_since: "",
  person1_name: "",
  person1_avatar: "",
  person2_name: "",
  person2_avatar: "",
});
const person1AvatarFile = ref<File | null>(null);
const person1AvatarPreview = ref("");
const person2AvatarFile = ref<File | null>(null);
const person2AvatarPreview = ref("");

function handlePerson1Avatar(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  person1AvatarFile.value = file;
  person1AvatarPreview.value = URL.createObjectURL(file);
}
function handlePerson2Avatar(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  person2AvatarFile.value = file;
  person2AvatarPreview.value = URL.createObjectURL(file);
}

onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.push("/login");
    return;
  }
  const u = authStore.user!;
  profile.value = {
    nickname: u.nickname,
    email: u.email,
    bio: u.bio,
    avatar: u.avatar,
  };
  await authStore.fetchSiteSettings();
  const s = authStore.siteSettings!;
  settings.value = {
    site_name: s.site_name,
    site_subtitle: s.site_subtitle,
    site_description: s.site_description,
    owner_location: s.owner_location,
    icp_number: s.icp_number,
    owner_avatar: s.owner_avatar,
    hero_background_image: s.hero_background_image || "",
    hero_background_opacity: s.hero_background_opacity || 0.7,
    music_urls: s.music_urls || "",
    music_names: s.music_names || "",
    owner_nickname: s.owner_nickname || "",
  };
  coupleSettings.value = {
    couple_password: s.couple_password || "",
    couple_since: s.couple_since || "",
    person1_name: s.person1_name || "晨晨",
    person1_avatar: s.person1_avatar || "/images/couple-avatar-1.svg",
    person2_name: s.person2_name || "月月",
    person2_avatar: s.person2_avatar || "/images/couple-avatar-2.svg",
  };
});

function handleAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  avatarFile.value = file;
  avatarPreview.value = URL.createObjectURL(file);
}

function handleOwnerAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  ownerAvatarFile.value = file;
  ownerAvatarPreview.value = URL.createObjectURL(file);
}

function handleBackgroundImageChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  backgroundImageFile.value = file;
  backgroundImagePreview.value = URL.createObjectURL(file);
}

function handleMusicFilesChange(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files || []);
  if (!files.length) return;
  musicFiles.value.push(...files);
  musicFileNames.value.push(...files.map((f) => f.name));
  (e.target as HTMLInputElement).value = "";
}

function removeMusicFile(index: number) {
  musicFiles.value.splice(index, 1);
  musicFileNames.value.splice(index, 1);
}

function removeSavedMusic(index: number) {
  const urls = settings.value.music_urls.split('\n').filter(url => url.trim())
  const names = settings.value.music_names.split('\n').filter(name => name.trim())
  
  // 记录被删除的URL
  const deletedUrl = urls[index]
  if (deletedUrl) {
    deletedMusicUrls.value.push(deletedUrl)
  }
  
  urls.splice(index, 1)
  names.splice(index, 1)
  settings.value.music_urls = urls.join('\n')
  settings.value.music_names = names.join('\n')
}

async function cleanupDeletedMusic(oldUrls: string[], newUrls: string[]) {
  const oldSet = new Set(oldUrls)
  const newSet = new Set(newUrls)
  const deletedUrls = Array.from(oldSet).filter(url => !newSet.has(url))
  
  if (deletedUrls.length > 0) {
    try {
      const { coupleApi } = await import('@/api')
      await coupleApi.deleteFiles(deletedUrls)
    } catch (err) {
      console.error('清理删除的音乐文件失败:', err)
    }
  }
}

async function handleMusicCleanup(musicUrls: string) {
  const oldMusicUrls = settings.value.music_urls.split('\n').filter(url => url.trim())
  const newMusicUrls = musicUrls.split('\n').filter(url => url.trim())
  await cleanupDeletedMusic(oldMusicUrls, newMusicUrls)
}

async function saveProfile() {
  saving.value = true;
  try {
    await authStore.updateProfile({
      ...profile.value,
      ...(avatarFile.value ? { avatar_file: avatarFile.value } : {}),
    });
    avatarFile.value = null;
    avatarPreview.value = "";
    toast.success("个人资料已保存");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "保存失败");
  } finally {
    saving.value = false;
  }
}

async function saveSettings() {
  savingSettings.value = true
  try {
    // 保存旧的音乐URL列表（用于后续清理）
    const oldMusicUrls = settings.value.music_urls.split('\n').filter(url => url.trim())
    
    let musicUrls = settings.value.music_urls
    let musicNames = settings.value.music_names
    
    // 上传新的音乐文件
    if (musicFiles.value.length > 0) {
      const { coupleApi } = await import('@/api')
      const uploadedUrls: string[] = []
      const uploadedNames: string[] = []
      for (let i = 0; i < musicFiles.value.length; i++) {
        const file = musicFiles.value[i]
        try {
          const url = await coupleApi.uploadImage(file)
          uploadedUrls.push(url)
          uploadedNames.push(file.name)
        } catch (err) {
          toast.error(`音乐文件 ${file.name} 上传失败`)
          return
        }
      }
      // 将新上传的URL添加到现有的URL列表中
      const existingUrls = musicUrls.split('\n').filter(url => url.trim())
      const existingNames = musicNames.split('\n').filter(name => name.trim())
      musicUrls = [...existingUrls, ...uploadedUrls].join('\n')
      musicNames = [...existingNames, ...uploadedNames].join('\n')
      musicFiles.value = []
      musicFileNames.value = []
    }

    await authStore.updateSiteSettings({
      site_name: settings.value.site_name,
      site_subtitle: settings.value.site_subtitle,
      site_description: settings.value.site_description,
      owner_location: settings.value.owner_location,
      icp_number: settings.value.icp_number,
      owner_avatar: settings.value.owner_avatar,
      hero_background_image: settings.value.hero_background_image,
      hero_background_opacity: settings.value.hero_background_opacity,
      music_urls: musicUrls,
      music_names: musicNames,
      owner_nickname: settings.value.owner_nickname,
      ...(ownerAvatarFile.value ? { avatar_file: ownerAvatarFile.value } : {}),
      ...(backgroundImageFile.value
        ? { background_file: backgroundImageFile.value }
        : {}),
    });
    
    // 清理删除的音乐文件
    console.log('需要删除的URL:', deletedMusicUrls.value)
    if (deletedMusicUrls.value.length > 0) {
      const { coupleApi } = await import('@/api')
      console.log('开始删除文件...')
      await coupleApi.deleteFiles(deletedMusicUrls.value)
      console.log('文件删除完成')
      deletedMusicUrls.value = []
    }
    
    // 更新本地settings以回显
    settings.value.music_urls = musicUrls;
    settings.value.music_names = musicNames;
    if (backgroundImageFile.value) {
      settings.value.hero_background_image = backgroundImagePreview.value;
    }
    // 清空已上传的文件列表
    musicFiles.value = [];
    musicFileNames.value = [];
    ownerAvatarFile.value = null;
    ownerAvatarPreview.value = "";
    backgroundImageFile.value = null;
    backgroundImagePreview.value = "";
    toast.success("网站配置已保存");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "保存失败");
  } finally {
    savingSettings.value = false;
  }
}

async function saveCouple() {
  savingCouple.value = true;
  try {
    let p1avatar = coupleSettings.value.person1_avatar;
    let p2avatar = coupleSettings.value.person2_avatar;
    if (person1AvatarFile.value) {
      try {
        const { uploadImage } = await import("@/api");
        p1avatar = await uploadImage(person1AvatarFile.value);
        person1AvatarFile.value = null;
        person1AvatarPreview.value = p1avatar;
      } catch {
        toast.error("男主头像上传失败");
      }
    }
    if (person2AvatarFile.value) {
      try {
        const { uploadImage } = await import("@/api");
        p2avatar = await uploadImage(person2AvatarFile.value);
        person2AvatarFile.value = null;
        person2AvatarPreview.value = p2avatar;
      } catch {
        toast.error("女主头像上传失败");
      }
    }
    await authStore.updateSiteSettings({
      couple_password: coupleSettings.value.couple_password,
      couple_since: coupleSettings.value.couple_since,
      person1_name: coupleSettings.value.person1_name,
      person1_avatar: p1avatar,
      person2_name: coupleSettings.value.person2_name,
      person2_avatar: p2avatar,
    });
    toast.success("情侣空间配置已保存 💕");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "保存失败");
  } finally {
    savingCouple.value = false;
  }
}

function handleLogout() {
  authStore.logout();
  router.push("/");
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-header">
      <button class="back-btn" @click="router.push('/')">← 返回首页</button>
      <h1 class="admin-title">⚙️ 管理设置</h1>
      <!-- <AppButton variant="ghost" @click="handleLogout">🔒 退出登录</AppButton> -->
    </div>
    <div class="admin-layout">
      <!-- 个人配置：个人资料 + 网站配置 -->
      <section class="admin-section glass-card">
        <h2 class="section-title">🧑 配置中心</h2>

        <div class="sub-section">
          <h3 class="sub-title">个人资料</h3>
          <div class="avatar-wrapper">
            <div class="avatar-center">
              <img
                :src="avatarPreview || profile.avatar || '/images/avatar.svg'"
                alt="头像"
                class="avatar-img"
              />
              <label class="avatar-upload-btn"
                >📷 更换头像<input
                  type="file"
                  accept="image/*"
                  style="display: none"
                  @change="handleAvatarChange"
              /></label>
              <span class="avatar-tip"
                >账号：<strong>{{ authStore.user?.username }}</strong></span
              >
            </div>
            <div class="form-stack">
              <div class="form-group">
                <label class="form-label">昵称</label>
                <input
                  v-model="profile.nickname"
                  class="form-input"
                  placeholder="你的昵称"
                />
              </div>
              <div class="form-group">
                <label class="form-label">邮箱</label>
                <input
                  v-model="profile.email"
                  class="form-input"
                  type="email"
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">个人简介</label>
            <textarea
              v-model="profile.bio"
              class="form-textarea"
              rows="3"
              placeholder="介绍一下自己..."
            />
          </div>
          <div class="sub-footer">
            <AppButton :loading="saving" @click="saveProfile"
              >保存个人资料</AppButton
            >
          </div>
        </div>

        <div class="sub-divider" />

        <div class="sub-section-wzpz">
          <h3 class="sub-title">网站配置</h3>
          <div class="form-stack">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">网站名称</label>
                <input
                  v-model="settings.site_name"
                  class="form-input"
                  placeholder="Luminary"
                />
              </div>
              <div class="form-group">
                <label class="form-label">所在城市</label>
                <input
                  v-model="settings.owner_location"
                  class="form-input"
                  placeholder="深圳"
                />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">网站副标题</label>
              <input
                v-model="settings.site_subtitle"
                class="form-input"
                placeholder="记录生活与技术"
              />
            </div>
            <div class="form-group">
              <label class="form-label">网站描述</label>
              <textarea
                v-model="settings.site_description"
                class="form-textarea"
                rows="3"
                placeholder="热爱生活，热爱代码..."
              />
            </div>
            <div class="form-group">
              <label class="form-label">ICP 备案号</label>
              <input
                v-model="settings.icp_number"
                class="form-input"
                placeholder="粤ICP备XXXXXXXX号"
              />
            </div>
          </div>
          <div>
            <label class="form-label">所有者昵称</label>
            <input
              v-model="settings.owner_nickname"
              class="form-input"
              placeholder="例如：晨光"
            />
          </div>
        </div>

        <!-- <div class="sub-divider" /> -->

        <div class="hero-config">
          <div>
            <h3 class="sub-title">🎨 首页背景</h3>
            <div class="bg-preview-wrap">
              <div
                v-if="backgroundImagePreview || settings.hero_background_image"
                class="bg-preview"
                :style="{
                  backgroundImage: `url('${backgroundImagePreview || settings.hero_background_image}')`,
                }"
              />
              <div v-else class="bg-preview bg-preview--empty">暂无背景图</div>
              <label class="avatar-upload-btn"
                >📷 选择背景图<input
                  type="file"
                  accept="image/*"
                  style="display: none"
                  @change="handleBackgroundImageChange"
              /></label>
            </div>
            <div class="form-stack">
              <div class="form-group">
                <label class="form-label">背景透明度</label>
                <div class="opacity-control">
                  <input
                    v-model.number="settings.hero_background_opacity"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    class="opacity-slider"
                  />
                  <span class="opacity-value"
                    >{{
                      (settings.hero_background_opacity * 100).toFixed(0)
                    }}%</span
                  >
                </div>
                <span class="form-hint-text"
                  >调整背景图片的透明度（0-100%）</span
                >
              </div>
            </div>
          </div>

          <div>
            <h3 class="sub-title">🎵 背景音乐</h3>
            <div class="form-stack">
              <div class="form-group">
                <label class="avatar-upload-btn music-upload-btn">
                  🎵 选择音乐文件（支持多选）
                  <input
                    type="file"
                    accept="audio/*"
                    multiple
                    style="display: none"
                    @change="handleMusicFilesChange"
                  />
                </label>
                <span class="form-hint-text"
                  >支持 MP3、WAV、OGG 等音频格式</span
                >
              </div>
              <div
                v-if="musicFileNames.length > 0 || settings.music_names"
                class="music-list"
              >
                <div class="music-list-title">
                  {{
                    musicFileNames.length > 0
                      ? "已选择的音乐文件："
                      : "已保存的音乐文件："
                  }}
                </div>
                <div v-if="musicFileNames.length > 0">
                  <div
                    v-for="(name, idx) in musicFileNames"
                    :key="'new-' + idx"
                    class="music-item"
                  >
                    <span class="music-item__name">{{ name }}</span>
                    <button
                      type="button"
                      class="music-item__remove"
                      @click="removeMusicFile(idx)"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div v-if="settings.music_names">
                  <div
                    v-for="(name, idx) in settings.music_names
                      .split('\n')
                      .filter((n) => n.trim())"
                    :key="'saved-' + idx"
                    class="music-item"
                  >
                    <span class="music-item__name">{{ name }}</span>
                    <button type="button" class="music-item__remove" @click="removeSavedMusic(idx)">✕</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="sub-footer" style="grid-column: 1 / -1">
          <AppButton :loading="savingSettings" @click="saveSettings"
            >保存网站配置</AppButton
          >
        </div>
      </section>

      <!-- 情侣空间配置 -->
      <section class="admin-section glass-card couple-section">
        <h2 class="section-title">💕 情侣空间</h2>
        <div class="form-stack">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">访问密码</label>
              <div class="password-wrap">
                <input
                  v-model="coupleSettings.couple_password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-input"
                  placeholder="输入密码"
                />
                <button
                  type="button"
                  class="eye-btn"
                  @click="showPassword = !showPassword"
                >
                  {{ showPassword ? "🙈" : "👁️" }}
                </button>
              </div>
              <span class="form-hint-text">进入情侣空间的验证密码</span>
            </div>
            <div class="form-group">
              <label class="form-label">在一起的日期</label>
              <input
                v-model="coupleSettings.couple_since"
                class="form-input"
                type="date"
              />
              <span class="form-hint-text">用于显示天数计数</span>
            </div>
          </div>
        </div>

        <div class="sub-divider" />

        <div class="form-row">
          <div>
            <p class="sub-title">👦 男主配置</p>
            <div class="person-row">
              <div class="person-avatar-wrap">
                <img
                  :src="
                    person1AvatarPreview ||
                    coupleSettings.person1_avatar ||
                    '/images/couple-avatar-1.svg'
                  "
                  class="person-avatar"
                />
                <label class="avatar-upload-btn"
                  >📷 换头像<input
                    type="file"
                    accept="image/*"
                    style="display: none"
                    @change="handlePerson1Avatar"
                /></label>
              </div>
              <div class="form-group" style="flex: 1">
                <label class="form-label">昵称</label>
                <input
                  v-model="coupleSettings.person1_name"
                  class="form-input"
                  placeholder="晨晨"
                />
              </div>
            </div>
          </div>

          <div>
            <p class="sub-title">👧 女主配置</p>
            <div class="person-row">
              <div class="person-avatar-wrap">
                <img
                  :src="
                    person2AvatarPreview ||
                    coupleSettings.person2_avatar ||
                    '/images/couple-avatar-2.svg'
                  "
                  class="person-avatar"
                />
                <label class="avatar-upload-btn"
                  >📷 换头像<input
                    type="file"
                    accept="image/*"
                    style="display: none"
                    @change="handlePerson2Avatar"
                /></label>
              </div>
              <div class="form-group" style="flex: 1">
                <label class="form-label">昵称</label>
                <input
                  v-model="coupleSettings.person2_name"
                  class="form-input"
                  placeholder="月月"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="section-footer">
          <AppButton variant="warm" :loading="savingCouple" @click="saveCouple"
            >保存情侣配置 💕</AppButton
          >
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  width: 800px;
  margin: 0 auto;
  padding: 32px 24px 60px;
}
.admin-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}
.back-btn {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  cursor: pointer;
  background: none;
  border: none;
  transition: color var(--transition-fast);
}
.back-btn:hover {
  color: var(--color-primary);
}
.admin-title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  flex: 1;
}
.admin-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  align-items: start;
}
.admin-section {
  padding: 28px;
}
.section-title {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

/* 子模块 */
.sub-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}
.sub-section:first-of-type {
  grid-template-columns: 1fr;
}
.sub-section:nth-of-type(2) {
  grid-template-columns: 1fr;
}
.sub-title {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text-secondary);
  margin-bottom: 14px;
}
.sub-divider {
  height: 1px;
  background: var(--color-border);
  margin: 32px 0;
  grid-column: 1 / -1;
}

/* 首页背景和音乐配置 */
.hero-config {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;
  margin-top: 20px;
}
.hero-config > div {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.hero-config .sub-title {
  margin-bottom: 14px;
}
.hero-config .form-stack {
  gap: 12px;
}
.sub-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
.avatar-wrapper{
  display: flex;
  justify-content: center;
  gap: 60px;
}
.avatar-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.avatar-img {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--color-border-strong);
}
.avatar-upload-btn {
  display: inline-block;
  padding: 5px 12px;
  border-radius: var(--radius-full);
  border: 1.5px dashed var(--color-border);
  background: var(--color-bg-glass);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.avatar-upload-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.avatar-tip {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.form-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.form-row--three {
  grid-template-columns: 1fr 1fr 1fr;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.form-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
}
.form-hint-text {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
.form-input,
.form-textarea {
  padding: 9px 13px;
  background: var(--color-bg-glass);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  outline: none;
  width: 100%;
  transition: border-color var(--transition-fast);
}
.form-input:focus,
.form-textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(91, 138, 240, 0.1);
}
.form-textarea {
  resize: vertical;
  line-height: 1.6;
}
.section-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
}

/* 情侣空间 */
.couple-section {
  background: linear-gradient(
    135deg,
    rgba(232, 96, 122, 0.04) 0%,
    rgba(240, 160, 91, 0.04) 100%
  );
  border: 1px solid rgba(232, 96, 122, 0.15);
}
.couple-section .sub-section {
  grid-template-columns: 1fr 1fr;
}
.couple-icon {
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 8px;
}
.couple-desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-align: center;
  margin-bottom: 20px;
}
.couple-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(232, 96, 122, 0.08);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(232, 96, 122, 0.15);
}
.couple-preview__label {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
.couple-preview__date {
  font-size: var(--text-sm);
  font-weight: 600;
  color: #e8607a;
}

.password-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.password-wrap .form-input {
  padding-right: 40px;
}
.eye-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: var(--color-text-muted);
  padding: 0;
  line-height: 1;
}
.eye-btn:hover {
  color: var(--color-text-primary);
}
.person-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.person-avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.person-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(232, 96, 122, 0.3);
}

.bg-preview-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.bg-preview {
  width: 100%;
  height: 150px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background-size: cover;
  background-position: center;
}
.bg-preview--empty {
  background: var(--color-bg-glass);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.opacity-control {
  display: flex;
  align-items: center;
  gap: 12px;
}
.opacity-slider {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: rgba(91, 138, 240, 0.1);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}
.opacity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b8af0 0%, #8b6ff0 100%);
  cursor: pointer;
}
.opacity-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b8af0 0%, #8b6ff0 100%);
  cursor: pointer;
  border: none;
}
.opacity-value {
  min-width: 45px;
  text-align: right;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

.music-upload-btn {
  display: block;
  text-align: center;
  padding: 12px 16px;
}
.music-list {
  margin-top: 12px;
  padding: 12px;
  background: var(--color-bg-glass);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}
.music-list-title {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}
.music-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-md);
  margin-bottom: 6px;
  gap: 8px;
}

.music-item__name {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
}
.music-item:last-child {
  margin-bottom: 0;
}
.music-item__name {
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.music-item__remove {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 1rem;
  padding: 0 4px;
  transition: color var(--transition-fast);
}
.music-item__remove:hover {
  color: #e8607a;
}

@media (max-width: 900px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

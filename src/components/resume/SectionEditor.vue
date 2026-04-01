<script setup lang="ts">
import { ref, nextTick } from "vue";
import type { Directive } from "vue";
import type { ResumeSection } from "@/types/resume";
import { ensureHttpUrlForAssets } from "@/lib/qiniuClient";
import { syncTextareaHeight } from "@/lib/autoResizeTextarea";

function textareaMinPx(el: HTMLTextAreaElement): number {
  const rows = parseInt(el.getAttribute("rows") || "2", 10);
  const padY = 16;
  return padY + Math.round(14 * 1.35 * Math.max(rows, 1));
}

const vAutosize: Directive<HTMLTextAreaElement> = {
  mounted(el) {
    const run = () => syncTextareaHeight(el, textareaMinPx(el), Number.POSITIVE_INFINITY);
    el.addEventListener("input", run);
    (el as HTMLTextAreaElement & { _resumeAutosize?: () => void })._resumeAutosize = run;
    nextTick(run);
  },
  updated(el) {
    syncTextareaHeight(el, textareaMinPx(el), Number.POSITIVE_INFINITY);
  },
  unmounted(el) {
    const fn = (el as HTMLTextAreaElement & { _resumeAutosize?: () => void })._resumeAutosize;
    if (fn) el.removeEventListener("input", fn);
  },
};

interface Props {
  section: ResumeSection;
}

interface Emits {
  (e: "update", section: ResumeSection): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const avatarInput = ref<HTMLInputElement>();

const addItem = (type: string) => {
  if (!props.section.content.items) {
    props.section.content.items = [];
  }
  const newItem: any = { id: `item-+${Date.now()}` };
  switch (type) {
    case "education":
      newItem.school = "";
      newItem.degree = "";
      newItem.field = "";
      newItem.startDate = "";
      newItem.endDate = "";
      break;
    case "experience":
      newItem.company = "";
      newItem.position = "";
      newItem.startDate = "";
      newItem.endDate = "";
      break;
    case "skill":
      newItem.skill = "";
      break;
    case "project":
      newItem.name = "";
      newItem.description = "";
      newItem.link = "";
      break;
    case "award":
      newItem.title = "";
      newItem.issuer = "";
      newItem.date = "";
      newItem.description = "";
      break;
    case "certification":
      newItem.name = "";
      newItem.issuer = "";
      newItem.date = "";
      newItem.credentialId = "";
      newItem.credentialUrl = "";
      break;
  }
  props.section.content.items.push(newItem);
  emit("update", props.section);
};

const removeItem = (index: number | string) => {
  if (props.section.content.items) {
    props.section.content.items.splice(index, 1);
    emit("update", props.section);
  }
};

const handleAvatarUpload = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      props.section.content.avatar = result;
      emit("update", props.section);
    };
    reader.readAsDataURL(file);
  }
};

const removeAvatar = () => {
  props.section.content.avatar = '';
  emit("update", props.section);
  if (avatarInput.value) {
    avatarInput.value.value = '';
  }
};

const handleChange = () => {
  emit("update", props.section);
};
</script>

<template>
  <div class="section-editor">
    <div class="editor-header">
      <h2 class="editor-section-title">{{ section.title }}</h2>
    </div>
    <div v-if="section.type === 'basic'" class="editor-form">
      <div class="form-group">
        <label class="form-label">头像</label>
        <div class="avatar-upload-container">
          <div class="avatar-upload-row">
            <div class="avatar-preview" @click="avatarInput?.click()">
              <img v-if="section.content.avatar" :src="ensureHttpUrlForAssets(section.content.avatar)" :alt="section.content.name" class="avatar-image" />
              <div v-else class="avatar-placeholder">
                <span class="placeholder-icon">📷</span>
                <span class="placeholder-text">上传头像</span>
              </div>
            </div>
            <div class="upload-controls">
              <input ref="avatarInput" type="file" accept="image/*" class="avatar-file-input" @change="handleAvatarUpload" />
              <button type="button" @click="avatarInput?.click()" class="btn-upload">选择图片</button>
              <button v-if="section.content.avatar" type="button" @click="removeAvatar" class="btn-remove-avatar">删除</button>
            </div>
          </div>
          <p class="upload-hint">支持 JPG、PNG、GIF 格式，建议尺寸 200×200px，最大 5MB</p>
        </div>
      </div>
      <div class="form-group"><label class="form-label">姓名</label><input v-model="section.content.name" type="text" class="form-input" @change="handleChange" /></div>
      <div class="form-group"><label class="form-label">求职岗位</label><input v-model="section.content.title" type="text" class="form-input" @change="handleChange" /></div>
      <div class="form-group"><label class="form-label">工作年限</label><input v-model="section.content.workYears" type="text" class="form-input" @change="handleChange" /></div>
      <div class="form-group"><label class="form-label">状态</label><input v-model="section.content.status" type="text" class="form-input" @change="handleChange" /></div>
      <div class="form-group"><label class="form-label">邮箱</label><input v-model="section.content.email" type="email" class="form-input" @change="handleChange" /></div>
      <div class="form-group"><label class="form-label">电话</label><input v-model="section.content.phone" type="tel" class="form-input" @change="handleChange" /></div>
      <div class="form-group"><label class="form-label">籍贯</label><input v-model="section.content.location" type="text" class="form-input" @change="handleChange" /></div>
    </div>
    <div v-else-if="section.type === 'education'" class="editor-form">
      <div v-for="(item, index) in section.content.items" :key="item.id" class="item-card">
        <div class="item-header">
          <h4>{{ item.school || '新学校' }}</h4><button @click="removeItem(index)" class="btn-remove">✕</button>
        </div>
        <div class="form-group"><label class="form-label">学校</label><input v-model="item.school" type="text" class="form-input" @change="handleChange" /></div>
        <div class="form-group"><label class="form-label">学位</label><input v-model="item.degree" type="text" class="form-input" @change="handleChange" /></div>
        <div class="form-group"><label class="form-label">专业</label><input v-model="item.field" type="text" class="form-input" @change="handleChange" /></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">开始日期</label><input v-model="item.startDate" type="month" class="form-input" @change="handleChange" /></div>
          <div class="form-group"><label class="form-label">结束日期</label><input v-model="item.endDate" type="month" class="form-input" @change="handleChange" /></div>
        </div>
        <div class="form-group"><label class="form-label">描述</label><textarea v-model="item.description" v-autosize class="form-textarea" rows="2" @change="handleChange"></textarea></div>
      </div>
      <button @click="addItem('education')" class="btn-add">+ 添加教育背景</button>
    </div>
    <div v-else-if="section.type === 'experience'" class="editor-form">
      <div v-for="(item, index) in section.content.items" :key="item.id" class="item-card">
        <div class="item-header">
          <h4>{{ item.company || '新公司' }}</h4><button @click="removeItem(index)" class="btn-remove">✕</button>
        </div>
        <div class="form-group"><label class="form-label">公司</label><input v-model="item.company" type="text" class="form-input" @change="handleChange" /></div>
        <div class="form-group"><label class="form-label">职位</label><input v-model="item.position" type="text" class="form-input" @change="handleChange" /></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">开始日期</label><input v-model="item.startDate" type="month" class="form-input" @change="handleChange" /></div>
          <div class="form-group"><label class="form-label">结束日期</label><input v-model="item.endDate" type="month" class="form-input" @change="handleChange" /></div>
        </div>
        <div class="form-group"><label class="form-label">描述</label><textarea v-model="item.description" v-autosize class="form-textarea" rows="2" @change="handleChange"></textarea></div>
      </div>
      <button @click="addItem('experience')" class="btn-add">+ 添加工作经历</button>
    </div>
    <div v-else-if="section.type === 'skills'" class="editor-form">
      <div v-for="(item, index) in section.content.items" :key="item.id" class="item-card">
        <div class="item-header">
          <h4>技能</h4><button @click="removeItem(index)" class="btn-remove">✕</button>
        </div>
        <div class="form-group"><textarea v-model="item.skill" v-autosize class="form-textarea" rows="2" placeholder="支持换行" @change="handleChange"></textarea></div>
      </div>
      <button @click="addItem('skill')" class="btn-add">+ 添加技能</button>
    </div>
    <div v-else-if="section.type === 'projects'" class="editor-form">
      <div v-for="(item, index) in section.content.items" :key="item.id" class="item-card">
        <div class="item-header">
          <h4>{{ item.name || '新项目' }}</h4><button @click="removeItem(index)" class="btn-remove">✕</button>
        </div>
        <div class="form-group"><label class="form-label">项目名称</label><input v-model="item.name" type="text" class="form-input" @change="handleChange" /></div>
        <div class="form-group"><label class="form-label">描述</label><textarea v-model="item.description" v-autosize class="form-textarea" rows="2" @change="handleChange"></textarea></div>
        <div class="form-group"><label class="form-label">项目链接</label><input v-model="item.link" type="url" class="form-input" placeholder="https://..." @change="handleChange" /></div>
      </div>
      <button @click="addItem('project')" class="btn-add">+ 添加项目</button>
    </div>
    <div v-else-if="section.type === 'awards'" class="editor-form">
      <div v-for="(item, index) in section.content.items" :key="item.id" class="item-card">
        <div class="item-header">
          <h4>{{ item.title || '新奖项' }}</h4><button @click="removeItem(index)" class="btn-remove">✕</button>
        </div>
        <div class="form-group"><label class="form-label">奖项名称</label><input v-model="item.title" type="text" class="form-input" @change="handleChange" /></div>
        <div class="form-group"><label class="form-label">颁发机构</label><input v-model="item.issuer" type="text" class="form-input" @change="handleChange" /></div>
        <div class="form-group"><label class="form-label">获奖日期</label><input v-model="item.date" type="month" class="form-input" @change="handleChange" /></div>
        <div class="form-group"><label class="form-label">描述</label><textarea v-model="item.description" v-autosize class="form-textarea" rows="2" @change="handleChange"></textarea></div>
      </div>
      <button @click="addItem('award')" class="btn-add">+ 添加奖项</button>
    </div>
    <div v-else-if="section.type === 'certifications'" class="editor-form">
      <div v-for="(item, index) in section.content.items" :key="item.id" class="item-card">
        <div class="item-header">
          <h4>{{ item.name || '新证书' }}</h4><button @click="removeItem(index)" class="btn-remove">✕</button>
        </div>
        <div class="form-group"><label class="form-label">证书名称</label><input v-model="item.name" type="text" class="form-input" @change="handleChange" /></div>
        <div class="form-group"><label class="form-label">颁发机构</label><input v-model="item.issuer" type="text" class="form-input" @change="handleChange" /></div>
        <div class="form-group"><label class="form-label">获证日期</label><input v-model="item.date" type="month" class="form-input" @change="handleChange" /></div>
        <div class="form-group"><label class="form-label">凭证ID</label><input v-model="item.credentialId" type="text" class="form-input" placeholder="可选" @change="handleChange" /></div>
        <div class="form-group"><label class="form-label">凭证链接</label><input v-model="item.credentialUrl" type="url" class="form-input" placeholder="可选" @change="handleChange" /></div>
      </div>
      <button @click="addItem('certification')" class="btn-add">+ 添加证书</button>
    </div>
    <div v-else-if="section.type === 'introduction'" class="editor-form">
      <div class="form-group"><label class="form-label">个人介绍</label><textarea v-model="section.content.text" v-autosize class="form-textarea" rows="6" placeholder="介绍你自己..." @change="handleChange"></textarea></div>
    </div>
    <div v-else class="editor-form">
      <p class="text-muted">此模块类型暂不支持编辑</p>
    </div>
  </div>
</template>

<style scoped>
.section-editor {
  height: 100%;
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column
}
.editor-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--color-primary)
}
.editor-section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary)
}
.editor-form {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0
}
.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary)
}
.form-input,
.form-textarea {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-family: inherit;
  transition: all 0.2s ease;
  box-sizing: border-box
}

.form-textarea {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  resize: vertical;
  overflow-y: hidden;
  overflow-wrap: break-word;
  word-break: break-word;
  line-height: 1.35
}
.form-input:focus,
.form-textarea:focus {
  outline: 0;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(91, 138, 240, 0.1)
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px
}
.item-card {
  padding: 16px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0
}
.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px
}
.item-header h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0
}
.btn-remove {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem
}
.btn-remove:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5)
}
.btn-add {
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(91, 138, 240, 0.1);
  color: var(--color-primary);
  border: 1px dashed var(--color-primary)
}
.btn-add:hover {
  background: rgba(91, 138, 240, 0.2)
}
.avatar-upload-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md)
}
.avatar-upload-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.avatar-preview {
  width: 80px;
  height: 96px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-card);
  border: 2px dashed var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease
}
.avatar-preview:hover {
  border-color: var(--color-primary);
  background: rgba(91, 138, 240, 0.05)
}
.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover
}
.avatar-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--color-text-muted)
}
.placeholder-icon {
  font-size: 2rem
}
.placeholder-text {
  font-size: 0.75rem;
  text-align: center
}
.upload-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 128px;
  flex: 0 0 auto;
}
.avatar-file-input {
  display: none
}
.btn-upload {
  width: 100%;
  padding: 8px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--color-bg-card)
}
.btn-upload:hover {
  background: rgba(91, 138, 240, 0.1);
  border-color: var(--color-primary);
  color: var(--color-primary)
}
.btn-remove-avatar {
  width: 100%;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444
}
.btn-remove-avatar:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5)
}
.upload-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
  max-width: 100%
}
.text-muted {
  color: var(--color-text-muted);
  text-align: center;
  padding: 40px 20px
}
</style>

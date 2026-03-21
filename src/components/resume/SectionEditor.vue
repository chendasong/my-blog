<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ResumeSection } from '@/types/resume'

interface Props {
  section: ResumeSection
}

interface Emits {
  (e: 'update', section: ResumeSection): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const editingSection = ref<ResumeSection>(JSON.parse(JSON.stringify(props.section)))

watch(() => props.section, (newSection) => {
  editingSection.value = JSON.parse(JSON.stringify(newSection))
}, { deep: true })

const handleUpdate = () => {
  emit('update', editingSection.value)
}

const addItem = (type: string) => {
  if (!editingSection.value.content.items) {
    editingSection.value.content.items = []
  }
  const newItem: any = { id: `item-${Date.now()}` }
  switch (type) {
    case 'education': newItem.school = ''; newItem.degree = ''; newItem.field = ''; newItem.startDate = ''; newItem.endDate = ''; break
    case 'experience': newItem.company = ''; newItem.position = ''; newItem.startDate = ''; newItem.endDate = ''; break
    case 'skill': newItem.category = ''; newItem.skills = []; break
    case 'project': newItem.name = ''; newItem.description = ''; newItem.technologies = []; break
    case 'award': newItem.title = ''; newItem.issuer = ''; newItem.date = ''; newItem.description = ''; break
    case 'language': newItem.language = ''; newItem.proficiency = 'intermediate'; break
    case 'certification': newItem.name = ''; newItem.issuer = ''; newItem.date = ''; newItem.credentialId = ''; newItem.credentialUrl = ''; break
  }
  editingSection.value.content.items.push(newItem)
}

const removeItem = (index: number) => {
  if (editingSection.value.content.items) {
    editingSection.value.content.items.splice(index, 1)
  }
}

const proficiencyOptions = ['beginner', 'intermediate', 'advanced', 'fluent']
const proficiencyLabels: Record<string, string> = {
  beginner: '初级', intermediate: '中级', advanced: '高级', fluent: '精通',
}
</script>

<template>
  <div class="section-editor">
    <div class="editor-header"><h2 class="editor-section-title">{{ section.title }}</h2></div>
    <div v-if="section.type === 'basic'" class="editor-form">
      <div class="form-group"><label class="form-label">姓名</label><input v-model="editingSection.content.name" type="text" class="form-input" /></div>
      <div class="form-group"><label class="form-label">职位</label><input v-model="editingSection.content.title" type="text" class="form-input" /></div>
      <div class="form-group"><label class="form-label">邮箱</label><input v-model="editingSection.content.email" type="email" class="form-input" /></div>
      <div class="form-group"><label class="form-label">电话</label><input v-model="editingSection.content.phone" type="tel" class="form-input" /></div>
      <div class="form-group"><label class="form-label">位置</label><input v-model="editingSection.content.location" type="text" class="form-input" /></div>
      <div class="form-group"><label class="form-label">简介</label><textarea v-model="editingSection.content.bio" class="form-textarea" rows="4"></textarea></div>
      <button @click="handleUpdate" class="btn-save">保存</button>
    </div>
    <div v-else-if="section.type === 'education'" class="editor-form">
      <div v-for="(item, index) in editingSection.content.items" :key="item.id" class="item-card">
        <div class="item-header"><h4>{{ item.school || '新学校' }}</h4><button @click="removeItem(index)" class="btn-remove">✕</button></div>
        <div class="form-group"><label class="form-label">学校</label><input v-model="item.school" type="text" class="form-input" /></div>
        <div class="form-group"><label class="form-label">学位</label><input v-model="item.degree" type="text" class="form-input" /></div>
        <div class="form-group"><label class="form-label">专业</label><input v-model="item.field" type="text" class="form-input" /></div>
        <div class="form-row"><div class="form-group"><label class="form-label">开始日期</label><input v-model="item.startDate" type="date" class="form-input" /></div><div class="form-group"><label class="form-label">结束日期</label><input v-model="item.endDate" type="date" class="form-input" /></div></div>
        <div class="form-group"><label class="form-label">描述</label><textarea v-model="item.description" class="form-textarea" rows="2"></textarea></div>
      </div>
      <button @click="addItem('education')" class="btn-add">+ 添加教育背景</button>
      <button @click="handleUpdate" class="btn-save">保存</button>
    </div>
    <div v-else-if="section.type === 'experience'" class="editor-form">
      <div v-for="(item, index) in editingSection.content.items" :key="item.id" class="item-card">
        <div class="item-header"><h4>{{ item.company || '新公司' }}</h4><button @click="removeItem(index)" class="btn-remove">✕</button></div>
        <div class="form-group"><label class="form-label">公司</label><input v-model="item.company" type="text" class="form-input" /></div>
        <div class="form-group"><label class="form-label">职位</label><input v-model="item.position" type="text" class="form-input" /></div>
        <div class="form-row"><div class="form-group"><label class="form-label">开始日期</label><input v-model="item.startDate" type="date" class="form-input" /></div><div class="form-group"><label class="form-label">结束日期</label><input v-model="item.endDate" type="date" class="form-input" /></div></div>
        <div class="form-group"><label class="form-label">描述</label><textarea v-model="item.description" class="form-textarea" rows="2"></textarea></div>
      </div>
      <button @click="addItem('experience')" class="btn-add">+ 添加工作经历</button>
      <button @click="handleUpdate" class="btn-save">保存</button>
    </div>
    <div v-else-if="section.type === 'skills'" class="editor-form">
      <div v-for="(item, index) in editingSection.content.items" :key="item.id" class="item-card">
        <div class="item-header"><h4>{{ item.category || '新技能类别' }}</h4><button @click="removeItem(index)" class="btn-remove">✕</button></div>
        <div class="form-group"><label class="form-label">类别</label><input v-model="item.category" type="text" class="form-input" /></div>
        <div class="form-group"><label class="form-label">技能（逗号分隔）</label><textarea v-model="item.skills" class="form-textarea" rows="2" placeholder="例如: Vue, React, TypeScript"></textarea></div>
      </div>
      <button @click="addItem('skill')" class="btn-add">+ 添加技能类别</button>
      <button @click="handleUpdate" class="btn-save">保存</button>
    </div>
    <div v-else-if="section.type === 'projects'" class="editor-form">
      <div v-for="(item, index) in editingSection.content.items" :key="item.id" class="item-card">
        <div class="item-header"><h4>{{ item.name || '新项目' }}</h4><button @click="removeItem(index)" class="btn-remove">✕</button></div>
        <div class="form-group"><label class="form-label">项目名称</label><input v-model="item.name" type="text" class="form-input" /></div>
        <div class="form-group"><label class="form-label">描述</label><textarea v-model="item.description" class="form-textarea" rows="2"></textarea></div>
        <div class="form-group"><label class="form-label">技术栈（逗号分隔）</label><input v-model="item.technologies" type="text" class="form-input" /></div>
        <div class="form-group"><label class="form-label">项目链接</label><input v-model="item.link" type="url" class="form-input" /></div>
      </div>
      <button @click="addItem('project')" class="btn-add">+ 添加项目</button>
      <button @click="handleUpdate" class="btn-save">保存</button>
    </div>
    <div v-else-if="section.type === 'awards'" class="editor-form">
      <div v-for="(item, index) in editingSection.content.items" :key="item.id" class="item-card">
        <div class="item-header"><h4>{{ item.title || '新奖项' }}</h4><button @click="removeItem(index)" class="btn-remove">✕</button></div>
        <div class="form-group"><label class="form-label">奖项名称</label><input v-model="item.title" type="text" class="form-input" /></div>
        <div class="form-group"><label class="form-label">颁发机构</label><input v-model="item.issuer" type="text" class="form-input" /></div>
        <div class="form-group"><label class="form-label">获奖日期</label><input v-model="item.date" type="date" class="form-input" /></div>
        <div class="form-group"><label class="form-label">描述</label><textarea v-model="item.description" class="form-textarea" rows="2"></textarea></div>
      </div>
      <button @click="addItem('award')" class="btn-add">+ 添加奖项</button>
      <button @click="handleUpdate" class="btn-save">保存</button>
    </div>
    <div v-else-if="section.type === 'languages'" class="editor-form">
      <div v-for="(item, index) in editingSection.content.items" :key="item.id" class="item-card">
        <div class="item-header"><h4>{{ item.language || '新语言' }}</h4><button @click="removeItem(index)" class="btn-remove">✕</button></div>
        <div class="form-group"><label class="form-label">语言</label><input v-model="item.language" type="text" class="form-input" placeholder="例如: 中文, 英文" /></div>
        <div class="form-group"><label class="form-label">熟练度</label><select v-model="item.proficiency" class="form-input"><option v-for="level in proficiencyOptions" :key="level" :value="level">{{ proficiencyLabels[level] }}</option></select></div>
      </div>
      <button @click="addItem('language')" class="btn-add">+ 添加语言</button>
      <button @click="handleUpdate" class="btn-save">保存</button>
    </div>
    <div v-else-if="section.type === 'certifications'" class="editor-form">
      <div v-for="(item, index) in editingSection.content.items" :key="item.id" class="item-card">
        <div class="item-header"><h4>{{ item.name || '新证书' }}</h4><button @click="removeItem(index)" class="btn-remove">✕</button></div>
        <div class="form-group"><label class="form-label">证书名称</label><input v-model="item.name" type="text" class="form-input" /></div>
        <div class="form-group"><label class="form-label">颁发机构</label><input v-model="item.issuer" type="text" class="form-input" /></div>
        <div class="form-group"><label class="form-label">获证日期</label><input v-model="item.date" type="date" class="form-input" /></div>
        <div class="form-group"><label class="form-label">凭证ID</label><input v-model="item.credentialId" type="text" class="form-input" placeholder="可选" /></div>
        <div class="form-group"><label class="form-label">凭证链接</label><input v-model="item.credentialUrl" type="url" class="form-input" placeholder="可选" /></div>
      </div>
      <button @click="addItem('certification')" class="btn-add">+ 添加证书</button>
      <button @click="handleUpdate" class="btn-save">保存</button>
    </div>
    <div v-else class="editor-form"><p class="text-muted">此模块类型暂不支持编辑</p></div>
  </div>
</template>

<style scoped>
.section-editor{height:100%;display:flex;flex-direction:column}.editor-header{margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid var(--color-primary)}.editor-section-title{font-size:1.25rem;font-weight:600;color:var(--color-text-primary)}.editor-form{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:16px}.form-group{display:flex;flex-direction:column;gap:6px}.form-label{font-size:0.875rem;font-weight:500;color:var(--color-text-primary)}.form-input,.form-textarea{padding:8px 12px;border:1px solid var(--color-border);border-radius:var(--radius-md);font-size:0.875rem;font-family:inherit;transition:all 0.2s ease}.form-input:focus,.form-textarea:focus{outline:0;border-color:var(--color-primary);box-shadow:0 0 0 2px rgba(91,138,240,0.1)}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.item-card{padding:16px;background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);display:flex;flex-direction:column;gap:12px}.item-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.item-header h4{font-size:0.95rem;font-weight:600;color:var(--color-text-primary);margin:0}.btn-remove{width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:var(--radius-md);color:#ef4444;cursor:pointer;transition:all 0.2s ease;font-size:0.875rem}.btn-remove:hover{background:rgba(239,68,68,0.2);border-color:rgba(239,68,68,0.5)}.btn-add,.btn-save{padding:10px 16px;border:0;border-radius:var(--radius-md);font-size:0.875rem;font-weight:500;cursor:pointer;transition:all 0.2s ease}.btn-add{background:rgba(91,138,240,0.1);color:var(--color-primary);border:1px dashed var(--color-primary)}.btn-add:hover{background:rgba(91,138,240,0.2)}.btn-save{background:var(--color-primary);color:#fff;margin-top:auto}.btn-save:hover{opacity:0.9;transform:translateY(-1px)}.text-muted{color:var(--color-text-muted);text-align:center;padding:40px 20px}
</style>

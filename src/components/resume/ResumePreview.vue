<script setup lang="ts">
import type { ResumeSection } from '@/types/resume'

interface Props {
  sections: ResumeSection[]
}

defineProps<Props>()

const sectionLabels: Record<string, string> = {
  basic: '基本信息',
  education: '教育背景',
  experience: '工作经历',
  skills: '技能',
  projects: '项目',
  awards: '奖项',
  languages: '语言',
  certifications: '证书',
}

const formatDate = (date: string) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' })
}
</script>

<template>
  <div class="resume-preview">
    <div class="preview-header">
      <h3 class="preview-title">预览</h3>
    </div>

    <div class="preview-content">
      <!-- 基本信息 -->
      <div v-for="section in sections" :key="section.id" v-show="section.visible" class="preview-section">
        <!-- 基本信息预览 -->
        <div v-if="section.type === 'basic'" class="basic-info">
          <div class="basic-info__header">
            <div class="basic-info__avatar" v-if="section.content.avatar">
              <img :src="section.content.avatar" :alt="section.content.name" />
            </div>
            <div class="basic-info__text">
              <h1 class="basic-info__name">{{ section.content.name }}</h1>
              <p class="basic-info__title">{{ section.content.title }}</p>
              <div class="basic-info__meta">
                <span v-if="section.content.email">📧 {{ section.content.email }}</span>
                <span v-if="section.content.phone">📱 {{ section.content.phone }}</span>
                <span v-if="section.content.location">📍 {{ section.content.location }}</span>
              </div>
            </div>
          </div>
          <p v-if="section.content.bio" class="basic-info__bio">{{ section.content.bio }}</p>
        </div>

        <!-- 教育背景预览 -->
        <div v-else-if="section.type === 'education'">
          <h2 class="section-title">{{ sectionLabels[section.type] }}</h2>
          <div v-for="item in section.content.items" :key="item.id" class="item">
            <div class="item__header">
              <h4 class="item__title">{{ item.school }}</h4>
              <span class="item__date">{{ formatDate(item.startDate) }} - {{ formatDate(item.endDate) }}</span>
            </div>
            <p class="item__subtitle">{{ item.degree }} · {{ item.field }}</p>
            <p v-if="item.description" class="item__description">{{ item.description }}</p>
          </div>
        </div>

        <!-- 工作经历预览 -->
        <div v-else-if="section.type === 'experience'">
          <h2 class="section-title">{{ sectionLabels[section.type] }}</h2>
          <div v-for="item in section.content.items" :key="item.id" class="item">
            <div class="item__header">
              <h4 class="item__title">{{ item.position }}</h4>
              <span class="item__date">{{ formatDate(item.startDate) }} - {{ formatDate(item.endDate) }}</span>
            </div>
            <p class="item__subtitle">{{ item.company }}</p>
            <p v-if="item.description" class="item__description">{{ item.description }}</p>
            <ul v-if="item.highlights?.length" class="item__highlights">
              <li v-for="(highlight, i) in item.highlights" :key="i">{{ highlight }}</li>
            </ul>
          </div>
        </div>

        <!-- 技能预览 -->
        <div v-else-if="section.type === 'skills'">
          <h2 class="section-title">{{ sectionLabels[section.type] }}</h2>
          <div v-for="item in section.content.items" :key="item.id" class="skill-group">
            <h4 class="skill-group__title">{{ item.category }}</h4>
            <div class="skill-tags">
              <span v-for="(skill, i) in item.skills" :key="i" class="skill-tag">{{ skill }}</span>
            </div>
          </div>
        </div>

        <!-- 项目预览 -->
        <div v-else-if="section.type === 'projects'">
          <h2 class="section-title">{{ sectionLabels[section.type] }}</h2>
          <div v-for="item in section.content.items" :key="item.id" class="item">
            <div class="item__header">
              <h4 class="item__title">{{ item.name }}</h4>
              <span v-if="item.link" class="item__link">
                <a :href="item.link" target="_blank">查看</a>
              </span>
            </div>
            <p v-if="item.description" class="item__description">{{ item.description }}</p>
            <div v-if="item.technologies?.length" class="tech-tags">
              <span v-for="(tech, i) in item.technologies" :key="i" class="tech-tag">{{ tech }}</span>
            </div>
          </div>
        </div>

        <!-- 其他类型 -->
        <div v-else>
          <h2 class="section-title">{{ sectionLabels[section.type] }}</h2>
          <p class="text-muted">此模块暂无预览</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resume-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.preview-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
}

.preview-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.preview-section {
  margin-bottom: 32px;
}

.preview-section:last-child {
  margin-bottom: 0;
}

/* 基本信息 */
.basic-info {
  margin-bottom: 24px;
}

.basic-info__header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.basic-info__avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.basic-info__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.basic-info__text {
  flex: 1;
}

.basic-info__name {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 4px 0;
}

.basic-info__title {
  font-size: 1rem;
  color: var(--color-primary);
  margin: 0 0 8px 0;
  font-weight: 500;
}

.basic-info__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.basic-info__bio {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin: 0;
}

/* 章节标题 */
.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--color-primary);
}

/* 项目 */
.item {
  margin-bottom: 16px;
}

.item__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 4px;
}

.item__title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.item__date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.item__link {
  font-size: 0.8rem;
}

.item__link a {
  color: var(--color-primary);
  text-decoration: none;
}

.item__link a:hover {
  text-decoration: underline;
}

.item__subtitle {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin: 0 0 6px 0;
  font-weight: 500;
}

.item__description {
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
  margin: 0;
}

.item__highlights {
  margin: 8px 0 0 0;
  padding-left: 20px;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.item__highlights li {
  margin-bottom: 4px;
}

/* 技能 */
.skill-group {
  margin-bottom: 16px;
}

.skill-group__title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.skill-tags,
.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-tag,
.tech-tag {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(91, 138, 240, 0.1);
  border: 1px solid rgba(91, 138, 240, 0.2);
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  color: var(--color-primary);
  font-weight: 500;
}

.text-muted {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}
</style>

<script setup lang="ts">
import type { ResumeSection } from '@/types/resume'

interface Props {
  sections: ResumeSection[]
}

defineProps<Props>()

const formatDate = (date: string) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' })
}
</script>

<template>
  <div class="resume-content">
    <div v-for="section in sections.filter(s => s.visible)" :key="section.id">
      <div v-if="section.type === 'basic'" class="basic-section">
        <div class="basic-header">
          <div class="basic-info">
            <h2 class="name">{{ section.content.name }}</h2>
            <div class="text-info">
              <div class="contact-info">
                <span v-if="section.content.title">岗位：{{ section.content.title }}</span>
                <span v-if="section.content.workYears">工龄：{{ section.content.workYears }}年</span>
                <span v-if="section.content.status">状态：{{ section.content.status }}</span>
                <span v-if="section.content.email">邮箱：{{ section.content.email }}</span>
                <span v-if="section.content.phone">电话：{{ section.content.phone }}</span>
                <span v-if="section.content.location">籍贯：{{ section.content.location }}</span>
              </div>
            </div>
          </div>
          <div v-if="section.content.avatar" class="basic-avatar">
            <img :src="section.content.avatar" :alt="section.content.name" />
          </div>
        </div>
        <p v-if="section.content.bio" class="bio">{{ section.content.bio }}</p>
      </div>

      <div v-else-if="section.type === 'education'" class="section">
        <h3 class="section-title">🎓 {{ section.title }}</h3>
        <div v-for="item in section.content.items" :key="item.id" class="section-item">
          <div class="item-header">
            <h4 class="item-title">{{ item.school }}</h4>
            <span class="item-date">{{ formatDate(item.startDate) }} - {{ formatDate(item.endDate) }}</span>
          </div>
          <p class="item-subtitle">{{ item.degree }} · {{ item.field }}</p>
          <p v-if="item.description" class="item-desc">{{ item.description }}</p>
        </div>
      </div>

      <div v-else-if="section.type === 'experience'" class="section">
        <h3 class="section-title">💼 {{ section.title }}</h3>
        <div v-for="item in section.content.items" :key="item.id" class="section-item">
          <div class="item-header">
            <p class="item-title">{{ item.company }}</p>
            <span class="item-date">{{ formatDate(item.startDate) }} - {{ formatDate(item.endDate) }}</span>
          </div>
          <h4 class="item-subtitle">职&emsp;&emsp;位：{{ item.position }}</h4>
          <p v-if="item.description" class="item-desc">工作职责：{{ item.description }}</p>
        </div>
      </div>

      <div v-else-if="section.type === 'skills'" class="section">
        <h3 class="section-title">🛠️ {{ section.title }}</h3>
        <div v-for="item in section.content.items" :key="item.id" class="skill-item">
          {{ item.skill }}
        </div>
      </div>

      <div v-else-if="section.type === 'projects'" class="section">
        <h3 class="section-title">🚀 {{ section.title }}</h3>
        <div v-for="item in section.content.items" :key="item.id" class="section-item">
          <div class="item-header">
            <h4 class="item-title">{{ item.name }}</h4>
            <span v-if="item.link" class="item-link"><a :href="item.link" target="_blank">查看</a></span>
          </div>
          <p v-if="item.description" class="item-desc">{{ item.description }}</p>
          <div v-if="item.technologies?.length" class="tech-tags">
            <span v-for="(tech, i) in item.technologies" :key="i" class="tech-tag">{{ tech }}</span>
          </div>
        </div>
      </div>

      <div v-else-if="section.type === 'awards'" class="section">
        <h3 class="section-title">🏆 {{ section.title }}</h3>
        <div v-for="item in section.content.items" :key="item.id" class="section-item">
          <div class="item-header">
            <h4 class="item-title">{{ item.title }}</h4>
            <span class="item-date">{{ formatDate(item.date) }}</span>
          </div>
          <p class="item-subtitle">{{ item.issuer }}</p>
          <p v-if="item.description" class="item-desc">{{ item.description }}</p>
        </div>
      </div>

      <div v-else-if="section.type === 'certifications'" class="section">
        <h3 class="section-title">📜 {{ section.title }}</h3>
        <div v-for="item in section.content.items" :key="item.id" class="section-item">
          <div class="item-header">
            <h4 class="item-title">{{ item.name }}</h4>
            <span class="item-date">{{ formatDate(item.date) }}</span>
          </div>
          <p class="item-subtitle">{{ item.issuer }}</p>
          <div v-if="item.credentialUrl" class="cert-link">
            <a :href="item.credentialUrl" target="_blank">查看凭证</a>
          </div>
        </div>
      </div>

      <div v-else-if="section.type === 'introduction'" class="section">
        <h3 class="section-title">✨ {{ section.title }}</h3>
        <p class="intro-text">{{ section.content.text }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resume-content {
  width: 700px;
  background: #fff;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)
}

.basic-section {
  margin-bottom: 20px;
}

.basic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.basic-info {
  flex: 1
}
.text-info{
  display: flex;
  justify-content: space-between;
}
.name {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 6px 0
}

.title {
  font-size: 1.25rem;
  color: var(--color-primary);
  margin: 0 0 12px 0;
  font-weight: 500
}

.contact-info {
  display: grid;
  grid-template-columns: 180px 180px 150px;
  /* 2行，每行等分高度（也可以用 auto 自适应内容） */
  grid-template-rows: 1fr 1fr;
  row-gap: 12px;
  font-size: 0.95rem;
  color: var(--color-text-secondary)
}
.imageUrl{
  width: 80px;
  height: 96px;
}
.basic-avatar {
  width: 80px;
  height: 96px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0
}

.basic-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover
}

.bio {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin: 16px 0 0 0
}

.section {
  margin-bottom: 28px
}

.section-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 16px 0;
  border-bottom: 2px solid var(--color-primary)
}

.section-item {
  margin-bottom: 16px
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 4px
}

.item-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0
}

.item-date {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  white-space: nowrap
}

.item-subtitle {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin: 0 0 6px 0;
  font-weight: 500
}

.item-desc {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
  margin: 0
}

.item-link {
  font-size: 0.85rem
}

.item-link a {
  color: var(--color-primary);
  text-decoration: none
}

.item-link a:hover {
  text-decoration: underline
}

.skill-group {
  margin-bottom: 12px
}

.skill-category {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px 0
}

.skill-tags,
.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px
}

.skill-tag,
.tech-tag {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(91, 138, 240, 0.1);
  border: 1px solid rgba(91, 138, 240, 0.2);
  border-radius: 16px;
  font-size: 0.8rem;
  color: var(--color-primary);
  font-weight: 500
}

.cert-link {
  margin-top: 8px
}

.cert-link a {
  font-size: 0.85rem;
  color: var(--color-primary);
  text-decoration: none
}

.cert-link a:hover {
  text-decoration: underline
}

.intro-text {
  font-size: 0.95rem;
  line-height: 1.8;
  color: var(--color-text-secondary);
  margin: 0
}

@media (max-width:768px) {
  .resume-content {
    padding: 24px
  }

  .basic-header {
    flex-direction: column
  }

  .basic-avatar {
    width: 100px;
    height: 100px
  }
}
</style>


.skill-item {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
  line-height: 1.6
}


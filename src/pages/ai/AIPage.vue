<script setup lang="ts">
import { ref, computed } from 'vue'
import { aiFeatures } from '@/data'
import AIFeatureCard from '@/components/ai/AIFeatureCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import SectionTitle from '@/components/common/SectionTitle.vue'
import type { AIFeature, AICategory } from '@/types'

const selectedFeature = ref<AIFeature | null>(aiFeatures[0])
const activeCategory = ref<AICategory | 'all'>('all')
const inputText = ref('')
const outputText = ref('')
const isLoading = ref(false)

const categoryLabels: Record<string, string> = {
  all: '全部', writing: '写作', vision: '视觉', analysis: '分析', creative: '创意', productivity: '效率',
}
const categoryIcons: Record<string, string> = {
  all: '✨', writing: '✍️', vision: '🔍', analysis: '💡', creative: '🎨', productivity: '⚡',
}
const aiIcons: Record<string, string> = {
  'AI 文案创作': '✍️', 'AI 代码助手': '💻', 'AI 图片识别': '🔍',
  'AI 情感分析': '💡', 'AI 翻译润色': '🌐', 'AI 思维导图': '🗺️',
  'AI 诗词创作': '🪶', 'AI 摘要提取': '📋',
}

const filteredFeatures = computed(() => {
  if (activeCategory.value === 'all') return aiFeatures
  return aiFeatures.filter(f => f.category === activeCategory.value)
})

const mockResponses: Record<string, string> = {
  '1': '# ✍️ AI 文案创作\n\n根据您的主题，生成了以下文案：\n\n**标题建议：**\n- 探索无限可能：当代技术的边界与未来\n- 以代码为笔，书写数字时代的故事\n\n**正文：**\n在这个日新月异的时代，技术已不再只是工具，而是一种语言，一种思维方式。我们用代码构建桥梁，用算法描绘未来...\n\n*（演示输出，接入真实 AI API 后可获得更精准的结果）*',
  '2': '# 💻 AI 代码助手\n\n```typescript\nimport { ref, computed } from "vue"\n\nexport function useExample(initialValue = "") {\n  const data = ref(initialValue)\n  const isEmpty = computed(() => !data.value.trim())\n  return { data, isEmpty }\n}\n```\n\n以上是根据您描述生成的代码示例，包含完整类型注解和注释。',
  '3': '# 🔍 AI 图片识别\n\n**识别结果：**\n- 场景：室外自然风光\n- 主体：山地景观，远处有雪山\n- 色调：暖色调，黄金时段拍摄\n- 文字：未检测到文字内容\n\n*（演示输出，实际识别需上传真实图片并接入视觉 API）*',
  '4': '# 💡 AI 情感分析\n\n**情感倾向：** 积极正面 😊\n**置信度：** 87%\n\n**关键词分析：**\n- 正面词汇：美好、期待、感谢\n- 情感强度：中等偏强\n\n**总结：** 文本整体情绪乐观，表达了对未来的期待与感激之情。',
  '5': '# 🌐 AI 翻译润色\n\n**原文：** 您输入的内容\n\n**英文翻译：**\nThe content you entered has been professionally translated with native-level fluency.\n\n**润色建议：** 建议使用更丰富的表达方式，可以适当增加修辞手法让文章更生动。',
  '6': '# 🗺️ AI 思维导图\n\n```\n主题\n├── 核心概念\n│   ├── 基础理论\n│   └── 应用实践\n├── 关键要素\n│   ├── 要素一\n│   ├── 要素二\n│   └── 要素三\n└── 行动计划\n    ├── 短期目标\n    └── 长期规划\n```\n\n*（完整思维导图可导出为图片或 Markdown 格式）*',
  '7': '# 🪶 AI 诗词创作\n\n**七言绝句：**\n\n霜叶随风入画图，\n孤灯独照夜云孤。\n此情若问归何处，\n一寸相思万里途。\n\n**现代诗：**\n\n你说秋天很美\n我说是你让秋天变得美\n像一枚书签\n夹在我生命里最好的那一页',
  '8': '# 📋 AI 摘要提取\n\n**核心要点（共3条）：**\n\n1. 文章主要探讨了技术发展对现代生活的深远影响\n2. 作者认为数字化转型是不可逆的历史趋势\n3. 提出了三个应对策略：学习、适应、创新\n\n**关键词：** 技术、数字化、转型、创新\n\n**阅读时长：** 约 3 分钟',
}

async function handleGenerate() {
  if (!inputText.value.trim() || !selectedFeature.value) return
  isLoading.value = true
  outputText.value = ''
  await new Promise(r => setTimeout(r, 1500))
  outputText.value = mockResponses[selectedFeature.value.id] || '# AI 处理结果\n\n已完成处理。这是演示输出，接入真实 AI API 后可获得实际结果。'
  isLoading.value = false
}

function handleSelect(feature: AIFeature) {
  selectedFeature.value = feature
  inputText.value = ''
  outputText.value = ''
}
</script>

<template>
  <div class="ai-page">
    <section class="ai-hero">
      <div class="ai-hero__bg">
        <div class="ai-blob ai-blob--1" />
        <div class="ai-blob ai-blob--2" />
      </div>
      <div class="ai-hero__inner">
        <div class="ai-hero__icon animate-float">✨</div>
        <SectionTitle title="AI 工坊" subtitle="集成多种 AI 能力，让创作、分析、开发更高效。选择一个工具开始体验。" align="center" />
        <div class="ai-hero__stats">
          <span class="ai-stat">🔧 {{ aiFeatures.length }} 个工具</span>
          <span class="ai-stat">🆕 {{ aiFeatures.filter(f => f.isNew).length }} 个新功能</span>
          <span class="ai-stat">⚡ 即时响应</span>
        </div>
      </div>
    </section>

    <div class="ai-workspace">
      <aside class="ai-panel">
        <div class="ai-panel__cats">
          <button
            v-for="(label, key) in categoryLabels"
            :key="key"
            :class="['ai-cat-btn', { 'ai-cat-btn--active': activeCategory === key }]"
            @click="activeCategory = key as AICategory | 'all'"
          >
            {{ categoryIcons[key] }} {{ label }}
          </button>
        </div>
        <div class="ai-panel__list">
          <AIFeatureCard
            v-for="feature in filteredFeatures"
            :key="feature.id"
            :feature="feature"
            :active="selectedFeature?.id === feature.id"
            @select="handleSelect"
          />
        </div>
      </aside>

      <main class="ai-main">
        <Transition name="ai-fade" mode="out-in">
          <div v-if="selectedFeature" :key="selectedFeature.id" class="ai-workspace-panel">
            <div class="ai-workspace-panel__header">
              <span class="ai-ws-icon">{{ aiIcons[selectedFeature.name] || '🤖' }}</span>
              <div>
                <h3 class="ai-ws-title">{{ selectedFeature.name }}</h3>
                <p class="ai-ws-desc">{{ selectedFeature.description }}</p>
              </div>
            </div>
            <div class="ai-io">
              <div class="ai-input-area">
                <label class="ai-label">输入内容</label>
                <textarea v-model="inputText" class="ai-textarea" :placeholder="selectedFeature.placeholder" rows="6" />
                <div class="ai-input-actions">
                  <span class="ai-char-count">{{ inputText.length }} 字</span>
                  <AppButton :loading="isLoading" :disabled="!inputText.trim()" @click="handleGenerate">
                    {{ isLoading ? '生成中...' : '✨ 开始生成' }}
                  </AppButton>
                </div>
              </div>
              <Transition name="output-fade">
                <div v-if="outputText || isLoading" class="ai-output-area">
                  <label class="ai-label">AI 输出</label>
                  <div v-if="isLoading" class="ai-loading">
                    <div class="ai-loading__dots"><span /><span /><span /></div>
                    <p>AI 正在思考中...</p>
                  </div>
                  <div v-else class="ai-output">
                    <pre class="ai-output__text">{{ outputText }}</pre>
                    <div class="ai-output__actions">
                      <button class="tag" @click="outputText = ''">清除</button>
                      <button class="tag" @click="inputText = ''; outputText = ''">重置</button>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </Transition>
      </main>
    </div>
  </div>
</template>

<style scoped>
.ai-hero {
  position: relative; padding: 60px 24px 40px; text-align: center; overflow: hidden;
}
.ai-hero__bg { position: absolute; inset: 0; pointer-events: none; }
.ai-blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.35; }
.ai-blob--1 { width: 400px; height: 400px; background: rgba(91,138,240,0.2); top: -100px; right: -100px; animation: float 8s ease-in-out infinite; }
.ai-blob--2 { width: 350px; height: 350px; background: rgba(139,111,240,0.15); bottom: -60px; left: -60px; animation: float 10s ease-in-out infinite reverse; }
.ai-hero__inner { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }
.ai-hero__icon { font-size: 3.5rem; margin-bottom: 16px; display: block; }
.ai-hero__stats { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; margin-top: 16px; }
.ai-stat { font-size: var(--text-sm); color: var(--color-text-muted); background: var(--color-bg-card); padding: 6px 14px; border-radius: var(--radius-full); border: 1px solid var(--color-border); }
.ai-workspace { display: flex; max-width: 1200px; margin: 0 auto; padding: 0 24px 80px; gap: 24px; }
.ai-panel { width: 340px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; position: sticky; top: 80px; max-height: calc(100vh - 80px); overflow-y: auto; padding-bottom: 20px; }
.ai-panel__cats { display: flex; flex-wrap: wrap; gap: 6px; }
.ai-cat-btn { padding: 5px 12px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: var(--color-bg-card); font-size: var(--text-xs); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast); }
.ai-cat-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.ai-cat-btn--active { background: rgba(91,138,240,0.10); border-color: rgba(91,138,240,0.3); color: var(--color-primary); font-weight: 600; }
.ai-panel__list { display: flex; flex-direction: column; gap: 8px; }
.ai-main { flex: 1; min-width: 0; padding-bottom: 40px; }
.ai-workspace-panel { background: var(--color-bg-card); backdrop-filter: var(--blur-md); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 32px; box-shadow: var(--shadow-md); }
.ai-workspace-panel__header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--color-border); }
.ai-ws-icon { font-size: 2.5rem; flex-shrink: 0; }
.ai-ws-title { font-size: var(--text-xl); font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px; }
.ai-ws-desc { font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.5; }
.ai-io { display: flex; flex-direction: column; gap: 20px; }
.ai-label { display: block; font-size: var(--text-sm); font-weight: 600; color: var(--color-text-secondary); margin-bottom: 8px; }
.ai-textarea { width: 100%; padding: 14px 16px; background: rgba(255,255,255,0.5); border: 1px solid var(--color-border); border-radius: var(--radius-lg); font-size: var(--text-sm); color: var(--color-text-primary); font-family: var(--font-sans); line-height: 1.6; resize: vertical; outline: none; transition: border-color var(--transition-fast); }
.ai-textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(91,138,240,0.10); }
.ai-textarea::placeholder { color: var(--color-text-muted); }
.ai-input-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
.ai-char-count { font-size: var(--text-xs); color: var(--color-text-muted); }
.ai-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px; border: 1px dashed var(--color-border); border-radius: var(--radius-lg); color: var(--color-text-muted); font-size: var(--text-sm); }
.ai-loading__dots { display: flex; gap: 6px; }
.ai-loading__dots span { width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary); animation: bounce 1.2s ease-in-out infinite; }
.ai-loading__dots span:nth-child(2) { animation-delay: 0.2s; }
.ai-loading__dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%,80%,100% { transform: scale(0.8); opacity: 0.5; } 40% { transform: scale(1.2); opacity: 1; } }
.ai-output { border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
.ai-output__text { padding: 20px; font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.8; white-space: pre-wrap; font-family: var(--font-sans); background: rgba(91,138,240,0.03); margin: 0; }
.ai-output__actions { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--color-border); background: var(--color-bg-card); }
.ai-fade-enter-active, .ai-fade-leave-active { transition: all 0.25s ease; }
.ai-fade-enter-from, .ai-fade-leave-to { opacity: 0; transform: translateY(8px); }
.output-fade-enter-active { transition: all 0.3s ease; }
.output-fade-enter-from { opacity: 0; transform: translateY(12px); }
@media (max-width: 900px) {
  .ai-workspace { flex-direction: column; }
  .ai-panel { width: 100%; position: static; max-height: none; }
}
</style>

<script setup lang="ts">
import { ref, computed } from "vue";
import { aiFeatures } from "@/data";
import { streamChat } from "@/api/siliconflow";
import { useToast } from "@/composables/useToast";
import AppButton from "@/components/common/AppButton.vue";
import type { AIFeature, AICategory } from "@/types";

const toast = useToast();
const selectedFeature = ref<AIFeature | null>(aiFeatures[0]);
const activeCategory = ref<AICategory | "all">("all");
const inputText = ref("");
const thinkingMode = ref<"fast" | "balanced" | "deep">("fast");
const outputText = ref("");
const thinkText = ref("");
const thinkExpanded = ref(false);
const isLoading = ref(false);
const isThinking = ref(false);
let abortFlag = false;

const categoryLabels: Record<string, string> = {
  all: "全部",
  writing: "写作",
  vision: "视觉",
  analysis: "分析",
  creative: "创意",
  productivity: "效率",
};
const categoryIcons: Record<string, string> = {
  all: "✨",
  writing: "✍️",
  vision: "🔍",
  analysis: "💡",
  creative: "🎨",
  productivity: "⚡",
};
const aiIcons: Record<string, string> = {
  "AI 文案创作": "✍️",
  "AI 代码助手": "💻",
  "AI 图片识别": "🔍",
  "AI 情感分析": "💡",
  "AI 翻译": "🌐",
  "AI 思维导图": "🗺️",
  "AI 诗词创作": "🪶",
  "AI 摘要提取": "📋",
  "AI 食谱": "🍼",
  "AI 医生": "🏥",
  "AI 生图": "🖼️",
};

const thinkingModes = [
  { value: "fast" as const, label: "⚡ 快速", desc: "快速回答，适合日常对话" },
  { value: "balanced" as const, label: "⚖️ 平衡", desc: "平衡效率与质量" },
  { value: "deep" as const, label: "🧠 深思", desc: "深度思考，适合复杂任务" },
];
const langOptions = [
  "中文",
  "English",
  "日本语",
  "韩语",
  "法语",
  "德语",
  "西班牙语",
  "俄语",
];
const sourceLang = ref("中文");
const targetLang = ref("English");

function swapLangs() {
  const tmp = sourceLang.value;
  sourceLang.value = targetLang.value;
  targetLang.value = tmp;
}

const filteredFeatures = computed(() => {
  const visible = aiFeatures.filter((f) => !f.hidden);
  if (activeCategory.value === "all") return visible;
  return visible.filter((f) => f.category === activeCategory.value);
});

async function handleGenerate() {
  if (!inputText.value.trim() || !selectedFeature.value) return;
  if (isLoading.value) {
    abortFlag = true;
    return;
  }
  isLoading.value = true;
  isThinking.value = false;
  abortFlag = false;
  outputText.value = "";
  thinkText.value = "";
  thinkExpanded.value = true;

  const userInput =
    selectedFeature.value.id === "5"
      ? `[${sourceLang.value}] -> [${targetLang.value}]\n${inputText.value}`
      : inputText.value;
  await streamChat({
    featureId: selectedFeature.value.id,
    userInput,
    thinkingMode: thinkingMode.value,
    onThink: (text) => {
      if (abortFlag) return;
      isThinking.value = true;
      thinkText.value += text;
    },
    onChunk: (text) => {
      if (abortFlag) return;
      isThinking.value = false;
      if (!outputText.value) thinkExpanded.value = false;
      outputText.value += text;
    },
    onDone: () => {
      isLoading.value = false;
      thinkExpanded.value = false;
    },
    onError: (err) => {
      isLoading.value = false;
      toast.error(err);
      if (!outputText.value) outputText.value = "";
      thinkText.value = "";
      thinkExpanded.value = true;
    },
  });
}

function handleSelect(feature: AIFeature) {
  if (isLoading.value) {
    abortFlag = true;
    isLoading.value = false;
  }
  selectedFeature.value = feature;
  inputText.value = "";
  outputText.value = "";
  thinkText.value = "";
  thinkExpanded.value = false;
  thinkText.value = "";
  thinkExpanded.value = true;
}

function handleStop() {
  abortFlag = true;
  isLoading.value = false;
}

function copyOutput() {
  navigator.clipboard?.writeText(outputText.value);
  toast.success("复制成功");
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
        <div class="ai-hero-title-wrapper">
          <div class="ai-hero__icon animate-float">✨</div>
          <h1 class="ai-hero__title">AI 工坊</h1>
        </div>
        <p class="ai-hero__subtitle">
          集成多种 AI 能力，让创作、分析、开发更高效。
        </p>
        <div class="ai-hero__stats">
          <span class="ai-stat">🔧 {{ aiFeatures.length }} 个工具</span>
          <span class="ai-stat"
            >🆕 {{ aiFeatures.filter((f) => f.isNew).length }} 个新功能</span
          >
          <span class="ai-stat">⚡ 千问大模型</span>
        </div>
      </div>
    </section>

    <div class="ai-body">
      <div class="ai-cats">
        <button
          v-for="(label, key) in categoryLabels"
          :key="key"
          :class="[
            'ai-cat-btn',
            { 'ai-cat-btn--active': activeCategory === key },
          ]"
          @click="activeCategory = key as AICategory | 'all'"
        >
          {{ categoryIcons[key] }} {{ label }}
        </button>
      </div>

      <div class="ai-grid">
        <div
          v-for="feature in filteredFeatures"
          :key="feature.id"
          :class="[
            'ai-tool-card',
            { 'ai-tool-card--active': selectedFeature?.id === feature.id },
          ]"
          @click="handleSelect(feature)"
        >
          <div class="ai-tool-card__icon">
            {{ aiIcons[feature.name] || "🤖" }}
          </div>
          <div class="ai-tool-card__info">
            <h4 class="ai-tool-card__name">{{ feature.name }}</h4>
            <p class="ai-tool-card__desc">{{ feature.description }}</p>
          </div>
          <span v-if="feature.isNew" class="ai-tool-card__badge">NEW</span>
        </div>
      </div>

      <Transition name="ai-fade" mode="out-in">
        <div
          v-if="selectedFeature"
          :key="selectedFeature.id"
          class="ai-workspace glass-card"
        >
          <div class="ai-workspace__header">
            <span class="ai-ws-icon">{{
              aiIcons[selectedFeature.name] || "🤖"
            }}</span>
            <div>
              <h3 class="ai-ws-title">{{ selectedFeature.name }}</h3>
              <p class="ai-ws-desc">{{ selectedFeature.description }}</p>
            </div>
          </div>
          <div class="ai-io">
            <div class="ai-input-area">
              <label class="ai-label">输入内容</label>
              <div v-if="selectedFeature.id === '5'" class="lang-switcher">
                <select v-model="sourceLang" class="lang-select">
                  <option v-for="l in langOptions" :key="l" :value="l">
                    {{ l }}
                  </option>
                </select>
                <button
                  class="lang-swap-btn"
                  @click="swapLangs"
                  title="交换语言"
                >
                  🔄
                </button>
                <select v-model="targetLang" class="lang-select">
                  <option v-for="l in langOptions" :key="l" :value="l">
                    {{ l }}
                  </option>
                </select>
              </div>
              <div class="ai-input-row">
                <textarea
                  v-model="inputText"
                  class="ai-textarea"
                  :placeholder="selectedFeature.placeholder"
                  rows="1"
                  :disabled="isLoading"
                />
              </div>
            </div>
            <div class="ai-button-row">
              <label class="ai-label">
                AI 输出
                <span v-if="isLoading && !isThinking" class="ai-streaming-badge"
                  >● 生成中</span
                >
              </label>
              <div class="ai-input-btns">
                <select
                  v-model="thinkingMode"
                  class="mode-select"
                  :disabled="isLoading"
                >
                  <option
                    v-for="mode in thinkingModes"
                    :key="mode.value"
                    :value="mode.value"
                  >
                    {{ mode.label }}
                  </option>
                </select>
                <button
                  v-if="isLoading"
                  class="stop-btn stop-btn--active"
                  @click="handleStop"
                >
                ◼️ 停止
                </button>
                <AppButton
                  v-else
                  :disabled="!inputText.trim()"
                  @click="handleGenerate"
                  >✨ 生成</AppButton
                >
              </div>
            </div>
            <div class="ai-output-area">
              <div v-if="thinkText" class="ai-think-block">
                <button
                  class="ai-think-toggle"
                  @click="thinkExpanded = !thinkExpanded"
                >
                  <span class="ai-think-icon">🧠</span>
                  <span>思考过程</span>
                  <span v-if="isThinking" class="ai-streaming-badge"
                    >● 思考中</span
                  >
                  <span class="ai-think-arrow">{{
                    thinkExpanded ? "▲" : "▼"
                  }}</span>
                </button>
                <Transition name="think-slide">
                  <div v-if="thinkExpanded" class="ai-think-content">
                    <pre>{{ thinkText }}</pre>
                  </div>
                </Transition>
              </div>
              <div v-if="isLoading && !outputText.trim()" class="ai-loading">
                <div class="ai-loading__dots"><span /><span /><span /></div>
                <p>
                  {{ isThinking ? "AI 正在思考中..." : "AI 正在生成中..." }}
                </p>
              </div>
              <div v-else-if="outputText" class="ai-output">
                <pre
                  class="ai-output__text">{{ outputText }}<span v-if="isLoading" class="cursor-blink">▋</span></pre>
                <div v-if="!isLoading" class="ai-output__actions">
                  <button class="tag" @click="copyOutput()">📋 复制</button>
                  <button class="tag" @click="outputText = ''">清除</button>
                  <button
                    class="tag"
                    @click="
                      inputText = '';
                      outputText = '';
                    "
                  >
                    重置
                  </button>
                </div>
              </div>
              <div v-else class="ai-output-empty">
                <p>在上方输入内容，点击「开始生成」</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.ai-hero {
  position: relative;
  padding: 60px 24px 40px;
  text-align: center;
  overflow: hidden;
}
.ai-hero__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.ai-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.35;
}
.ai-blob--1 {
  width: 400px;
  height: 400px;
  background: rgba(91, 138, 240, 0.2);
  top: -100px;
  right: -100px;
  animation: float 8s ease-in-out infinite;
}
.ai-blob--2 {
  width: 350px;
  height: 350px;
  background: rgba(139, 111, 240, 0.15);
  bottom: -60px;
  left: -60px;
  animation: float 10s ease-in-out infinite reverse;
}
.ai-hero__inner {
  position: relative;
  z-index: 1;
  max-width: 640px;
  margin: 0 auto;
}
.ai-hero-title-wrapper{
  display: flex;
  justify-content: center;
  gap: 6px;
}
.ai-hero__icon {
  font-size: 3.5rem;
  margin-bottom: 16px;
  display: block;
}
.ai-hero__title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.03em;
  margin-bottom: 8px;
}
.ai-hero__subtitle {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  margin-bottom: 16px;
}
.ai-hero__stats {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
.ai-stat {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  background: var(--color-bg-card);
  padding: 6px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
}
.ai-body {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 80px;
}
.ai-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}
.ai-cat-btn {
  padding: 7px 16px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.ai-cat-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.ai-cat-btn--active {
  background: rgba(91, 138, 240, 0.1);
  border-color: rgba(91, 138, 240, 0.3);
  color: var(--color-primary);
  font-weight: 600;
}
.ai-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
  margin-bottom: 32px;
}
.ai-tool-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 20px;
  background: var(--color-bg-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}
.ai-tool-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-strong);
}
.ai-tool-card--active {
  border-color: var(--color-primary);
  background: rgba(91, 138, 240, 0.06);
  box-shadow: 0 0 0 3px rgba(91, 138, 240, 0.12);
}
.ai-tool-card__icon {
  font-size: 1.8rem;
  flex-shrink: 0;
  line-height: 1;
}
.ai-tool-card__info {
  flex: 1;
  min-width: 0;
}
.ai-tool-card__name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}
.ai-tool-card__desc {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ai-tool-card__badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--gradient-primary);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-full);
}
.ai-workspace {
  padding: 32px;
}
.ai-workspace__header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
}
.ai-ws-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}
.ai-ws-title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}
.ai-ws-desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.5;
}
.ai-io {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.ai-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}
.ai-streaming-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary);
  background: rgba(91, 138, 240, 0.12);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
.lang-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.lang-select {
  flex: 1;
  padding: 7px 10px;
  background: var(--color-bg-glass);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  outline: none;
  cursor: pointer;
}
.lang-swap-btn {
  flex-shrink: 0;
  padding: 7px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  cursor: pointer;
  font-size: 1rem;
  transition:
    transform 0.4s ease,
    border-color var(--transition-fast),
    background var(--transition-fast);
}
.lang-swap-btn:active {
  transform: scale(1.2);
  border-color: var(--color-primary);
  background: rgba(91, 138, 240, 0.08);
}
.ai-textarea {
  width: 100%;
  padding: 14px 16px;
  background: var(--color-bg-glass);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: border-color var(--transition-fast);
}
.ai-textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(91, 138, 240, 0.1);
}
.ai-textarea:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.ai-textarea::placeholder {
  color: var(--color-text-muted);
}
.ai-input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.stop-btn {
  height: 40px;
  padding: 0 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}
.stop-btn:hover {
  border-color: #e8607a;
  color: #e8607a;
}
.ai-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 20px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
.ai-loading__dots {
  display: flex;
  gap: 6px;
}
.ai-loading__dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: bounce 1.2s ease-in-out infinite;
}
.ai-loading__dots span:nth-child(2) {
  animation-delay: 0.2s;
}
.ai-loading__dots span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}
.ai-output {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.ai-output__text {
  padding: 20px;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.8;
  white-space: pre-wrap;
  font-family: var(--font-sans);
  background: rgba(91, 138, 240, 0.02);
  margin: 0;
  min-height: 200px;
}
.cursor-blink {
  display: inline-block;
  animation: blink 0.8s step-end infinite;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
.ai-output__actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-card);
}
.ai-output-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
.ai-fade-enter-active,
.ai-fade-leave-active {
  transition: all 0.25s ease;
}
.ai-fade-enter-from,
.ai-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
@media (max-width: 768px) {
  .ai-io {
    grid-template-columns: 1fr;
  }
  .ai-grid {
    grid-template-columns: 1fr;
  }
}
.ai-button-row{
  display: flex;
  justify-content: space-between;
}
.ai-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ai-input-row .ai-textarea {
  flex: 1;
  min-height: 44px;
  max-height: 300px;
  resize: none;
  overflow-y: auto;
}
.ai-input-btns {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ai-think-block {
  border: 1px solid rgba(91, 138, 240, 0.2);
  border-radius: var(--radius-lg);
  margin-bottom: 16px;
  overflow: hidden;
  background: rgba(91, 138, 240, 0.03);
}
.ai-think-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-weight: 600;
  text-align: left;
}
.ai-think-toggle:hover {
  background: rgba(91, 138, 240, 0.06);
}
.ai-think-icon {
  font-size: 1rem;
}
.ai-think-arrow {
  margin-left: auto;
  font-size: 10px;
  color: var(--color-text-muted);
}
.ai-think-content {
  padding: 12px 16px 16px;
  border-top: 1px solid rgba(91, 138, 240, 0.12);
}
.ai-think-content pre {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: 1.7;
  white-space: pre-wrap;
  font-family: var(--font-sans);
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
}
.think-slide-enter-active,
.think-slide-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.think-slide-enter-from,
.think-slide-leave-to {
  opacity: 0;
  max-height: 0;
}
.think-slide-enter-to,
.think-slide-leave-from {
  max-height: 300px;
}

.mode-select {
  height: 40px;
  padding: 0 12px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-bg-glass);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  outline: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}
.mode-select:focus {
  border-color: var(--color-primary);
}
.mode-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

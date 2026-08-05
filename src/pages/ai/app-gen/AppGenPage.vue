<script setup lang="ts">
/**
 * AI 应用生成工作台：对话驱动生成完整 Vue3 工程，浏览器内 WebContainer 预览。
 *
 * 核心分支：
 * - 首次生成（无 files）：runAppGenPipeline 规划+脚手架+分批出码 → 自动 startPreview
 * - 续改（已有 files）：runAppGenEditPipeline 增量改文件 → 热同步到已启动的预览
 *
 * 状态通过 localStorage 持久化对话与工程；预览会话不持久化，刷新后需手动「启动预览」。
 * handlePipelineEvent 统一把 pipeline 事件映射到 UI（状态条、对话流、文件树、编辑器）。
 */
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  runAppGenPipeline,
  runAppGenEditPipeline,
  startVuePreview,
  downloadAppZip,
  listSortedPaths,
  buildFileTree,
  loadAppGenWorkspace,
  saveAppGenWorkspace,
  clearAppGenWorkspace,
  type AppGenFileMap,
  type AppGenChatMessage,
  type AppGenPipelineStatus,
  type AppGenPlan,
  type AppGenProgressEvent,
  type PreviewSession,
} from '@/modules/app-gen'
import { useModelConfigStore } from '@/stores/modelConfig'
import { useToast } from '@/composables/useToast'
import AppButton from '@/components/common/AppButton.vue'
import AppGenFileTree from './components/AppGenFileTree.vue'

const router = useRouter()
const modelConfig = useModelConfigStore()
const toast = useToast()

type LeftTab = 'chat' | 'files'

/** 左侧面板 Tab：对话区 vs 文件树+编辑器 */
const leftTab = ref<LeftTab>('chat')
/** 输入框草稿，会随 workspace 持久化 */
const inputText = ref(
  '做一个简洁的个人作品集站点：首页介绍、项目列表、关于我。中文界面，现代卡片风格。',
)
/** 顶部状态条文案来源，与 pipeline / 预览生命周期同步 */
const status = ref<AppGenPipelineStatus>('idle')
const messages = ref<AppGenChatMessage[]>([])
/** 虚拟工程：path → 源码，是「是否有项目」与续改分支的判断依据 */
const files = ref<AppGenFileMap>({})
/** 首次生成时的路由/页面规划，续改时传给模型作上下文 */
const currentPlan = ref<AppGenPlan | null>(null)
const selectedPath = ref('')
const editorContent = ref('')
/** 用户手改编辑器内容后，避免被 pipeline 的 file 事件覆盖 */
const editorDirty = ref(false)
const previewUrl = ref('')
const errorMessage = ref('')
/** 生成或预览启动中，禁用发送/新建等操作 */
const isBusy = ref(false)
const saveHint = ref('')
const previewLogs = ref<string[]>([])
const previewLogRef = ref<HTMLElement | null>(null)

/** WebContainer 会话：含 iframe URL 与单文件热写能力 */
const previewSession = ref<PreviewSession | null>(null)
const abortRef = ref<AbortController | null>(null)
const chatBoxRef = ref<HTMLElement | null>(null)

const hasTextModel = computed(() => modelConfig.hasText)
/** 有任意文件即视为「续改模式」，sendMessage 走 edit 而非全量生成 */
const hasProject = computed(() => Object.keys(files.value).length > 0)
const fileTree = computed(() => buildFileTree(files.value))
const fileCount = computed(() => Object.keys(files.value).length)
const canDownload = computed(() => fileCount.value > 0)
/** 续改与首生的占位提示不同，引导用户输入修改指令 vs 需求描述 */
const composerPlaceholder = computed(() =>
  hasProject.value
    ? '继续提修改要求，例如：把首页改成深色、加一个联系页… Enter 发送'
    : '描述应用需求，Enter 发送，Shift+Enter 换行…',
)
/** 将 pipeline 内部 status 枚举映射为顶部状态条中文文案 */
const statusLabel = computed(() => {
  const map: Record<AppGenPipelineStatus, string> = {
    idle: '待命',
    planning: '思考规划中',
    generating: '流式生成中',
    ready: '代码就绪',
    installing: '安装依赖',
    starting: '启动预览',
    previewing: '预览中',
    error: '出错',
    cancelled: '已中断',
  }
  return map[status.value]
})

/** 切换选中文件时加载内容，并清除「未保存」标记 */
watch(selectedPath, (path) => {
  editorDirty.value = false
  editorContent.value = path ? (files.value[path] ?? '') : ''
})

/** pipeline 更新 files 时，若当前文件未被用户手改，同步编辑器内容 */
watch(
  () => files.value,
  (map) => {
    if (selectedPath.value && map[selectedPath.value] !== undefined && !editorDirty.value) {
      editorContent.value = map[selectedPath.value]
    }
  },
)

/** 防抖写入 localStorage；进行中的中间态存为 ready/idle，避免刷新后卡在「生成中」 */
let persistTimer: number | null = null
function schedulePersist() {
  if (persistTimer !== null) window.clearTimeout(persistTimer)
  persistTimer = window.setTimeout(() => {
    persistTimer = null
    const ok = saveAppGenWorkspace({
      inputText: inputText.value,
      status:
        status.value === 'planning' ||
        status.value === 'generating' ||
        status.value === 'installing' ||
        status.value === 'starting'
          ? hasProject.value
            ? 'ready'
            : 'idle'
          : status.value,
      messages: messages.value,
      files: files.value,
      plan: currentPlan.value,
      selectedPath: selectedPath.value,
    })
    if (!ok) {
      // 只提示一次容易刷屏，静默即可；新建项目仍可 clear
    }
  }, 400)
}

watch([files, messages, currentPlan, selectedPath, inputText, status], schedulePersist, {
  deep: true,
})

async function scrollChat() {
  await nextTick()
  const el = chatBoxRef.value
  if (el) el.scrollTop = el.scrollHeight
}

async function scrollPreviewLog() {
  await nextTick()
  const el = previewLogRef.value
  if (el) el.scrollTop = el.scrollHeight
}

function appendPreviewLog(line: string) {
  const text = line.trim()
  if (!text) return
  previewLogs.value.push(text)
  // 日志条数上限，避免长 install 输出撑爆内存
  if (previewLogs.value.length > 200) {
    previewLogs.value = previewLogs.value.slice(-160)
  }
  void scrollPreviewLog()
}

function pushUser(content: string) {
  messages.value.push({
    id: `user-${Date.now()}`,
    role: 'user',
    content,
    thinking: '',
    thinkingOpen: false,
    streaming: false,
    at: Date.now(),
  })
  void scrollChat()
}

function pushSystem(content: string) {
  messages.value.push({
    id: `sys-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    role: 'system',
    content,
    thinking: '',
    thinkingOpen: false,
    streaming: false,
    at: Date.now(),
  })
  void scrollChat()
}

function findMsg(id: string) {
  return messages.value.find((m) => m.id === id)
}

function selectFile(path: string) {
  selectedPath.value = path
  leftTab.value = 'files'
}

function onEditorInput() {
  editorDirty.value = true
}

/** 将编辑器内容写回 files，并尝试热同步到 WebContainer（预览已启动时） */
async function applyEditorToFiles() {
  if (!selectedPath.value) {
    toast.error('请先选择文件')
    return
  }
  files.value = { ...files.value, [selectedPath.value]: editorContent.value }
  editorDirty.value = false

  if (previewSession.value) {
    try {
      await previewSession.value.writeFile(selectedPath.value, editorContent.value)
      saveHint.value = '已同步到预览'
      toast.success('已保存并同步到预览')
    } catch (e) {
      saveHint.value = '已保存到工程（预览同步失败）'
      toast.error(e instanceof Error ? e.message : '预览同步失败')
    }
  } else {
    saveHint.value = '已保存到工程（预览未启动）'
    toast.success('已保存到工程文件')
  }
  window.setTimeout(() => {
    saveHint.value = ''
  }, 2500)
}

function stopPreview() {
  previewSession.value?.disposeDev()
  previewSession.value = null
  previewUrl.value = ''
}

/** 中断当前 pipeline 请求，保留已生成的部分工程与对话 */
function cancelGeneration() {
  if (!isBusy.value) return
  abortRef.value?.abort()
  status.value = 'cancelled'
  pushSystem('已中断当前生成。你可以直接修改需求后重新发送。')
  isBusy.value = false
  toast.success('已中断')
}

/**
 * pipeline / edit 的统一事件入口：把底层进度翻译成页面状态。
 * - assistant-* / thinking / content：驱动对话区流式展示
 * - files / file：更新工程与编辑器（尊重 editorDirty）
 * - plan：首次规划完成时展示路由摘要
 */
function handlePipelineEvent(ev: AppGenProgressEvent) {
  if (ev.type === 'status') status.value = ev.status
  if (ev.type === 'step') pushSystem(ev.message)
  if (ev.type === 'assistant-start') {
    messages.value.push({
      id: ev.id,
      role: 'assistant',
      content: '',
      thinking: '',
      thinkingOpen: false,
      streaming: true,
      at: Date.now(),
    })
    void scrollChat()
  }
  if (ev.type === 'thinking-delta') {
    const m = findMsg(ev.id)
    if (m) {
      m.thinking += ev.text
      void scrollChat()
    }
  }
  if (ev.type === 'content-delta') {
    const m = findMsg(ev.id)
    if (m) {
      m.content += ev.text
      void scrollChat()
    }
  }
  if (ev.type === 'assistant-end') {
    const m = findMsg(ev.id)
    if (m) {
      m.streaming = false
      m.thinkingOpen = false
      const raw = m.content.trim()
      // 模型常只输出 JSON/思考，对话区用友好文案代替原始结构化内容
      if (!raw && m.thinking.trim()) {
        m.content = '本步已完成（详见思考过程）'
      } else if (raw.startsWith('{') || raw.startsWith('```')) {
        m.content = '本步已完成，结构化结果已写入工程。'
      }
    }
  }
  if (ev.type === 'files') {
    files.value = { ...ev.files }
    // 首包文件到达时自动选中第一个 .vue，方便立刻查看页面代码
    if (!selectedPath.value) {
      const firstVue = listSortedPaths(ev.files).find((p) => p.endsWith('.vue'))
      selectedPath.value = firstVue || listSortedPaths(ev.files)[0] || ''
    }
  }
  if (ev.type === 'file') {
    if (selectedPath.value === ev.path && !editorDirty.value) {
      editorContent.value = ev.content
    }
  }
  if (ev.type === 'plan') {
    currentPlan.value = ev.plan
    pushSystem(`结构：${ev.plan.appTitle} · 路由 ${ev.plan.routes.map((r) => r.path).join('、')}`)
  }
  if (ev.type === 'error') {
    errorMessage.value = ev.message
    status.value = 'error'
  }
}

/** 续改完成后，把变更/删除的文件热写到 WebContainer，无需重装依赖 */
async function syncChangedFilesToPreview(changed: string[], deleted: string[]) {
  const session = previewSession.value
  if (!session || !previewUrl.value) return
  for (const path of deleted) {
    try {
      // WebContainer 无统一 delete API 封装时，写空文件避免引用爆炸；路由侧应由模型改掉引用
      await session.writeFile(path, '')
    } catch {
      /* ignore */
    }
  }
  for (const path of changed) {
    if (deleted.includes(path)) continue
    const content = files.value[path]
    if (typeof content !== 'string') continue
    try {
      await session.writeFile(path, content)
    } catch (e) {
      pushSystem(`同步预览失败 ${path}：${e instanceof Error ? e.message : '未知错误'}`)
    }
  }
  pushSystem('已将改动热同步到预览（若页面无变化可手动刷新 iframe）')
}

/** 清空工程、对话与本地持久化，回到「首生」状态；需先停止进行中的任务 */
function resetProject() {
  if (isBusy.value) {
    toast.error('请先停止当前任务')
    return
  }
  abortRef.value?.abort()
  stopPreview()
  files.value = {}
  currentPlan.value = null
  selectedPath.value = ''
  editorContent.value = ''
  editorDirty.value = false
  previewLogs.value = []
  errorMessage.value = ''
  status.value = 'idle'
  messages.value = []
  clearAppGenWorkspace()
  inputText.value =
    '做一个简洁的个人作品集站点：首页介绍、项目列表、关于我。中文界面，现代卡片风格。'
  pushSystem('已清空工程。下一条消息将重新生成新项目；有工程后可继续对话改代码。')
  toast.success('已新建空白会话')
}

/**
 * 发送用户消息：根据 hasProject 分叉。
 * - 续改：保留 files/plan，edit pipeline 结束后热同步预览
 * - 首生：清空旧工程，全量 pipeline，完成后自动 startPreview
 */
async function sendMessage() {
  if (!hasTextModel.value) {
    errorMessage.value = '请先配置文本模型'
    return
  }
  const text = inputText.value.trim()
  if (!text) {
    toast.error(hasProject.value ? '请输入修改要求' : '请先描述你想生成的应用')
    return
  }
  if (isBusy.value) {
    toast.error('正在生成中，可先点停止再发送')
    return
  }

  leftTab.value = 'chat'
  abortRef.value?.abort()
  const ac = new AbortController()
  abortRef.value = ac
  isBusy.value = true
  errorMessage.value = ''
  pushUser(text)
  inputText.value = ''

  const editing = hasProject.value

  try {
    if (editing) {
      // 续改：保留工程与预览，不做整包重建
      pushSystem('在现有工程上继续修改…')
      const result = await runAppGenEditPipeline({
        instruction: text,
        files: files.value,
        plan: currentPlan.value,
        signal: ac.signal,
        onEvent: handlePipelineEvent,
      })
      files.value = result.files
      if (previewSession.value && previewUrl.value) {
        await syncChangedFilesToPreview(
          result.changed.filter((p) => !result.deleted.includes(p)),
          result.deleted,
        )
        status.value = 'previewing'
      } else {
        pushSystem('修改完成。可点右上角「启动预览」查看效果。')
      }
    } else {
      // 首生：丢弃旧预览会话与工程，从零跑 pipeline
      stopPreview()
      files.value = {}
      selectedPath.value = ''
      editorContent.value = ''
      currentPlan.value = null
      const result = await runAppGenPipeline({
        requirement: text,
        signal: ac.signal,
        onEvent: handlePipelineEvent,
      })
      files.value = result.files
      pushSystem('代码已就绪，正在启动浏览器预览…')
      await startPreview(ac.signal)
    }
  } catch (e) {
    if (ac.signal.aborted || (e instanceof Error && e.name === 'AbortError')) {
      status.value = 'cancelled'
      return
    }
    const msg = e instanceof Error ? e.message : '生成失败'
    errorMessage.value = msg
    status.value = 'error'
    pushSystem(`出错：${msg}`)
  } finally {
    if (!ac.signal.aborted) isBusy.value = false
  }
}

/**
 * 在 WebContainer 内 mount 工程 → npm install → vite dev。
 * 可由首生流程传入 externalSignal 与生成共用 AbortController；也可单独点「启动预览」。
 */
async function startPreview(externalSignal?: AbortSignal) {
  if (!Object.keys(files.value).length) {
    toast.error('还没有可预览的工程文件')
    return
  }
  const ac = externalSignal ? null : new AbortController()
  if (ac) {
    abortRef.value?.abort()
    abortRef.value = ac
  }
  const signal = externalSignal ?? ac!.signal

  stopPreview()
  previewLogs.value = []
  isBusy.value = true
  errorMessage.value = ''
  status.value = 'installing'
  pushSystem('开始浏览器内预览：启动 WebContainer → 安装依赖 → 跑 Vite。下方右侧可看实时日志。')

  try {
    const session = await startVuePreview(files.value, {
      signal,
      onLog: (line) => {
        appendPreviewLog(line)
        // 关键节点同步到对话，避免刷屏
        if (
          /WebContainer|挂载|开始 npm|依赖安装|启动 Vite|预览地址|失败|error|ERR!|timeout|超时/i.test(
            line,
          )
        ) {
          pushSystem(line)
        }
      },
    })
    previewSession.value = session
    previewUrl.value = session.url
    status.value = 'previewing'
    pushSystem('预览已就绪')
    toast.success('预览已启动')
  } catch (e) {
    if (signal.aborted || (e instanceof Error && e.name === 'AbortError')) {
      status.value = 'cancelled'
      appendPreviewLog('已取消')
      return
    }
    const msg = e instanceof Error ? e.message : '预览启动失败'
    errorMessage.value = msg
    status.value = 'error'
    appendPreviewLog(msg)
    pushSystem(`预览失败：${msg}`)
    toast.error(msg)
  } finally {
    if (!signal.aborted) isBusy.value = false
  }
}

function handleDownload() {
  if (!canDownload.value) {
    toast.error('暂无可下载的工程')
    return
  }
  // ZIP 文件名优先取 package.json 的 name 字段
  let name = 'ai-app'
  try {
    name = String(JSON.parse(files.value['package.json'] || '{}').name || 'ai-app')
  } catch {
    /* ignore */
  }
  downloadAppZip(files.value, `${name}.zip`)
  toast.success('已开始下载 ZIP')
}

function goModelConfig() {
  router.push('/model-config')
}

function toggleThinking(msg: AppGenChatMessage) {
  msg.thinkingOpen = !msg.thinkingOpen
}

function onComposerKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    void sendMessage()
  }
}

/** 从 localStorage 恢复对话与工程；预览不恢复，需用户手动启动 */
onMounted(() => {
  const saved = loadAppGenWorkspace()
  if (!saved) return
  files.value = saved.files
  messages.value = saved.messages
  currentPlan.value = saved.plan
  selectedPath.value =
    saved.selectedPath ||
    listSortedPaths(saved.files).find((p) => p.endsWith('.vue')) ||
    listSortedPaths(saved.files)[0] ||
    ''
  if (saved.inputText) inputText.value = saved.inputText
  status.value = Object.keys(saved.files).length ? saved.status || 'ready' : 'idle'
  if (saved.messages.length || Object.keys(saved.files).length) {
    pushSystem('已从本地恢复上次的对话与工程（预览需重新点「启动预览」）')
  }
})

/** 离开页面前中止生成、释放预览，并做一次同步持久化（不走防抖） */
onUnmounted(() => {
  abortRef.value?.abort()
  stopPreview()
  if (persistTimer !== null) {
    window.clearTimeout(persistTimer)
    persistTimer = null
  }
  saveAppGenWorkspace({
    inputText: inputText.value,
    status: hasProject.value ? 'ready' : 'idle',
    messages: messages.value,
    files: files.value,
    plan: currentPlan.value,
    selectedPath: selectedPath.value,
  })
})
</script>

<template>
  <div class="workspace">
    <header class="workspace__top">
      <div class="workspace__brand">
        <h1 class="workspace__title">AI 应用生成</h1>
        <span class="workspace__status">{{ statusLabel }}</span>
        <span v-if="hasProject" class="workspace__mode">续改中</span>
      </div>
      <div class="workspace__actions">
        <AppButton variant="ghost" size="sm" :disabled="isBusy" @click="resetProject">
          新建项目
        </AppButton>
        <AppButton
          variant="secondary"
          size="sm"
          :disabled="!canDownload || isBusy"
          @click="startPreview()"
        >
          启动预览
        </AppButton>
        <AppButton size="sm" :disabled="!canDownload" @click="handleDownload">下载 ZIP</AppButton>
      </div>
    </header>

    <div v-if="!hasTextModel" class="workspace__guard">
      <p>尚未配置文本模型，无法生成应用。</p>
      <AppButton size="sm" @click="goModelConfig">去配置模型</AppButton>
    </div>

    <div class="workspace__body">
      <!-- 左侧：对话 / 文件 -->
      <section class="pane pane--left">
        <div class="pane__tabs">
          <button
            type="button"
            class="pane__tab"
            :class="{ 'pane__tab--active': leftTab === 'chat' }"
            @click="leftTab = 'chat'"
          >
            对话
          </button>
          <button
            type="button"
            class="pane__tab"
            :class="{ 'pane__tab--active': leftTab === 'files' }"
            @click="leftTab = 'files'"
          >
            文件
            <span v-if="fileCount" class="pane__tab-count">{{ fileCount }}</span>
          </button>
        </div>

        <!-- 对话面板 -->
        <div v-show="leftTab === 'chat'" class="chat">
          <div ref="chatBoxRef" class="chat__list">
            <div v-if="!messages.length" class="chat__empty">
              <p>描述你想做的应用，我会流式生成完整 Vue3 工程。</p>
              <p class="muted">工程与对话会自动保存在本机浏览器；换页再回来还能继续。推倒重来点「新建项目」。</p>
            </div>

            <div
              v-for="msg in messages"
              :key="msg.id"
              class="bubble"
              :class="`bubble--${msg.role}`"
            >
              <div class="bubble__role">
                {{ msg.role === 'user' ? '你' : msg.role === 'assistant' ? 'AI' : '系统' }}
                <span v-if="msg.streaming" class="bubble__pulse">生成中</span>
              </div>

              <button
                v-if="msg.thinking"
                type="button"
                class="think"
                @click="toggleThinking(msg)"
              >
                <span class="think__label">
                  {{ msg.streaming ? '思考过程（生成中）' : '思考过程' }}
                </span>
                <span class="think__chevron">{{ msg.thinkingOpen ? '收起' : '展开' }}</span>
              </button>
              <pre v-if="msg.thinking && msg.thinkingOpen" class="think__body">{{ msg.thinking }}</pre>

              <div v-if="msg.content" class="bubble__content">{{ msg.content }}</div>
            </div>
          </div>

          <div class="composer">
            <textarea
              v-model="inputText"
              class="composer__input"
              rows="3"
              :disabled="!hasTextModel"
              :placeholder="composerPlaceholder"
              @keydown="onComposerKeydown"
            />
            <div class="composer__bar">
              <p v-if="errorMessage" class="composer__error">{{ errorMessage }}</p>
              <div class="composer__btns">
                <AppButton
                  v-if="isBusy"
                  variant="ghost"
                  size="sm"
                  @click="cancelGeneration"
                >
                  停止
                </AppButton>
                <AppButton
                  size="sm"
                  :disabled="isBusy || !hasTextModel"
                  @click="sendMessage"
                >
                  {{ isBusy ? '生成中…' : '发送' }}
                </AppButton>
              </div>
            </div>
          </div>
        </div>

        <!-- 文件面板 -->
        <div v-show="leftTab === 'files'" class="files">
          <div class="files__tree">
            <p v-if="!fileCount" class="muted files__empty">生成后将在此展示工程目录</p>
            <AppGenFileTree
              v-else
              :tree="fileTree"
              :selected-path="selectedPath"
              @select="selectFile"
            />
          </div>
          <div class="files__editor">
            <div class="files__bar">
              <span class="files__path">{{ selectedPath || '未选择文件' }}</span>
              <div class="files__bar-right">
                <span v-if="saveHint" class="files__hint">{{ saveHint }}</span>
                <span v-else-if="editorDirty" class="files__hint files__hint--dirty">未保存</span>
                <AppButton
                  size="sm"
                  variant="secondary"
                  :disabled="!selectedPath"
                  @click="applyEditorToFiles"
                >
                  保存并同步预览
                </AppButton>
              </div>
            </div>
            <textarea
              v-model="editorContent"
              class="files__code"
              :disabled="!selectedPath"
              spellcheck="false"
              @input="onEditorInput"
            />
          </div>
        </div>
      </section>

      <!-- 右侧：预览 -->
      <section class="pane pane--right">
        <div class="preview__head">
          <span>运行预览</span>
          <a
            v-if="previewUrl"
            class="preview__link"
            :href="previewUrl"
            target="_blank"
            rel="noopener"
          >
            新窗口打开
          </a>
        </div>
        <div class="preview__body">
          <iframe
            v-if="previewUrl"
            class="preview__frame"
            :src="previewUrl"
            title="应用预览"
          />
          <div v-else class="preview__empty">
            <p>预览区</p>
            <p class="muted">生成完成后会在浏览器内安装依赖并启动 Vite</p>
          </div>
        </div>
        <div v-if="previewLogs.length" class="preview__log">
          <div class="preview__log-head">安装 / 启动日志</div>
          <div ref="previewLogRef" class="preview__log-body">
            <div v-for="(line, i) in previewLogs" :key="`${i}-${line.slice(0, 24)}`" class="preview__log-line">
              {{ line }}
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.workspace {
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  padding: 12px 16px 16px;
  box-sizing: border-box;
}

.workspace__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.workspace__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.workspace__title {
  margin: 0;
  font-size: 1.15rem;
  letter-spacing: -0.02em;
}

.workspace__status {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  background: var(--color-surface);
}

.workspace__mode {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  font-weight: 600;
}

.workspace__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.workspace__guard {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 10px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--color-warning) 35%, var(--color-border));
  background: color-mix(in srgb, var(--color-warning) 10%, var(--color-surface));
  flex-shrink: 0;
}

.workspace__body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(360px, 1fr) minmax(380px, 1.1fr);
  gap: 12px;
}

.pane {
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
  overflow: hidden;
}

.pane__tabs {
  display: flex;
  gap: 4px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.pane__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.pane__tab--active {
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
}

.pane__tab-count {
  font-size: 11px;
  opacity: 0.75;
}

.chat,
.files {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.chat__list {
  flex: 1;
  overflow: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat__empty {
  margin: auto 0;
  text-align: center;
  color: var(--color-text-secondary);
  line-height: 1.7;
  padding: 24px;
}

.bubble {
  max-width: 92%;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
}

.bubble--user {
  align-self: flex-end;
  background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
}

.bubble--assistant,
.bubble--system {
  align-self: flex-start;
}

.bubble--system {
  max-width: 100%;
  background: transparent;
  border-style: dashed;
  opacity: 0.92;
}

.bubble__role {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.bubble__pulse {
  font-weight: 600;
  color: var(--color-primary);
  animation: pulse 1.2s ease-in-out infinite;
}

.bubble__content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.65;
  font-size: var(--text-sm);
}

.think {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  margin-bottom: 8px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-bg) 80%, #64748b 8%);
  cursor: pointer;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.think__label {
  font-weight: 600;
}

.think__dots {
  animation: pulse 1s linear infinite;
}

.think__body {
  margin: 0 0 8px;
  padding: 10px;
  max-height: 220px;
  overflow: auto;
  border-radius: 10px;
  background: #0b1220;
  color: #cbd5e1;
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.composer {
  border-top: 1px solid var(--color-border);
  padding: 10px;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--color-bg) 55%, var(--color-surface));
}

.composer__input {
  width: 100%;
  resize: none;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: inherit;
  font: inherit;
  line-height: 1.55;
}

.composer__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}

.composer__error {
  margin: 0;
  flex: 1;
  font-size: 12px;
  color: var(--color-error);
}

.composer__btns {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.files {
  flex-direction: row;
}

.files__tree {
  width: 200px;
  flex-shrink: 0;
  overflow: auto;
  padding: 8px;
  border-right: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-bg) 70%, var(--color-surface));
}

.files__empty {
  padding: 12px 8px;
}

.files__editor {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.files__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.files__path {
  font-size: 12px;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.files__bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.files__hint {
  font-size: 11px;
  color: var(--color-success);
}

.files__hint--dirty {
  color: var(--color-warning);
}

.files__code {
  flex: 1;
  min-height: 0;
  width: 100%;
  border: none;
  resize: none;
  padding: 12px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;
  background: #0f172a;
  color: #e2e8f0;
}

.preview__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
  font-weight: 600;
  font-size: var(--text-sm);
  flex-shrink: 0;
}

.preview__link {
  font-size: 12px;
  color: var(--color-primary);
}

.preview__body {
  flex: 1;
  min-height: 0;
  background: var(--color-bg);
}

.preview__frame {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}

.preview__empty {
  height: 100%;
  display: grid;
  place-content: center;
  text-align: center;
  gap: 6px;
  color: var(--color-text-secondary);
}

.preview__log {
  flex-shrink: 0;
  max-height: 180px;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--color-border);
  background: #0b1220;
}

.preview__log-head {
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.preview__log-body {
  flex: 1;
  overflow: auto;
  padding: 8px 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.45;
  color: #cbd5e1;
}

.preview__log-line {
  word-break: break-word;
  margin-bottom: 2px;
}

.muted {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

@media (max-width: 960px) {
  .workspace {
    height: auto;
    min-height: calc(100vh - 64px);
  }
  .workspace__body {
    grid-template-columns: 1fr;
    min-height: 70vh;
  }
  .pane--left,
  .pane--right {
    min-height: 420px;
  }
  .files {
    flex-direction: column;
  }
  .files__tree {
    width: 100%;
    max-height: 160px;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }
}
</style>

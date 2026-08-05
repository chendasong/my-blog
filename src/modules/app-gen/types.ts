/**
 * AI 应用生成（App Gen）模块类型定义。
 * 与博客其它 AI 能力（对话、知识库、图片等）隔离，专用于「描述需求 → 规划 → 生成 Vue 工程 → 预览/下载」流水线。
 */

/** 生成物：相对工程根的路径 → 文件全文；与 zip、WebContainer 挂载、Monaco 编辑共用同一结构 */
export type AppGenFileMap = Record<string, string>

/** 单条路由规划：LLM 规划阶段产出，scaffold 用来写 router 与占位 view */
export type AppGenRoutePlan = {
  /** Vue Router path，须以 / 开头；'/' 为应用首页 */
  path: string
  /** 路由 name，同时用作 App.vue 导航链接文案 */
  name: string
  /** 页面组件文件名，相对 src/views，如 HomeView.vue */
  viewFile: string
  /** 页面职责说明，写入占位页并指导 LLM 生成正文 */
  description: string
}

/**
 * 应用规划（planning 阶段结构化结果）。
 * 先定 app 元信息与路由/组件清单，再分步生成代码，避免一次输出整仓导致失控。
 */
export type AppGenPlan = {
  /** npm package name 来源，经 sanitizePkgName 后写入 package.json */
  appName: string
  /** 浏览器标题、顶栏品牌文案 */
  appTitle: string
  /** 应用一句话描述，README 与占位页会引用 */
  description: string
  routes: AppGenRoutePlan[]
  /** plan 阶段声明的共享组件，相对 src/components，最多 6 个 */
  components?: string[]
  /** 给后续生成步骤的备注，不一定展示给用户 */
  notes?: string
}

export type AppGenLogLevel = 'info' | 'success' | 'warn' | 'error'

/** 工作台底部/侧栏流水线日志条目 */
export type AppGenLogItem = {
  id: string
  level: AppGenLogLevel
  message: string
  at: number
}

/**
 * 生成流水线状态机。
 * idle → planning → generating → ready →（可选）installing/starting → previewing；
 * error/cancelled 为终态或中断。
 */
export type AppGenPipelineStatus =
  | 'idle'
  | 'planning'
  | 'generating'
  | 'ready'
  | 'installing'
  | 'starting'
  | 'previewing'
  | 'error'
  | 'cancelled'

export type AppGenChatRole = 'user' | 'assistant' | 'system'

/** 左侧对话区一条消息；与博客通用聊天分离，仅服务 App Gen 多轮改需求 */
export type AppGenChatMessage = {
  id: string
  role: AppGenChatRole
  /** 展示给用户的正文（流式 delta 追加） */
  content: string
  /** 模型 reasoning/思考过程，可折叠，类似 Cursor Thinking */
  thinking: string
  thinkingOpen: boolean
  streaming: boolean
  at: number
}

/**
 * pipeline 向 UI 推送的事件联合类型。
 * 覆盖：日志、状态、完整 plan/files、单文件增量、预览 URL、流式 assistant 消息等。
 */
export type AppGenProgressEvent =
  | { type: 'log'; level: AppGenLogLevel; message: string }
  | { type: 'status'; status: AppGenPipelineStatus }
  | { type: 'plan'; plan: AppGenPlan }
  | { type: 'files'; files: AppGenFileMap }
  | { type: 'file'; path: string; content: string }
  | { type: 'preview-url'; url: string }
  | { type: 'error'; message: string }
  | { type: 'assistant-start'; id: string; title?: string }
  | { type: 'thinking-delta'; id: string; text: string }
  | { type: 'content-delta'; id: string; text: string }
  | { type: 'assistant-end'; id: string }
  | { type: 'step'; message: string }

/** 文件树节点：目录可含 children，文件为叶子；path 为选中/读取 AppGenFileMap 的 key */
export type FileTreeNode = {
  name: string
  /** 目录为累积路径（如 src/views），文件为完整相对路径（如 src/views/HomeView.vue） */
  path: string
  type: 'file' | 'dir'
  children?: FileTreeNode[]
}

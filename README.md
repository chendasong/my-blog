# Luminary（chends）

个人站点全栈项目：**博客、笔记、简历、情侣空间、AI 工坊、悬浮音乐与站点助手**。前端为 **Vue 3 + Vite + TypeScript**，内容与管理数据主要走 **Supabase**，媒体资源优先 **七牛云**，大模型能力对接 **火山方舟**（文本 / 生图 / 视频等，按环境变量启用）。

---

## 功能一览

| 模块 | 说明 |
|------|------|
| **博客** | 列表筛选 / 搜索、详情 Markdown 渲染、后台撰写与编辑（需登录） |
| **笔记** | 列表与详情、分类与置顶、编辑器（需登录） |
| **简历** | 在线展示与编辑，数据持久化 |
| **情侣空间** | 入口密码校验（session）、记忆卡片与多媒体、路由守卫 |
| **AI 工坊** | 多能力工作台：对话文案、生图、视频、连载漫画等（按功能拆分组件） |
| **AI Agent** | 多步任务流页面（需登录） |
| **管理** | 登录、`/admin/profile` 站点设置（如背景音乐列表） |
| **全局** | 悬浮音乐播放器、悬浮 AI 助手、Toast、回顶 |

更细的**架构说明、实现思路与面试话术**见：[docs/架构与面试要点.md](./docs/架构与面试要点.md)。

---

## 技术栈

- **Vue 3**（Composition API + `<script setup>`）
- **Vue Router**（路由元信息 + 导航守卫）
- **Pinia**（认证、站点设置、各业务 store）
- **TypeScript**
- **Vite 5**
- **Supabase**（Postgres + Auth + Storage 回退场景）
- **七牛云 Kodo**（直传凭证、删除、外链拉取转存）
- **Axios / fetch**（API 调用）
- **marked + highlight.js**（Markdown 与代码高亮）
- 其他：**dayjs**、**@vueuse/core**、**html2pdf.js**（导出等）

---

## 环境要求

- **Node.js** ≥ 18  
- **npm** ≥ 9

---

## 快速开始

```bash
npm install
npm run dev
```

默认开发地址：<http://localhost:5173>（端口以 Vite 配置为准）。

```bash
npm run build    # 产物在 dist/
npm run preview  # 本地预览生产构建
```

---

## 环境变量

复制 `.env.example` 为 `.env`，按说明填写。**修改后需重启 `npm run dev` 或重新 build**（Vite 在编译期注入变量）。

主要类别：

- **Supabase**：`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`
- **七牛**：`QINIU_*`（密钥勿使用 `VITE_` 暴露到浏览器）、`QINIU_ADMIN_SECRET`、`VITE_QINIU_PUBLIC_BASE` 等
- **API 根路径**：`VITE_API_BASE`（前后端不同源时）
- **火山方舟**：`VITE_VOLCANO_*` 等（见 `.env.example` 注释）

七牛相关 **Secret 仅放在服务端**；前端通过本站 `/api/*` 换上传凭证、删除与转存。

---

## 目录结构（精简）

```
chends/
├── api/                      # 部署到 Vercel 等平台的 Serverless 接口（七牛、图片代理等）
├── public/                   # 静态资源
├── src/
│   ├── api/                  # 前端数据层：Supabase 封装、AI 请求等
│   ├── components/           # 通用 + blog / notes / resume / ai-workshop 等
│   ├── composables/          # 组合式函数（如 Toast）
│   ├── data/                 # 静态展示数据、AI 功能配置等
│   ├── layouts/              # 主布局
│   ├── lib/                  # 工具：七牛客户端、音乐桥接、图片拼接等
│   ├── pages/                # 页面级路由组件
│   ├── router/               # 路由与守卫
│   ├── stores/               # Pinia
│   ├── types/                # TS 类型
│   ├── assets/styles/        # 全局样式与设计变量
│   ├── App.vue
│   └── main.ts
├── docs/                     # 架构与面试说明文档
├── vite.config.ts            # 含路径别名、七牛相关 env 合并、本地 API 插件
├── .env.example
└── package.json
```

---

## 部署说明（简要）

- **静态站点**：`npm run build` 后托管 `dist/`。
- **接口**：`api/` 目录需部署到支持 Node Serverless 的平台（如 Vercel），并与前端配置同源或设置 `VITE_API_BASE`。
- 生产环境请完整配置 HTTPS、环境变量与 Supabase / 七牛权限策略。

---

## 许可

私有个人项目；如需开源再补充 LICENSE。

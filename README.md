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
- 其他：**dayjs**、**@vueuse/core**

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
- **接口（七牛上传凭证、删除、外链转存、图片代理）**  
  - **Vercel**：仓库根目录的 `api/*.js` 会作为 Serverless 函数挂载到同源 `/api/*`，与本地 `npm run dev` 行为一致。  
  - **仅 VPS / Nginx 静态托管**（只放了 `dist/`，没有 Node 处理 `/api`）：浏览器请求 `POST /api/qiniu-fetch-upload` 等会得到 **405** 或空响应，因为静态服务器不执行接口。请任选其一：  
    1. 在同一台机器用 **Node 跑本仓库提供的 API 进程**，再由 Nginx 反代：服务器上 `git pull` 后安装依赖，根目录放置与本地一致的 `.env`，执行 `npm run serve:api`（默认 `127.0.0.1:8787`），Nginx 里为 `location /api/` 配置 `proxy_pass http://127.0.0.1:8787`，并设置 `client_max_body_size`（如 `50m`）以便上传视频。详见 `scripts/serve-api.mjs` 文件头注释。  
    2. 或将整站（含 `api/`）部署到 Vercel 等平台；若接口与前端不同源，构建时设置 `VITE_API_BASE` 指向接口根 URL。
- 生产环境请完整配置 HTTPS、环境变量与 Supabase / 七牛权限策略。

### 宝塔面板（BT）简要步骤

思路：**静态页面**仍由 Nginx 指到 `dist/`；**七牛相关接口**由本机 Node 进程监听 `127.0.0.1:8787`，Nginx 把带 `/api/` 的请求转发过去。

1. **环境**  
   - 软件商店安装 **Node 版本管理器** 或 **Node.js**（建议 v18+）。  
   - 网站根目录建议放**完整项目**（含 `api/`、`scripts/`、`package.json`），而不仅是 `dist/`；或在本机 `npm run build` 后把 `dist/` 上传到站点目录，同时把 `api/`、`scripts/`、`package.json`、`package-lock.json` 放到服务器上同一套目录结构里，便于执行下面命令。

2. **依赖与构建**  
   - SSH 或宝塔「终端」进入项目根目录：  
     `npm ci` 或 `npm install`  
   - 若 `dist` 在服务器上构建：`npm run build`（记得在面板或终端里配置好生产用环境变量，或根目录放好 `.env`）。

3. **环境变量**  
   - 将本地已调通的 **`.env`** 拷到服务器**项目根目录**（勿提交到 Git）。至少包含七牛与 `QINIU_ADMIN_SECRET` 等，与本地一致。

4. **常驻运行 API 进程**  
   - 软件商店安装 **PM2 管理器**。  
   - 添加项目：启动文件选 **`npm`**，参数填 **`run serve:api`**，运行目录填**项目根目录**；或直接启动文件填 **`node`**，参数 **`scripts/serve-api.mjs`**。  
   - 保存并启动，确认日志里出现 `[serve-api] http://127.0.0.1:8787`。

5. **Nginx 反代 `/api/`**  
   - 打开该站点 → **设置** → **配置文件**，在 `server { ... }` 里、`location /` 之前或合适位置加入（若已有 `location /api/` 则合并修改，避免重复）：

```nginx
client_max_body_size 50m;

location /api/ {
    proxy_pass http://127.0.0.1:8787;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

   - 保存后 **重载配置**。也可用宝塔「反向代理」添加，注意目标为 `http://127.0.0.1:8787`，路径为 `/api/`（需与上面 `proxy_pass` 行为一致：请求路径原样传给 Node）。

6. **自测**  
   - 浏览器打开：`https://你的域名/api/qiniu-upload-token`（若配置了 `QINIU_ADMIN_SECRET`，需在请求头带密钥，与前端一致；可先临时在面板里关掉鉴权做连通性测试，或看 PM2 日志）。  
   - 能返回 JSON 后再试站内上传。

换域名后若只改了网站目录或 SSL，**没有动 PM2 与 Nginx 里的 `/api/` 反代**，也可能表现为「上传挂了」——按上面检查 **PM2 是否在跑**、**Nginx 是否仍包含 `location /api/`**。

---

## 许可

私有个人项目；如需开源再补充 LICENSE。

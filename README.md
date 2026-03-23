# Luminary — 我的个人博客空间

一个基于 Vue 3 + Vite + TypeScript 构建的现代化个人博客网站，具备博客发布、私密笔记、情侣空间、AI 工坊等功能模块。

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | ^3.4 | 核心框架，Composition API |
| Vite | ^5.2 | 构建工具 |
| TypeScript | ^5.2 | 类型系统 |
| Vue Router | ^4.3 | 客户端路由 |
| Pinia | ^2.1 | 状态管理 |
| dayjs | ^1.11 | 日期处理 |
| @vueuse/core | ^10.9 | Vue 组合式工具库 |

---

## 快速启动

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

浏览器访问 [http://localhost:5173](http://localhost:5173)

### 构建生产版本

```bash
npm run build
```

构建产物输出至 `dist/` 目录。

### 预览生产构建

```bash
npm run preview
```

---

## 项目目录结构

```
chends/
├── public/                        # 静态资源（不经过构建处理）
│   ├── favicon.svg                # 网站图标
│   └── images/                    # 静态图片资源
│       ├── avatar.svg             # 用户头像
│       ├── article-1.svg          # 文章封面图 1-6
│       ├── couple-avatar-1.svg    # 情侣头像
│       ├── couple-avatar-2.svg
│       ├── couple-cover.svg       # 情侣空间封面
│       └── memory-1.svg           # 记忆相册图 1-6
│
├── src/
│   ├── assets/
│   │   └── styles/
│   │       ├── variables.css      # 全局 CSS 变量（颜色、间距、字体、动画等）
│   │       └── global.css         # 全局样式、动画、工具类
│   │
│   ├── components/                # 公共组件（按模块分类）
│   │   ├── common/                # 通用组件
│   │   │   ├── AppNavbar.vue      # 顶部导航栏（含移动端抽屉菜单）
│   │   │   ├── AppFooter.vue      # 底部页脚
│   │   │   ├── AppButton.vue      # 通用按钮（多变体：primary/secondary/ghost/warm）
│   │   │   ├── AppBadge.vue       # 标签徽章
│   │   │   ├── DayCounter.vue     # 天数计数器（用于情侣空间）
│   │   │   └── SectionTitle.vue   # 区块标题组件
│   │   ├── blog/
│   │   │   └── ArticleCard.vue    # 文章卡片（支持普通/精选两种样式）
│   │   ├── notes/
│   │   │   └── NoteCard.vue       # 笔记卡片
│   │   └── ai/
│   │       └── AIFeatureCard.vue  # AI 功能卡片
│   │
│   ├── data/                      # 静态数据文件（所有数据集中管理）
│   │   ├── index.ts               # 数据统一出口
│   │   ├── user.ts                # 用户个人信息
│   │   ├── articles.ts            # 博客文章数据
│   │   ├── notes.ts               # 笔记数据
│   │   ├── couple.ts              # 情侣空间数据（信息 + 记忆相册）
│   │   └── ai-features.ts         # AI 功能列表数据
│   │
│   ├── layouts/
│   │   └── MainLayout.vue         # 主布局（含 Navbar + Footer + RouterView）
│   │
│   ├── pages/                     # 页面组件
│   │   ├── HomePage.vue           # 首页
│   │   ├── blog/
│   │   │   ├── BlogList.vue       # 博客列表页（支持分类筛选、关键词搜索）
│   │   │   └── BlogDetail.vue     # 博客详情页（Markdown 渲染）
│   │   ├── notes/
│   │   │   └── NotesPage.vue      # 笔记页（左侧列表 + 右侧内容双栏布局）
│   │   ├── couple/
│   │   │   ├── CoupleEntry.vue    # 情侣空间入口（密码验证）
│   │   │   └── CoupleSpace.vue    # 情侣空间主页（需密码授权）
│   │   └── ai/
│   │       └── AIPage.vue         # AI 工坊页（功能列表 + 输入输出工作台）
│   │
│   ├── router/
│   │   └── index.ts               # 路由配置（含情侣空间路由守卫）
│   │
│   ├── stores/
│   │   └── app.ts                 # Pinia 全局状态（菜单开关、情侣空间认证）
│   │
│   ├── types/
│   │   └── index.ts               # 全局 TypeScript 类型定义
│   │
│   ├── App.vue                    # 根组件
│   └── main.ts                    # 应用入口
│
├── index.html                     # HTML 模板
├── vite.config.ts                 # Vite 配置（路径别名 @/）
├── tsconfig.json                  # TypeScript 配置
├── tsconfig.node.json             # Node 环境 TS 配置
└── package.json                   # 项目依赖与脚本
```

---

## 功能模块说明

### 📝 博客

- 文章列表支持按分类（技术、生活、设计、思考）筛选
- 支持标题、摘要、标签关键词搜索
- 文章详情页内置轻量 Markdown 渲染
- 文章数据位于 `src/data/articles.ts`

### 📔 笔记

- 左侧导航列表，右侧内容预览
- 支持按分类（工作、生活、学习、想法、待办）筛选
- 支持置顶笔记
- 笔记数据位于 `src/data/notes.ts`

### 💑 情侣空间

- 入口页需输入专属密码（默认：`cy0714`）
- 通过后写入 `sessionStorage`，刷新页面无需重新输入
- 内含：在一起天数计数、双人信息卡、记忆相册（可按类型筛选）
- 情侣数据位于 `src/data/couple.ts`
- 路由守卫位于 `src/router/index.ts`

> 修改密码：编辑 `src/pages/couple/CoupleEntry.vue` 中的 `COUPLE_PASSWORD` 常量

### ✨ AI 工坊

- 多个 AI 功能入口：文案创作、代码助手、翻译、诗词、食谱、医生、生图、视频生成作坊等（部分能力在界面中隐藏）
- 当前为演示模式（Mock 响应），接入真实 API 只需替换 `handleGenerate` 函数中的逻辑
- 功能数据位于 `src/data/ai-features.ts`

---

## 样式系统

所有设计 Token 定义在 `src/assets/styles/variables.css` 中，包括：

- **颜色**：`--color-primary`、`--color-bg`、`--color-text-*` 等
- **渐变**：`--gradient-primary`、`--gradient-warm` 等
- **阴影**：`--shadow-sm` 到 `--shadow-xl`
- **圆角**：`--radius-sm` 到 `--radius-full`
- **动画时长**：`--transition-fast`、`--transition-base`、`--transition-spring`
- **模糊**：`--blur-sm` 到 `--blur-xl`（用于磨砂玻璃效果）

---

## 扩展指南

### 添加新文章

编辑 `src/data/articles.ts`，按照 `Article` 类型结构添加新条目，封面图放在 `public/images/` 目录。

### 添加新笔记

编辑 `src/data/notes.ts`，按照 `Note` 类型结构添加新条目。

### 接入真实 AI API

修改 `src/pages/ai/AIPage.vue` 中的 `handleGenerate` 函数，将 Mock 响应替换为真实 API 调用（推荐使用 OpenAI / Claude / 国内大模型 API）。

### 修改主题颜色

编辑 `src/assets/styles/variables.css` 中的 CSS 变量即可全局生效。

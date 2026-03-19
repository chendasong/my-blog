-- Chends Blog seed data: 10 articles + 20 notes
-- Run in Supabase SQL Editor

INSERT INTO articles (title,summary,content,cover,category,tags,author,featured,views,likes,comments,published_at,updated_at) VALUES
('Vue 3 Composition API 深度实践指南','深入讲解 setup ref reactive computed watch 的使用技巧与最佳实践。','# Vue 3 Composition API

## 核心 API

```ts
const count = ref(0)
const double = computed(() => count.value * 2)
```

## Composables

```ts
export function useCounter(init = 0) {
  const count = ref(init)
  return { count, increment: () => count.value++ }
}
```

## 生命周期

setup onMounted onUpdated onUnmounted

## 总结

Composition API 让代码按功能组织，配合 script setup 更简洁。','/images/article-1.svg','技术',ARRAY['Vue3','Composition API','前端'],'晨光',true,2340,128,24,'2024-02-10','2024-02-10'),
('TypeScript 高级类型体操','深入理解条件类型 映射类型 infer 关键字，构建强大的类型工具库。','# TypeScript 高级类型

## 条件类型

```ts
type IsArr<T> = T extends any[] ? true : false
```

## infer

```ts
type RetType<T> = T extends (...a:any[]) => infer R ? R : never
```

## 映射类型

```ts
type MyPartial<T> = { [K in keyof T]?: T[K] }
type MyReadonly<T> = { readonly [K in keyof T]: T[K] }
```

## 工具类型速查

Partial Required Pick Omit Record Exclude Extract','/images/article-2.svg','技术',ARRAY['TypeScript','类型系统','前端'],'晨光',true,1890,96,18,'2024-02-28','2024-02-28'),
('前端性能优化：从加载到渲染的完整链路','覆盖网络请求 资源加载 JS执行 渲染性能四大维度，附实战案例。','# 前端性能优化

## 核心指标

FCP<1.8s LCP<2.5s CLS<0.1

## 网络层

预加载关键资源，HTTP/2，资源压缩。

## JS 优化

动态导入代码分割，Web Worker 处理重计算。

## 图片

WebP响应式图片懒加载。

## 渲染

避免强制同步布局，will-change 提升合成层，虚拟列表处理大数据。','/images/article-3.svg','技术',ARRAY['性能优化','Web','前端工程化'],'晨光',false,3120,145,31,'2024-03-12','2024-03-12'),
('Vite 原理深度解析：为什么比 Webpack 快那么多','对比 Webpack 与 Vite 构建策略，理解 ESM 按需编译的本质。','# Vite 原理

## Webpack 的困境

启动时分析所有模块依赖，项目越大冷启动越慢。

## Vite 方案

浏览器请求时才编译对应模块（原生ESM），esbuild 预构建依赖（Go编写，快10-100x）。

生产构建基于 Rollup，支持 Tree Shaking 和代码分割。

| 维度 | Webpack | Vite |
|---|---|---|
| 冷启动 | 慢 | 极快 |
| HMR | 较慢 | 极快 |','/images/article-4.svg','技术',ARRAY['Vite','Webpack','构建工具'],'晨光',true,2560,112,27,'2024-03-25','2024-03-25'),
('CSS Grid 布局完全指南','掌握 Grid 布局系统，命名区域，响应式布局，与 Flexbox 配合的最佳实践。','# CSS Grid 完全指南

## 基础

```css
.container { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
```

## 命名区域

```css
.layout { grid-template-areas: "header header" "sidebar main" "footer footer"; }
```

## 响应式黄金公式

```css
.cards { grid-template-columns: repeat(auto-fill,minmax(280px,1fr)); }
```

无需媒体查询自动适配列数。Grid 二维 vs Flexbox 一维，配合使用最佳。','/images/article-5.svg','技术',ARRAY['CSS','Grid','布局'],'晨光',false,1450,78,14,'2024-04-08','2024-04-08'),
('深圳到厦门：700公里骑行记录','骑行穿越粤闽两省，记录沿途风景与内心变化，与自己对话的旅程。','# 深圳到厦门 700公里骑行

## 为什么出发

某个压力顶点的周五，打开地图画了一条线。两周准备，出发。

## 广东段

汕尾渔港炒粉20块，旅程最好吃的一顿。

## 福建段

漳州茶园，阿婆塞来一袋桔子：不远了加油！

## 抵达

骑进厦门那刻泪流满面。700公里是和解——和焦虑，和自己。

## 收获

少即是多。背包越轻，心越自由。','/images/article-6.svg','生活',ARRAY['骑行','旅行','生活'],'晨光',true,4200,210,45,'2024-04-20','2024-04-20'),
('Pinia 状态管理最佳实践','掌握 Vue3 时代的状态管理，告别繁琐的 mutations，拥抱更简洁的 API。','# Pinia 最佳实践

## 为什么选 Pinia

无需 mutations 直接修改，完整 TypeScript 支持，模块化无嵌套。

## 定义 Store

```ts
export const useUserStore = defineStore("user", () => {
  const user = ref<User|null>(null)
  const isLoggedIn = computed(() => !!user.value)
  async function login(c) { user.value = await api.login(c) }
  return { user, isLoggedIn, login }
})
```

## 持久化插件

pinia.use(piniaPluginPersistedstate)','/images/article-1.svg','技术',ARRAY['Pinia','Vue3','状态管理'],'晨光',false,1680,89,20,'2024-05-06','2024-05-06'),
('设计系统从零到一：构建可复用组件库','从设计 Token 到组件实现，分享企业级设计系统完整实践经验。','# 设计系统从零到一

## 设计 Token

```css
:root { --color-primary:#5B8AF0; --spacing-md:16px; --radius-md:8px; }
```

## 组件原则

单一职责，可组合，可配置（props），可访问（WCAG）。

## 工具链

Storybook 文档 + Vitest 测试 + Changesets 版本管理。

先写文档再写组件，文档驱动开发。','/images/article-2.svg','设计',ARRAY['设计系统','组件库','UI'],'晨光',false,980,56,11,'2024-05-18','2024-05-18'),
('三十岁，写给自己的一封信','在三十岁节点回顾过去十年，那些失去的得到的，以及对未来的期许。','# 三十岁，写给自己

三十岁到来之前，以为自己会很焦虑。但那天早晨阳光照进窗户，我只是平静地想——还好，我还在。

## 二十岁的事

离开家乡来深圳，在出租屋用二手电脑学编程，学了三年。

## 感谢

感谢那些最难时没有放弃的自己。

## 期许

少一些证明，多一些感受。慢下来，好好看看风景。','/images/article-3.svg','思考',ARRAY['成长','随笔','生活'],'晨光',true,5600,320,67,'2024-06-01','2024-06-01'),
('Node.js 流式处理：大文件与实时数据','掌握 Streams 核心概念，解决大文件读写和 SSE 实时推送问题。','# Node.js 流式处理

## 为什么用流

读取1GB文件一次性加载会撑爆内存，流每次只处理一小块。

## 四种流

Readable 可读，Writable 可写，Duplex 双工，Transform 转换。

## 文件复制

```js
fs.createReadStream("in.txt").pipe(fs.createWriteStream("out.txt"))
```

## SSE 推送

```js
res.setHeader("Content-Type","text/event-stream")
setInterval(() => res.write("data: ping\n\n"), 1000)
```','/images/article-4.svg','技术',ARRAY['Node.js','Stream','后端'],'晨光',false,1230,67,15,'2024-06-15','2024-06-15')
;

INSERT INTO notes (title,content,category,tags,color,pinned) VALUES
('2025年Q1工作复盘','## 完成

- 博客系统重构上线
- 设计规范文档整理

## 下季度计划

1. 推动前端监控建设
2. 组件库文档完善
3. 性能优化落地','work',ARRAY['复盘','工作','计划'],'#6C8EBF',true),
('Vue3 响应式原理笔记','## Proxy vs defineProperty

Vue3 用 Proxy 拦截所有操作包括数组变化。

核心：effect + track + trigger 三角关系。','study',ARRAY['Vue3','源码'],'#82B366',true),
('本月待办清单','## 工作

- [x] 完成组件库文档
- [ ] 性能优化评审

## 生活

- [ ] 买机械键盘
- [ ] 读完人类简史','todo',ARRAY['待办','计划'],'#B85450',false),
('关于写作的一些想法','写作是思维的外化。写不出来不是文笔问题，是思考不够深。每天写300字，不求好只求写。','idea',ARRAY['写作','思考'],'#9673A6',false),
('深圳周末骑行路线','## 推荐路线

1. 沿海绿道：深圳湾到蛇口约15km
2. 山地：塘朗山环线约25km
3. 城市：福田到南山约20km

最佳时间：秋冬清晨7-9点','idea',ARRAY['骑行','深圳','户外'],'#D6B656',false),
('英语学习方法论','输入为主，大量阅读英文文档。每天30分钟：15分钟精读技术文档，15分钟泛听Podcast。不背单词，在语境中记忆。','study',ARRAY['英语','学习','方法'],'#82B366',false),
('2024年书单','## 已读

- 人类简史 5星
- 被讨厌的勇气 4星
- 深度工作 4星

## 在读

- 置身事内

## 待读

- 黑天鹅
- 思考快与慢','idea',ARRAY['书单','阅读','成长'],'#9673A6',false),
('数据库索引优化笔记','## 核心原则

1. 最左前缀原则
2. 覆盖索引减少回表
3. 避免在索引列做运算

## 常见误区

LIKE前缀%失效，OR条件失效，NULL值注意处理','study',ARRAY['数据库','索引','后端'],'#6C8EBF',false),
('产品思维备忘录','## 核心问题

1. 用户是谁
2. 核心诉求是什么
3. 现有方案痛点
4. 我们的差异化

好产品：让用户感觉这就是我想要的。','work',ARRAY['产品','思维','工作'],'#D6B656',false),
('给未来自己的便签','如果你在焦虑，先深呼吸三次。大多数担心的事不会发生。专注当下，做好手头的事，其他的交给时间。你已经很好了。','idea',ARRAY['心情','随笔'],'#B85450',false),
('算法刷题模板','## 二分查找

```js
let l=0,r=n-1
while(l<=r){const m=(l+r)>>1;if(ok(m))r=m-1;else l=m+1}
```

## 滑动窗口

```js
let l=0
for(let r=0;r<n;r++){while(invalid())l++}
```','study',ARRAY['算法','LeetCode','数据结构'],'#82B366',true),
('Mac效率工具清单','## 必装

- Raycast 替代Spotlight
- iTerm2 + Oh My Zsh
- Rectangle 窗口管理

## 开发

- Cursor
- TablePlus 数据库客户端
- Proxyman 抓包','work',ARRAY['效率','工具','Mac'],'#6C8EBF',false),
('CSS变量使用技巧','## 基础

```css
:root { --primary: #5B8AF0; }
.btn { color: var(--primary); }
```

## 动态主题

```js
document.documentElement.style.setProperty("--primary","#E8607A")
```

## 计算值

```css
.box { width: calc(var(--size) * 2); }
```','study',ARRAY['CSS','变量','前端'],'#D6B656',false),
('关于时间管理的思考','时间管理的本质不是管理时间，而是管理精力。在精力最好的时段做最重要的事。学会说不，是第一课。','idea',ARRAY['时间管理','效率','思考'],'#9673A6',false),
('Git高频命令速查','## 撤销

```bash
git reset --soft HEAD~1
git reset --hard HEAD~1
git restore file.txt
```

## 分支

```bash
git switch -c feature/xxx
git cherry-pick <hash>
```','study',ARRAY['Git','命令','工具'],'#6C8EBF',false),
('摄影后期流程备忘','## Lightroom 流程

1. 导入评级筛选
2. 基础：曝光对比度高光阴影
3. HSL 色彩调整
4. 锐化降噪
5. 导出：长边2000px sRGB 80%质量','idea',ARRAY['摄影','后期','爱好'],'#D6B656',false),
('React Hooks 对比 Vue Composables','## 相似点

都是逻辑复用方案，都基于函数。

## 差异

React Hooks 每次渲染都执行，需注意依赖数组。
Vue Composables 只在 setup 中执行一次，响应式自动追踪。','study',ARRAY['React','Vue3','前端'],'#82B366',false),
('2025年个人OKR','## O1 技术影响力

- KR1: 输出10篇技术文章
- KR2: 开源项目500 star

## O2 身体健康

- KR1: 每周骑行3次
- KR2: 体重控制在70kg','work',ARRAY['OKR','计划','成长'],'#6C8EBF',true),
('常用正则表达式速查','## 邮箱
/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

## 手机号
/^1[3-9]\d{9}$/

## URL
/^https?:\/\/.+/

## 日期 YYYY-MM-DD
/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/','study',ARRAY['正则','工具','开发'],'#B85450',false),
('深圳生活指南','## 交通

地铁覆盖全市，打车滴滴，骑行绿道。

## 美食

- 早茶：沙井海鲜市场
- 客家菜：龙华
- 粤菜：老街

## 周末

东部：大鹏、较场尾
西部：深圳湾公园、蛇口','idea',ARRAY['深圳','生活','攻略'],'#9673A6',false)
;


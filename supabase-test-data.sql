-- 6 篇文章 + 7 条笔记
INSERT INTO articles (title,summary,content,cover,category,tags,author,featured,views,likes,comments,published_at,updated_at) VALUES
('Vue 3 Composition API 深度实践','setup、ref、reactive、computed、watch 核心用法与 Composables 最佳实践。','# Vue 3 Composition API

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

onMounted onUpdated onUnmounted','/images/article-1.svg','技术',ARRAY['Vue3','前端'],'晨光',true,1200,56,12,'2024-03-01','2024-03-01'),
('TypeScript 高级类型实战','条件类型、映射类型、infer 关键字，让你的代码更健壮。','# TypeScript 高级类型

## 条件类型

```ts
type IsArr<T> = T extends any[] ? true : false
```

## infer

```ts
type Ret<T> = T extends () => infer R ? R : never
```

## 映射类型

```ts
type MyPartial<T> = { [K in keyof T]?: T[K] }
```','/images/article-2.svg','技术',ARRAY['TypeScript','前端'],'晨光',true,980,44,8,'2024-03-15','2024-03-15'),
('Vite 原理：为什么比 Webpack 快','基于原生 ESM 的按需编译，esbuild 预构建，彻底告别漫长的冷启动。','# Vite 原理

## 核心思路

开发时利用浏览器原生 ESM，只在请求时才编译对应模块。

## esbuild 预构建

node_modules 依赖用 Go 编写的 esbuild 预构建，比 JS 工具快 10-100x。

## HMR

只更新变更模块，毫秒级热更新。','/images/article-3.svg','技术',ARRAY['Vite','构建工具'],'晨光',false,1560,72,18,'2024-04-01','2024-04-01'),
('深圳骑行：沿海绿道全程记录','从深圳湾出发，沿海岸线一路向西，风吹过来都是海的味道。','# 深圳骑行：沿海绿道

## 路线

深圳湾公园 → 蛇口渔港 → 海上世界，全程约 22km。

## 最佳时间

秋冬清晨 7-9 点，人少风轻，阳光斜照在海面上特别好看。

## 装备

共享单车即可，带水和防晒。终点吃碗蛇口的肠粉，完美。','/images/article-4.svg','生活',ARRAY['骑行','深圳','户外'],'晨光',true,2300,98,24,'2024-04-15','2024-04-15'),
('CSS Grid 响应式布局实战','用 auto-fill + minmax 实现无媒体查询的自适应网格，附命名区域完整示例。','# CSS Grid 实战

## 响应式黄金公式

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}
```

无需媒体查询，列数自动适配。

## 命名区域

```css
.layout {
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
}
```','/images/article-5.svg','技术',ARRAY['CSS','Grid','布局'],'晨光',false,876,38,6,'2024-05-01','2024-05-01'),
('三十岁写给自己','三十岁到来时没有焦虑，只有一种平静——还好，我还在。','# 三十岁写给自己

三十岁到来之前，以为会很焦虑。

但那天早晨阳光照进窗户，我只是平静地想：还好，我还在。

## 二十岁的事

离开家乡来深圳，在出租屋里用二手电脑学编程，学了三年。

## 期许

少一些证明，多一些感受。慢下来，好好看看风景。','/images/article-6.svg','思考',ARRAY['成长','随笔','生活'],'晨光',true,3400,186,41,'2024-06-01','2024-06-01');

INSERT INTO notes (title,content,category,tags,color,pinned) VALUES
('Vue3 响应式原理速记','## Proxy vs defineProperty

Vue3 用 Proxy 拦截，可监听数组变化和新增属性。

核心三角：effect + track + trigger。','study',ARRAY['Vue3','源码'],'#82B366',true),
('本周待办','- [x] 修复封面图 bug
- [ ] 写数据库种子数据
- [ ] 部署到生产环境
- [ ] 更新 README','todo',ARRAY['待办','工作'],'#B85450',true),
('Git 常用命令速查','```bash
# 撤销最后一次提交（保留改动）
git reset --soft HEAD~1

# 创建并切换分支
git switch -c feature/xxx

# 暂存
git stash / git stash pop
```','study',ARRAY['Git','工具'],'#6C8EBF',false),
('深圳好吃的记录','## 早茶
沙井生蚝、虾饺皇、叉烧包

## 客家菜
盐焗鸡、梅菜扣肉

## 快餐
肠粉（推荐蛇口老街那家）','idea',ARRAY['美食','深圳','生活'],'#D6B656',false),
('2025读书计划','## 已读
- 《人类简史》★★★★★
- 《被讨厌的勇气》★★★★

## 在读
- 《置身事内》

## 想读
- 《黑天鹅》
- 《思考快与慢》','idea',ARRAY['读书','计划','成长'],'#9673A6',false),
('Pinia 使用笔记','## 定义 Store

```ts
export const useStore = defineStore("main", () => {
  const count = ref(0)
  return { count }
})
```

无需 mutations，直接修改，TypeScript 完美支持。','study',ARRAY['Pinia','Vue3','前端'],'#82B366',false),
('每日一句','慢慢来，比较快。

做喜欢的事，剩下的交给时间。

不必证明什么，只需要感受当下。','idea',ARRAY['随笔','心情'],'#9673A6',false);
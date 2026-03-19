const e=[{id:"1",name:"技术",slug:"tech",description:"前端、后端、工程实践",count:18,color:"#6C8EBF",icon:"mdi:code-braces"},{id:"2",name:"生活",slug:"life",description:"日常记录与感悟",count:12,color:"#82B366",icon:"mdi:leaf"},{id:"3",name:"设计",slug:"design",description:"UI/UX 与视觉美学",count:8,color:"#B85450",icon:"mdi:palette"},{id:"4",name:"思考",slug:"thinking",description:"深度思考与观点",count:4,color:"#9673A6",icon:"mdi:lightbulb"}],t=[{id:"1",title:"Vue 3 Composition API 深度实践：从原理到工程化",summary:"深入探索 Vue 3 Composition API 的设计哲学，以及在大型项目中如何优雅地组织代码逻辑，实现高复用性与可维护性。",content:`# Vue 3 Composition API 深度实践

## 前言

Composition API 是 Vue 3 最重要的特性之一，它带来了全新的代码组织方式。

## 核心概念

### setup 函数

\`\`\`typescript
import { ref, computed, onMounted } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  const doubled = computed(() => count.value * 2)
  
  function increment() {
    count.value++
  }
  
  onMounted(() => {
    console.log('Counter mounted with value:', count.value)
  })
  
  return { count, doubled, increment }
}
\`\`\`

## 最佳实践

1. 将相关逻辑提取为 Composable
2. 保持 setup 函数简洁
3. 合理使用 provide/inject

## 总结

Composition API 提供了更强大的代码复用能力，是 Vue 3 开发的核心工具。`,cover:"/images/article-1.svg",category:"技术",tags:["Vue3","TypeScript","前端工程化"],author:"晨光",publishedAt:"2024-03-10",updatedAt:"2024-03-12",views:2340,likes:128,comments:24,featured:!0},{id:"2",title:"从零搭建现代化前端工程：Vite + Vue3 + TypeScript",summary:"详细介绍如何从零开始搭建一个现代化的前端工程，包括工具链配置、代码规范、自动化测试等完整实践。",content:`# 从零搭建现代化前端工程

## 工具选型

- **构建工具**：Vite 5.x
- **框架**：Vue 3.x
- **语言**：TypeScript 5.x
- **状态管理**：Pinia
- **路由**：Vue Router 4

## 项目初始化

\`\`\`bash
npm create vite@latest my-app -- --template vue-ts
cd my-app
npm install
\`\`\`

## 目录结构

良好的目录结构是项目可维护性的基础。`,cover:"/images/article-2.svg",category:"技术",tags:["Vite","Vue3","工程化","TypeScript"],author:"晨光",publishedAt:"2024-02-28",updatedAt:"2024-03-01",views:1890,likes:96,comments:18,featured:!0},{id:"3",title:"深圳的春天，写在三月的风里",summary:"三月的深圳，木棉花开，海风轻抚。一个关于城市、关于生活、关于那些平凡而美好瞬间的记录。",content:`# 深圳的春天

三月，木棉花开遍了街道。

深圳是一座年轻的城市，年轻得像每一个来这里追梦的人。海风从大鹏湾吹来，带着些许咸涩，却也带着无限可能。

## 莲花山的傍晚

傍晚时分，莲花山公园里，有人在放风筝，有人在散步，有老人在打太极，有孩子在追逐嬉闹。城市的喧嚣在这里沉淀成了一种温柔的底色。

## 写给这座城市

深圳教会了我，勇敢和努力是可以改变命运的。这里没有太多历史的包袱，每个人都在书写自己的故事。`,cover:"/images/article-3.svg",category:"生活",tags:["深圳","生活","随笔"],author:"晨光",publishedAt:"2024-03-05",updatedAt:"2024-03-05",views:876,likes:64,comments:12,featured:!1},{id:"4",title:"设计系统构建指南：从原子设计到组件库",summary:"如何从零开始构建一套完整的设计系统，涵盖设计原则、组件规范、Token 体系和文档建设的完整方法论。",content:`# 设计系统构建指南

## 什么是设计系统

设计系统是一套完整的标准，包含可复用的组件、清晰的原则和文档。

## 原子设计方法论

原子设计将界面分解为：
- **原子**：基础元素（颜色、字体、间距）
- **分子**：简单组件（按钮、输入框）
- **有机体**：复杂组件（表单、卡片）
- **模板**：页面布局
- **页面**：最终产品

## Token 体系

设计 Token 是设计系统的基础，用于统一管理设计决策。`,cover:"/images/article-4.svg",category:"设计",tags:["设计系统","UI","组件库"],author:"晨光",publishedAt:"2024-02-15",updatedAt:"2024-02-20",views:1420,likes:88,comments:16,featured:!1},{id:"5",title:"CSS 容器查询：响应式设计的新范式",summary:"容器查询（Container Queries）正式进入标准，它将如何改变我们编写响应式 CSS 的方式？深度解析与实战案例。",content:`# CSS 容器查询

## 为什么需要容器查询

媒体查询基于视口，而容器查询基于父容器尺寸，更适合组件化开发。

## 基本用法

\`\`\`css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}
\`\`\`

## 实战应用

容器查询特别适合卡片、侧边栏等需要根据容器宽度调整布局的场景。`,cover:"/images/article-5.svg",category:"技术",tags:["CSS","响应式","前端"],author:"晨光",publishedAt:"2024-01-20",updatedAt:"2024-01-22",views:1100,likes:72,comments:10,featured:!1},{id:"6",title:"当我们谈论「慢生活」时，我们在谈什么",summary:"在这个急速运转的时代，慢生活究竟意味着什么？不是逃避，而是一种更清醒的选择与感知。",content:`# 当我们谈论「慢生活」时

"慢"，不是懒散，不是无所事事，而是一种对生活节奏的主动掌控。

## 慢生活的真义

慢生活不是要你放弃效率，而是让你在每件事上都多一点专注与投入。

## 从一杯茶开始

每天早晨，给自己泡一杯茶。不是为了提神，只是为了那几分钟的安静与专注。看着茶叶在水中舒展，感受热气升腾，这就是慢生活最朴素的注脚。

## 与快时代共处

慢生活不是逃离，而是在快节奏中找到自己的频率。工作可以高效，但也要留出时间给自己、给家人、给那些真正重要的事。`,cover:"/images/article-6.svg",category:"生活",tags:["慢生活","随笔","思考"],author:"晨光",publishedAt:"2024-01-10",updatedAt:"2024-01-10",views:654,likes:48,comments:8,featured:!1}];export{t as a,e as c};

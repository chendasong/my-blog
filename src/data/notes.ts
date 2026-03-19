import type { Note } from '@/types'

export const notes: Note[] = [
  {
    id: '1',
    title: '2024年Q1工作复盘',
    content: `## 本季度完成

- 完成博客系统重构，性能提升40%
- 主导设计系统建设，覆盖80+组件
- 完成团队技术分享3次

## 不足之处

- 文档输出不够及时
- 需要加强跨团队沟通

## 下季度计划

1. 推动前端监控体系建设
2. 深入学习 Rust 基础
3. 坚持每周技术博客输出`,
    category: 'work',
    tags: ['复盘', '工作', '计划'],
    createdAt: '2024-03-31',
    updatedAt: '2024-03-31',
    pinned: true,
    color: '#6C8EBF',
  },
  {
    id: '2',
    title: 'Vue3 响应式原理笔记',
    content: `## Proxy vs Object.defineProperty

Vue3 使用 Proxy 替代 Object.defineProperty：

- **优势**：可拦截更多操作（删除属性、数组索引等）
- **劣势**：不支持 IE11

## 核心实现

\`\`\`js
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      track(target, key) // 依赖收集
      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver)
      trigger(target, key) // 触发更新
      return result
    }
  })
}
\`\`\`

## effect 与 track/trigger

响应式系统的核心是 effect + track + trigger 三角关系。`,
    category: 'study',
    tags: ['Vue3', '源码', '响应式'],
    createdAt: '2024-03-15',
    updatedAt: '2024-03-18',
    pinned: true,
    color: '#82B366',
  },
  {
    id: '3',
    title: '周末去爬山 🏔️',
    content: `## 行程记录

今天去爬了梧桐山，从登山口到山顶用了2小时。

天气很好，能看到远处的香港。山顶有点冷，记得下次带外套。

## 拍了很多照片

木棉花还没谢，红艳艳的很好看。碰到了几只可爱的小猫，在登山道旁边晒太阳。

## 感受

爬山真的很解压，每次爬完都感觉整个人清醒了很多。要养成定期爬山的习惯💪`,
    category: 'life',
    tags: ['爬山', '生活', '深圳'],
    createdAt: '2024-03-09',
    updatedAt: '2024-03-09',
    pinned: false,
    color: '#D6B656',
  },
  {
    id: '4',
    title: 'AI时代下前端开发的变革思考',
    content: `## 核心观点

AI 不会替代前端开发者，但会重塑工作方式。

## 机会在哪里

1. **提示工程**：学会与 AI 协作的能力将成为核心竞争力
2. **系统设计**：AI 擅长局部代码，不擅长整体架构
3. **用户体验**：AI 理解不了真实用户的情感需求
4. **质量把控**：AI 生成的代码需要人来审查和优化

## 行动建议

- 把 AI 当成 Senior 结对伙伴
- 专注于 AI 暂时无法替代的高价值工作
- 持续学习，保持技术敏感度`,
    category: 'idea',
    tags: ['AI', '思考', '前端'],
    createdAt: '2024-03-01',
    updatedAt: '2024-03-02',
    pinned: false,
    color: '#9673A6',
  },
  {
    id: '5',
    title: '本月待办清单',
    content: `## 工作

- [x] 完成组件库文档
- [x] Code Review - 新功能分支
- [ ] 性能优化方案评审
- [ ] 下个版本需求拆解

## 学习

- [x] 读完《深入浅出 Vue3》
- [ ] 学习 Rust 基础语法（进行中）
- [ ] 完成 LeetCode 每日一题

## 生活

- [x] 去看牙医
- [ ] 买新的机械键盘
- [ ] 和朋友聚餐`,
    category: 'todo',
    tags: ['待办', '计划'],
    createdAt: '2024-03-01',
    updatedAt: '2024-03-20',
    pinned: false,
    color: '#B85450',
  },
  {
    id: '6',
    title: 'TypeScript 高级类型备忘录',
    content: `## 常用工具类型

\`\`\`typescript
// 条件类型
type IsString<T> = T extends string ? true : false

// 映射类型
type Optional<T> = { [K in keyof T]?: T[K] }

// 模板字面量类型
type EventName<T extends string> = \`on\${Capitalize<T>}\`

// infer 关键字
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never
\`\`\`

## 常见模式

1. **鉴别联合类型**：用 discriminant 字段区分
2. **品牌类型**：防止结构相同但语义不同的类型混用
3. **递归类型**：处理树形结构数据`,
    category: 'study',
    tags: ['TypeScript', '学习', '备忘'],
    createdAt: '2024-02-20',
    updatedAt: '2024-03-10',
    pinned: false,
    color: '#6C8EBF',
  },
]

-- 新增 2 篇文章 + 2 条笔记

INSERT INTO articles (title,summary,content,cover,category,tags,author,featured,views,likes,comments,published_at,updated_at) VALUES
('React 与 Vue3 的核心差异对比','从响应式原理、组件模型、状态管理三个维度，深度对比 React 和 Vue3 的设计哲学。','# React 与 Vue3 核心差异

## 响应式原理

Vue3 基于 Proxy 自动追踪依赖，React 依赖 setState 手动触发更新。

```tsx
// React
const [count, setCount] = useState(0)
setCount(count + 1)

// Vue3
const count = ref(0)
count.value++
```

## 组件模型

React 函数组件每次渲染都重新执行，需要 useMemo/useCallback 优化。
Vue3 setup 只执行一次，响应式系统自动管理更新。

## 状态管理

| | React | Vue3 |
|---|---|---|
| 官方方案 | Context + Reducer | Pinia |
| 心智负担 | 较高 | 较低 |
| TypeScript | 良好 | 优秀 |

## 总结

没有好坏之分，React 生态更大，Vue3 上手更快。','/images/article-1.svg','技术',ARRAY['React','Vue3','前端'],'晨光',false,890,45,9,'2024-07-01','2024-07-01'),
('我在深圳租房两年的经验总结','从南山到福田，租过5个地方，踩过不少坑。整理了选房、看房、签合同的实用经验。','# 深圳租房两年经验

## 区域选择

- 南山：IT 集中，租金贵，交通好
- 福田：均衡，适合大多数人
- 龙华：性价比高，地铁通达

## 看房要点

1. 采光朝向（南向优先）
2. 楼层（避开 1 楼和顶楼）
3. 隔音（敲墙听声）
4. 周边配套（超市、地铁步行距离）

## 合同注意事项

- 核实房东身份证和房产证
- 明确水电费计费方式
- 拍照记录入住前现状
- 押金退还条款要写清楚

## 推荐平台

贝壳 > 安居客 > 自如（品牌公寓价格高但省心）

## 最大的坑

中介费。能找房东直租就直租，省下的钱够吃一个月好饭。','/images/article-2.svg','生活',ARRAY['深圳','租房','生活经验'],'晨光',true,3200,156,38,'2024-07-15','2024-07-15');

INSERT INTO notes (title,content,category,tags,color,pinned) VALUES
('面试准备清单','## 技术题

- [ ] 手写 Promise
- [ ] 虚拟 DOM diff 算法
- [ ] CSS BFC 和 IFC
- [ ] HTTP 缓存策略

## 项目亮点

准备 2-3 个有深度的项目故事，说清楚：背景→问题→方案→结果

## 反问环节

- 团队技术栈和规模
- 项目当前阶段
- 晋升路径','work',ARRAY['面试','求职','技术'],'#6C8EBF',true),
('最近看到的一句话','「不要试图成为一个成功的人，而要试图成为一个有价值的人。」

——爱因斯坦

想了很久，价值感比成功感更持久，也更自由。成功是结果，价值是过程。','idea',ARRAY['随笔','思考','引言'],'#9673A6',false);
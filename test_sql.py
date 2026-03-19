# -*- coding: utf-8 -*-
# 新增 2 篇文章 + 2 条笔记
# 在 Supabase SQL Editor 中执行输出的 SQL

def e(s): return s.replace("'", "''")

articles = [
  (
    'React 与 Vue3 的核心差异对比',
    '从响应式原理、组件模型、状态管理三个维度，深度对比 React 和 Vue3 的设计哲学。',
    '# React 与 Vue3 核心差异\n\n## 响应式原理\n\nVue3 基于 Proxy 自动追踪依赖，React 依赖 setState 手动触发更新。\n\n```tsx\n// React\nconst [count, setCount] = useState(0)\nsetCount(count + 1)\n\n// Vue3\nconst count = ref(0)\ncount.value++\n```\n\n## 组件模型\n\nReact 函数组件每次渲染都重新执行，需要 useMemo/useCallback 优化。\nVue3 setup 只执行一次，响应式系统自动管理更新。\n\n## 状态管理\n\n| | React | Vue3 |\n|---|---|---|\n| 官方方案 | Context + Reducer | Pinia |\n| 心智负担 | 较高 | 较低 |\n| TypeScript | 良好 | 优秀 |\n\n## 总结\n\n没有好坏之分，React 生态更大，Vue3 上手更快。',
    '/images/article-1.svg', '技术', "ARRAY['React','Vue3','前端']", False, 890, 45, 9, '2024-07-01'
  ),
  (
    '我在深圳租房两年的经验总结',
    '从南山到福田，租过5个地方，踩过不少坑。整理了选房、看房、签合同的实用经验。',
    '# 深圳租房两年经验\n\n## 区域选择\n\n- 南山：IT 集中，租金贵，交通好\n- 福田：均衡，适合大多数人\n- 龙华：性价比高，地铁通达\n\n## 看房要点\n\n1. 采光朝向（南向优先）\n2. 楼层（避开 1 楼和顶楼）\n3. 隔音（敲墙听声）\n4. 周边配套（超市、地铁步行距离）\n\n## 合同注意事项\n\n- 核实房东身份证和房产证\n- 明确水电费计费方式\n- 拍照记录入住前现状\n- 押金退还条款要写清楚\n\n## 推荐平台\n\n贝壳 > 安居客 > 自如（品牌公寓价格高但省心）\n\n## 最大的坑\n\n中介费。能找房东直租就直租，省下的钱够吃一个月好饭。',
    '/images/article-2.svg', '生活', "ARRAY['深圳','租房','生活经验']", True, 3200, 156, 38, '2024-07-15'
  ),
]

notes = [
  (
    '面试准备清单',
    '## 技术题\n\n- [ ] 手写 Promise\n- [ ] 虚拟 DOM diff 算法\n- [ ] CSS BFC 和 IFC\n- [ ] HTTP 缓存策略\n\n## 项目亮点\n\n准备 2-3 个有深度的项目故事，说清楚：背景→问题→方案→结果\n\n## 反问环节\n\n- 团队技术栈和规模\n- 项目当前阶段\n- 晋升路径',
    'work', "ARRAY['面试','求职','技术']", '#6C8EBF', True
  ),
  (
    '最近看到的一句话',
    '「不要试图成为一个成功的人，而要试图成为一个有价值的人。」\n\n——爱因斯坦\n\n想了很久，价值感比成功感更持久，也更自由。成功是结果，价值是过程。',
    'idea', "ARRAY['随笔','思考','引言']", '#9673A6', False
  ),
]

sql_parts = []
sql_parts.append('-- 新增 2 篇文章 + 2 条笔记')
sql_parts.append('')
sql_parts.append('INSERT INTO articles (title,summary,content,cover,category,tags,author,featured,views,likes,comments,published_at,updated_at) VALUES')
rows = []
for t,s,c,cv,cat,tags,feat,v,l,cm,d in articles:
    rows.append("('%s','%s','%s','%s','%s',%s,'晨光',%s,%d,%d,%d,'%s','%s')" % (
        e(t),e(s),e(c),cv,cat,tags,'true' if feat else 'false',v,l,cm,d,d))
sql_parts.append(',\n'.join(rows) + ';')
sql_parts.append('')
sql_parts.append('INSERT INTO notes (title,content,category,tags,color,pinned) VALUES')
nrows = []
for t,c,cat,tags,color,pin in notes:
    nrows.append("('%s','%s','%s',%s,'%s',%s)" % (e(t),e(c),cat,tags,color,'true' if pin else 'false'))
sql_parts.append(',\n'.join(nrows) + ';')

result = '\n'.join(sql_parts)
print(result)

with open('E:/github/chends/supabase-add.sql', 'w', encoding='utf-8') as f:
    f.write(result)
print('\n-- 已写入 supabase-add.sql')

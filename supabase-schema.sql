-- =============================================
-- Chends Blog - Supabase 建表 SQL
-- 在 Supabase 控制台 SQL Editor 中执行此文件
-- =============================================

-- 1. 文章表
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text default '',
  content text default '',
  cover text default '/images/article-1.svg',
  category text default '技术',
  tags text[] default array[]::text[],
  author text default '晨光',
  featured boolean default false,
  views integer default 0,
  likes integer default 0,
  comments integer default 0,
  published_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 2. 笔记表
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text default '',
  category text default 'idea',
  tags text[] default array[]::text[],
  color text default '#6C8EBF',
  pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. 情侣记忆表
create table if not exists couple_memories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  image text default '/images/memory-1.svg',
  date date,
  type text default 'photo',
  emotion text default 'sweet',
  created_at timestamptz default now()
);

-- 4. 开启 Row Level Security（允许匿名读写，适合个人项目）
alter table articles enable row level security;
alter table notes enable row level security;
alter table couple_memories enable row level security;

create policy "public_all" on articles for all using (true) with check (true);
create policy "public_all" on notes for all using (true) with check (true);
create policy "public_all" on couple_memories for all using (true) with check (true);

-- 5. 创建 Storage bucket 用于图片上传
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

create policy "public_read" on storage.objects for select using (bucket_id = 'images');
create policy "public_upload" on storage.objects for insert with check (bucket_id = 'images');
create policy "public_delete" on storage.objects for delete using (bucket_id = 'images');

-- 6. 初始数据
insert into articles (title, summary, content, cover, category, tags, featured, views, likes, comments) values
(
  'Vue 3 Composition API 深度实践：从原理到工程化',
  '深入探索 Vue 3 Composition API 的设计哲学，以及在大型项目中如何优雅地组织代码逻辑。',
  '# Vue 3 Composition API 深度实践

Composition API 是 Vue 3 最重要的特性之一。

## 核心概念

```typescript
import { ref, computed } from ''vue''
export function useCounter(init = 0) {
  const count = ref(init)
  return { count }
}
```',
  '/images/article-1.svg', '技术', array['Vue3','TypeScript','前端工程化'], true, 2340, 128, 24
),
(
  '从零搭建现代化前端工程：Vite + Vue3 + TypeScript',
  '详细介绍如何从零开始搭建一个现代化的前端工程，包括工具链配置、代码规范等完整实践。',
  '# 从零搭建现代化前端工程

## 工具选型

- Vite 5.x
- Vue 3.x
- TypeScript 5.x',
  '/images/article-2.svg', '技术', array['Vite','Vue3','工程化'], true, 1890, 96, 18
),
(
  '深圳的春天，写在三月的风里',
  '三月的深圳，木棉花开，海风轻抚。一个关于城市、关于生活的记录。',
  '# 深圳的春天

三月，木棉花开遍了街道。深圳是一座年轻的城市。',
  '/images/article-3.svg', '生活', array['深圳','生活','随笔'], false, 876, 64, 12
);

insert into notes (title, content, category, tags, color, pinned) values
(
  '2024年Q1工作复盘',
  '## 本季度完成

- 完成博客系统重构
- 主导设计系统建设

## 下季度计划

1. 推动前端监控体系建设',
  'work', array['复盘','工作','计划'], '#6C8EBF', true
),
(
  'Vue3 响应式原理笔记',
  '## Proxy vs Object.defineProperty

Vue3 使用 Proxy 替代 Object.defineProperty。

响应式系统的核心是 effect + track + trigger。',
  'study', array['Vue3','源码','响应式'], '#82B366', true
),
(
  '本月待办清单',
  '## 工作

- [x] 完成组件库文档
- [ ] 性能优化方案评审

## 生活

- [ ] 买新的机械键盘',
  'todo', array['待办','计划'], '#B85450', false
);

insert into couple_memories (title, description, image, date, type, emotion) values
(
  '第一次见面',
  '在那个阳光明媚的下午，我们在书店相遇。你在看一本村上春树，我鼓起勇气和你说话。',
  '/images/memory-1.svg', '2021-05-20', 'milestone', 'sweet'
),
(
  '在一起的纪念日',
  '2021年7月14日，我们正式在一起。那天我们去了海边，看了日落，吃了冰淇淋。',
  '/images/memory-2.svg', '2021-07-14', 'milestone', 'romantic'
),
(
  '第一次旅行 — 厦门',
  '我们的第一次旅行，去了厦门。鼓浪屿的老建筑、还有海边的风。',
  '/images/memory-3.svg', '2021-10-01', 'photo', 'happy'
);

-- =============================================
-- 追加到 supabase-schema.sql 的新增表
-- 在 Supabase SQL Editor 中执行
-- =============================================

-- 1. 管理员表（手动插入账号，不支持注册）
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,  -- 存储 bcrypt hash
  nickname text default '博主',
  avatar text default '',
  email text default '',
  bio text default '',
  created_at timestamptz default now()
);

-- 2. 网站配置表（单行配置）
create table if not exists site_settings (
  id integer primary key default 1,
  site_name text default 'Luminary',
  site_subtitle text default '我的个人空间',
  site_description text default '',
  owner_nickname text default '晨光',
  owner_avatar text default '/images/avatar.svg',
  owner_bio text default '',
  owner_location text default '深圳',
  icp_number text default '',
  couple_password text default '2024-11-09',
  updated_at timestamptz default now()
);

-- RLS 策略
alter table admin_users enable row level security;
alter table site_settings enable row level security;

create policy "public_read_settings" on site_settings for select using (true);
create policy "public_read_admin" on admin_users for select using (true);
create policy "public_update_admin" on admin_users for update using (true);
create policy "public_update_settings" on site_settings for update using (true);

-- 插入默认网站配置
insert into site_settings (id, site_name, site_subtitle, owner_nickname, owner_avatar, owner_location)
values (1, 'Luminary', '记录生活与技术的小角落', '晨光', '/images/avatar.svg', '深圳')
on conflict (id) do nothing;

-- 插入初始管理员账号（密码：admin123，bcrypt hash）
-- 你可以在下方修改 username 和 password_hash
-- 生成新 hash 可访问：https://bcrypt-generator.com （rounds=10）
insert into admin_users (username, password_hash, nickname)
values ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '晨光')
on conflict (username) do nothing;
-- 上面的 hash 对应密码：admin123

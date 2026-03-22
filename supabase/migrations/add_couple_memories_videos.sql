-- 情侣记忆：视频 URL 列表，使用 jsonb（Supabase/PostgREST 友好）
--
-- 在 Supabase → SQL Editor 整段执行一次即可。
-- 若你曾用旧版建过 text 类型的 videos，下面 DO 块会自动改成 jsonb。

-- 尚无列时：直接 jsonb
alter table public.couple_memories add column if not exists videos jsonb;

-- 旧库：videos 为 text 且存的是 JSON 字符串 → 转为 jsonb
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'couple_memories'
      and column_name = 'videos'
      and data_type = 'text'
  ) then
    alter table public.couple_memories
      alter column videos type jsonb using (
        case
          when videos is null or btrim(videos::text) = '' then null::jsonb
          else btrim(videos::text)::jsonb
        end
      );
  end if;
end $$;

comment on column public.couple_memories.videos is 'JSON array of video file URLs';

notify pgrst, 'reload schema';

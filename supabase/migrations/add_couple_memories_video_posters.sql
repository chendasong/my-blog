-- 情侣记忆：与 videos 数组按索引对齐的封面图 URL（JPEG），列表展示用，避免列表里加载完整视频
--
-- Supabase → SQL Editor 执行一次。

alter table public.couple_memories add column if not exists video_posters jsonb;

comment on column public.couple_memories.video_posters is 'JSON array of poster image URLs, same order/length as videos';

notify pgrst, 'reload schema';

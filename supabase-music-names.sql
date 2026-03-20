-- 为 site_settings 表添加 music_names 字段
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS music_names TEXT;

-- 添加注释
COMMENT ON COLUMN site_settings.music_names IS '音乐文件名列表，每行一个，与music_urls对应';

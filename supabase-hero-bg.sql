-- 添加首页背景图片和音乐配置字段
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS hero_background_image TEXT,
ADD COLUMN IF NOT EXISTS hero_background_opacity DECIMAL(3,2) DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS music_urls TEXT;

-- 添加注释
COMMENT ON COLUMN site_settings.hero_background_image IS '首页Hero背景图片URL';
COMMENT ON COLUMN site_settings.hero_background_opacity IS '首页背景图片透明度 (0-1)';
COMMENT ON COLUMN site_settings.music_urls IS '首页背景音乐URL列表，每行一个';


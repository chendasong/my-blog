-- 为 couple_memories 表添加 images 字段
ALTER TABLE couple_memories 
ADD COLUMN IF NOT EXISTS images TEXT;

-- 添加注释
COMMENT ON COLUMN couple_memories.images IS '记忆的所有图片URL数组，JSON格式存储';

-- 如果已有数据，将 image 字段的值迁移到 images 数组中
UPDATE couple_memories 
SET images = json_build_array(image)::text 
WHERE image IS NOT NULL AND images IS NULL;

-- 用户自配火山方舟模型（Base URL / API Key / 文本·图片·视频模型 ID）
-- 在 Supabase SQL Editor 中执行本脚本

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS ai_model_config jsonb;

COMMENT ON COLUMN admin_users.ai_model_config IS
  '火山方舟等 AI 模型配置: { baseUrl, apiKey, textModel, imageModel, videoModel }';

-- 安全提示（请按你现有 admin_users 策略自行收紧）：
-- 1. 该列含 API Key，勿对匿名 anon 开放全表 SELECT *。
-- 2. 本站登录走自定义校验而非 Supabase Auth，RLS 需与现有写法一致；
--    至少避免把 ai_model_config 暴露给未鉴权的公开读策略。
